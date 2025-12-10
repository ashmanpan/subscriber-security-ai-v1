// Dashboard Page Script

async function loadDashboard() {
    initializeDemoData();

    // Load all dashboard sections
    loadStats();
    loadRecentActivity();
    loadRecentScans();
    loadChildrenQuick();
    loadSecurityAlerts();
    loadFraudStats();
    loadRecentFraudIncidents();
    loadFirewallRules();

    // Refresh data every 30 seconds
    setInterval(() => {
        loadStats();
        loadRecentActivity();
        loadSecurityAlerts();
        loadFraudStats();
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

    // Get fraud stats for blocked count
    const fraudStats = getFraudStats();
    const totalBlocked = fraudStats.digitalArrestScams.blocked +
        fraudStats.investmentScams.blocked +
        fraudStats.loanAppScams.blocked +
        fraudStats.upiFraud.blocked +
        fraudStats.bettingSites.blocked +
        fraudStats.dataTheft.blocked;
    document.getElementById('totalBlocked').textContent = totalBlocked;
}

async function loadSecurityAlerts() {
    const alerts = getDemoAlerts();
    const alertsContainer = document.getElementById('securityAlerts');
    const alertCount = document.getElementById('alertCount');

    alertCount.textContent = alerts.length;

    if (!alerts || alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="no-alerts">
                <span class="no-alerts-icon">✅</span>
                <p>No active security alerts</p>
            </div>
        `;
        return;
    }

    alertsContainer.innerHTML = alerts.slice(0, 5).map(alert => `
        <div class="alert-item ${alert.severity}">
            <div class="alert-header">
                <span class="alert-severity ${alert.severity}">${getSeverityIcon(alert.severity)} ${alert.severity.toUpperCase()}</span>
                <span class="alert-time">${formatTimeAgo(alert.timestamp)}</span>
            </div>
            <div class="alert-content">
                <span class="alert-type">${alert.type}</span>
                <p class="alert-desc">${alert.description}</p>
                <div class="alert-meta">
                    <span class="alert-child">👤 ${alert.child}</span>
                    <span class="alert-source">📡 ${alert.source}</span>
                    ${alert.blocked ? '<span class="alert-status blocked">✅ Blocked</span>' : '<span class="alert-status active">⚠️ Active</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

function loadFraudStats() {
    const stats = getFraudStats();

    document.getElementById('digitalArrestBlocks').textContent = stats.digitalArrestScams.count;
    document.getElementById('investmentScamBlocks').textContent = stats.investmentScams.count;
    document.getElementById('loanAppBlocks').textContent = stats.loanAppScams.count;
    document.getElementById('upiFraudBlocks').textContent = stats.upiFraud.count;
    document.getElementById('bettingBlocks').textContent = stats.bettingSites.count;
    document.getElementById('dataTheftAlerts').textContent = stats.dataTheft.count;
}

function loadRecentFraudIncidents() {
    const stats = getFraudStats();
    const container = document.getElementById('recentFraudIncidents');

    // Combine all incidents and sort by timestamp
    const allIncidents = [
        ...stats.digitalArrestScams.incidents.map(i => ({ ...i, category: 'Digital Arrest Scam', icon: '🚫' })),
        ...stats.investmentScams.incidents.map(i => ({ ...i, category: 'Investment Scam', icon: '📉' })),
        ...stats.loanAppScams.incidents.map(i => ({ ...i, category: 'Loan App Scam', icon: '💳' })),
        ...stats.upiFraud.incidents.map(i => ({ ...i, category: 'UPI Fraud', icon: '📱' })),
        ...stats.bettingSites.incidents.map(i => ({ ...i, category: 'Betting Site', icon: '🎰' })),
        ...stats.dataTheft.incidents.map(i => ({ ...i, category: 'Data Theft', icon: '🔓' }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (allIncidents.length === 0) {
        container.innerHTML = `
            <div class="no-incidents">
                <span>✅</span>
                <p>No fraud incidents detected</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allIncidents.slice(0, 5).map(incident => `
        <div class="fraud-incident-item">
            <div class="incident-icon">${incident.icon}</div>
            <div class="incident-details">
                <div class="incident-header">
                    <span class="incident-category">${incident.category}</span>
                    <span class="incident-time">${formatTimeAgo(incident.timestamp)}</span>
                </div>
                <p class="incident-desc">${incident.description}</p>
                <div class="incident-meta">
                    <span class="incident-child">👤 ${incident.child}</span>
                    <span class="incident-action">✅ ${incident.action}</span>
                    ${incident.riskScore ? `<span class="incident-risk">Risk: ${incident.riskScore}/10</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function loadFirewallRules() {
    const rules = getFirewallRules();
    const container = document.getElementById('activeFirewallRules');
    const rulesCount = document.getElementById('rulesCount');

    rulesCount.textContent = `${rules.activeRules} rules`;

    if (!rules.rules || rules.rules.length === 0) {
        container.innerHTML = `
            <div class="no-rules">
                <span>🛡️</span>
                <p>No active blocking rules</p>
            </div>
        `;
        return;
    }

    container.innerHTML = rules.rules.slice(0, 5).map(rule => `
        <div class="firewall-rule-item">
            <div class="rule-status ${rule.status}"></div>
            <div class="rule-details">
                <div class="rule-header">
                    <span class="rule-app">${rule.app}</span>
                    <span class="rule-action">${rule.action}</span>
                </div>
                <div class="rule-meta">
                    <span class="rule-child">👤 ${rule.child}</span>
                    <span class="rule-method">🔥 ${rule.method}</span>
                    <span class="rule-hits">📊 ${rule.hits} hits</span>
                    <span class="rule-created">${formatTimeAgo(rule.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
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

    // Get fraud stats for per-child blocking info
    const rules = getFirewallRules();

    childrenList.innerHTML = children.slice(0, 4).map(child => {
        const childRules = rules.rules.filter(r => r.child === child.name);
        return `
            <div class="child-quick-card">
                <div class="child-avatar">👤</div>
                <h3>${child.name}</h3>
                <p>Age: ${child.age} • ${child.device}</p>
                <div class="child-rules-count">${childRules.length} active rules</div>
                <button class="btn-small" onclick="window.location.href='children.html'">Manage</button>
            </div>
        `;
    }).join('');
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

function getSeverityIcon(severity) {
    switch(severity) {
        case 'critical': return '🔴';
        case 'high': return '🟠';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '⚪';
    }
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

// Fraud Modal Functions
function showFraudDetails() {
    const modal = document.getElementById('fraudModal');
    const body = document.getElementById('fraudModalBody');
    const stats = getFraudStats();

    body.innerHTML = `
        <div class="fraud-details-tabs">
            <button class="fraud-tab active" onclick="showFraudTab('digitalArrest')">Digital Arrest</button>
            <button class="fraud-tab" onclick="showFraudTab('investment')">Investment</button>
            <button class="fraud-tab" onclick="showFraudTab('loanApp')">Loan Apps</button>
            <button class="fraud-tab" onclick="showFraudTab('upi')">UPI Fraud</button>
            <button class="fraud-tab" onclick="showFraudTab('betting')">Betting</button>
            <button class="fraud-tab" onclick="showFraudTab('dataTheft')">Data Theft</button>
        </div>

        <div id="fraudTabContent" class="fraud-tab-content">
            ${renderDigitalArrestTab(stats.digitalArrestScams)}
        </div>
    `;

    modal.style.display = 'flex';
}

function showFraudTab(tab) {
    const stats = getFraudStats();
    const content = document.getElementById('fraudTabContent');

    // Update active tab
    document.querySelectorAll('.fraud-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    switch(tab) {
        case 'digitalArrest':
            content.innerHTML = renderDigitalArrestTab(stats.digitalArrestScams);
            break;
        case 'investment':
            content.innerHTML = renderInvestmentTab(stats.investmentScams);
            break;
        case 'loanApp':
            content.innerHTML = renderLoanAppTab(stats.loanAppScams);
            break;
        case 'upi':
            content.innerHTML = renderUpiTab(stats.upiFraud);
            break;
        case 'betting':
            content.innerHTML = renderBettingTab(stats.bettingSites);
            break;
        case 'dataTheft':
            content.innerHTML = renderDataTheftTab(stats.dataTheft);
            break;
    }
}

function renderDigitalArrestTab(data) {
    return `
        <div class="fraud-summary">
            <div class="fraud-summary-stat">
                <h3>${data.count}</h3>
                <p>Total Incidents</p>
            </div>
            <div class="fraud-summary-stat">
                <h3>${data.blocked}</h3>
                <p>Blocked</p>
            </div>
        </div>
        <div class="fraud-description">
            <h4>What is Digital Arrest Scam?</h4>
            <p>Scammers impersonate law enforcement (CBI, Police, Customs) and claim the victim is involved in illegal activities. They threaten immediate arrest unless money is transferred.</p>
        </div>
        <div class="fraud-incidents">
            <h4>Recent Incidents</h4>
            ${data.incidents.map(i => `
                <div class="fraud-incident-detail">
                    <div class="incident-info">
                        <span class="incident-type">${i.type}</span>
                        <span class="incident-time">${formatTimeAgo(i.timestamp)}</span>
                    </div>
                    <p>${i.description}</p>
                    <div class="incident-details-meta">
                        <span>👤 ${i.child}</span>
                        <span>📞 ${i.callerNumber || 'Unknown'}</span>
                        <span>⚠️ Risk: ${i.riskScore}/10</span>
                        <span class="action-taken">✅ ${i.action}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderInvestmentTab(data) {
    return `
        <div class="fraud-summary">
            <div class="fraud-summary-stat">
                <h3>${data.count}</h3>
                <p>Total Incidents</p>
            </div>
            <div class="fraud-summary-stat">
                <h3>${data.blocked}</h3>
                <p>Blocked</p>
            </div>
        </div>
        <div class="fraud-description">
            <h4>What is Investment Scam?</h4>
            <p>Fake investment platforms promising unrealistic returns (100-500%). Often involves cryptocurrency, stock trading, or forex. These platforms disappear after collecting money.</p>
        </div>
        <div class="fraud-incidents">
            <h4>Recent Incidents</h4>
            ${data.incidents.map(i => `
                <div class="fraud-incident-detail">
                    <div class="incident-info">
                        <span class="incident-type">${i.type}</span>
                        <span class="incident-time">${formatTimeAgo(i.timestamp)}</span>
                    </div>
                    <p>${i.description}</p>
                    <div class="incident-details-meta">
                        <span>👤 ${i.child}</span>
                        <span>🌐 ${i.website}</span>
                        <span>⚠️ Risk: ${i.riskScore}/10</span>
                        <span class="action-taken">✅ ${i.action}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderLoanAppTab(data) {
    return `
        <div class="fraud-summary">
            <div class="fraud-summary-stat">
                <h3>${data.count}</h3>
                <p>Total Incidents</p>
            </div>
            <div class="fraud-summary-stat">
                <h3>${data.blocked}</h3>
                <p>Blocked</p>
            </div>
        </div>
        <div class="fraud-description">
            <h4>What is Loan App Scam?</h4>
            <p>Predatory loan apps with hidden fees (often 30-50%), that harvest personal data and harass borrowers. They often access contacts, photos, and messages to blackmail users.</p>
        </div>
        <div class="fraud-incidents">
            <h4>Recent Incidents</h4>
            ${data.incidents.map(i => `
                <div class="fraud-incident-detail">
                    <div class="incident-info">
                        <span class="incident-type">${i.appName}</span>
                        <span class="incident-time">${formatTimeAgo(i.timestamp)}</span>
                    </div>
                    <p>${i.description}</p>
                    <div class="incident-permissions">
                        <span>Dangerous Permissions:</span>
                        ${i.permissions.map(p => `<span class="permission-tag">${p}</span>`).join('')}
                    </div>
                    <div class="incident-details-meta">
                        <span>👤 ${i.child}</span>
                        <span>⚠️ Risk: ${i.riskScore}/10</span>
                        <span class="action-taken">✅ ${i.action}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderUpiTab(data) {
    return `
        <div class="fraud-summary">
            <div class="fraud-summary-stat">
                <h3>${data.count}</h3>
                <p>Total Incidents</p>
            </div>
            <div class="fraud-summary-stat">
                <h3>${data.blocked}</h3>
                <p>Blocked</p>
            </div>
        </div>
        <div class="fraud-description">
            <h4>What is UPI Fraud?</h4>
            <p>Fraudsters send fake payment requests, share malicious QR codes, or impersonate customer support to steal money through UPI apps like PhonePe, GPay, Paytm.</p>
        </div>
        <div class="fraud-incidents">
            <h4>Recent Incidents</h4>
            ${data.incidents.map(i => `
                <div class="fraud-incident-detail">
                    <div class="incident-info">
                        <span class="incident-type">${i.type}</span>
                        <span class="incident-time">${formatTimeAgo(i.timestamp)}</span>
                    </div>
                    <p>${i.description}</p>
                    <div class="incident-details-meta">
                        <span>👤 ${i.child}</span>
                        ${i.amount ? `<span>💰 ${i.amount}</span>` : ''}
                        ${i.upiId ? `<span>📱 ${i.upiId}</span>` : ''}
                        <span>⚠️ Risk: ${i.riskScore}/10</span>
                        <span class="action-taken">✅ ${i.action}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderBettingTab(data) {
    return `
        <div class="fraud-summary">
            <div class="fraud-summary-stat">
                <h3>${data.count}</h3>
                <p>Sites Blocked</p>
            </div>
            <div class="fraud-summary-stat">
                <h3>${data.incidents.reduce((sum, i) => sum + (i.attempts || 1), 0)}</h3>
                <p>Access Attempts</p>
            </div>
        </div>
        <div class="fraud-description">
            <h4>Why Block Betting Sites?</h4>
            <p>Online betting and gambling sites are illegal in most Indian states. They can lead to financial losses, addiction, and exposure to fraudulent platforms.</p>
        </div>
        <div class="fraud-incidents">
            <h4>Blocked Sites</h4>
            ${data.incidents.map(i => `
                <div class="fraud-incident-detail">
                    <div class="incident-info">
                        <span class="incident-type">${i.category}</span>
                        <span class="incident-time">${formatTimeAgo(i.timestamp)}</span>
                    </div>
                    <p>🌐 ${i.website}</p>
                    <div class="incident-details-meta">
                        <span>👤 ${i.child}</span>
                        <span>🔄 ${i.attempts} attempt(s)</span>
                        <span class="action-taken">✅ ${i.action}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDataTheftTab(data) {
    return `
        <div class="fraud-summary">
            <div class="fraud-summary-stat">
                <h3>${data.count}</h3>
                <p>Incidents Detected</p>
            </div>
            <div class="fraud-summary-stat">
                <h3>${data.blocked}</h3>
                <p>Blocked</p>
            </div>
        </div>
        <div class="fraud-description">
            <h4>What is Data Theft Detection?</h4>
            <p>AI-powered monitoring using Splunk MLTK detects unusual data transfers, contact exfiltration, and suspicious network activity that may indicate data theft or malware.</p>
        </div>
        <div class="fraud-incidents">
            <h4>Recent Incidents</h4>
            ${data.incidents.map(i => `
                <div class="fraud-incident-detail">
                    <div class="incident-info">
                        <span class="incident-type">${i.type}</span>
                        <span class="incident-time">${formatTimeAgo(i.timestamp)}</span>
                    </div>
                    <p>${i.description}</p>
                    <div class="incident-details-meta">
                        <span>👤 ${i.child}</span>
                        <span>🌐 ${i.destination}</span>
                        <span>📊 ${i.dataSize}</span>
                        <span>📡 ${i.source}</span>
                        <span>⚠️ Risk: ${i.riskScore}/10</span>
                        <span class="action-taken">✅ ${i.action}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function closeFraudModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('fraudModal').style.display = 'none';
}

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboard);
