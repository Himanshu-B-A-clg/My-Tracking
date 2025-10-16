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

            // Save each application (serialize files array to avoid nested entity error)
            const promises = applications.map((app, index) => {
                // Convert files array to JSON string for Firestore compatibility
                const appData = {
                    ...app,
                    files: app.files ? JSON.stringify(app.files) : '[]',
                    index: index,
                    updatedAt: new Date().toISOString()
                };
                
                return setDoc(doc(db, this.collectionName, `app_${index}`), appData);
            });

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
            
            const querySnapshot = await getDocs(collection(db, this.collectionName));
            const applications = [];
            
            querySnapshot.forEach((document) => {
                if (document.id !== this.metadataDoc) {
                    const data = document.data();
                    // Deserialize files array back to objects
                    if (data.files && typeof data.files === 'string') {
                        data.files = JSON.parse(data.files);
                    }
                    applications.push(data);
                }
            });

            // Sort by index
            applications.sort((a, b) => (a.index || 0) - (b.index || 0));
            
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
            
            const querySnapshot = await getDocs(collection(db, this.collectionName));
            const promises = [];
            
            querySnapshot.forEach((document) => {
                promises.push(deleteDoc(doc(db, this.collectionName, document.id)));
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
