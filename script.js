// Application data storage
let applications = JSON.parse(localStorage.getItem('applications')) || [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadApplications();
    updateStats();
    setDefaultDate();
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
    setDefaultDate();
}

// Close modal
function closeModal() {
    document.getElementById('applicationModal').style.display = 'none';
    document.getElementById('applicationForm').reset();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('applicationModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Save application
function saveApplication(event) {
    event.preventDefault();
    
    const companyName = document.getElementById('companyName').value;
    const dateApplied = document.getElementById('dateApplied').value;
    const status = document.getElementById('status').value;
    const requirements = document.getElementById('requirements').value;
    const editIndex = document.getElementById('editIndex').value;
    
    const application = {
        id: editIndex ? applications[editIndex].id : Date.now(),
        companyName,
        dateApplied,
        status,
        requirements
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
    closeModal();
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
            <td>${app.requirements || 'N/A'}</td>
            <td>
                <div class="action-btns">
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

// Edit application
function editApplication(index) {
    const app = applications[index];
    
    document.getElementById('companyName').value = app.companyName;
    document.getElementById('dateApplied').value = app.dateApplied;
    document.getElementById('status').value = app.status;
    document.getElementById('requirements').value = app.requirements;
    document.getElementById('editIndex').value = index;
    document.getElementById('modalTitle').textContent = 'Edit Application';
    
    document.getElementById('applicationModal').style.display = 'block';
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
    
    const dataStr = JSON.stringify(applications, null, 2);
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
            
            if (shouldMerge) {
                // Merge data (avoid duplicates by ID)
                const existingIds = new Set(applications.map(app => app.id));
                const newApps = importedData.filter(app => !existingIds.has(app.id));
                applications = [...applications, ...newApps];
            } else {
                // Replace all data
                applications = importedData;
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
    
    let csv = 'Company Name,Date Applied,Status,Requirements\n';
    
    applications.forEach(app => {
        csv += `"${app.companyName}","${formatDate(app.dateApplied)}","${formatStatus(app.status)}","${app.requirements || 'N/A'}"\n`;
    });
    
    downloadFile(csv, 'job-applications.csv', 'text/csv');
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
        formatStatus(app.status),
        app.requirements || 'N/A'
    ]);
    
    // Add table
    doc.autoTable({
        startY: 70,
        head: [['Company Name', 'Date Applied', 'Status', 'Requirements']],
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

// Helper function to download file
function downloadFile(content, fileName, mimeType) {
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

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('applications', JSON.stringify(applications));
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
