// App Scanning Page Script - Enhanced with Full MobSF Data Display

let allScans = [];
let currentFilter = 'all';
let currentTab = 'overview';

async function loadAppScanning() {
    await loadScans();
    updateStats();

    // Refresh scans every 30 seconds
    setInterval(async () => {
        await loadScans();
        updateStats();
    }, 30000);
}

async function loadScans() {
    const scansData = await getMobSFScans();
    allScans = scansData.scans || [];
    renderScans();
}

function updateStats() {
    const stats = {
        total: allScans.length,
        high: allScans.filter(s => getRiskLevel(s.riskScore) === 'high').length,
        medium: allScans.filter(s => getRiskLevel(s.riskScore) === 'medium').length,
        low: allScans.filter(s => getRiskLevel(s.riskScore) === 'low').length
    };

    document.getElementById('totalScans').textContent = stats.total;
    document.getElementById('highRiskApps').textContent = stats.high;
    document.getElementById('mediumRiskApps').textContent = stats.medium;
    document.getElementById('lowRiskApps').textContent = stats.low;
}

function renderScans() {
    const scansList = document.getElementById('scansList');
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';

    // Filter scans
    let filteredScans = allScans.filter(scan => {
        // Apply search filter
        if (searchQuery && !scan.appName.toLowerCase().includes(searchQuery) &&
            !(scan.packageName && scan.packageName.toLowerCase().includes(searchQuery))) {
            return false;
        }

        // Apply risk filter
        if (currentFilter !== 'all') {
            if (currentFilter === 'scanning') {
                return scan.status === 'scanning' || scan.status === 'pending';
            }
            const risk = getRiskLevel(scan.riskScore);
            return risk === currentFilter;
        }

        return true;
    });

    if (filteredScans.length === 0) {
        scansList.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">📱</div>
                <h3>No scans found</h3>
                <p>${currentFilter === 'all' ? 'Apps will appear here when scanned' : 'No scans match the current filter'}</p>
            </div>
        `;
        return;
    }

    scansList.innerHTML = filteredScans.map(scan => {
        const risk = getRiskLevel(scan.riskScore);
        const totalVulns = scan.vulnerabilities
            ? (scan.vulnerabilities.critical + scan.vulnerabilities.high + scan.vulnerabilities.medium + scan.vulnerabilities.low)
            : 0;
        const dangerousPerms = scan.permissions ? scan.permissions.filter(p => p.status === 'dangerous' || p.protection === 'dangerous').length : 0;

        return `
            <div class="scan-card risk-${risk}" onclick="showScanDetails('${scan.scanId}')">
                <div class="scan-header">
                    <div class="scan-info">
                        <span class="scan-icon">${scan.platform === 'Android' ? '🤖' : '🍎'}</span>
                        <div>
                            <p class="scan-name">${scan.appName}</p>
                            <span class="scan-package">${scan.packageName || ''}</span>
                            <span class="scan-version">v${scan.versionName || '?'}</span>
                            <span class="scan-date">${formatDate(scan.scannedAt)}</span>
                        </div>
                    </div>
                    <div class="risk-score-container">
                        <span class="risk-badge ${risk}">${scan.riskScore}/10</span>
                    </div>
                </div>
                <div class="scan-quick-stats">
                    <div class="quick-stat">
                        <span class="quick-stat-icon">🚨</span>
                        <span class="quick-stat-value ${scan.vulnerabilities?.critical > 0 ? 'danger' : ''}">${scan.vulnerabilities?.critical || 0}</span>
                        <span class="quick-stat-label">Critical</span>
                    </div>
                    <div class="quick-stat">
                        <span class="quick-stat-icon">⚠️</span>
                        <span class="quick-stat-value ${totalVulns > 10 ? 'warning' : ''}">${totalVulns}</span>
                        <span class="quick-stat-label">Vulns</span>
                    </div>
                    <div class="quick-stat">
                        <span class="quick-stat-icon">🔑</span>
                        <span class="quick-stat-value ${dangerousPerms > 5 ? 'warning' : ''}">${dangerousPerms}</span>
                        <span class="quick-stat-label">Dangerous</span>
                    </div>
                    <div class="quick-stat">
                        <span class="quick-stat-icon">📊</span>
                        <span class="quick-stat-value ${scan.trackers > 10 ? 'warning' : ''}">${scan.trackers || 0}</span>
                        <span class="quick-stat-label">Trackers</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function showScanDetails(scanId) {
    const scan = allScans.find(s => s.scanId === scanId);
    if (!scan) return;

    const modal = document.getElementById('scanModal');
    const modalBody = document.getElementById('modalBody');
    const modalAppName = document.getElementById('modalAppName');

    modalAppName.textContent = `${scan.appName} - Security Analysis`;
    currentTab = 'overview';

    // Build comprehensive detailed view with tabs
    const risk = getRiskLevel(scan.riskScore);
    const riskColor = getRiskColor(risk);

    modalBody.innerHTML = `
        <!-- App Header -->
        <div class="scan-detail-header">
            <div class="app-icon-large">${scan.platform === 'Android' ? '🤖' : '🍎'}</div>
            <div class="app-header-info">
                <h2>${scan.appName}</h2>
                <p class="package-name">${scan.packageName || 'Unknown Package'}</p>
                <div class="app-meta">
                    <span class="meta-item">v${scan.versionName || '?'} (${scan.versionCode || '?'})</span>
                    <span class="meta-item">${formatBytes(scan.fileSize || 0)}</span>
                    <span class="meta-item">${scan.platform}</span>
                    <span class="meta-item">SDK ${scan.minSdk || '?'} - ${scan.targetSdk || '?'}</span>
                </div>
            </div>
            <div class="risk-score-large" style="background: ${riskColor}20; border-color: ${riskColor};">
                <span class="score-value" style="color: ${riskColor};">${scan.riskScore}</span>
                <span class="score-label">Risk Score</span>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="detail-tabs">
            <button class="detail-tab active" onclick="switchTab('overview', '${scanId}')">Overview</button>
            <button class="detail-tab" onclick="switchTab('vulnerabilities', '${scanId}')">Vulnerabilities</button>
            <button class="detail-tab" onclick="switchTab('permissions', '${scanId}')">Permissions</button>
            <button class="detail-tab" onclick="switchTab('trackers', '${scanId}')">Trackers</button>
            <button class="detail-tab" onclick="switchTab('code', '${scanId}')">Code Analysis</button>
            <button class="detail-tab" onclick="switchTab('network', '${scanId}')">Network</button>
            <button class="detail-tab" onclick="switchTab('binary', '${scanId}')">Binary</button>
            <button class="detail-tab" onclick="switchTab('certificate', '${scanId}')">Certificate</button>
        </div>

        <!-- Tab Content -->
        <div class="detail-tab-content" id="tabContent">
            ${renderOverviewTab(scan)}
        </div>
    `;

    modal.classList.add('show');
}

function switchTab(tabName, scanId) {
    const scan = allScans.find(s => s.scanId === scanId);
    if (!scan) return;

    currentTab = tabName;

    // Update active tab
    document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Render tab content
    const tabContent = document.getElementById('tabContent');
    switch(tabName) {
        case 'overview':
            tabContent.innerHTML = renderOverviewTab(scan);
            break;
        case 'vulnerabilities':
            tabContent.innerHTML = renderVulnerabilitiesTab(scan);
            break;
        case 'permissions':
            tabContent.innerHTML = renderPermissionsTab(scan);
            break;
        case 'trackers':
            tabContent.innerHTML = renderTrackersTab(scan);
            break;
        case 'code':
            tabContent.innerHTML = renderCodeAnalysisTab(scan);
            break;
        case 'network':
            tabContent.innerHTML = renderNetworkTab(scan);
            break;
        case 'binary':
            tabContent.innerHTML = renderBinaryTab(scan);
            break;
        case 'certificate':
            tabContent.innerHTML = renderCertificateTab(scan);
            break;
    }
}

function renderOverviewTab(scan) {
    const totalVulns = scan.vulnerabilities ?
        (scan.vulnerabilities.critical + scan.vulnerabilities.high + scan.vulnerabilities.medium + scan.vulnerabilities.low) : 0;
    const dangerousPerms = scan.permissions ? scan.permissions.filter(p => p.status === 'dangerous' || p.protection === 'dangerous').length : 0;

    return `
        <!-- Quick Summary Cards -->
        <div class="overview-grid">
            <div class="overview-card danger">
                <div class="overview-icon">🚨</div>
                <div class="overview-value">${scan.vulnerabilities?.critical || 0}</div>
                <div class="overview-label">Critical Issues</div>
            </div>
            <div class="overview-card warning">
                <div class="overview-icon">⚠️</div>
                <div class="overview-value">${totalVulns}</div>
                <div class="overview-label">Total Vulnerabilities</div>
            </div>
            <div class="overview-card info">
                <div class="overview-icon">🔑</div>
                <div class="overview-value">${dangerousPerms}/${scan.permissions?.length || 0}</div>
                <div class="overview-label">Dangerous Permissions</div>
            </div>
            <div class="overview-card neutral">
                <div class="overview-icon">📊</div>
                <div class="overview-value">${scan.trackers || 0}</div>
                <div class="overview-label">Trackers Detected</div>
            </div>
        </div>

        <!-- Vulnerability Breakdown -->
        <div class="detail-section">
            <h3>Vulnerability Breakdown</h3>
            <div class="vuln-breakdown">
                <div class="vuln-bar">
                    <div class="vuln-segment critical" style="width: ${(scan.vulnerabilities?.critical || 0) * 5}%"></div>
                    <div class="vuln-segment high" style="width: ${(scan.vulnerabilities?.high || 0) * 3}%"></div>
                    <div class="vuln-segment medium" style="width: ${(scan.vulnerabilities?.medium || 0) * 2}%"></div>
                    <div class="vuln-segment low" style="width: ${(scan.vulnerabilities?.low || 0) * 1}%"></div>
                </div>
                <div class="vuln-legend">
                    <span class="legend-item"><span class="dot critical"></span> Critical: ${scan.vulnerabilities?.critical || 0}</span>
                    <span class="legend-item"><span class="dot high"></span> High: ${scan.vulnerabilities?.high || 0}</span>
                    <span class="legend-item"><span class="dot medium"></span> Medium: ${scan.vulnerabilities?.medium || 0}</span>
                    <span class="legend-item"><span class="dot low"></span> Low: ${scan.vulnerabilities?.low || 0}</span>
                    <span class="legend-item"><span class="dot info"></span> Info: ${scan.vulnerabilities?.info || 0}</span>
                </div>
            </div>
        </div>

        <!-- Security Checklist -->
        <div class="detail-section">
            <h3>Security Checklist</h3>
            <div class="security-checklist">
                ${renderChecklistItem('Certificate Pinning', scan.networkSecurity?.certificatePinning)}
                ${renderChecklistItem('HTTPS Only', !scan.networkSecurity?.cleartextPermitted)}
                ${renderChecklistItem('Root Detection', scan.binaryAnalysis?.rootDetection)}
                ${renderChecklistItem('Anti-Tampering', scan.binaryAnalysis?.antiTampering)}
                ${renderChecklistItem('Code Obfuscation', scan.binaryAnalysis?.obfuscation && scan.binaryAnalysis?.obfuscation !== 'None')}
                ${renderChecklistItem('No Debuggable', !scan.manifestAnalysis?.debuggable)}
                ${renderChecklistItem('Backup Disabled', !scan.manifestAnalysis?.allowBackup)}
                ${renderChecklistItem('No Hardcoded Secrets', !scan.codeAnalysis?.hardcodedSecrets?.length)}
            </div>
        </div>

        <!-- Recommendations -->
        <div class="detail-section">
            <h3>Recommendations</h3>
            <div class="recommendations-box ${scan.riskScore >= 7 ? 'danger' : scan.riskScore >= 4 ? 'warning' : 'safe'}">
                ${scan.riskScore >= 7 ? `
                    <div class="rec-header danger">
                        <span class="rec-icon">🚫</span>
                        <span class="rec-title">HIGH RISK - Not Recommended for Children</span>
                    </div>
                    <p>This app has significant security and privacy concerns. Consider blocking it or monitoring usage closely.</p>
                    <ul>
                        <li>Contains ${scan.vulnerabilities?.critical || 0} critical security vulnerabilities</li>
                        <li>Requests ${dangerousPerms} dangerous permissions</li>
                        <li>Includes ${scan.trackers || 0} third-party trackers</li>
                    </ul>
                ` : scan.riskScore >= 4 ? `
                    <div class="rec-header warning">
                        <span class="rec-icon">⚠️</span>
                        <span class="rec-title">MEDIUM RISK - Use with Caution</span>
                    </div>
                    <p>This app has some security issues. Monitor usage and review permissions regularly.</p>
                    <ul>
                        <li>Review the ${dangerousPerms} dangerous permissions granted</li>
                        <li>Be aware of ${scan.trackers || 0} trackers collecting data</li>
                    </ul>
                ` : `
                    <div class="rec-header safe">
                        <span class="rec-icon">✅</span>
                        <span class="rec-title">LOW RISK - Generally Safe</span>
                    </div>
                    <p>This app appears to be relatively safe, but continue monitoring as needed.</p>
                `}
            </div>
        </div>

        <!-- File Info -->
        <div class="detail-section">
            <h3>File Information</h3>
            <div class="file-info-grid">
                <div class="file-info-item">
                    <span class="file-info-label">File Name</span>
                    <span class="file-info-value">${scan.fileName || 'N/A'}</span>
                </div>
                <div class="file-info-item">
                    <span class="file-info-label">SHA256</span>
                    <span class="file-info-value hash">${scan.sha256 || scan.fileHash || 'N/A'}</span>
                </div>
                <div class="file-info-item">
                    <span class="file-info-label">Scanned</span>
                    <span class="file-info-value">${formatDate(scan.scannedAt)}</span>
                </div>
                <div class="file-info-item">
                    <span class="file-info-label">Status</span>
                    <span class="file-info-value status-${scan.status}">${scan.status}</span>
                </div>
            </div>
        </div>
    `;
}

function renderVulnerabilitiesTab(scan) {
    const vulns = scan.vulnerabilities?.details || [];

    if (vulns.length === 0) {
        return `
            <div class="empty-tab">
                <span class="empty-icon">✅</span>
                <h3>No Detailed Vulnerabilities</h3>
                <p>No specific vulnerability details available for this scan.</p>
            </div>
        `;
    }

    return `
        <div class="detail-section">
            <h3>Vulnerability Details (${vulns.length} found)</h3>
            <div class="vuln-list">
                ${vulns.map(vuln => `
                    <div class="vuln-item ${vuln.severity}">
                        <div class="vuln-header">
                            <span class="vuln-severity ${vuln.severity}">${vuln.severity.toUpperCase()}</span>
                            <span class="vuln-title">${vuln.title}</span>
                            <span class="vuln-cvss">CVSS: ${vuln.cvss}</span>
                        </div>
                        <div class="vuln-body">
                            <p class="vuln-desc">${vuln.description}</p>
                            <div class="vuln-meta">
                                <span class="vuln-cwe">${vuln.cwe}</span>
                                <span class="vuln-file">📁 ${vuln.file}:${vuln.line}</span>
                            </div>
                            ${vuln.remediation ? `
                                <div class="vuln-remediation">
                                    <strong>Remediation:</strong> ${vuln.remediation}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderPermissionsTab(scan) {
    const permissions = scan.permissions || [];
    const dangerous = permissions.filter(p => p.status === 'dangerous' || p.protection === 'dangerous');
    const normal = permissions.filter(p => p.status === 'normal' || p.protection === 'normal');

    return `
        <div class="detail-section">
            <h3>Dangerous Permissions (${dangerous.length})</h3>
            ${dangerous.length > 0 ? `
                <div class="permissions-list">
                    ${dangerous.map(perm => `
                        <div class="permission-item dangerous">
                            <div class="perm-icon">🔴</div>
                            <div class="perm-info">
                                <span class="perm-name">${perm.name}</span>
                                <span class="perm-desc">${perm.description}</span>
                            </div>
                            <span class="perm-badge dangerous">DANGEROUS</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="no-items">No dangerous permissions requested</p>'}
        </div>

        <div class="detail-section">
            <h3>Normal Permissions (${normal.length})</h3>
            ${normal.length > 0 ? `
                <div class="permissions-list">
                    ${normal.map(perm => `
                        <div class="permission-item normal">
                            <div class="perm-icon">🟢</div>
                            <div class="perm-info">
                                <span class="perm-name">${perm.name}</span>
                                <span class="perm-desc">${perm.description}</span>
                            </div>
                            <span class="perm-badge normal">NORMAL</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="no-items">No normal permissions</p>'}
        </div>
    `;
}

function renderTrackersTab(scan) {
    const trackers = scan.trackerDetails || [];

    // Group trackers by category
    const categories = {};
    trackers.forEach(t => {
        if (!categories[t.category]) categories[t.category] = [];
        categories[t.category].push(t);
    });

    const categoryIcons = {
        'Analytics': '📊',
        'Advertising': '📢',
        'Social': '🔗',
        'Crash Reporting': '🐛',
        'Location': '📍'
    };

    return `
        <div class="detail-section">
            <h3>Trackers Detected (${scan.trackers || trackers.length})</h3>
            <div class="privacy-impact ${scan.trackers > 10 ? 'high' : scan.trackers > 5 ? 'medium' : 'low'}">
                <span class="impact-icon">${scan.trackers > 10 ? '🔴' : scan.trackers > 5 ? '🟡' : '🟢'}</span>
                <span class="impact-text">Privacy Impact: ${scan.trackers > 10 ? 'HIGH' : scan.trackers > 5 ? 'MEDIUM' : 'LOW'}</span>
                <span class="impact-desc">This app shares data with ${scan.trackers || trackers.length} third-party companies</span>
            </div>
        </div>

        ${Object.keys(categories).map(cat => `
            <div class="detail-section">
                <h3>${categoryIcons[cat] || '📦'} ${cat} (${categories[cat].length})</h3>
                <div class="trackers-list">
                    ${categories[cat].map(tracker => `
                        <div class="tracker-item">
                            <div class="tracker-info">
                                <span class="tracker-name">${tracker.name}</span>
                                <span class="tracker-desc">${tracker.description}</span>
                            </div>
                            <a href="${tracker.website}" target="_blank" class="tracker-link">Learn More →</a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        ${trackers.length === 0 ? `
            <div class="empty-tab">
                <span class="empty-icon">🎉</span>
                <h3>No Trackers Detected</h3>
                <p>This app doesn't appear to contain known trackers.</p>
            </div>
        ` : ''}
    `;
}

function renderCodeAnalysisTab(scan) {
    const code = scan.codeAnalysis || {};

    return `
        <!-- Hardcoded Secrets -->
        <div class="detail-section">
            <h3>🔑 Exposed Secrets (${code.hardcodedSecrets?.length || 0})</h3>
            ${code.hardcodedSecrets?.length > 0 ? `
                <div class="secrets-list">
                    ${code.hardcodedSecrets.map(secret => `
                        <div class="secret-item">
                            <span class="secret-type">${secret.type}</span>
                            <span class="secret-service">${secret.service}</span>
                            <code class="secret-value">${secret.value}</code>
                            <span class="secret-file">📁 ${secret.file}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="code-warning">
                    ⚠️ Hardcoded secrets can be extracted by attackers and abused
                </div>
            ` : '<p class="no-items safe">✅ No hardcoded secrets found</p>'}
        </div>

        <!-- Firebase URLs -->
        <div class="detail-section">
            <h3>🔥 Firebase URLs (${code.firebaseUrls?.length || 0})</h3>
            ${code.firebaseUrls?.length > 0 ? `
                <div class="urls-list">
                    ${code.firebaseUrls.map(url => `
                        <div class="url-item warning">
                            <span class="url-icon">🔥</span>
                            <span class="url-value">${url}</span>
                            <span class="url-warning">⚠️ Check Firebase security rules!</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="no-items">No Firebase URLs found</p>'}
        </div>

        <!-- S3 Buckets -->
        <div class="detail-section">
            <h3>☁️ S3 Buckets (${code.s3Buckets?.length || 0})</h3>
            ${code.s3Buckets?.length > 0 ? `
                <div class="urls-list">
                    ${code.s3Buckets.map(bucket => `
                        <div class="url-item warning">
                            <span class="url-icon">☁️</span>
                            <span class="url-value">${bucket}</span>
                            <span class="url-warning">⚠️ Verify bucket is not public!</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="no-items">No S3 buckets found</p>'}
        </div>

        <!-- External URLs -->
        <div class="detail-section">
            <h3>🌐 External URLs (${code.exposedUrls?.length || 0})</h3>
            ${code.exposedUrls?.length > 0 ? `
                <div class="urls-list">
                    ${code.exposedUrls.map(item => `
                        <div class="url-item ${item.secure ? 'secure' : 'insecure'}">
                            <span class="url-icon">${item.secure ? '🔒' : '⚠️'}</span>
                            <span class="url-value">${item.url}</span>
                            <span class="url-status ${item.secure ? 'secure' : 'insecure'}">${item.secure ? 'HTTPS' : 'HTTP'}</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="no-items">No URLs extracted</p>'}
        </div>

        <!-- Emails & IPs -->
        <div class="detail-section-row">
            <div class="detail-section half">
                <h3>📧 Emails Found</h3>
                ${code.emails?.length > 0 ? `
                    <ul class="simple-list">
                        ${code.emails.map(email => `<li>${email}</li>`).join('')}
                    </ul>
                ` : '<p class="no-items">None</p>'}
            </div>
            <div class="detail-section half">
                <h3>🖥️ IP Addresses</h3>
                ${code.ipAddresses?.length > 0 ? `
                    <ul class="simple-list">
                        ${code.ipAddresses.map(ip => `<li>${ip}</li>`).join('')}
                    </ul>
                ` : '<p class="no-items">None</p>'}
            </div>
        </div>
    `;
}

function renderNetworkTab(scan) {
    const net = scan.networkSecurity || {};

    return `
        <div class="detail-section">
            <h3>Network Security Configuration</h3>
            <div class="network-grid">
                <div class="network-item ${net.certificatePinning ? 'secure' : 'insecure'}">
                    <span class="net-icon">${net.certificatePinning ? '✅' : '❌'}</span>
                    <span class="net-label">Certificate Pinning</span>
                    <span class="net-value">${net.certificatePinning ? 'Enabled' : 'Not Implemented'}</span>
                </div>
                <div class="network-item ${!net.cleartextPermitted ? 'secure' : 'insecure'}">
                    <span class="net-icon">${!net.cleartextPermitted ? '✅' : '⚠️'}</span>
                    <span class="net-label">Cleartext Traffic</span>
                    <span class="net-value">${net.cleartextPermitted ? 'Allowed' : 'Blocked'}</span>
                </div>
                <div class="network-item secure">
                    <span class="net-icon">🔒</span>
                    <span class="net-label">TLS Version</span>
                    <span class="net-value">${net.tlsVersion || 'Unknown'}</span>
                </div>
            </div>
        </div>

        ${net.cleartextDomains?.length > 0 ? `
            <div class="detail-section">
                <h3>⚠️ Domains Allowing HTTP</h3>
                <div class="domain-list warning">
                    ${net.cleartextDomains.map(d => `<span class="domain-item">${d}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${net.domainWhitelist?.length > 0 ? `
            <div class="detail-section">
                <h3>Whitelisted Domains</h3>
                <div class="domain-list">
                    ${net.domainWhitelist.map(d => `<span class="domain-item">${d}</span>`).join('')}
                </div>
            </div>
        ` : ''}

        ${net.trustAnchors?.length > 0 ? `
            <div class="detail-section">
                <h3>Trust Anchors</h3>
                <ul class="simple-list">
                    ${net.trustAnchors.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
}

function renderBinaryTab(scan) {
    const binary = scan.binaryAnalysis || {};
    const malware = scan.malwareAnalysis || {};
    const manifest = scan.manifestAnalysis || {};

    return `
        <div class="detail-section">
            <h3>Binary Protection Analysis</h3>
            <div class="binary-grid">
                ${renderBinaryItem('PIE', 'Position Independent Executable', binary.pie)}
                ${renderBinaryItem('Stack Canary', 'Buffer overflow protection', binary.stackCanary)}
                ${renderBinaryItem('NX Bit', 'No-execute memory protection', binary.nxBit)}
                ${renderBinaryItem('RELRO', 'Relocation Read-Only', binary.relro)}
                ${renderBinaryItem('FORTIFY', 'FORTIFY_SOURCE enabled', binary.fortify)}
                ${renderBinaryItem('Symbols Stripped', 'Debug symbols removed', !binary.symbols)}
            </div>
        </div>

        <div class="detail-section">
            <h3>Security Features</h3>
            <div class="binary-grid">
                ${renderBinaryItem('Root Detection', 'Detects rooted devices', binary.rootDetection)}
                ${renderBinaryItem('Anti-Tampering', 'Prevents modification', binary.antiTampering)}
                ${renderBinaryItem('Anti-Debug', 'Prevents debugging', malware.antiDebug)}
                ${renderBinaryItem('Anti-VM', 'Detects emulators', malware.antiVM)}
            </div>
        </div>

        <div class="detail-section">
            <h3>Code Protection</h3>
            <div class="code-protection">
                <div class="protection-item">
                    <span class="protection-label">Obfuscation</span>
                    <span class="protection-value ${binary.obfuscation && binary.obfuscation !== 'None' ? 'good' : 'bad'}">
                        ${binary.obfuscation || 'None'}
                    </span>
                </div>
                <div class="protection-item">
                    <span class="protection-label">Packer</span>
                    <span class="protection-value ${malware.packer === 'None' ? 'good' : 'warning'}">
                        ${malware.packer || 'None'}
                    </span>
                </div>
                <div class="protection-item">
                    <span class="protection-label">Compiler</span>
                    <span class="protection-value">${malware.compiler || 'Unknown'}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Manifest Analysis</h3>
            <div class="manifest-grid">
                <div class="manifest-item ${!manifest.debuggable ? 'secure' : 'insecure'}">
                    <span class="manifest-label">Debuggable</span>
                    <span class="manifest-value">${manifest.debuggable ? 'Yes ⚠️' : 'No ✅'}</span>
                </div>
                <div class="manifest-item ${!manifest.allowBackup ? 'secure' : 'insecure'}">
                    <span class="manifest-label">Allow Backup</span>
                    <span class="manifest-value">${manifest.allowBackup ? 'Yes ⚠️' : 'No ✅'}</span>
                </div>
                <div class="manifest-item">
                    <span class="manifest-label">Exported Activities</span>
                    <span class="manifest-value">${manifest.exportedActivities || 0}</span>
                </div>
                <div class="manifest-item">
                    <span class="manifest-label">Exported Services</span>
                    <span class="manifest-value">${manifest.exportedServices || 0}</span>
                </div>
                <div class="manifest-item">
                    <span class="manifest-label">Exported Receivers</span>
                    <span class="manifest-value">${manifest.exportedReceivers || 0}</span>
                </div>
                <div class="manifest-item">
                    <span class="manifest-label">Exported Providers</span>
                    <span class="manifest-value">${manifest.exportedProviders || 0}</span>
                </div>
            </div>
        </div>
    `;
}

function renderCertificateTab(scan) {
    const cert = scan.certificateInfo || {};

    return `
        <div class="detail-section">
            <h3>Certificate Information</h3>
            <div class="cert-grid">
                <div class="cert-item">
                    <span class="cert-label">Issuer</span>
                    <span class="cert-value">${cert.issuer || 'Unknown'}</span>
                </div>
                <div class="cert-item">
                    <span class="cert-label">Subject</span>
                    <span class="cert-value">${cert.subject || 'Unknown'}</span>
                </div>
                <div class="cert-item">
                    <span class="cert-label">Valid From</span>
                    <span class="cert-value">${cert.validFrom || 'Unknown'}</span>
                </div>
                <div class="cert-item">
                    <span class="cert-label">Valid Until</span>
                    <span class="cert-value">${cert.validTo || 'Unknown'}</span>
                </div>
                <div class="cert-item">
                    <span class="cert-label">Algorithm</span>
                    <span class="cert-value">${cert.signatureAlgorithm || 'Unknown'}</span>
                </div>
                <div class="cert-item">
                    <span class="cert-label">Serial Number</span>
                    <span class="cert-value">${cert.serialNumber || 'Unknown'}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>Fingerprints</h3>
            <div class="fingerprint-list">
                <div class="fingerprint-item">
                    <span class="fp-label">SHA1</span>
                    <code class="fp-value">${cert.sha1Fingerprint || 'N/A'}</code>
                </div>
                <div class="fingerprint-item">
                    <span class="fp-label">SHA256</span>
                    <code class="fp-value">${cert.sha256Fingerprint || 'N/A'}</code>
                </div>
            </div>
        </div>

        ${cert.warnings?.length > 0 ? `
            <div class="detail-section">
                <h3>⚠️ Certificate Warnings</h3>
                <div class="cert-warnings">
                    ${cert.warnings.map(w => `
                        <div class="warning-item">
                            <span class="warning-icon">⚠️</span>
                            <span class="warning-text">${w}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : `
            <div class="detail-section">
                <div class="no-warnings">
                    <span class="no-warnings-icon">✅</span>
                    <span>No certificate warnings</span>
                </div>
            </div>
        `}
    `;
}

// Helper functions
function renderChecklistItem(label, value) {
    return `
        <div class="checklist-item ${value ? 'pass' : 'fail'}">
            <span class="check-icon">${value ? '✅' : '❌'}</span>
            <span class="check-label">${label}</span>
        </div>
    `;
}

function renderBinaryItem(name, description, value) {
    const isGood = value === true || value === 'Full';
    return `
        <div class="binary-item ${isGood ? 'secure' : 'insecure'}">
            <span class="binary-icon">${isGood ? '✅' : '❌'}</span>
            <div class="binary-info">
                <span class="binary-name">${name}</span>
                <span class="binary-desc">${description}</span>
            </div>
            <span class="binary-value">${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || 'No')}</span>
        </div>
    `;
}

function closeScanModal(event) {
    if (!event || event.target === event.currentTarget) {
        document.getElementById('scanModal').classList.remove('show');
    }
}

function setFilter(button, filter) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    currentFilter = filter;
    renderScans();
}

function filterScans() {
    renderScans();
}

// Load scans on page load
document.addEventListener('DOMContentLoaded', loadAppScanning);
