# 📊 Job Application Tracker

A beautiful, professional web application to track your job applications with **automatic cloud sync** - no backend server or Firebase needed!

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## ✨ Features

### 🎯 Two-Page System
- 📊 **Dashboard Page** - Beautiful analytics with interactive charts
- 📝 **Manage Page** - Add, edit, and manage applications

### 📱 Core Features
- ✅ **Add/Edit/Delete** job applications
- ✅ **Track Status**: Selected, Rejected, Rejected in Rounds, In Progress
- ✅ **Search & Filter** by company name and status
- ✅ **Interactive Charts** - Pie, Line, and Bar charts
- ✅ **Achievement System** - Unlock achievements as you progress
- ✅ **Statistics Dashboard** with animated counters
- ✅ **Export to CSV** for spreadsheet analysis
- ✅ **Export to PDF** for professional reports

### 🎨 UI/UX
- ✅ **Professional animated interface**
- ✅ **Fully responsive** (mobile, tablet, desktop)
- ✅ **Modern gradient design**
- ✅ **Smooth animations** and transitions
- ✅ **Color-coded status badges**
- ✅ **Toast notifications** for all actions

### ☁️ Cloud Sync (Optional)
- ✅ **Automatic sync** across all devices
- ✅ **Free forever** using GitHub Gist
- ✅ **No backend required**
- ✅ **Private & secure**
- ✅ **Works offline** with localStorage fallback

---

## 🚀 Quick Start

### Option 1: Use Locally (No Setup)
1. Download all files
2. Open `dashboard.html` in your browser to see analytics
3. Click "Manage Applications" to add data
4. Start tracking applications!

**Data Storage:** Local browser storage (device-specific)

### Option 2: Cloud Sync (5 Minutes Setup)
1. Open `setup-guide.html` in browser for visual guide
2. Follow the 4 simple steps
3. Enable cloud sync across all devices!

**Data Storage:** GitHub Gist (syncs across all devices)

---

## 📁 Project Structure

```
job-application-tracker/
├── dashboard.html              # Analytics dashboard with charts
├── index.html                  # Manage applications page
├── dashboard.js                # Dashboard logic & charts
├── script.js                   # Application management logic
├── styles.css                  # Professional styling & animations
├── github-gist-config.js       # Cloud sync configuration
├── setup-guide.html            # Visual setup guide
├── TWO_PAGE_GUIDE.md          # Guide for 2-page system
├── CLOUD_SYNC_SETUP.md        # Detailed cloud sync docs
└── README.md                   # This file
```

---

## 🎯 How to Use

### Adding Applications
1. Click **"Add New Application"** button
2. Fill in:
   - Company Name (required)
   - Date Applied (required)
   - Status (required)
   - Company Requirements (optional)
3. Click **"Save Application"**

### Exporting Data
- **CSV Export**: Click "Export CSV" - opens in Excel/Google Sheets
- **PDF Export**: Click "Export PDF" - professional report with stats
- **Backup Data**: Click "Backup Data" - download JSON for manual transfer

### Cloud Sync
- **Enable once** following setup-guide.html
- **Automatic sync** every 30 seconds
- **Access anywhere** - just open the app on any device

---

## 🔒 Privacy & Security

### Local Storage
- All data stored in **your browser**
- No external servers involved
- Complete privacy

### Cloud Sync
- Data stored in **your private GitHub Gist**
- Only you have access
- Token stays on your device
- End-to-end encrypted connection (HTTPS)

**Important:** Never share your GitHub token or commit it to public repositories!

---

## 🛠️ Cloud Sync Setup (Detailed)

### Step 1: Get GitHub Token
1. Go to https://github.com/settings/tokens/new
2. Name: `Job Application Tracker`
3. Expiration: `No expiration` or `1 year`
4. Check only: `gist` permission
5. Generate and copy token

### Step 2: Create Secret Gist
1. Go to https://gist.github.com/
2. Description: `Job Application Tracker Data`
3. Filename: `job-applications-data.json`
4. Content: `[]`
5. Create as **secret** gist
6. Copy Gist ID from URL

### Step 3: Configure
Edit `github-gist-config.js`:
```javascript
const GITHUB_CONFIG = {
    GITHUB_TOKEN: 'ghp_your_token_here',
    GIST_ID: 'your_gist_id_here',
    USERNAME: 'your_github_username'
};

const SYNC_ENABLED = true; // Change to true
```

### Step 4: Test
- Open app
- Add an application
- Check for sync status messages
- Open on another device - data syncs!

---

## 💡 Advanced Features

### Auto-Sync Interval
Edit `github-gist-config.js`:
```javascript
const AUTO_SYNC_INTERVAL = 30000; // milliseconds

// Examples:
// 10000  = 10 seconds
// 30000  = 30 seconds (default)
// 60000  = 1 minute
// 300000 = 5 minutes
```

### Merge vs Replace Data
When restoring backup:
- **Merge**: Keeps existing + adds new data
- **Replace**: Deletes existing, uses backup only

---

## 📊 Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Storage**: localStorage + GitHub Gist API
- **Export**: jsPDF, jsPDF-AutoTable
- **Icons**: Font Awesome 6
- **No frameworks** - lightweight & fast!

---

## 🎨 Customization

### Change Colors
Edit `styles.css`:
```css
:root {
    --primary-color: #667eea;  /* Main color */
    --secondary-color: #764ba2; /* Secondary color */
    --success-color: #10b981;   /* Success messages */
    --danger-color: #ef4444;    /* Danger/delete */
}
```

### Add New Status Types
Edit `script.js` and `index.html` to add more status options.

---

## 🐛 Troubleshooting

### Data not showing on refresh
- **Local mode**: Data stored in browser - clear cache may delete it
- **Cloud sync**: Check if `SYNC_ENABLED = true` in config

### 401 Unauthorized Error
- Invalid GitHub token
- Create new token with `gist` permission

### 404 Not Found Error
- Invalid Gist ID
- Check the Gist URL and copy correct ID

### Sync not working
1. Open browser console (F12)
2. Check for error messages
3. Verify config values are correct
4. Ensure internet connection

---

## 📱 Browser Compatibility

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📄 License

MIT License - feel free to use, modify, and distribute!

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 🎓 Support

- **Setup Help**: Open `setup-guide.html`
- **Documentation**: Read `CLOUD_SYNC_SETUP.md`
- **Issues**: Check browser console for errors

---

## 🌟 Features Coming Soon

- [ ] User authentication
- [ ] Multiple boards/categories
- [ ] Email reminders
- [ ] Interview date tracking
- [ ] Salary information
- [ ] Company ratings
- [ ] Timeline view
- [ ] Dark mode

---

## 📞 Contact

Built with ❤️ for job seekers everywhere!

**No Firebase. No Backend. Just Simple & Effective!** 🚀

---

## ⭐ Star This Project

If you find this helpful, please give it a star on GitHub!

