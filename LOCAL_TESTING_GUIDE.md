# 🔧 Local Development & Testing Guide

## ⚠️ CORS Error Explanation

If you see CORS errors in the console when opening `index.html` directly, this is **NORMAL**!

### Why CORS Error Happens:
- Opening `index.html` as a file (`file:///...`) has security restrictions
- Browsers block API calls from local files for security
- This is a browser security feature, not a bug in the app

### Solutions:

---

## ✅ Solution 1: Use a Local Server (Recommended)

### Option A: Python Simple Server

**If you have Python installed:**

```powershell
# Navigate to your project folder
cd "C:\Users\himub\Desktop\My data"

# Python 3.x (most common)
python -m http.server 8000

# OR Python 2.x
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000`

---

### Option B: VS Code Live Server

1. **Install Extension:**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search: "Live Server"
   - Install by Ritwick Dey

2. **Run Server:**
   - Right-click `index.html`
   - Select "Open with Live Server"
   - Browser opens automatically

---

### Option C: Node.js http-server

**If you have Node.js installed:**

```powershell
# Install http-server globally (one time)
npm install -g http-server

# Navigate to project folder
cd "C:\Users\himub\Desktop\My data"

# Start server
http-server -p 8000

# Or with CORS enabled
http-server -p 8000 --cors
```

Then open: `http://localhost:8000`

---

### Option D: PHP Built-in Server

**If you have PHP installed:**

```powershell
cd "C:\Users\himub\Desktop\My data"
php -S localhost:8000
```

Then open: `http://localhost:8000`

---

## ✅ Solution 2: Deploy to GitHub Pages (Best for Production)

This completely solves CORS issues AND makes your app accessible online!

### Steps:

1. **Push to GitHub:**
```powershell
git init
git add .
git commit -m "Job Application Tracker"
git remote add origin https://github.com/Himanshu-B-A-clg/job-tracker.git
git push -u origin main
```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click Settings → Pages
   - Source: `main` branch
   - Folder: `/ (root)`
   - Click Save

3. **Access your app:**
   - URL: `https://himanshu-b-a-clg.github.io/job-tracker/`
   - No CORS errors!
   - Works on all devices!

---

## ✅ Solution 3: Disable Cloud Sync for Local Testing

If you just want to test the app without cloud sync:

Edit `github-gist-config.js`:
```javascript
const SYNC_ENABLED = false; // Change to false temporarily
```

This will:
- ✅ Remove CORS errors
- ✅ App works perfectly with localStorage
- ✅ All features work except cloud sync
- ✅ Can still use Backup/Restore buttons

---

## 🧪 Testing Checklist

### Test Without Cloud Sync:
```
✅ Open index.html (any way)
✅ Add applications
✅ Edit/Delete works
✅ Search/Filter works
✅ Export CSV works
✅ Export PDF works
✅ Backup/Restore works
✅ Stats update correctly
```

### Test With Cloud Sync:
```
⚠️ Must use local server OR GitHub Pages
✅ All above tests
✅ Check console for sync messages
✅ Verify data in GitHub Gist
✅ Open in another browser - data syncs
✅ Check sync status in header
```

---

## 🔍 Debugging Cloud Sync

### Check Your Configuration:

Open browser console (F12) and run:

```javascript
// Check if sync is enabled
console.log('Sync enabled:', SYNC_ENABLED);

// Check token format (should start with ghp_)
console.log('Token starts with ghp_:', GITHUB_CONFIG.GITHUB_TOKEN.startsWith('ghp_'));

// Check Gist ID (should be 32 characters, alphanumeric)
console.log('Gist ID length:', GITHUB_CONFIG.GIST_ID.length);
console.log('Gist ID:', GITHUB_CONFIG.GIST_ID);
```

**Expected results:**
- Sync enabled: `true`
- Token starts with ghp_: `true`
- Gist ID length: `32`
- Gist ID: Should be a string like `3f96a17daa34d25916e6ec20c0c90c62`

---

## 🛠️ Token Troubleshooting

### If you see 401 Unauthorized:

Your token might be:
1. **Invalid** - Generate a new one
2. **Expired** - Generate a new one
3. **Missing 'gist' permission** - Generate with correct permission

### Generate New Token:

1. Go to: https://github.com/settings/tokens/new
2. Note: `Job Application Tracker`
3. Expiration: `No expiration` or `90 days`
4. **Check ONLY**: `gist` ✅
5. Click `Generate token`
6. Copy the new token (starts with `ghp_`)
7. Replace in `github-gist-config.js`

⚠️ **Important:** Each token can only be viewed ONCE when created!

---

## 🛠️ Gist ID Troubleshooting

### If you see 404 Not Found:

1. **Open your Gist:** https://gist.github.com/Himanshu-B-A-clg
2. **Find:** "job-applications-data.json"
3. **Click** on it
4. **URL will be:** `https://gist.github.com/Himanshu-B-A-clg/[GIST_ID]`
5. **Copy only the random string** (the GIST_ID part)
   - Example: `3f96a17daa34d25916e6ec20c0c90c62`
6. **Update** in `github-gist-config.js`

### Current Config Check:
Your GIST_ID should look like: `3f96a17daa34d25916e6ec20c0c90c62`
NOT like: `https://gist.github.com/...` (no URL, just the ID!)

---

## ✅ Recommended Workflow

### For Development:
```
1. Use VS Code Live Server or Python server
2. Enable cloud sync
3. Test all features
4. Check console for errors
```

### For Production:
```
1. Push to GitHub
2. Enable GitHub Pages
3. Share the live URL
4. No CORS issues!
```

### For Quick Local Testing:
```
1. Set SYNC_ENABLED = false
2. Open index.html directly
3. Test app features
4. Use Backup/Restore for data transfer
```

---

## 📊 Current Status

Based on your configuration:

✅ **Token:** Looks valid (ghp_...)
✅ **Gist ID:** Now fixed (just the ID, not URL)
✅ **Username:** Correct
✅ **Sync:** Enabled

**Next Step:** Use a local server OR deploy to GitHub Pages to avoid CORS!

---

## 🎯 Quick Commands

### Check if Python is installed:
```powershell
python --version
```

### Check if Node.js is installed:
```powershell
node --version
npm --version
```

### Check if PHP is installed:
```powershell
php --version
```

---

## 💡 Best Solution for You

Based on your setup, I recommend:

1. **Right now:** Set `SYNC_ENABLED = false` to test the app
2. **Next:** Deploy to GitHub Pages (takes 5 minutes)
3. **Then:** Enable sync and test on multiple devices

This way:
- ✅ App works immediately
- ✅ No CORS issues
- ✅ Can share with others
- ✅ Cloud sync works perfectly

---

Need help with any of these steps? Let me know! 🚀
