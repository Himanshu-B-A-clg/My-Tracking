# Storage Quota Issue - SOLUTION GUIDE

## ⚠️ Problem: "QuotaExceededError"

This error means your browser's localStorage is full (usually limited to 5-10MB total).

### Why This Happens:
- **File uploads use Base64 encoding** which increases file size by ~33%
- **Multiple files** across all applications add up quickly
- **localStorage limit** is typically 5-10MB for the entire domain

## ✅ SOLUTIONS

### Solution 1: Reduce File Size (Recommended)
**New Limit: 2MB per file** (changed from 5MB for safety)

1. Compress your PDF files before uploading:
   - Use online tools: smallpdf.com, ilovepdf.com
   - Or use "Print to PDF" with lower quality settings

2. Keep only essential files:
   - Upload only 1-2 files per application
   - Delete old files you don't need

### Solution 2: Clear Old Data

**Step-by-step:**
1. Open `clear-data.html` in your browser
2. Click "Clear All Data"
3. Start fresh with smaller files

### Solution 3: Use Cloud Storage Links Instead

Instead of uploading files, you can:
1. Upload files to Google Drive/Dropbox
2. Store the **link** in the Description field
3. No file size limits!

**Example Description:**
```
Full Stack Developer Role
Resume: https://drive.google.com/file/d/xxx
```

### Solution 4: Remove Files from Existing Applications

1. Click the View (eye icon) on any application
2. Click Delete button on large files
3. Free up space for new applications

## 📊 How to Check Storage Usage

Open browser console (F12) and run:
```javascript
const dataStr = localStorage.getItem('applications');
const sizeInMB = (new Blob([dataStr]).size / (1024 * 1024)).toFixed(2);
console.log(`Current storage: ${sizeInMB}MB`);
```

## 🎯 Best Practices

### DO:
✅ Compress PDFs before uploading
✅ Keep files under 2MB each
✅ Limit to 2-3 files per application
✅ Delete old files you don't need
✅ Use cloud storage links for large files

### DON'T:
❌ Upload original high-res PDFs (often 5-10MB)
❌ Upload multiple versions of same document
❌ Store dozens of files across applications
❌ Ignore the 2MB warning

## 🔧 Technical Details

### File Size Calculation:
- Original file: 1MB
- Base64 encoded: ~1.33MB
- JSON + metadata: ~1.4MB
- **Actual storage used: 1.4MB per 1MB file**

### Storage Limit:
- **Total localStorage**: ~5-10MB (browser dependent)
- **Safe limit**: Keep under 4MB
- **Warning threshold**: Shows warning at 4MB
- **Current limit**: 2MB per file

### What Uses Space:
1. Application data (company, date, status, description)
2. File metadata (name, type, size)
3. Base64 encoded file content (largest part)

## 🚨 Emergency: Storage Full Right Now

If you can't save anything:

1. **Open Console** (F12)
2. **Run this command:**
```javascript
// See what's taking space
let apps = JSON.parse(localStorage.getItem('applications'));
apps.forEach((app, i) => {
    let fileSize = 0;
    if (app.files) {
        fileSize = app.files.reduce((sum, f) => sum + (f.data?.length || 0), 0);
    }
    console.log(`${i}: ${app.companyName} - ${(fileSize/1024/1024).toFixed(2)}MB in files`);
});
```

3. **Find the largest ones** and delete them using clear-data.html

## 💡 Alternative: File Links Method

Instead of uploading files, store them like this:

**Description field:**
```
Full Stack Developer Position
- Applied: Oct 17, 2025
- Resume: https://bit.ly/myresume2025
- Cover Letter: https://bit.ly/coverletter-fullstack
- Portfolio: https://myportfolio.com
```

This way:
- ✅ No storage limit
- ✅ Easy to update files
- ✅ Files can be any size
- ✅ Share links with recruiters easily

## 📝 Summary

**The error you saw means storage is full.**

**Quick fix:**
1. Go to clear-data.html and clear everything
2. Re-add applications with compressed PDFs (under 2MB each)
3. Or use cloud storage links instead of uploads

**Long-term solution:**
- Keep files under 2MB
- Use cloud links for large documents
- Regularly clean up old applications
