// Dashboard Page Script

async function loadDashboard() {
    initializeDemoData();

    // Load statistics
    loadStats();

    // Load recent activity
    loadRecentActivity();

    // Load recent scans
    loadRecentScans();

    // Load children
    loadChildrenQuick();

    // Refresh data every 30 seconds
    setInterval(() => {
        loadStats();
        loadRecentActivity();
    }, 30000);
}

async function loadStats() {
    const children = getChildren();
    const scans = await getMobSFScans();

    // Update stats
    document.getElementById('totalChildren').textContent = children.length;
    document.getElementById('totalApps').textContent = scans.scans ? scans.scans.length : 0;

    // Calculate threats
    let totalThreats = 0;
    if (scans.scans) {
        scans.scans.forEach(scan => {
            if (scan.vulnerabilities) {
                totalThreats += (scan.vulnerabilities.critical || 0) + (scan.vulnerabilities.high || 0);
            }
        });
    }
    document.getElementById('totalThreats').textContent = totalThreats;

    // Blocked today (demo value)
    document.getElementById('totalBlocked').textContent = Math.floor(Math.random() * 20) + 5;
}

async function loadRecentActivity() {
    const activities = await getRecentActivity(null, 5);
    const activityList = document.getElementById('recentActivity');

    if (!activities || activities.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <span class="activity-icon">📊</span>
                <div class="activity-details">
                    <p class="activity-text">No recent activity</p>
                    <span class="activity-time">System monitoring active</span>
                </div>
            </div>
        `;
        return;
    }

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <span class="activity-icon">${getActivityIcon(activity.type)}</span>
            <div class="activity-details">
                <p class="activity-text"><strong>${activity.child}</strong>: ${activity.description}</p>
                <span class="activity-time">${formatDate(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

async function loadRecentScans() {
    const scans = await getMobSFScans();
    const scansList = document.getElementById('recentScans');

    if (!scans.scans || scans.scans.length === 0) {
        scansList.innerHTML = `
            <div class="scan-item">
                <div class="scan-info">
                    <span class="scan-icon">📱</span>
                    <div>
                        <p class="scan-name">No scans yet</p>
                        <span class="scan-date">Apps will be scanned automatically</span>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Show only last 3 scans
    const recentScans = scans.scans.slice(0, 3);

    scansList.innerHTML = recentScans.map(scan => {
        const risk = getRiskLevel(scan.riskScore);
        return `
            <div class="scan-item" onclick="window.location.href='app-scanning.html'">
                <div class="scan-info">
                    <span class="scan-icon">📱</span>
                    <div>
                        <p class="scan-name">${scan.appName}</p>
                        <span class="scan-date">${formatDate(scan.scannedAt)}</span>
                    </div>
                </div>
                <span class="risk-badge ${risk}">Risk: ${scan.riskScore}/10</span>
            </div>
        `;
    }).join('');
}

function loadChildrenQuick() {
    const children = getChildren();
    const childrenList = document.getElementById('childrenList');

    if (children.length === 0) {
        childrenList.innerHTML = `
            <div class="child-quick-card">
                <div class="child-avatar">👤</div>
                <p>No children added yet</p>
                <button class="btn-small" onclick="window.location.href='children.html'">Add Child</button>
            </div>
        `;
        return;
    }

    childrenList.innerHTML = children.slice(0, 4).map(child => `
        <div class="child-quick-card">
            <div class="child-avatar">👤</div>
            <h3>${child.name}</h3>
            <p>Age: ${child.age} • ${child.device}</p>
            <button class="btn-small" onclick="window.location.href='children.html'">Manage</button>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    switch(type) {
        case 'download': return '⬇️';
        case 'blocked': return '🚫';
        case 'scan': return '🔍';
        case 'alert': return '⚠️';
        default: return '📱';
    }
}

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard);
