/**
 * Google Drive Cloud Storage for Job Tracker
 * No local storage - everything in Google Drive
 * Access from any device, any browser
 */

// Google Drive API Configuration
const GOOGLE_DRIVE_CONFIG = {
    API_KEY: 'YOUR_API_KEY_HERE',
    CLIENT_ID: 'YOUR_CLIENT_ID_HERE',
    FOLDER_NAME: 'Job-Tracker-Data',
    FILE_NAME: 'applications.json'
};

class GoogleDriveStorage {
    constructor() {
        this.isSignedIn = false;
        this.accessToken = null;
        this.folderId = null;
        this.fileId = null;
    }

    /**
     * Initialize Google Drive API
     */
    async init() {
        return new Promise((resolve, reject) => {
            // Load Google API
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
                        clientId: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                        scope: 'https://www.googleapis.com/auth/drive.file'
                    });

                    // Listen for sign-in state changes
                    gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSignInStatus.bind(this));

                    // Handle initial sign-in state
                    this.updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

                    resolve(true);
                } catch (error) {
                    console.error('Error initializing Google Drive:', error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Update sign-in status
     */
    updateSignInStatus(isSignedIn) {
        this.isSignedIn = isSignedIn;
        if (isSignedIn) {
            this.accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
            console.log('✓ Signed in to Google Drive');
        } else {
            console.log('Not signed in to Google Drive');
        }
    }

    /**
     * Sign in to Google Drive
     */
    async signIn() {
        try {
            await gapi.auth2.getAuthInstance().signIn();
            return true;
        } catch (error) {
            console.error('Sign-in error:', error);
            return false;
        }
    }

    /**
     * Sign out from Google Drive
     */
    async signOut() {
        try {
            await gapi.auth2.getAuthInstance().signOut();
            return true;
        } catch (error) {
            console.error('Sign-out error:', error);
            return false;
        }
    }

    /**
     * Find or create the Job Tracker folder
     */
    async ensureFolder() {
        if (this.folderId) return this.folderId;

        try {
            // Search for existing folder
            const response = await gapi.client.drive.files.list({
                q: `name='${GOOGLE_DRIVE_CONFIG.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.result.files.length > 0) {
                this.folderId = response.result.files[0].id;
                console.log('✓ Found existing folder:', this.folderId);
            } else {
                // Create new folder
                const createResponse = await gapi.client.drive.files.create({
                    resource: {
                        name: GOOGLE_DRIVE_CONFIG.FOLDER_NAME,
                        mimeType: 'application/vnd.google-apps.folder'
                    },
                    fields: 'id'
                });
                this.folderId = createResponse.result.id;
                console.log('✓ Created new folder:', this.folderId);
            }

            return this.folderId;
        } catch (error) {
            console.error('Error ensuring folder:', error);
            throw error;
        }
    }

    /**
     * Find the applications data file
     */
    async findDataFile() {
        const folderId = await this.ensureFolder();

        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${GOOGLE_DRIVE_CONFIG.FILE_NAME}' and '${folderId}' in parents and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.result.files.length > 0) {
                this.fileId = response.result.files[0].id;
                console.log('✓ Found data file:', this.fileId);
                return this.fileId;
            }

            return null;
        } catch (error) {
            console.error('Error finding data file:', error);
            throw error;
        }
    }

    /**
     * Save applications to Google Drive
     */
    async save(applications) {
        if (!this.isSignedIn) {
            console.log('Not signed in, prompting user...');
            const success = await this.signIn();
            if (!success) return false;
        }

        try {
            const folderId = await this.ensureFolder();
            const dataStr = JSON.stringify({
                applications: applications,
                lastUpdated: new Date().toISOString(),
                version: '2.0'
            }, null, 2);

            const sizeInMB = (new Blob([dataStr]).size / (1024 * 1024)).toFixed(2);
            console.log(`Uploading ${sizeInMB}MB to Google Drive...`);

            const fileMetadata = {
                name: GOOGLE_DRIVE_CONFIG.FILE_NAME,
                mimeType: 'application/json'
            };

            const fileId = await this.findDataFile();

            if (fileId) {
                // Update existing file
                const response = await gapi.client.request({
                    path: `/upload/drive/v3/files/${fileId}`,
                    method: 'PATCH',
                    params: {
                        uploadType: 'multipart'
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: dataStr
                });

                console.log('✓ Updated file in Google Drive');
                return true;
            } else {
                // Create new file
                fileMetadata.parents = [folderId];

                const response = await gapi.client.request({
                    path: '/upload/drive/v3/files',
                    method: 'POST',
                    params: {
                        uploadType: 'multipart'
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...fileMetadata,
                        content: dataStr
                    })
                });

                this.fileId = response.result.id;
                console.log('✓ Created new file in Google Drive');
                return true;
            }
        } catch (error) {
            console.error('Error saving to Google Drive:', error);
            return false;
        }
    }

    /**
     * Load applications from Google Drive
     */
    async load() {
        if (!this.isSignedIn) {
            console.log('Not signed in, prompting user...');
            const success = await this.signIn();
            if (!success) return [];
        }

        try {
            const fileId = await this.findDataFile();
            
            if (!fileId) {
                console.log('No data file found in Google Drive');
                return [];
            }

            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            const data = JSON.parse(response.body);
            console.log(`✓ Loaded ${data.applications.length} applications from Google Drive`);
            
            return data.applications || [];
        } catch (error) {
            console.error('Error loading from Google Drive:', error);
            return [];
        }
    }

    /**
     * Get current user info
     */
    getUserInfo() {
        if (!this.isSignedIn) return null;

        const user = gapi.auth2.getAuthInstance().currentUser.get();
        const profile = user.getBasicProfile();

        return {
            name: profile.getName(),
            email: profile.getEmail(),
            image: profile.getImageUrl()
        };
    }

    /**
     * Check storage quota
     */
    async getStorageQuota() {
        if (!this.isSignedIn) return null;

        try {
            const response = await gapi.client.drive.about.get({
                fields: 'storageQuota'
            });

            const quota = response.result.storageQuota;
            return {
                limit: quota.limit,
                usage: quota.usage,
                usageInDrive: quota.usageInDrive,
                limitMB: (quota.limit / (1024 * 1024)).toFixed(2),
                usageMB: (quota.usage / (1024 * 1024)).toFixed(2),
                percentUsed: ((quota.usage / quota.limit) * 100).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting storage quota:', error);
            return null;
        }
    }
}

// Create global instance
const driveStorage = new GoogleDriveStorage();
