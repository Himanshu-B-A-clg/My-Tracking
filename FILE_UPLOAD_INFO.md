# 📎 File Upload Information

## File Size Limits
- **Maximum file size per file: 5MB**
- Files are automatically chunked into 800KB pieces for Firebase storage
- You can attach multiple files per job application

## How It Works

### 1. File Chunking
- Large files are split into 800KB chunks
- Each chunk is stored as a separate Firebase document
- This bypasses Firebase's 1MB document field limit

### 2. Storage Structure
```
Firebase Collections:
├── job_applications (application data)
└── job_files (file metadata + chunks)
    ├── app_0_file_0 (metadata)
    ├── app_0_file_0_chunk_0 (data)
    ├── app_0_file_0_chunk_1 (data)
    └── ...
```

### 3. Automatic Reassembly
- When you load applications, chunks are automatically reassembled
- You can download/view files as normal
- Files sync across all your devices

## Supported File Types
- ✅ PDF documents (resumes, cover letters)
- ✅ Word documents (.doc, .docx)
- ✅ Images (.jpg, .png, .gif)
- ✅ Text files (.txt)
- ✅ Any file type under 5MB

## Tips
- Keep individual files under 5MB for best performance
- Compress large PDFs before uploading
- Use images/screenshots for quick reference
- Attach relevant documents per application

## Cloud Benefits
- 📱 Access from any device
- ☁️ No local storage needed
- 🔄 Auto-sync across devices
- 💾 1GB total storage (Firebase free tier)
