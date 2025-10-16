# Database Management Instructions

## How to Clear Old/Dummy Data

### Option 1: Using Clear Data Page (Recommended)
1. Open `clear-data.html` in your browser
2. You'll see the current number of applications stored
3. Click "Clear All Data" button
4. Confirm the action
5. You'll be redirected to the main page with a clean database

### Option 2: Using Browser Console
1. Open your browser (with index.html loaded)
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Type: `localStorage.clear()`
5. Press Enter
6. Refresh the page (F5 or Ctrl+R)

### Option 3: Manual Storage Check
1. Press F12 in browser
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Expand "Local Storage"
4. Click on your site (http://127.0.0.1:5500)
5. Find "applications" key
6. Right-click and delete it
7. Refresh the page

## What Changed in This Update

### 1. Table Structure
- **Removed:** Description column from main table
- **Removed:** Files column from main table
- **New Layout:** Company Name | Date Applied | Status | Actions

### 2. View Button
- **Location:** Now in Actions column (green eye icon)
- **Function:** Opens a detailed modal showing:
  - Company Name
  - Date Applied
  - Status
  - Full Description
  - All attached files with download/delete options

### 3. Fresh Data Loading
- Application now reloads data fresh from localStorage on every page load
- No more cached/duplicate data
- Ensures data consistency across browser sessions

### 4. Export Updates
- CSV export now includes: Company Name, Date Applied, Status (no description)
- PDF export now includes: Company Name, Date Applied, Status (no description)
- Both exports remain functional with cleaner output

## Troubleshooting

### If you see duplicate data:
1. Go to `clear-data.html`
2. Clear all data
3. Return to `index.html`
4. Add your applications fresh

### If changes don't appear:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Close and reopen the browser

### If cloud sync shows old data:
1. Disable cloud sync temporarily (SYNC_ENABLED = false in github-gist-config.js)
2. Clear local data using clear-data.html
3. Re-enable sync
4. Add new applications

## Testing Your Setup

1. **Clear old data:** Open clear-data.html and clear everything
2. **Add test application:** Go to index.html and add one application
3. **View details:** Click the green eye icon in Actions column
4. **Verify:** Check that description and files show in the modal
5. **Test export:** Export to CSV/PDF and verify only 3 columns appear

## Files Modified in This Update

- `index.html` - Updated table structure (removed 2 columns)
- `script.js` - Updated loadApplications(), added viewApplication() function, updated exports
- `styles.css` - Added view details modal styling
- `clear-data.html` - NEW FILE for easy data management

## Need Help?

If you encounter any issues:
1. Check browser console (F12) for errors
2. Verify localStorage is enabled in your browser
3. Make sure you've cleared old data using clear-data.html
4. Try hard refresh (Ctrl+Shift+R)
