// API Configuration - Load from config.js or use defaults
const API_CONFIG = typeof CONFIG !== 'undefined' ? {
    MOBSF_API: CONFIG.API_ENDPOINTS.MOBSF_INTEGRATION,
    GATEWAY_API: CONFIG.API_ENDPOINTS.P_GATEWAY,
    ANALYTICS_API: CONFIG.API_ENDPOINTS.ANALYTICS,
    FTD_API: CONFIG.API_ENDPOINTS.FTD_INTEGRATION
} : {
    // Fallback configuration for local development
    MOBSF_API: 'http://localhost:6000/api/v1',
    GATEWAY_API: 'http://localhost:8080/api',
    ANALYTICS_API: 'http://localhost:7000/api',
    FTD_API: 'http://localhost:5000/api'
};

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(45deg, #00ff88, #00aaff)' : 'linear-gradient(45deg, #ff4444, #ff6666)'};
        color: ${type === 'success' ? '#000' : '#fff'};
        padding: 1rem 2rem;
        border-radius: 10px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getRiskLevel(score) {
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
}

function getRiskColor(risk) {
    switch(risk) {
        case 'high': return '#ff4444';
        case 'medium': return '#ffaa00';
        case 'low': return '#00ff88';
        default: return '#888';
    }
}

// Authentication Functions
function isAuthenticated() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function checkAuth() {
    if (!isAuthenticated() && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
}

// MobSF API Functions
async function getMobSFScans() {
    try {
        const response = await fetch(`${API_CONFIG.MOBSF_API}/scans`);
        if (!response.ok) throw new Error('Failed to fetch scans');
        return await response.json();
    } catch (error) {
        console.error('Error fetching MobSF scans:', error);
        // Return demo data for now
        return getDemoScans();
    }
}

async function getScanResults(scanId) {
    try {
        const response = await fetch(`${API_CONFIG.MOBSF_API}/scans/${scanId}/results`);
        if (!response.ok) throw new Error('Failed to fetch scan results');
        return await response.json();
    } catch (error) {
        console.error('Error fetching scan results:', error);
        return null;
    }
}

async function getAppScanStatus(appName) {
    try {
        const response = await fetch(`${API_CONFIG.MOBSF_API}/apps/${appName}/scan-status`);
        if (!response.ok) throw new Error('Failed to fetch scan status');
        return await response.json();
    } catch (error) {
        console.error('Error fetching scan status:', error);
        return null;
    }
}

// Children Management API
function getChildren() {
    const children = localStorage.getItem('children');
    return children ? JSON.parse(children) : [];
}

function saveChildren(children) {
    localStorage.setItem('children', JSON.stringify(children));
}

function addChildToStorage(child) {
    const children = getChildren();
    child.id = Date.now();
    children.push(child);
    saveChildren(children);
    return child;
}

function deleteChildFromStorage(childId) {
    let children = getChildren();
    children = children.filter(c => c.id !== childId);
    saveChildren(children);
}

// Activity Monitoring API (Splunk/FTD)
async function getRecentActivity(childPhone = null, limit = 10) {
    try {
        // This would call Splunk API or Analytics service
        // For now, return demo data
        return getDemoActivity();
    } catch (error) {
        console.error('Error fetching activity:', error);
        return [];
    }
}

async function getSecurityAlerts() {
    try {
        // This would call Splunk MLTK alerts
        return getDemoAlerts();
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
    }
}

// Demo Data Functions (for testing without backend)
function getDemoScans() {
    return {
        scans: [
            {
                scanId: 'scan_' + Date.now(),
                appName: 'TikTok_v29.apk',
                fileHash: 'a1b2c3d4e5f6g7h8i9j0',
                scannedAt: new Date().toISOString(),
                status: 'completed',
                riskScore: 8,
                platform: 'Android',
                vulnerabilities: {
                    critical: 3,
                    high: 5,
                    medium: 12,
                    low: 8
                },
                permissions: ['CAMERA', 'MICROPHONE', 'LOCATION', 'CONTACTS'],
                trackers: 15
            },
            {
                scanId: 'scan_' + (Date.now() - 3600000),
                appName: 'Instagram_v280.apk',
                fileHash: 'b2c3d4e5f6g7h8i9j0k1',
                scannedAt: new Date(Date.now() - 3600000).toISOString(),
                status: 'completed',
                riskScore: 6,
                platform: 'Android',
                vulnerabilities: {
                    critical: 1,
                    high: 3,
                    medium: 8,
                    low: 5
                },
                permissions: ['CAMERA', 'MICROPHONE', 'LOCATION'],
                trackers: 12
            },
            {
                scanId: 'scan_' + (Date.now() - 7200000),
                appName: 'GameApp_v1.2.apk',
                fileHash: 'c3d4e5f6g7h8i9j0k1l2',
                scannedAt: new Date(Date.now() - 7200000).toISOString(),
                status: 'completed',
                riskScore: 3,
                platform: 'Android',
                vulnerabilities: {
                    critical: 0,
                    high: 1,
                    medium: 3,
                    low: 4
                },
                permissions: ['INTERNET', 'STORAGE'],
                trackers: 3
            }
        ],
        total: 3
    };
}

function getDemoActivity() {
    return [
        {
            timestamp: new Date().toISOString(),
            type: 'download',
            child: 'Sarah',
            phone: '+1 (555) 123-4567',
            description: 'Downloaded TikTok_v29.apk',
            risk: 'high'
        },
        {
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            type: 'blocked',
            child: 'Michael',
            phone: '+1 (555) 987-6543',
            description: 'Blocked access to inappropriate website',
            risk: 'medium'
        },
        {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            type: 'scan',
            child: 'Sarah',
            phone: '+1 (555) 123-4567',
            description: 'Completed security scan of Instagram',
            risk: 'low'
        }
    ];
}

function getDemoAlerts() {
    return [
        {
            id: 'alert_1',
            timestamp: new Date().toISOString(),
            severity: 'high',
            type: 'Data Exfiltration',
            child: 'Sarah',
            description: 'Unusual data upload detected - 150MB to unknown server',
            source: 'Splunk MLTK'
        },
        {
            id: 'alert_2',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            severity: 'medium',
            type: 'Malware Detected',
            child: 'Michael',
            description: 'Potentially harmful app detected: Unknown_Game.apk',
            source: 'MobSF Scan'
        }
    ];
}

// Initialize demo children on first load
function initializeDemoData() {
    if (getChildren().length === 0) {
        const demoChildren = [
            {
                id: 1,
                name: 'Sarah',
                age: 12,
                phone: '+1 (555) 123-4567',
                device: 'Android'
            },
            {
                id: 2,
                name: 'Michael',
                age: 15,
                phone: '+1 (555) 987-6543',
                device: 'iOS'
            }
        ];
        saveChildren(demoChildren);
    }
}

// Check authentication on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.location.href.includes('login.html')) {
            checkAuth();
        }
    });
} else {
    if (!window.location.href.includes('login.html')) {
        checkAuth();
    }
}
