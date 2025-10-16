// Firebase Configuration
// To use Firebase cloud storage:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project
// 3. Go to Project Settings > General
// 4. Scroll down to "Your apps" and click the web icon (</>)
// 5. Copy your Firebase configuration and replace the config below

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Uncomment these lines after adding your Firebase config above
/*
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Save to Firebase
async function saveToFirebase() {
    try {
        const userId = getUserId(); // Get or create user ID
        await db.collection('applications').doc(userId).set({
            data: applications,
            lastUpdated: new Date().toISOString()
        });
        showNotification('Data synced to cloud!', 'success');
    } catch (error) {
        console.error('Firebase save error:', error);
        showNotification('Failed to sync to cloud', 'error');
    }
}

// Load from Firebase
async function loadFromFirebase() {
    try {
        const userId = getUserId();
        const doc = await db.collection('applications').doc(userId).get();
        if (doc.exists) {
            const cloudData = doc.data();
            applications = cloudData.data || [];
            saveToLocalStorage();
            loadApplications();
            updateStats();
            showNotification('Data loaded from cloud!', 'success');
        }
    } catch (error) {
        console.error('Firebase load error:', error);
    }
}

// Get or create user ID
function getUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }
    return userId;
}

// Auto-sync every time data changes
function saveToLocalStorage() {
    localStorage.setItem('applications', JSON.stringify(applications));
    saveToFirebase(); // Auto-sync to cloud
}

// Load from cloud on page load
document.addEventListener('DOMContentLoaded', function() {
    loadFromFirebase();
});
*/
