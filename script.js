// Application data storage
let applications = [];

// Load fresh data from IndexedDB
async function loadFromStorage() {
    try {
        // Initialize IndexedDB if not already done
        if (!idbStorage.db) {
            await idbStorage.init();
        }
        
        // Try to migrate from localStorage if this is first time
        const localData = localStorage.getItem('applications');
        if (localData) {
            const localApps = JSON.parse(localData);
            const idbApps = await idbStorage.getAll();
            
            // If IndexedDB is empty but localStorage has data, migrate
            if (idbApps.length === 0 && localApps.length > 0) {
                console.log('Migrating from localStorage to IndexedDB...');
                await idbStorage.saveAll(localApps);
                localStorage.removeItem('applications'); // Clear old storage
                showNotification(`Migrated ${localApps.length} applications to IndexedDB!`, 'success');
            }
        }
        
        // Load from IndexedDB
        applications = await idbStorage.getAll();
        console.log('Loaded applications from IndexedDB:', applications.length);
    } catch (error) {
        console.error('Error loading from storage:', error);
        applications = [];
        showNotification('Error loading data. Please refresh the page.', 'error');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading indicator
    showNotification('Loading applications...', 'info');
    
    // Load from IndexedDB
    await loadFromStorage();
    
    // Try to load from cloud first (priority over local data)
    if (typeof gistStorage !== 'undefined' && SYNC_ENABLED) {
        showSyncStatus('Syncing with cloud...', 'info');
        try {
            const cloudData = await gistStorage.load();
            if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
                // Always prefer cloud data (for cross-device sync)
                console.log(`Cloud: ${cloudData.length} apps, Local: ${applications.length} apps`);
                
                // Use cloud data if it has more or equal applications
                if (cloudData.length >= applications.length) {
                    applications = cloudData;
                    await idbStorage.saveAll(applications);
                    showSyncStatus(`✓ Loaded ${cloudData.length} apps from cloud`, 'success');
                } else {
                    // Local has more, push to cloud
                    await gistStorage.save(applications);
                    showSyncStatus(`✓ Uploaded ${applications.length} apps to cloud`, 'success');
                }
            } else if (applications.length > 0) {
                // No cloud data, push local to cloud
                console.log('No cloud data, uploading local data...');
                await gistStorage.save(applications);
                showSyncStatus(`✓ Uploaded ${applications.length} apps to cloud`, 'success');
            }
        } catch (error) {
            console.error('Cloud sync error:', error);
            showSyncStatus('⚠ Cloud sync unavailable', 'warning');
        }
        
        // Start auto-sync every 30 seconds
        gistStorage.startAutoSync(async () => {
            if (typeof gistStorage !== 'undefined' && SYNC_ENABLED) {
                try {
                    await gistStorage.save(applications);
                    console.log('Auto-synced to cloud');
                } catch (error) {
                    console.error('Auto-sync failed:', error);
                }
            }
        });
    }
    
    loadApplications();
    updateStats();
    updateStorageStatus();
    setDefaultDate();
    initializeFileUpload();
});

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateApplied').value = today;
}

