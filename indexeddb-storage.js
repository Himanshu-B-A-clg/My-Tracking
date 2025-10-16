/**
 * IndexedDB Storage Manager for Job Tracker
 * Supports large file storage (1GB+)
 * Much more reliable than localStorage
 */

class IndexedDBStorage {
    constructor() {
        this.dbName = 'JobTrackerDB';
        this.version = 1;
        this.db = null;
    }

    /**
     * Initialize the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store for applications
                if (!db.objectStoreNames.contains('applications')) {
                    const objectStore = db.createObjectStore('applications', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    
                    // Create indexes for faster queries
                    objectStore.createIndex('companyName', 'companyName', { unique: false });
                    objectStore.createIndex('status', 'status', { unique: false });
                    objectStore.createIndex('dateApplied', 'dateApplied', { unique: false });
                }

                console.log('Database structure created');
            };
        });
    }

    /**
     * Save all applications (replaces existing data)
     */
    async saveAll(applications) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['applications'], 'readwrite');
            const objectStore = transaction.objectStore('applications');

            // Clear existing data
            const clearRequest = objectStore.clear();

            clearRequest.onsuccess = () => {
                // Add all applications
                let addedCount = 0;
                
                if (applications.length === 0) {
                    resolve(true);
                    return;
                }

                applications.forEach((app, index) => {
                    const addRequest = objectStore.add({
                        ...app,
                        id: index + 1 // Ensure sequential IDs
                    });

                    addRequest.onsuccess = () => {
                        addedCount++;
                        if (addedCount === applications.length) {
                            console.log(`Saved ${addedCount} applications to IndexedDB`);
                            resolve(true);
                        }
                    };

                    addRequest.onerror = () => {
                        console.error('Error adding application:', addRequest.error);
                    };
                });
            };

            clearRequest.onerror = () => {
                console.error('Error clearing store:', clearRequest.error);
                reject(clearRequest.error);
            };

            transaction.onerror = () => {
                console.error('Transaction error:', transaction.error);
                reject(transaction.error);
            };
        });
    }

    /**
     * Add a single application
     */
    async addApplication(application) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['applications'], 'readwrite');
            const objectStore = transaction.objectStore('applications');

            const request = objectStore.add(application);

            request.onsuccess = () => {
                console.log('Application added with ID:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error adding application:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all applications
     */
    async getAll() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['applications'], 'readonly');
            const objectStore = transaction.objectStore('applications');
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const apps = request.result || [];
                console.log(`Retrieved ${apps.length} applications from IndexedDB`);
                resolve(apps);
            };

            request.onerror = () => {
                console.error('Error retrieving applications:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update an application by ID
     */
    async updateApplication(id, application) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['applications'], 'readwrite');
            const objectStore = transaction.objectStore('applications');

            const request = objectStore.put({ ...application, id });

            request.onsuccess = () => {
                console.log('Application updated:', id);
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error updating application:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete an application by ID
     */
    async deleteApplication(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['applications'], 'readwrite');
            const objectStore = transaction.objectStore('applications');

            const request = objectStore.delete(id);

            request.onsuccess = () => {
                console.log('Application deleted:', id);
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error deleting application:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Clear all data
     */
    async clearAll() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['applications'], 'readwrite');
            const objectStore = transaction.objectStore('applications');

            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('All applications cleared from IndexedDB');
                resolve(true);
            };

            request.onerror = () => {
                console.error('Error clearing applications:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get storage size estimate
     */
    async getStorageEstimate() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                usageMB: (estimate.usage / (1024 * 1024)).toFixed(2),
                quotaMB: (estimate.quota / (1024 * 1024)).toFixed(2),
                percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
            };
        }
        return null;
    }

    /**
     * Export all data as JSON (for backup)
     */
    async exportData() {
        const applications = await this.getAll();
        return JSON.stringify(applications, null, 2);
    }

    /**
     * Import data from JSON (for restore)
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

    /**
     * Migrate from localStorage to IndexedDB
     */
    async migrateFromLocalStorage() {
        try {
            const localData = localStorage.getItem('applications');
            if (localData) {
                const applications = JSON.parse(localData);
                await this.saveAll(applications);
                console.log(`Migrated ${applications.length} applications from localStorage to IndexedDB`);
                return applications.length;
            }
            return 0;
        } catch (error) {
            console.error('Error migrating from localStorage:', error);
            return 0;
        }
    }
}

// Create global instance
const idbStorage = new IndexedDBStorage();

// Initialize on load
idbStorage.init().then(() => {
    console.log('IndexedDB ready for use');
}).catch(error => {
    console.error('Failed to initialize IndexedDB:', error);
});
