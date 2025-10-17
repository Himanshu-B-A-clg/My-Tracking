// Firebase Configuration
// 🔥 SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (name: Job-Tracker)
// 3. Enable Firestore Database
// 4. Go to Project Settings > General
// 5. Scroll down to "Your apps" and click web icon (</>)
// 6. Copy your firebaseConfig and REPLACE the values below

const firebaseConfig = {
    apiKey: "AIzaSyBZ50oDsUPvWIA3uAq9ebHcTYmF0P2Kz24",
    authDomain: "job-tracker-8c9bc.firebaseapp.com",
    projectId: "job-tracker-8c9bc",
    storageBucket: "job-tracker-8c9bc.firebasestorage.app",
    messagingSenderId: "256467953173",
    appId: "1:256467953173:web:6ce2bf25314c4334abd01c"
};

// Import Firebase modules (v10 - modular SDK)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDoc,
    getDocs, 
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Firebase Cloud Storage Class
 * Pure cloud storage - no local database needed!
 */
class FirebaseCloudStorage {
    constructor() {
        this.collectionName = 'job_applications';
        this.filesCollectionName = 'job_files';
        this.metadataDoc = 'metadata';
        this.chunkSize = 800 * 1024; // 800KB chunks (safe under 1MB limit)
        console.log('🔥 Firebase initialized - Cloud storage ready!');
    }
    
    /**
     * Split large file data into chunks
     */
    chunkFileData(fileData) {
        const chunks = [];
        const data = fileData.data; // Base64 string
        const totalChunks = Math.ceil(data.length / this.chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
            const start = i * this.chunkSize;
            const end = Math.min(start + this.chunkSize, data.length);
            chunks.push(data.substring(start, end));
        }
        
        return chunks;
    }
    
    /**
     * Reassemble file chunks
     */
    reassembleChunks(chunks) {
        return chunks.join('');
    }

    /**
     * Save all applications to Firebase
     */
    async saveAll(applications) {
        try {
            console.log(`☁️ Uploading ${applications.length} applications to Firebase...`);
            
            // Save metadata
            await setDoc(doc(db, this.collectionName, this.metadataDoc), {
                count: applications.length,
                lastUpdated: new Date().toISOString(),
                version: '2.0'
            });

            // Save each application (files stored separately to avoid 1MB field limit)
            const promises = [];
            
            for (let index = 0; index < applications.length; index++) {
                const app = applications[index];
                const appId = `app_${index}`;
                
                // Save application data without files (handle both old and new field names)
                const appData = {
                    company: app.company || app.companyName || '',
                    position: app.position || '',
                    location: app.location || '',
                    status: app.status || 'Applied',
                    dateApplied: app.dateApplied || new Date().toISOString().split('T')[0],
                    salary: app.salary || '',
                    jobType: app.jobType || '',
                    notes: app.notes || app.description || '',
                    contactInfo: app.contactInfo || '',
                    id: app.id || Date.now(),
                    index: index,
                    updatedAt: new Date().toISOString(),
                    hasFiles: app.files && app.files.length > 0
                };
                
                promises.push(setDoc(doc(db, this.collectionName, appId), appData));
                
                // Save files separately with chunking for large files
                if (app.files && app.files.length > 0) {
                    for (let fileIndex = 0; fileIndex < app.files.length; fileIndex++) {
                        const file = app.files[fileIndex];
                        const fileId = `${appId}_file_${fileIndex}`;
                        
                        // Split file data into chunks
                        const chunks = this.chunkFileData(file);
                        
                        // Save file metadata
                        promises.push(setDoc(doc(db, this.filesCollectionName, fileId), {
                            appIndex: index,
                            fileIndex: fileIndex,
                            name: file.name || 'unknown.file',
                            size: file.size || 0,
                            type: file.type || 'application/octet-stream',
                            uploadDate: file.uploadDate || new Date().toISOString(),
                            totalChunks: chunks.length
                        }));
                        
                        // Save each chunk separately
                        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                            const chunkId = `${fileId}_chunk_${chunkIndex}`;
                            promises.push(setDoc(doc(db, this.filesCollectionName, chunkId), {
                                appIndex: index,
                                fileIndex: fileIndex,
                                chunkIndex: chunkIndex,
                                data: chunks[chunkIndex]
                            }));
                        }
                    }
                }
            }

            // Process in batches to avoid rate limits
            const batchSize = 50; // Process 50 writes at a time
            const results = [];
            
            for (let i = 0; i < promises.length; i += batchSize) {
                const batch = promises.slice(i, i + batchSize);
                try {
                    await Promise.all(batch);
                    results.push(...batch);
                    
                    // Small delay between batches if there are more
                    if (i + batchSize < promises.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } catch (error) {
                    console.warn(`⚠️ Batch ${i / batchSize + 1} partially failed:`, error.message);
                    // Continue with next batch even if this one fails
                }
            }
            
            const sizeInMB = (JSON.stringify(applications).length / (1024 * 1024)).toFixed(2);
            console.log(`✅ Saved to Firebase: ${applications.length} apps (${sizeInMB}MB)`);
            return true;
        } catch (error) {
            console.error('❌ Firebase save error:', error);
            // Don't throw - allow partial saves
            return false;
        }
    }

