# 🌐 Local Server Setup - CORS Fix

## ✅ Server is Now Running!

Your Job Application Tracker is now running at:
**http://localhost:8000**

## Why You Need This

The CORS errors you saw happen because:
- Browsers block ES6 module imports from `file://` URLs
- Firebase requires HTTP/HTTPS protocol
- Direct file opening causes security restrictions

## How to Use

### Option 1: Use START_HERE.bat (Easiest)
1. Double-click `START_HERE.bat`
2. Server starts automatically
3. Browser opens to http://localhost:8000
4. ✅ No CORS errors!

### Option 2: Manual Start
1. Open PowerShell in this folder
2. Run: `powershell -ExecutionPolicy Bypass -File start-server.ps1`
3. Open browser to http://localhost:8000

## Server Features

✅ **Auto-opens browser** - Launches http://localhost:8000/index.html
✅ **Proper MIME types** - Serves .js files as JavaScript modules
✅ **Fast & lightweight** - Pure PowerShell, no installation needed
✅ **Request logging** - See what files are being accessed

## Stopping the Server

Press `Ctrl+C` in the PowerShell window to stop the server.

## Access Your App

- **Main App**: http://localhost:8000/index.html
- **Dashboard**: http://localhost:8000/dashboard.html

## Important Notes

⚠️ **Keep the server running** while using the app
⚠️ **Don't close the PowerShell window** - it hosts the server
✅ **Bookmark the URL** for easy access: http://localhost:8000

## For Other Devices

To access from phone/tablet on same WiFi:
1. Find your PC's IP address: `ipconfig` (look for IPv4)
2. Open browser on other device
3. Go to: `http://YOUR-PC-IP:8000`

Example: `http://192.168.1.100:8000`

## Troubleshooting

**Port 8000 already in use?**
- Edit `start-server.ps1`
- Change line: `$port = 8000` to `$port = 8080`
- Restart server

**Server won't start?**
- Right-click `start-server.ps1`
- Select "Run with PowerShell"

**Still seeing CORS errors?**
- Make sure you're using http://localhost:8000
- NOT file:///C:/Users/...
- Close any old file:// tabs

---

🎉 **Your app is now running with full Firebase cloud sync!**
