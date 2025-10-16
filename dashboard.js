// Dashboard Analytics Script
let applications = JSON.parse(localStorage.getItem('applications')) || [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    displayCurrentDate();
    createCharts();
    displayCompanies();
    updateQuickStats();
});

// Display current date
function displayCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = today.toLocaleDateString('en-US', options);
}

// Load and display dashboard data
function loadDashboardData() {
    const total = applications.length;
    const selected = applications.filter(app => app.status === 'selected').length;
    const rejected = applications.filter(app => 
        app.status === 'rejected' || app.status === 'rejected-in-rounds'
    ).length;
    const pending = applications.filter(app => app.status === 'in-progress').length;
    
    // Update big stats
    animateValue('dashTotalApplications', 0, total, 1500);
    animateValue('dashSelectedCount', 0, selected, 1500);
    animateValue('dashPendingCount', 0, pending, 1500);
    animateValue('dashRejectedCount', 0, rejected, 1500);
    
    // Calculate percentages
    const successRate = total > 0 ? Math.round((selected / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
    
    document.getElementById('successRate').textContent = successRate + '% Success';
    document.getElementById('rejectionRate').textContent = rejectionRate + '%';
}

// Animate numbers
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

// Create all charts
function createCharts() {
    createStatusChart();
    createTimelineChart();
    createSuccessChart();
}

// Status Pie Chart
function createStatusChart() {
    const ctx = document.getElementById('statusChart').getContext('2d');
    
    const selected = applications.filter(app => app.status === 'selected').length;
    const rejected = applications.filter(app => 
        app.status === 'rejected' || app.status === 'rejected-in-rounds'
    ).length;
    const pending = applications.filter(app => app.status === 'in-progress').length;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Selected', 'In Progress', 'Rejected'],
            datasets: [{
                data: [selected, pending, rejected],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12,
                            family: "'Segoe UI', sans-serif"
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Timeline Chart
function createTimelineChart() {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    // Get last 7 days
    const last7Days = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        const count = applications.filter(app => app.dateApplied === dateStr).length;
        counts.push(count);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: 'Applications',
                data: counts,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Success Rate Bar Chart
function createSuccessChart() {
    const ctx = document.getElementById('successChart').getContext('2d');
    
    const selected = applications.filter(app => app.status === 'selected').length;
    const rejected = applications.filter(app => 
        app.status === 'rejected' || app.status === 'rejected-in-rounds'
    ).length;
    const pending = applications.filter(app => app.status === 'in-progress').length;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Selected', 'In Progress', 'Rejected'],
            datasets: [{
                label: 'Count',
                data: [selected, pending, rejected],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Display recent companies
function displayCompanies() {
    const companiesList = document.getElementById('companiesList');
    const recentApps = applications.slice(0, 8);
    
    if (recentApps.length === 0) {
        companiesList.innerHTML = '<div class="empty-companies"><i class="fas fa-inbox"></i><p>No applications yet</p></div>';
        return;
    }
    
    companiesList.innerHTML = recentApps.map(app => `
        <div class="company-item">
            <div class="company-icon">
                <i class="fas fa-building"></i>
            </div>
            <div class="company-info">
                <h4>${app.companyName}</h4>
                <p>${formatDate(app.dateApplied)}</p>
            </div>
            <span class="status-badge status-${app.status}">${formatStatus(app.status)}</span>
        </div>
    `).join('');
}

// Display achievements
function displayAchievements() {
    const achievementsGrid = document.getElementById('achievementsGrid');
    const achievements = calculateAchievements();
    
    achievementsGrid.innerHTML = achievements.map(achievement => `
        <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">
                <i class="${achievement.icon}"></i>
            </div>
            <div class="achievement-info">
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
            </div>
            ${achievement.unlocked ? '<div class="achievement-badge">✓</div>' : ''}
        </div>
    `).join('');
}

// Calculate achievements
function calculateAchievements() {
    const total = applications.length;
    const selected = applications.filter(app => app.status === 'selected').length;
    
    return [
        {
            title: 'First Step',
            description: 'Applied to your first job',
            icon: 'fas fa-flag',
            unlocked: total >= 1
        },
        {
            title: 'Job Hunter',
            description: 'Applied to 10 companies',
            icon: 'fas fa-crosshairs',
            unlocked: total >= 10
        },
        {
            title: 'Persistent',
            description: 'Applied to 25 companies',
            icon: 'fas fa-fire',
            unlocked: total >= 25
        },
        {
            title: 'First Victory',
            description: 'Got your first placement!',
            icon: 'fas fa-trophy',
            unlocked: selected >= 1
        },
        {
            title: 'Success Story',
            description: '3 placements achieved',
            icon: 'fas fa-star',
            unlocked: selected >= 3
        },
        {
            title: 'Dedicated',
            description: 'Applied for 7 days straight',
            icon: 'fas fa-calendar-check',
            unlocked: checkStreak() >= 7
        }
    ];
}

// Update quick stats
function updateQuickStats() {
    // This week count
    const thisWeek = applications.filter(app => {
        const appDate = new Date(app.dateApplied);
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return appDate >= weekAgo;
    }).length;
    document.getElementById('thisWeekCount').textContent = thisWeek;
    
    // Streak
    const streak = checkStreak();
    document.getElementById('streakCount').textContent = streak;
    
    // Response rate
    const responded = applications.filter(app => 
        app.status === 'selected' || app.status === 'rejected' || app.status === 'rejected-in-rounds'
    ).length;
    const responseRate = applications.length > 0 ? 
        Math.round((responded / applications.length) * 100) : 0;
    document.getElementById('responseRate').textContent = responseRate + '%';
}

// Check application streak
function checkStreak() {
    if (applications.length === 0) return 0;
    
    const dates = applications.map(app => new Date(app.dateApplied)).sort((a, b) => b - a);
    let streak = 1;
    let currentDate = new Date(dates[0]);
    
    for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor((currentDate - dates[i]) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
            streak++;
            currentDate = dates[i];
        } else if (diff > 1) {
            break;
        }
    }
    
    return streak;
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStatus(status) {
    const statusMap = {
        'selected': 'Selected',
        'rejected': 'Rejected',
        'rejected-in-rounds': 'Rejected in Rounds',
        'in-progress': 'In Progress'
    };
    return statusMap[status] || status;
}
