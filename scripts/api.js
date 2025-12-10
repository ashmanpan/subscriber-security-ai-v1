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
// Comprehensive MobSF scan data structure
function getDemoScans() {
    return {
        scans: [
            {
                // Basic App Info
                scanId: 'scan_' + Date.now(),
                appName: 'TikTok',
                fileName: 'TikTok_v29.5.3.apk',
                packageName: 'com.zhiliaoapp.musically',
                versionName: '29.5.3',
                versionCode: '2953001',
                fileHash: 'a1b2c3d4e5f6789abcdef1234567890abcdef12',
                md5: 'abc123def456',
                sha1: 'def456abc789',
                sha256: 'a1b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890',
                fileSize: 257482956,
                scannedAt: new Date().toISOString(),
                status: 'completed',
                platform: 'Android',
                targetSdk: '34',
                minSdk: '21',
                maxSdk: '',
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',

                // Security Score
                riskScore: 8.2,
                securityScore: 18,
                averageCvss: 6.8,

                // Vulnerabilities with details
                vulnerabilities: {
                    critical: 3,
                    high: 5,
                    medium: 12,
                    low: 8,
                    info: 15,
                    details: [
                        {
                            id: 'VULN-001',
                            title: 'Hardcoded API Key Exposed',
                            severity: 'critical',
                            cvss: 9.1,
                            cwe: 'CWE-798',
                            description: 'Google Maps API key found hardcoded in source code',
                            file: 'res/values/strings.xml',
                            line: 42,
                            remediation: 'Store API keys in secure storage or environment variables'
                        },
                        {
                            id: 'VULN-002',
                            title: 'SSL Certificate Validation Disabled',
                            severity: 'critical',
                            cvss: 8.5,
                            cwe: 'CWE-295',
                            description: 'App accepts any SSL certificate, vulnerable to MITM attacks',
                            file: 'com/app/network/HttpClient.java',
                            line: 89,
                            remediation: 'Implement proper certificate validation'
                        },
                        {
                            id: 'VULN-003',
                            title: 'SQL Injection Vulnerability',
                            severity: 'critical',
                            cvss: 9.8,
                            cwe: 'CWE-89',
                            description: 'User input directly concatenated in SQL query',
                            file: 'com/app/db/DatabaseHelper.java',
                            line: 156,
                            remediation: 'Use parameterized queries'
                        },
                        {
                            id: 'VULN-004',
                            title: 'WebView JavaScript Enabled',
                            severity: 'high',
                            cvss: 7.4,
                            cwe: 'CWE-79',
                            description: 'WebView allows JavaScript execution from untrusted sources',
                            file: 'com/app/ui/WebViewActivity.java',
                            line: 45,
                            remediation: 'Disable JavaScript or implement content security policy'
                        },
                        {
                            id: 'VULN-005',
                            title: 'Sensitive Data in Logs',
                            severity: 'high',
                            cvss: 6.5,
                            cwe: 'CWE-532',
                            description: 'User credentials logged in debug output',
                            file: 'com/app/auth/LoginManager.java',
                            line: 78,
                            remediation: 'Remove sensitive data from log statements'
                        },
                        {
                            id: 'VULN-006',
                            title: 'Weak Cryptographic Algorithm',
                            severity: 'medium',
                            cvss: 5.3,
                            cwe: 'CWE-327',
                            description: 'MD5 used for password hashing',
                            file: 'com/app/util/CryptoHelper.java',
                            line: 34,
                            remediation: 'Use bcrypt or Argon2 for password hashing'
                        }
                    ]
                },

                // Permissions with details
                permissions: [
                    { name: 'CAMERA', status: 'dangerous', description: 'Can take photos and videos using your camera', protection: 'dangerous' },
                    { name: 'RECORD_AUDIO', status: 'dangerous', description: 'Can record audio using your microphone', protection: 'dangerous' },
                    { name: 'ACCESS_FINE_LOCATION', status: 'dangerous', description: 'Can access your precise GPS location', protection: 'dangerous' },
                    { name: 'ACCESS_COARSE_LOCATION', status: 'dangerous', description: 'Can access your approximate location', protection: 'dangerous' },
                    { name: 'READ_CONTACTS', status: 'dangerous', description: 'Can read your contact list', protection: 'dangerous' },
                    { name: 'WRITE_CONTACTS', status: 'dangerous', description: 'Can modify your contacts', protection: 'dangerous' },
                    { name: 'READ_EXTERNAL_STORAGE', status: 'dangerous', description: 'Can read files on your device', protection: 'dangerous' },
                    { name: 'WRITE_EXTERNAL_STORAGE', status: 'dangerous', description: 'Can write files on your device', protection: 'dangerous' },
                    { name: 'READ_PHONE_STATE', status: 'dangerous', description: 'Can read phone status and identity', protection: 'dangerous' },
                    { name: 'INTERNET', status: 'normal', description: 'Can access the internet', protection: 'normal' },
                    { name: 'ACCESS_NETWORK_STATE', status: 'normal', description: 'Can view network connections', protection: 'normal' },
                    { name: 'VIBRATE', status: 'normal', description: 'Can control vibration', protection: 'normal' },
                    { name: 'WAKE_LOCK', status: 'normal', description: 'Can prevent phone from sleeping', protection: 'normal' },
                    { name: 'RECEIVE_BOOT_COMPLETED', status: 'normal', description: 'Can run at startup', protection: 'normal' }
                ],

                // Trackers with details
                trackers: 15,
                trackerDetails: [
                    { name: 'Google Analytics', category: 'Analytics', website: 'https://analytics.google.com', description: 'Usage statistics and user behavior tracking' },
                    { name: 'Facebook Analytics', category: 'Analytics', website: 'https://analytics.facebook.com', description: 'User behavior and engagement tracking' },
                    { name: 'AppsFlyer', category: 'Analytics', website: 'https://appsflyer.com', description: 'Mobile attribution and marketing analytics' },
                    { name: 'Adjust', category: 'Analytics', website: 'https://adjust.com', description: 'Mobile measurement and fraud prevention' },
                    { name: 'Google AdMob', category: 'Advertising', website: 'https://admob.google.com', description: 'Mobile advertising network' },
                    { name: 'Facebook Ads', category: 'Advertising', website: 'https://facebook.com/business', description: 'Targeted advertising based on user data' },
                    { name: 'Unity Ads', category: 'Advertising', website: 'https://unity.com/solutions/unity-ads', description: 'In-app video advertisements' },
                    { name: 'IronSource', category: 'Advertising', website: 'https://ironsource.com', description: 'Ad mediation platform' },
                    { name: 'AppLovin', category: 'Advertising', website: 'https://applovin.com', description: 'Mobile marketing platform' },
                    { name: 'Facebook SDK', category: 'Social', website: 'https://developers.facebook.com', description: 'Social login and sharing' },
                    { name: 'Twitter Kit', category: 'Social', website: 'https://developer.twitter.com', description: 'Tweet integration' },
                    { name: 'Crashlytics', category: 'Crash Reporting', website: 'https://firebase.google.com/products/crashlytics', description: 'Crash and error reporting' },
                    { name: 'Sentry', category: 'Crash Reporting', website: 'https://sentry.io', description: 'Error tracking and monitoring' },
                    { name: 'Mixpanel', category: 'Analytics', website: 'https://mixpanel.com', description: 'Product analytics' },
                    { name: 'Amplitude', category: 'Analytics', website: 'https://amplitude.com', description: 'Product intelligence' }
                ],

                // Certificate Analysis
                certificateInfo: {
                    issuer: 'CN=TikTok Release, O=ByteDance Ltd',
                    subject: 'CN=TikTok Release Key',
                    serialNumber: '12345678',
                    sha1Fingerprint: 'AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12',
                    sha256Fingerprint: 'AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90',
                    validFrom: '2023-01-15',
                    validTo: '2048-01-08',
                    signatureAlgorithm: 'SHA256withRSA',
                    warnings: ['Certificate uses default keystore alias']
                },

                // Network Security
                networkSecurity: {
                    certificatePinning: false,
                    cleartextPermitted: true,
                    cleartextDomains: ['legacy.tiktok.com', 'test.internal.net'],
                    tlsVersion: 'TLS 1.2+',
                    trustAnchors: ['System CAs'],
                    domainWhitelist: ['api.tiktok.com', 'cdn.tiktok.com', 'log.tiktok.com']
                },

                // Code Analysis - Exposed Secrets
                codeAnalysis: {
                    hardcodedSecrets: [
                        { type: 'API Key', value: 'AIzaSy...xxxxx', service: 'Google Maps', file: 'res/values/strings.xml' },
                        { type: 'API Key', value: 'AAAA...xxxxx', service: 'Firebase', file: 'google-services.json' }
                    ],
                    exposedUrls: [
                        { url: 'https://api.tiktok.com', secure: true },
                        { url: 'https://cdn.tiktok.com', secure: true },
                        { url: 'http://tracking.adnetwork.com', secure: false },
                        { url: 'https://log.tiktok.com', secure: true }
                    ],
                    firebaseUrls: ['https://tiktok-prod.firebaseio.com'],
                    s3Buckets: ['s3://tiktok-user-uploads.s3.amazonaws.com'],
                    emails: ['support@tiktok.com', 'privacy@bytedance.com'],
                    ipAddresses: ['10.0.0.1', '192.168.1.100']
                },

                // Binary Analysis
                binaryAnalysis: {
                    pie: true,
                    stackCanary: true,
                    nxBit: true,
                    relro: 'Full',
                    fortify: true,
                    rpath: false,
                    symbols: false,
                    rootDetection: true,
                    antiTampering: false,
                    obfuscation: 'ProGuard'
                },

                // Malware Analysis
                malwareAnalysis: {
                    packer: 'None',
                    obfuscator: 'ProGuard',
                    antiVM: false,
                    antiDebug: true,
                    compiler: 'dx',
                    manipulator: 'None',
                    suspicious: false
                },

                // Manifest Analysis
                manifestAnalysis: {
                    debuggable: false,
                    allowBackup: true,
                    networkSecurityConfig: true,
                    exportedActivities: 5,
                    exportedServices: 2,
                    exportedReceivers: 8,
                    exportedProviders: 1,
                    browsableActivities: ['com.tiktok.DeepLinkActivity']
                },

                // Files Analysis
                filesAnalysis: {
                    totalFiles: 2456,
                    interestingFiles: ['config.json', 'secrets.xml', 'api_keys.properties'],
                    databaseFiles: ['app.db', 'cache.db', 'analytics.db'],
                    sharedPreferences: ['user_prefs.xml', 'app_settings.xml'],
                    nativeLibraries: ['libapp.so', 'libcrypto.so', 'libnative.so']
                }
            },
            {
                // Second app - Instagram (Medium Risk)
                scanId: 'scan_' + (Date.now() - 3600000),
                appName: 'Instagram',
                fileName: 'Instagram_v280.0.apk',
                packageName: 'com.instagram.android',
                versionName: '280.0.0.20.117',
                versionCode: '280001',
                fileHash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
                md5: 'def456ghi789',
                sha1: 'ghi789jkl012',
                sha256: 'b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890ab',
                fileSize: 198345672,
                scannedAt: new Date(Date.now() - 3600000).toISOString(),
                status: 'completed',
                platform: 'Android',
                targetSdk: '34',
                minSdk: '23',
                maxSdk: '',
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',

                riskScore: 6.1,
                securityScore: 42,
                averageCvss: 5.2,

                vulnerabilities: {
                    critical: 1,
                    high: 3,
                    medium: 8,
                    low: 5,
                    info: 10,
                    details: [
                        {
                            id: 'VULN-101',
                            title: 'Cleartext Traffic Allowed',
                            severity: 'critical',
                            cvss: 7.5,
                            cwe: 'CWE-319',
                            description: 'App allows cleartext HTTP traffic to certain domains',
                            file: 'res/xml/network_security_config.xml',
                            line: 12,
                            remediation: 'Enforce HTTPS for all network communications'
                        },
                        {
                            id: 'VULN-102',
                            title: 'Exported Activity Without Permission',
                            severity: 'high',
                            cvss: 6.5,
                            cwe: 'CWE-926',
                            description: 'Activity can be launched by other apps without permission',
                            file: 'AndroidManifest.xml',
                            line: 89,
                            remediation: 'Add android:permission attribute to exported activities'
                        }
                    ]
                },

                permissions: [
                    { name: 'CAMERA', status: 'dangerous', description: 'Can take photos and videos', protection: 'dangerous' },
                    { name: 'RECORD_AUDIO', status: 'dangerous', description: 'Can record audio', protection: 'dangerous' },
                    { name: 'ACCESS_FINE_LOCATION', status: 'dangerous', description: 'Can access precise location', protection: 'dangerous' },
                    { name: 'READ_CONTACTS', status: 'dangerous', description: 'Can read contacts', protection: 'dangerous' },
                    { name: 'INTERNET', status: 'normal', description: 'Can access internet', protection: 'normal' },
                    { name: 'ACCESS_NETWORK_STATE', status: 'normal', description: 'Can view network state', protection: 'normal' }
                ],

                trackers: 12,
                trackerDetails: [
                    { name: 'Facebook Analytics', category: 'Analytics', website: 'https://facebook.com', description: 'User analytics' },
                    { name: 'Google Analytics', category: 'Analytics', website: 'https://analytics.google.com', description: 'Usage tracking' },
                    { name: 'Crashlytics', category: 'Crash Reporting', website: 'https://firebase.google.com', description: 'Error reporting' },
                    { name: 'Facebook Ads', category: 'Advertising', website: 'https://facebook.com/business', description: 'Ad network' }
                ],

                certificateInfo: {
                    issuer: 'CN=Facebook, O=Meta Platforms Inc',
                    subject: 'CN=Instagram Release',
                    validFrom: '2022-06-01',
                    validTo: '2047-05-25',
                    signatureAlgorithm: 'SHA256withRSA',
                    warnings: []
                },

                networkSecurity: {
                    certificatePinning: true,
                    cleartextPermitted: false,
                    tlsVersion: 'TLS 1.3',
                    domainWhitelist: ['api.instagram.com', 'cdn.instagram.com']
                },

                codeAnalysis: {
                    hardcodedSecrets: [],
                    exposedUrls: [
                        { url: 'https://api.instagram.com', secure: true },
                        { url: 'https://graph.instagram.com', secure: true }
                    ],
                    firebaseUrls: [],
                    s3Buckets: [],
                    emails: ['support@instagram.com'],
                    ipAddresses: []
                },

                binaryAnalysis: {
                    pie: true,
                    stackCanary: true,
                    nxBit: true,
                    relro: 'Full',
                    fortify: true,
                    rootDetection: true,
                    antiTampering: true,
                    obfuscation: 'R8'
                },

                malwareAnalysis: {
                    packer: 'None',
                    obfuscator: 'R8',
                    antiVM: false,
                    antiDebug: true,
                    suspicious: false
                },

                manifestAnalysis: {
                    debuggable: false,
                    allowBackup: false,
                    exportedActivities: 3,
                    exportedServices: 1,
                    exportedReceivers: 4,
                    exportedProviders: 0
                }
            },
            {
                // Third app - Safe Game (Low Risk)
                scanId: 'scan_' + (Date.now() - 7200000),
                appName: 'Sudoku Master',
                fileName: 'SudokuMaster_v1.2.apk',
                packageName: 'com.puzzle.sudoku.master',
                versionName: '1.2.0',
                versionCode: '12',
                fileHash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
                md5: 'jkl012mno345',
                sha1: 'mno345pqr678',
                sha256: 'c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890abcd',
                fileSize: 15678432,
                scannedAt: new Date(Date.now() - 7200000).toISOString(),
                status: 'completed',
                platform: 'Android',
                targetSdk: '33',
                minSdk: '21',
                icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',

                riskScore: 2.5,
                securityScore: 78,
                averageCvss: 2.1,

                vulnerabilities: {
                    critical: 0,
                    high: 0,
                    medium: 2,
                    low: 4,
                    info: 8,
                    details: [
                        {
                            id: 'VULN-201',
                            title: 'Backup Allowed',
                            severity: 'low',
                            cvss: 2.4,
                            cwe: 'CWE-530',
                            description: 'Application data can be backed up',
                            file: 'AndroidManifest.xml',
                            line: 5,
                            remediation: 'Set android:allowBackup="false"'
                        }
                    ]
                },

                permissions: [
                    { name: 'INTERNET', status: 'normal', description: 'Can access internet', protection: 'normal' },
                    { name: 'ACCESS_NETWORK_STATE', status: 'normal', description: 'Can view network state', protection: 'normal' }
                ],

                trackers: 2,
                trackerDetails: [
                    { name: 'Google Analytics', category: 'Analytics', website: 'https://analytics.google.com', description: 'Basic usage stats' },
                    { name: 'AdMob', category: 'Advertising', website: 'https://admob.google.com', description: 'Banner ads' }
                ],

                certificateInfo: {
                    issuer: 'CN=Puzzle Games Dev',
                    subject: 'CN=Sudoku Master',
                    validFrom: '2024-01-01',
                    validTo: '2049-12-31',
                    signatureAlgorithm: 'SHA256withRSA',
                    warnings: []
                },

                networkSecurity: {
                    certificatePinning: false,
                    cleartextPermitted: false,
                    tlsVersion: 'TLS 1.2+',
                    domainWhitelist: ['api.puzzlegames.com']
                },

                codeAnalysis: {
                    hardcodedSecrets: [],
                    exposedUrls: [{ url: 'https://api.puzzlegames.com', secure: true }],
                    firebaseUrls: [],
                    s3Buckets: [],
                    emails: [],
                    ipAddresses: []
                },

                binaryAnalysis: {
                    pie: true,
                    stackCanary: true,
                    nxBit: true,
                    relro: 'Partial',
                    fortify: false,
                    rootDetection: false,
                    antiTampering: false,
                    obfuscation: 'None'
                },

                malwareAnalysis: {
                    packer: 'None',
                    obfuscator: 'None',
                    antiVM: false,
                    antiDebug: false,
                    suspicious: false
                },

                manifestAnalysis: {
                    debuggable: false,
                    allowBackup: true,
                    exportedActivities: 1,
                    exportedServices: 0,
                    exportedReceivers: 1,
                    exportedProviders: 0
                }
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
            severity: 'critical',
            type: 'Digital Arrest Scam',
            child: 'Sarah',
            description: 'Blocked call from fake "CBI Officer" demanding money transfer',
            source: 'AI Voice Analysis',
            blocked: true
        },
        {
            id: 'alert_2',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            severity: 'high',
            type: 'Data Exfiltration',
            child: 'Sarah',
            description: 'Unusual data upload detected - 150MB to unknown server in Russia',
            source: 'Splunk MLTK',
            blocked: true
        },
        {
            id: 'alert_3',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            severity: 'high',
            type: 'Investment Scam',
            child: 'Michael',
            description: 'Blocked access to fake crypto trading platform promising 500% returns',
            source: 'URL Filter',
            blocked: true
        },
        {
            id: 'alert_4',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            severity: 'medium',
            type: 'Malware Detected',
            child: 'Michael',
            description: 'Potentially harmful app detected: Unknown_Game.apk',
            source: 'MobSF Scan',
            blocked: true
        },
        {
            id: 'alert_5',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            severity: 'high',
            type: 'Loan App Scam',
            child: 'Sarah',
            description: 'Blocked download of predatory loan app with hidden fees',
            source: 'App Store Filter',
            blocked: true
        }
    ];
}

// Fraud Detection Data
function getFraudStats() {
    return {
        digitalArrestScams: {
            count: 3,
            blocked: 3,
            lastIncident: new Date(Date.now() - 3600000).toISOString(),
            incidents: [
                {
                    id: 'da_1',
                    timestamp: new Date().toISOString(),
                    child: 'Sarah',
                    phone: '+1 (555) 123-4567',
                    type: 'Fake CBI Officer Call',
                    description: 'Caller claimed to be CBI officer, threatened arrest for alleged money laundering',
                    callerNumber: '+91 98xxx xxxxx',
                    action: 'Blocked & Reported',
                    riskScore: 9.8
                },
                {
                    id: 'da_2',
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    child: 'Michael',
                    phone: '+1 (555) 987-6543',
                    type: 'Fake Police Call',
                    description: 'Caller impersonated police, demanded immediate payment via UPI',
                    callerNumber: '+91 87xxx xxxxx',
                    action: 'Blocked & Reported',
                    riskScore: 9.5
                }
            ]
        },
        investmentScams: {
            count: 5,
            blocked: 5,
            lastIncident: new Date(Date.now() - 7200000).toISOString(),
            incidents: [
                {
                    id: 'inv_1',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    child: 'Michael',
                    type: 'Crypto Scam',
                    website: 'fake-crypto-profits.com',
                    description: 'Fake trading platform promising 500% returns',
                    action: 'URL Blocked',
                    riskScore: 9.2
                },
                {
                    id: 'inv_2',
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    child: 'Sarah',
                    type: 'Stock Trading Scam',
                    website: 'guaranteed-profits.in',
                    description: 'Fake stock tips with paid subscription',
                    action: 'URL Blocked',
                    riskScore: 8.8
                }
            ]
        },
        loanAppScams: {
            count: 4,
            blocked: 4,
            lastIncident: new Date(Date.now() - 10800000).toISOString(),
            incidents: [
                {
                    id: 'loan_1',
                    timestamp: new Date(Date.now() - 10800000).toISOString(),
                    child: 'Sarah',
                    appName: 'QuickCash Loan',
                    packageName: 'com.quickcash.loan.fake',
                    description: 'Predatory loan app with 45% hidden fees and contacts access',
                    permissions: ['READ_CONTACTS', 'READ_SMS', 'CAMERA', 'LOCATION'],
                    action: 'Download Blocked',
                    riskScore: 9.0
                },
                {
                    id: 'loan_2',
                    timestamp: new Date(Date.now() - 172800000).toISOString(),
                    child: 'Michael',
                    appName: 'InstaMoney',
                    packageName: 'com.instamoney.loan',
                    description: 'Loan app known for harassment and data theft',
                    permissions: ['READ_CONTACTS', 'CAMERA', 'RECORD_AUDIO'],
                    action: 'Download Blocked',
                    riskScore: 9.5
                }
            ]
        },
        upiFraud: {
            count: 7,
            blocked: 7,
            lastIncident: new Date(Date.now() - 14400000).toISOString(),
            incidents: [
                {
                    id: 'upi_1',
                    timestamp: new Date(Date.now() - 14400000).toISOString(),
                    child: 'Sarah',
                    type: 'Fake Payment Request',
                    description: 'Fraudulent collect request claiming to be from bank',
                    amount: '₹15,000',
                    upiId: 'fraud@paytm',
                    action: 'Request Blocked',
                    riskScore: 8.5
                },
                {
                    id: 'upi_2',
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    child: 'Michael',
                    type: 'QR Code Scam',
                    description: 'Malicious QR code attempting to steal credentials',
                    action: 'Scan Blocked',
                    riskScore: 9.0
                }
            ]
        },
        bettingSites: {
            count: 12,
            blocked: 12,
            lastIncident: new Date(Date.now() - 1800000).toISOString(),
            incidents: [
                {
                    id: 'bet_1',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    child: 'Michael',
                    website: 'cricket-bet-pro.com',
                    category: 'Sports Betting',
                    action: 'URL Blocked',
                    attempts: 3
                },
                {
                    id: 'bet_2',
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    child: 'Sarah',
                    website: 'online-casino-india.com',
                    category: 'Online Casino',
                    action: 'URL Blocked',
                    attempts: 1
                },
                {
                    id: 'bet_3',
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    child: 'Michael',
                    website: 'fantasy-money-league.com',
                    category: 'Fantasy Sports',
                    action: 'URL Blocked',
                    attempts: 5
                }
            ]
        },
        dataTheft: {
            count: 2,
            detected: 2,
            blocked: 2,
            lastIncident: new Date(Date.now() - 1800000).toISOString(),
            incidents: [
                {
                    id: 'dt_1',
                    timestamp: new Date(Date.now() - 1800000).toISOString(),
                    child: 'Sarah',
                    type: 'Large Data Upload',
                    description: 'Unusual upload of 150MB to unknown server',
                    destination: '185.xxx.xxx.xxx (Russia)',
                    dataSize: '150 MB',
                    source: 'Splunk MLTK Anomaly',
                    action: 'Connection Blocked',
                    riskScore: 9.2
                },
                {
                    id: 'dt_2',
                    timestamp: new Date(Date.now() - 172800000).toISOString(),
                    child: 'Michael',
                    type: 'Contact Exfiltration',
                    description: 'App attempting to upload contact list to suspicious server',
                    destination: '103.xxx.xxx.xxx (Unknown)',
                    dataSize: '2.5 MB',
                    source: 'Splunk MLTK Anomaly',
                    action: 'Connection Blocked',
                    riskScore: 8.8
                }
            ]
        }
    };
}

// Firewall Rules Data
function getFirewallRules() {
    return {
        totalRules: 15,
        activeRules: 12,
        rules: [
            {
                id: 'rule_1',
                name: 'SUBSEC_BLOCK_919876543210_TikTok',
                child: 'Sarah',
                app: 'TikTok',
                action: 'BLOCK',
                sourceIp: '10.20.81.128',
                ports: [443, 80],
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                status: 'active',
                method: 'cdFMC',
                hits: 156
            },
            {
                id: 'rule_2',
                name: 'SUBSEC_BLOCK_919876543210_BettingSite',
                child: 'Michael',
                app: 'cricket-bet-pro.com',
                action: 'BLOCK',
                sourceIp: '10.20.81.129',
                ports: [443],
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                status: 'active',
                method: 'cdFMC',
                hits: 23
            },
            {
                id: 'rule_3',
                name: 'SUBSEC_BLOCK_919876543210_MaliciousIP',
                child: 'Sarah',
                app: 'Data Theft Prevention',
                action: 'BLOCK',
                sourceIp: '10.20.81.128',
                destIp: '185.xxx.xxx.xxx',
                ports: [443, 80, 8080],
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                status: 'active',
                method: 'cdFMC',
                hits: 45
            },
            {
                id: 'rule_4',
                name: 'SUBSEC_BLOCK_919876543210_LoanApp',
                child: 'Sarah',
                app: 'QuickCash Loan',
                action: 'BLOCK',
                sourceIp: '10.20.81.128',
                ports: [443],
                createdAt: new Date(Date.now() - 259200000).toISOString(),
                status: 'active',
                method: 'cdFMC',
                hits: 8
            },
            {
                id: 'rule_5',
                name: 'SUBSEC_BLOCK_919876543210_ScamDomain',
                child: 'Michael',
                app: 'fake-crypto-profits.com',
                action: 'BLOCK',
                sourceIp: '10.20.81.129',
                ports: [443],
                createdAt: new Date(Date.now() - 432000000).toISOString(),
                status: 'active',
                method: 'cdFMC',
                hits: 12
            }
        ]
    };
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