    /**
     * Load all applications from Firebase
     */
    async getAll() {
        try {
            console.log('📥 Loading from Firebase...');
            
            // Load applications
            const appsSnapshot = await getDocs(collection(db, this.collectionName));
            const applications = [];
            
            appsSnapshot.forEach((document) => {
                if (document.id !== this.metadataDoc) {
                    applications.push(document.data());
                }
            });

            // Sort by index
            applications.sort((a, b) => (a.index || 0) - (b.index || 0));
            
            // Load files for each application
            if (applications.length > 0) {
                const filesSnapshot = await getDocs(collection(db, this.filesCollectionName));
                const filesByApp = {};
                const chunksByFile = {};
                
                // Organize files and chunks
                filesSnapshot.forEach((document) => {
                    const docId = document.id;
                    const fileData = document.data();
                    
                    if (docId.includes('_chunk_')) {
                        // This is a chunk
                        const baseFileId = docId.substring(0, docId.lastIndexOf('_chunk_'));
                        if (!chunksByFile[baseFileId]) {
                            chunksByFile[baseFileId] = [];
                        }
                        chunksByFile[baseFileId].push(fileData);
                    } else {
                        // This is file metadata
                        const appIndex = fileData.appIndex;
                        if (!filesByApp[appIndex]) {
                            filesByApp[appIndex] = [];
                        }
                        filesByApp[appIndex].push({
                            docId: docId,
                            name: fileData.name || 'unknown.file',
                            size: fileData.size || 0,
                            type: fileData.type || 'application/octet-stream',
                            uploadDate: fileData.uploadDate || new Date().toISOString(),
                            totalChunks: fileData.totalChunks || 0
                        });
                    }
                });
                
                // Reassemble chunked files
                for (const appIndex in filesByApp) {
                    filesByApp[appIndex] = filesByApp[appIndex].map(file => {
                        const chunks = chunksByFile[file.docId] || [];
                        
                        if (chunks.length > 0) {
                            // Sort chunks by index
                            chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
                            // Reassemble data
                            const data = this.reassembleChunks(chunks.map(c => c.data));
                            return {
                                name: file.name || 'unknown.file',
                                size: file.size || 0,
                                type: file.type || 'application/octet-stream',
                                data: data,
                                uploadDate: file.uploadDate || new Date().toISOString()
                            };
                        }
                        
                        return file;
                    });
                }
                
                // Attach files to applications
                applications.forEach(app => {
                    app.files = filesByApp[app.index] || [];
                });
            }
            
            console.log(`✅ Loaded from Firebase: ${applications.length} applications`);
            return applications;
        } catch (error) {
            console.error('❌ Firebase load error:', error);
            return [];
        }
    }

    /**
     * Clear all data from Firebase
     */
    async clearAll() {
        try {
            console.log('🗑️ Clearing Firebase data...');
            
            const promises = [];
            
            // Clear applications
            const appsSnapshot = await getDocs(collection(db, this.collectionName));
            appsSnapshot.forEach((document) => {
                promises.push(deleteDoc(doc(db, this.collectionName, document.id)));
            });
            
            // Clear files
            const filesSnapshot = await getDocs(collection(db, this.filesCollectionName));
            filesSnapshot.forEach((document) => {
                promises.push(deleteDoc(doc(db, this.filesCollectionName, document.id)));
            });

            await Promise.all(promises);
            
            console.log('✅ Firebase data cleared');
            return true;
        } catch (error) {
            console.error('❌ Firebase clear error:', error);
            return false;
        }
    }

    /**
     * Initialize - migrate from IndexedDB if needed
     */
    async init() {
        try {
            // Check if we have cloud data
            const cloudApps = await this.getAll();
            
            // Check if we have local IndexedDB data
            if (typeof idbStorage !== 'undefined' && idbStorage.db) {
                const localApps = await idbStorage.getAll();
                
                if (localApps.length > 0 && cloudApps.length === 0) {
                    console.log('📤 Migrating from IndexedDB to Firebase...');
                    await this.saveAll(localApps);
                    console.log('✅ Migration complete!');
                }
            }
            
            return true;
        } catch (error) {
            console.error('Firebase init error:', error);
            return false;
        }
    }

    /**
     * Export data as JSON
     */
    async exportData() {
        const applications = await this.getAll();
        return JSON.stringify(applications, null, 2);
    }

    /**
     * Import data from JSON
     */
    async importData(jsonData) {
        try {
            const applications = JSON.parse(jsonData);
            await this.saveAll(applications);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Create global instance
const firebaseStorage = new FirebaseCloudStorage();

console.log('🔥 Firebase Cloud Storage ready!');
console.log('📡 All data stored in the cloud');
console.log('🌐 Access from ANY device!');

// Export for use in other modules
export { firebaseStorage };
