// GitHub Gist Cloud Storage Configuration
// This uses GitHub Gist as a free cloud database - no Firebase needed!

// SETUP INSTRUCTIONS:
// 1. Go to https://github.com/settings/tokens/new
// 2. Give it a name like "Job Tracker"
// 3. Select expiration: "No expiration" or "1 year"
// 4. Check only "gist" permission
// 5. Click "Generate token"
// 6. Copy the token and paste it below in GITHUB_TOKEN
// 7. Create a new gist at https://gist.github.com/
//    - Name it "job-applications-data.json"
//    - Content: []
//    - Make it SECRET (not public)
// 8. Copy the Gist ID from URL (the random string after your username)
// 9. Paste it below in GIST_ID

const GITHUB_CONFIG = {
    GITHUB_TOKEN: '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', // From step 5 above
    GIST_ID: '3f96a17daa34d25916e6ec20c0c90c62',          // From step 8 above - ONLY the ID, not full URL!
    USERNAME: 'Himanshu-B-A-clg'
};

// Cloud sync settings
const SYNC_ENABLED = true; // Set to true after adding your config above
const AUTO_SYNC_INTERVAL = 30000; // Auto sync every 30 seconds

// GitHub Gist API functions
class GistStorage {
    constructor(config) {
        this.token = config.GITHUB_TOKEN;
        this.gistId = config.GIST_ID;
        this.syncInterval = null;
    }

    // Save data to Gist
    async save(data) {
        if (!SYNC_ENABLED) return;
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: {
                        'job-applications-data.json': {
                            content: JSON.stringify({
                                applications: data,
                                lastUpdated: new Date().toISOString()
                            }, null, 2)
                        }
                    }
                })
            });

            if (response.ok) {
                console.log('✅ Data synced to cloud');
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Sync failed:', response.status, errorText);
                if (response.status === 401) {
                    console.error('⚠️ Invalid token! Create a new one at: https://github.com/settings/tokens/new');
                } else if (response.status === 404) {
                    console.error('⚠️ Gist not found! Check your GIST_ID');
                }
                return false;
            }
        } catch (error) {
            console.error('❌ Sync error:', error);
            if (error.message.includes('CORS')) {
                console.error('⚠️ CORS error - this is normal for local files. Deploy to GitHub Pages or use a local server.');
            }
            return false;
        }
    }

    // Load data from Gist
    async load() {
        if (!SYNC_ENABLED) return null;
        
        try {
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.token}`,
                }
            });

            if (response.ok) {
                const gist = await response.json();
                const content = gist.files['job-applications-data.json'].content;
                const data = JSON.parse(content);
                console.log('✅ Data loaded from cloud');
                return data.applications || [];
            } else {
                const errorText = await response.text();
                console.error('❌ Load failed:', response.status, errorText);
                if (response.status === 401) {
                    console.error('⚠️ Invalid token! Create a new one at: https://github.com/settings/tokens/new');
                } else if (response.status === 404) {
                    console.error('⚠️ Gist not found! Check your GIST_ID');
                }
                return null;
            }
        } catch (error) {
            console.error('❌ Load error:', error);
            if (error.message.includes('CORS')) {
                console.error('⚠️ CORS error - this is normal for local files. Deploy to GitHub Pages or use a local server.');
            }
            return null;
        }
    }

    // Start auto-sync
    startAutoSync(saveCallback) {
        if (!SYNC_ENABLED) return;
        
        this.syncInterval = setInterval(() => {
            saveCallback();
        }, AUTO_SYNC_INTERVAL);
        console.log('🔄 Auto-sync enabled');
    }

    // Stop auto-sync
    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            console.log('⏸️ Auto-sync disabled');
        }
    }
}

// Initialize Gist storage
const gistStorage = new GistStorage(GITHUB_CONFIG);

// Export for use in script.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gistStorage, SYNC_ENABLED };
}
