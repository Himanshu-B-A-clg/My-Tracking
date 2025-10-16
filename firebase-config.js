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
        console.log('🔥 Firebase initialized - Cloud storage ready!');
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
                
                // Save application data without files
                const appData = {
                    company: app.company,
                    position: app.position,
                    location: app.location,
                    status: app.status,
                    dateApplied: app.dateApplied,
                    salary: app.salary,
                    jobType: app.jobType,
                    notes: app.notes,
                    contactInfo: app.contactInfo,
                    index: index,
                    updatedAt: new Date().toISOString(),
                    hasFiles: app.files && app.files.length > 0
                };
                
                promises.push(setDoc(doc(db, this.collectionName, appId), appData));
                
                // Save files separately (each file in its own document)
                if (app.files && app.files.length > 0) {
                    for (let fileIndex = 0; fileIndex < app.files.length; fileIndex++) {
                        const file = app.files[fileIndex];
                        const fileId = `${appId}_file_${fileIndex}`;
                        
                        promises.push(setDoc(doc(db, this.filesCollectionName, fileId), {
                            appIndex: index,
                            fileIndex: fileIndex,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            data: file.data,
                            uploadDate: file.uploadDate
                        }));
                    }
                }
            }

            await Promise.all(promises);
            
            const sizeInMB = (JSON.stringify(applications).length / (1024 * 1024)).toFixed(2);
            console.log(`✅ Saved to Firebase: ${applications.length} apps (${sizeInMB}MB)`);
            return true;
        } catch (error) {
            console.error('❌ Firebase save error:', error);
            throw error;
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
                
                filesSnapshot.forEach((document) => {
                    const fileData = document.data();
                    const appIndex = fileData.appIndex;
                    
                    if (!filesByApp[appIndex]) {
                        filesByApp[appIndex] = [];
                    }
                    
                    filesByApp[appIndex].push({
                        name: fileData.name,
                        size: fileData.size,
                        type: fileData.type,
                        data: fileData.data,
                        uploadDate: fileData.uploadDate
                    });
                });
                
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