// Open modal
function openModal() {
    document.getElementById('applicationModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Add New Application';
    document.getElementById('applicationForm').reset();
    document.getElementById('editIndex').value = '';
    document.getElementById('fileList').innerHTML = '';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    setDefaultDate();
}

// Close modal
function closeModal() {
    document.getElementById('applicationModal').style.display = 'none';
    document.getElementById('applicationForm').reset();
    document.getElementById('fileList').innerHTML = '';
    document.body.style.overflow = 'auto'; // Restore background scroll
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('applicationModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Initialize file upload handler
function initializeFileUpload() {
    const fileUploadElement = document.getElementById('fileUpload');
    if (fileUploadElement) {
        fileUploadElement.addEventListener('change', function(e) {
            const fileList = document.getElementById('fileList');
            const files = Array.from(e.target.files);
            
            if (files.length > 0) {
                fileList.innerHTML = files.map((file, index) => `
                    <div class="file-item">
                        <i class="fas fa-file-alt"></i>
                        <span>${file.name}</span>
                        <button type="button" class="remove-file-btn" onclick="removeFile(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
            } else {
                fileList.innerHTML = '';
            }
        });
    }
}

// Remove file from upload
function removeFile(index) {
    const fileInput = document.getElementById('fileUpload');
    if (!fileInput || !fileInput.files) return;
    
    try {
        const dt = new DataTransfer();
        const files = Array.from(fileInput.files);
        
        files.forEach((file, i) => {
            if (i !== index) dt.items.add(file);
        });
        
        fileInput.files = dt.files;
        
        // Trigger change event to update display
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    } catch (error) {
        console.error('Error removing file:', error);
        showNotification('Could not remove file', 'error');
    }
}

// Save application
async function saveApplication(event) {
    event.preventDefault();
    
    const companyName = document.getElementById('companyName').value;
    const dateApplied = document.getElementById('dateApplied').value;
    const status = document.getElementById('status').value;
    const description = document.getElementById('description').value;
    const editIndex = document.getElementById('editIndex').value;
    const fileInput = document.getElementById('fileUpload');
    
    // Handle file uploads
    let uploadedFiles = [];
    if (editIndex !== '') {
        // Keep existing files if editing
        uploadedFiles = applications[editIndex].files || [];
    }
    
    // Add new files
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
        try {
            const newFiles = await Promise.all(
                Array.from(fileInput.files).map(file => convertFileToBase64(file))
            );
            uploadedFiles = [...uploadedFiles, ...newFiles];
        } catch (error) {
            console.error('Error uploading files:', error);
            showNotification('Some files could not be uploaded', 'warning');
        }
    }
    
    const application = {
        id: editIndex ? applications[editIndex].id : Date.now(),
        companyName,
        dateApplied,
        status,
        description,
        files: uploadedFiles
    };
    
    if (editIndex !== '') {
        // Update existing application
        applications[editIndex] = application;
        showNotification('Application updated successfully!', 'success');
    } else {
        // Add new application
        applications.unshift(application);
        showNotification('Application added successfully!', 'success');
    }
    
    saveToLocalStorage();
    loadApplications();
    updateStats();
    updateStorageStatus();
    closeModal();
}

// Convert file to base64 for storage
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        // Check file size (max 50MB with IndexedDB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            reject(new Error(`File "${file.name}" is too large. Maximum size is 50MB per file.`));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
            resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result
            });
        };
        reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
        reader.readAsDataURL(file);
    });
}

// Load applications
function loadApplications() {
    const tbody = document.getElementById('applicationsBody');
    const emptyState = document.getElementById('emptyState');
    
    if (applications.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    tbody.innerHTML = '';
    
    applications.forEach((app, index) => {
        const row = tbody.insertRow();
        row.style.animationDelay = `${index * 0.05}s`;
        
        row.innerHTML = `
            <td><strong>${app.companyName}</strong></td>
            <td>${formatDate(app.dateApplied)}</td>
            <td><span class="status-badge status-${app.status}">${formatStatus(app.status)}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-success" onclick="viewApplication(${index})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-info" onclick="editApplication(${index})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteApplication(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    });
}

// View application details modal
function viewApplication(index) {
    const app = applications[index];
    if (!app) {
        showNotification('Application not found!', 'error');
        return;
    }
    
    const filesHTML = app.files && app.files.length > 0 
        ? app.files.map((file, fileIndex) => `
            <div class="file-view-item">
                <div class="file-icon">
                    <i class="fas fa-file-${getFileIcon(file.type)}"></i>
                </div>
                <div class="file-info">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
                <div class="file-actions">
                    <button class="btn btn-primary" onclick="downloadFile(${index}, ${fileIndex})">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-danger" onclick="deleteFile(${index}, ${fileIndex})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('')
        : '<p class="no-files-msg"><i class="fas fa-info-circle"></i> No files attached</p>';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-eye"></i> Application Details</h2>
                <span class="close" onclick="this.closest('.modal').remove(); document.body.style.overflow='auto';">&times;</span>
            </div>
            <div class="view-details-container">
                <div class="detail-row">
                    <strong><i class="fas fa-building"></i> Company Name:</strong>
                    <span>${app.companyName}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-calendar"></i> Date Applied:</strong>
                    <span>${formatDate(app.dateApplied)}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-info-circle"></i> Status:</strong>
                    <span class="status-badge status-${app.status}">${formatStatus(app.status)}</span>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-align-left"></i> Description:</strong>
                    <p class="description-text">${app.description || app.requirements || 'No description provided'}</p>
                </div>
                <div class="detail-row">
                    <strong><i class="fas fa-paperclip"></i> Attached Files (${app.files ? app.files.length : 0}):</strong>
                </div>
                <div class="files-view-container">
                    ${filesHTML}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Close on outside click
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    };
}

// View files modal (keeping for backward compatibility)
function viewFiles(index) {
    const app = applications[index];
    if (!app || !app.files || app.files.length === 0) {
        showNotification('No files attached!', 'warning');
        return;
    }
    
    const filesHTML = app.files.map((file, fileIndex) => `
        <div class="file-view-item">
            <div class="file-icon">
                <i class="fas fa-file-${getFileIcon(file.type)}"></i>
            </div>
            <div class="file-info">
                <h4>${file.name}</h4>
                <p>${formatFileSize(file.size)}</p>
            </div>
            <div class="file-actions">
                <button class="btn btn-primary" onclick="downloadFile(${index}, ${fileIndex})">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-danger" onclick="deleteFile(${index}, ${fileIndex})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-folder-open"></i> Files - ${app.companyName}</h2>
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="files-view-container">
                ${filesHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Download uploaded file from application
function downloadFile(appIndex, fileIndex) {
    try {
        const file = applications[appIndex].files[fileIndex];
        if (!file || !file.data) {
            showNotification('File not found!', 'error');
            return;
        }
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('File downloaded!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Failed to download file!', 'error');
    }
}

// Delete file
function deleteFile(appIndex, fileIndex) {
    if (confirm('Are you sure you want to delete this file?')) {
        try {
            applications[appIndex].files.splice(fileIndex, 1);
            saveToLocalStorage();
            loadApplications();
            
            // Close and reopen modal with updated files
            const existingModal = document.querySelector('.modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            if (applications[appIndex].files.length > 0) {
                viewFiles(appIndex);
            }
            showNotification('File deleted!', 'success');
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Failed to delete file!', 'error');
        }
    }
}

// Get file icon based on type
function getFileIcon(type) {
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('word') || type.includes('document')) return 'word';
    if (type.includes('text')) return 'alt';
    return 'alt';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Edit application
function editApplication(index) {
    const app = applications[index];
    
    document.getElementById('companyName').value = app.companyName;
    document.getElementById('dateApplied').value = app.dateApplied;
    document.getElementById('status').value = app.status;
    document.getElementById('description').value = app.description || app.requirements || '';
    document.getElementById('editIndex').value = index;
    document.getElementById('modalTitle').textContent = 'Edit Application';
    
    // Clear file input but show existing files
    document.getElementById('fileUpload').value = '';
    const fileList = document.getElementById('fileList');
    if (app.files && app.files.length > 0) {
        fileList.innerHTML = `
            <div class="existing-files-note">
                <i class="fas fa-info-circle"></i>
                <span>${app.files.length} existing file(s). Upload new files to add more.</span>
            </div>
        `;
    } else {
        fileList.innerHTML = '';
    }
    
    document.getElementById('applicationModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

// Delete application
function deleteApplication(index) {
    if (confirm('Are you sure you want to delete this application?')) {
        applications.splice(index, 1);
        saveToLocalStorage();
        loadApplications();
        updateStats();
        showNotification('Application deleted successfully!', 'error');
    }
}

// Update statistics
function updateStats() {
    const total = applications.length;
    const selected = applications.filter(app => app.status === 'selected').length;
    const rejected = applications.filter(app => app.status === 'rejected' || app.status === 'rejected-in-rounds').length;
    const pending = applications.filter(app => app.status === 'in-progress').length;
    
    document.getElementById('totalApplications').textContent = total;
    document.getElementById('selectedCount').textContent = selected;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('pendingCount').textContent = pending;
    
    // Animate numbers
    animateValue('totalApplications', 0, total, 1000);
    animateValue('selectedCount', 0, selected, 1000);
    animateValue('rejectedCount', 0, rejected, 1000);
    animateValue('pendingCount', 0, pending, 1000);
}

// Animate number counting
function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Filter applications
function filterApplications() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const rows = document.querySelectorAll('#applicationsBody tr');
    
    rows.forEach(row => {
        const companyName = row.cells[0].textContent.toLowerCase();
        const status = row.cells[2].querySelector('.status-badge').className.split(' ')[1].replace('status-', '');
        
        const matchesSearch = companyName.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        
        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Export data as JSON for backup
function exportData() {
    if (applications.length === 0) {
        showNotification('No data to backup!', 'warning');
        return;
    }
    
    // Convert old data format if needed
    const exportData = applications.map(app => ({
        ...app,
        description: app.description || app.requirements || '',
        files: app.files || []
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `job-applications-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Data backed up successfully! Upload this file on other devices.', 'success');
}

// Import data from JSON file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) {
                showNotification('Invalid backup file format!', 'error');
                return;
            }
            
            // Ask user if they want to merge or replace
            const shouldMerge = confirm('Do you want to MERGE with existing data?\n\nClick OK to merge\nClick Cancel to replace all data');
            
            // Ensure all imported data has proper structure
            const normalizedData = importedData.map(app => ({
                ...app,
                description: app.description || app.requirements || '',
                files: app.files || []
            }));
            
            if (shouldMerge) {
                // Merge data (avoid duplicates by ID)
                const existingIds = new Set(applications.map(app => app.id));
                const newApps = normalizedData.filter(app => !existingIds.has(app.id));
                applications = [...applications, ...newApps];
            } else {
                // Replace all data
                applications = normalizedData;
            }
            
            saveToLocalStorage();
            loadApplications();
            updateStats();
            showNotification(`Data restored successfully! ${importedData.length} applications loaded.`, 'success');
        } catch (error) {
            showNotification('Error reading backup file!', 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Export to CSV
function exportToCSV() {
    if (applications.length === 0) {
        showNotification('No data to export!', 'warning');
        return;
    }
    
    let csv = 'Company Name,Date Applied,Status\n';
    
    applications.forEach(app => {
        csv += `"${app.companyName}","${formatDate(app.dateApplied)}","${formatStatus(app.status)}"\n`;
    });
    
    downloadExportFile(csv, 'job-applications.csv', 'text/csv');
    showNotification('CSV exported successfully!', 'success');
}

// Export to PDF
function exportToPDF() {
    if (applications.length === 0) {
        showNotification('No data to export!', 'warning');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('Job Application Tracker', 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Add statistics
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Applications: ${applications.length}`, 14, 40);
    doc.text(`Selected: ${applications.filter(app => app.status === 'selected').length}`, 14, 47);
    doc.text(`Rejected: ${applications.filter(app => app.status === 'rejected' || app.status === 'rejected-in-rounds').length}`, 14, 54);
    doc.text(`In Progress: ${applications.filter(app => app.status === 'in-progress').length}`, 14, 61);
    
    // Prepare table data
    const tableData = applications.map(app => [
        app.companyName,
        formatDate(app.dateApplied),
        formatStatus(app.status)
    ]);
    
    // Add table
    doc.autoTable({
        startY: 70,
        head: [['Company Name', 'Date Applied', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 10
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        },
        margin: { top: 70 }
    });
    
    doc.save('job-applications.pdf');
    showNotification('PDF exported successfully!', 'success');
}

// Helper function to download export file (CSV, etc)
function downloadExportFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Format status
function formatStatus(status) {
    const statusMap = {
        'selected': 'Selected',
        'rejected': 'Rejected',
        'rejected-in-rounds': 'Rejected in Rounds',
        'in-progress': 'In Progress'
    };
    return statusMap[status] || status;
}

// Save to IndexedDB and Cloud
async function saveToLocalStorage() {
    try {
        // Save to IndexedDB (supports 1GB+)
        await idbStorage.saveAll(applications);
        
        const dataStr = JSON.stringify(applications);
        const sizeInMB = (new Blob([dataStr]).size / (1024 * 1024)).toFixed(2);
        console.log(`✓ Saved to IndexedDB: ${applications.length} applications, ${sizeInMB}MB`);
        
        // Update storage display
        updateStorageStatus();
        
        // Immediately sync to cloud if enabled (for cross-device access)
        if (typeof gistStorage !== 'undefined' && SYNC_ENABLED) {
            showSyncStatus('Syncing to cloud...', 'info');
            try {
                const success = await gistStorage.save(applications);
                if (success) {
                    showSyncStatus('✓ Synced to cloud!', 'success');
                    console.log('✓ Synced to GitHub Gist');
                } else {
                    showSyncStatus('⚠ Cloud sync failed', 'warning');
                }
            } catch (err) {
                console.error('Cloud sync failed:', err);
                showSyncStatus('⚠ Cloud sync error', 'warning');
            }
        }
    } catch (error) {
        showNotification('Failed to save data: ' + error.message, 'error');
        console.error('Save error:', error);
    }
}

// Show sync status
function showSyncStatus(message, type) {
    const statusDiv = document.getElementById('syncStatus');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `sync-status sync-${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

// Update storage status display
async function updateStorageStatus() {
    const statusDiv = document.getElementById('storageStatus');
    if (!statusDiv) return;
    
    try {
        // Get IndexedDB storage estimate
        const estimate = await idbStorage.getStorageEstimate();
        
        if (estimate) {
            const usageMB = parseFloat(estimate.usageMB);
            const quotaMB = parseFloat(estimate.quotaMB);
            const percentage = parseFloat(estimate.percentUsed);
            
            let statusClass = 'storage-ok';
            let icon = 'fa-check-circle';
            
            if (percentage >= 80) {
                statusClass = 'storage-critical';
                icon = 'fa-exclamation-triangle';
            } else if (percentage >= 60) {
                statusClass = 'storage-warning';
                icon = 'fa-exclamation-circle';
            }
            
            statusDiv.innerHTML = `
                <i class="fas ${icon}"></i>
                Storage: ${usageMB}MB / ${quotaMB}MB (${percentage}%)
            `;
            statusDiv.className = `storage-status ${statusClass}`;
        } else {
            // Fallback if storage API not available
            const dataStr = JSON.stringify(applications);
            const sizeInMB = (new Blob([dataStr]).size / (1024 * 1024)).toFixed(2);
            
            statusDiv.innerHTML = `
                <i class="fas fa-database"></i>
                Data Size: ${sizeInMB}MB (IndexedDB)
            `;
            statusDiv.className = 'storage-status storage-ok';
        }
    } catch (error) {
        console.error('Error updating storage status:', error);
        statusDiv.innerHTML = `<i class="fas fa-database"></i> IndexedDB Active`;
        statusDiv.className = 'storage-status storage-ok';
    }
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.4s ease-out;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
    notification.innerHTML = `<span style="font-size: 1.2rem;">${icon}</span> ${message}`;
    
    document.body.appendChild(notification);
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.4s ease-out reverse';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 400);
    }, 3000);
}
