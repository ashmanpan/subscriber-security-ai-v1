// App Scanning Page Script

let allScans = [];
let currentFilter = 'all';

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
        if (searchQuery && !scan.appName.toLowerCase().includes(searchQuery)) {
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

        return `
            <div class="scan-card risk-${risk}" onclick="showScanDetails('${scan.scanId}')">
                <div class="scan-header">
                    <div class="scan-info">
                        <span class="scan-icon">${scan.platform === 'Android' ? '🤖' : '🍎'}</span>
                        <div>
                            <p class="scan-name">${scan.appName}</p>
                            <span class="scan-date">${formatDate(scan.scannedAt)}</span>
                        </div>
                    </div>
                    <span class="risk-badge ${risk}">Risk: ${scan.riskScore}/10</span>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #333;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.9rem;">
                        <div>
                            <span style="color: #888;">Vulnerabilities:</span>
                            <strong style="color: ${totalVulns > 10 ? '#ff4444' : '#00ff88'}; margin-left: 0.5rem;">${totalVulns}</strong>
                        </div>
                        <div>
                            <span style="color: #888;">Trackers:</span>
                            <strong style="color: ${scan.trackers > 10 ? '#ffaa00' : '#00ff88'}; margin-left: 0.5rem;">${scan.trackers || 0}</strong>
                        </div>
                        <div>
                            <span style="color: #888;">Critical:</span>
                            <strong style="color: #ff4444; margin-left: 0.5rem;">${scan.vulnerabilities?.critical || 0}</strong>
                        </div>
                        <div>
                            <span style="color: #888;">Permissions:</span>
                            <strong style="color: #00aaff; margin-left: 0.5rem;">${scan.permissions?.length || 0}</strong>
                        </div>
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

    modalAppName.textContent = scan.appName;

    // Build detailed view with tabs
    const risk = getRiskLevel(scan.riskScore);
    const riskColor = getRiskColor(risk);

    modalBody.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="color: #fff;">Risk Assessment</h3>
                <span style="font-size: 3rem; font-weight: 700; color: ${riskColor};">${scan.riskScore}/10</span>
            </div>
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                <p><strong>Platform:</strong> ${scan.platform}</p>
                <p><strong>File Hash:</strong> <code style="color: #00aaff; font-size: 0.85rem;">${scan.fileHash}</code></p>
                <p><strong>Scanned:</strong> ${formatDate(scan.scannedAt)}</p>
                <p><strong>Status:</strong> <span style="color: #00ff88;">${scan.status}</span></p>
                ${scan.malwareIndicators?.isMalware ? `
                    <div style="background: rgba(255,68,68,0.2); border: 1px solid #ff4444; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                        <p style="color: #ff4444; font-weight: 700; margin-bottom: 0.5rem;">⚠️ MALWARE DETECTED (${scan.malwareIndicators.confidence}% confidence)</p>
                        <p style="color: #888; font-size: 0.9rem;">This application exhibits malicious behavior and should be removed immediately.</p>
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- Tab Navigation -->
        <div style="border-bottom: 2px solid #333; margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 1rem;">
                <button onclick="showTab('overview')" id="tab-overview" class="scan-tab active-tab" style="background: none; border: none; color: #00ff88; padding: 0.75rem 1rem; cursor: pointer; border-bottom: 2px solid #00ff88; font-weight: 600;">
                    Overview
                </button>
                <button onclick="showTab('vulnerabilities')" id="tab-vulnerabilities" class="scan-tab" style="background: none; border: none; color: #888; padding: 0.75rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600;">
                    Vulnerabilities
                </button>
                <button onclick="showTab('code')" id="tab-code" class="scan-tab" style="background: none; border: none; color: #888; padding: 0.75rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600;">
                    Code Analysis
                </button>
                <button onclick="showTab('network')" id="tab-network" class="scan-tab" style="background: none; border: none; color: #888; padding: 0.75rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600;">
                    Network
                </button>
                <button onclick="showTab('certificate')" id="tab-certificate" class="scan-tab" style="background: none; border: none; color: #888; padding: 0.75rem 1rem; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600;">
                    Certificate
                </button>
            </div>
        </div>

        <!-- Tab Content -->
        <div id="tab-content-overview" class="tab-content">
            ${renderOverviewTab(scan, riskColor)}
        </div>
        <div id="tab-content-vulnerabilities" class="tab-content" style="display: none;">
            ${renderVulnerabilitiesTab(scan)}
        </div>
        <div id="tab-content-code" class="tab-content" style="display: none;">
            ${renderCodeAnalysisTab(scan)}
        </div>
        <div id="tab-content-network" class="tab-content" style="display: none;">
            ${renderNetworkTab(scan)}
        </div>
        <div id="tab-content-certificate" class="tab-content" style="display: none;">
            ${renderCertificateTab(scan)}
        </div>
    `;

    modal.classList.add('show');
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove active state from all tab buttons
    document.querySelectorAll('.scan-tab').forEach(btn => {
        btn.style.color = '#888';
        btn.style.borderBottom = '2px solid transparent';
        btn.classList.remove('active-tab');
    });

    // Show selected tab
    document.getElementById(`tab-content-${tabName}`).style.display = 'block';

    // Activate selected tab button
    const activeBtn = document.getElementById(`tab-${tabName}`);
    activeBtn.style.color = '#00ff88';
    activeBtn.style.borderBottom = '2px solid #00ff88';
    activeBtn.classList.add('active-tab');
}

function renderOverviewTab(scan, riskColor) {
    const totalVulns = (scan.vulnerabilities?.critical || 0) + (scan.vulnerabilities?.high || 0) +
                      (scan.vulnerabilities?.medium || 0) + (scan.vulnerabilities?.low || 0);

    return `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">🚨 Vulnerabilities Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                <div style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; padding: 1rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ff4444;">${scan.vulnerabilities?.critical || 0}</div>
                    <div style="color: #888;">Critical</div>
                </div>
                <div style="background: rgba(255,68,68,0.1); border: 1px solid #ff6666; padding: 1rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ff6666;">${scan.vulnerabilities?.high || 0}</div>
                    <div style="color: #888;">High</div>
                </div>
                <div style="background: rgba(255,170,0,0.1); border: 1px solid #ffaa00; padding: 1rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #ffaa00;">${scan.vulnerabilities?.medium || 0}</div>
                    <div style="color: #888;">Medium</div>
                </div>
                <div style="background: rgba(0,255,136,0.1); border: 1px solid #00ff88; padding: 1rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: #00ff88;">${scan.vulnerabilities?.low || 0}</div>
                    <div style="color: #888;">Low</div>
                </div>
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">🔑 Permissions (${scan.permissions?.length || 0})</h3>
            <div style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${scan.permissions?.map(perm => {
                        const isDangerous = ['CAMERA', 'RECORD_AUDIO', 'READ_CONTACTS', 'READ_SMS', 'SEND_SMS', 'CALL_PHONE', 'ACCESS_FINE_LOCATION', 'READ_PHONE_STATE'].includes(perm);
                        return `
                            <span style="background: rgba(${isDangerous ? '255,68,68' : '0,170,255'},0.2); color: ${isDangerous ? '#ff4444' : '#00aaff'}; border: 1px solid ${isDangerous ? '#ff4444' : '#00aaff'}; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">
                                ${isDangerous ? '⚠️ ' : ''}${perm}
                            </span>
                        `;
                    }).join('') || '<p style="color: #888;">No permissions data</p>'}
                </div>
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">📊 Trackers Detected (${scan.trackers || 0})</h3>
            ${scan.trackersList && scan.trackersList.length > 0 ? `
                <div style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                    ${scan.trackersList.map(tracker => `
                        <div style="padding: 0.5rem; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                            <span style="color: #fff;">${tracker.name}</span>
                            <span style="color: #888; font-size: 0.85rem;">${tracker.category}</span>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div style="background: rgba(255,170,0,0.1); border: 1px solid #ffaa00; padding: 1.5rem; border-radius: 10px; text-align: center;">
                    <div style="font-size: 3rem; font-weight: 700; color: #ffaa00;">${scan.trackers || 0}</div>
                    <div style="color: #888; margin-top: 0.5rem;">Third-party trackers found</div>
                </div>
            `}
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">📱 App Components</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                ${scan.components ? `
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #00aaff;">${scan.components.activities || 0}</div>
                        <div style="color: #888; font-size: 0.85rem;">Activities</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #00aaff;">${scan.components.services || 0}</div>
                        <div style="color: #888; font-size: 0.85rem;">Services</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #00aaff;">${scan.components.receivers || 0}</div>
                        <div style="color: #888; font-size: 0.85rem;">Receivers</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #00aaff;">${scan.components.providers || 0}</div>
                        <div style="color: #888; font-size: 0.85rem;">Providers</div>
                    </div>
                ` : '<p style="color: #888;">No component data</p>'}
            </div>
        </div>

        ${scan.manifestAnalysis ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #fff; margin-bottom: 1rem;">📄 Manifest Analysis</h3>
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <span style="color: #888;">Min SDK:</span>
                            <strong style="color: #fff; margin-left: 0.5rem;">${scan.manifestAnalysis.minSdk}</strong>
                        </div>
                        <div>
                            <span style="color: #888;">Target SDK:</span>
                            <strong style="color: #fff; margin-left: 0.5rem;">${scan.manifestAnalysis.targetSdk}</strong>
                        </div>
                        <div>
                            <span style="color: #888;">Debuggable:</span>
                            <strong style="color: ${scan.manifestAnalysis.debuggable ? '#ff4444' : '#00ff88'}; margin-left: 0.5rem;">
                                ${scan.manifestAnalysis.debuggable ? '⚠️ Yes' : 'No'}
                            </strong>
                        </div>
                        <div>
                            <span style="color: #888;">Allow Backup:</span>
                            <strong style="color: ${scan.manifestAnalysis.allowBackup ? '#ffaa00' : '#00ff88'}; margin-left: 0.5rem;">
                                ${scan.manifestAnalysis.allowBackup ? 'Yes' : 'No'}
                            </strong>
                        </div>
                        <div>
                            <span style="color: #888;">Cleartext Traffic:</span>
                            <strong style="color: ${scan.manifestAnalysis.usesCleartextTraffic ? '#ff4444' : '#00ff88'}; margin-left: 0.5rem;">
                                ${scan.manifestAnalysis.usesCleartextTraffic ? '⚠️ Allowed' : 'Blocked'}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}

        <div style="margin-bottom: 1rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">💡 Recommendations</h3>
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                ${scan.riskScore >= 7 ? `
                    <p style="color: #ff4444; margin-bottom: 0.5rem;">⚠️ <strong>High Risk App - Not Recommended</strong></p>
                    <p style="color: #888;">This app has significant security concerns. Consider blocking it or monitoring usage closely.</p>
                    ${scan.malwareIndicators?.reasons ? `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #333;">
                            <p style="color: #ff4444; font-weight: 700; margin-bottom: 0.5rem;">Malware Indicators:</p>
                            <ul style="color: #888; margin-left: 1.5rem;">
                                ${scan.malwareIndicators.reasons.map(reason => `<li style="margin-bottom: 0.3rem;">${reason}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                ` : scan.riskScore >= 4 ? `
                    <p style="color: #ffaa00; margin-bottom: 0.5rem;">⚠️ <strong>Medium Risk - Use with Caution</strong></p>
                    <p style="color: #888;">This app has some security issues. Monitor usage and review permissions regularly.</p>
                ` : `
                    <p style="color: #00ff88; margin-bottom: 0.5rem;">✅ <strong>Low Risk - Generally Safe</strong></p>
                    <p style="color: #888;">This app appears to be relatively safe, but continue monitoring as needed.</p>
                `}
            </div>
        </div>
    `;
}

function renderVulnerabilitiesTab(scan) {
    if (!scan.vulnerabilityDetails || scan.vulnerabilityDetails.length === 0) {
        return `
            <div class="no-data">
                <p style="color: #888;">No detailed vulnerability information available</p>
            </div>
        `;
    }

    const groupedVulns = {
        critical: scan.vulnerabilityDetails.filter(v => v.severity === 'critical'),
        high: scan.vulnerabilityDetails.filter(v => v.severity === 'high'),
        medium: scan.vulnerabilityDetails.filter(v => v.severity === 'medium'),
        low: scan.vulnerabilityDetails.filter(v => v.severity === 'low')
    };

    return `
        ${Object.entries(groupedVulns).map(([severity, vulns]) => {
            if (vulns.length === 0) return '';

            const colors = {
                critical: '#ff4444',
                high: '#ff6666',
                medium: '#ffaa00',
                low: '#00ff88'
            };

            return `
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: ${colors[severity]}; margin-bottom: 1rem; text-transform: uppercase;">
                        ${severity} Severity (${vulns.length})
                    </h3>
                    ${vulns.map(vuln => `
                        <div style="background: rgba(255,255,255,0.05); border-left: 3px solid ${colors[severity]}; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                <h4 style="color: #fff; margin: 0;">${vuln.title}</h4>
                                <span style="background: rgba(${severity === 'critical' ? '255,68,68' : severity === 'high' ? '255,102,102' : severity === 'medium' ? '255,170,0' : '0,255,136'},0.2); color: ${colors[severity]}; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                                    CVSS ${vuln.cvss}
                                </span>
                            </div>
                            <p style="color: #ccc; margin: 0.75rem 0;">${vuln.description}</p>
                            <p style="color: #888; font-size: 0.85rem; margin: 0;">
                                <strong>File:</strong> <code style="color: #00aaff;">${vuln.file}</code>
                            </p>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('')}
    `;
}

function renderCodeAnalysisTab(scan) {
    if (!scan.codeAnalysis) {
        return `
            <div class="no-data">
                <p style="color: #888;">No code analysis data available</p>
            </div>
        `;
    }

    return `
        ${scan.codeAnalysis.hardcodedSecrets && scan.codeAnalysis.hardcodedSecrets.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ff4444; margin-bottom: 1rem;">🚨 Hardcoded Secrets</h3>
                <div style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; padding: 1rem; border-radius: 10px;">
                    ${scan.codeAnalysis.hardcodedSecrets.map(secret => `
                        <div style="background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; font-family: monospace;">
                            <code style="color: #ff4444;">${secret}</code>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${scan.codeAnalysis.insecureFunctions && scan.codeAnalysis.insecureFunctions.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ffaa00; margin-bottom: 1rem;">⚠️ Insecure Functions</h3>
                <div style="background: rgba(255,170,0,0.1); border: 1px solid #ffaa00; padding: 1rem; border-radius: 10px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${scan.codeAnalysis.insecureFunctions.map(func => `
                            <span style="background: rgba(255,170,0,0.2); color: #ffaa00; border: 1px solid #ffaa00; padding: 0.5rem 1rem; border-radius: 20px; font-family: monospace; font-size: 0.85rem;">
                                ${func}
                            </span>
                        `).join('')}
                    </div>
                </div>
            </div>
        ` : ''}

        ${scan.codeAnalysis.sqlInjection && scan.codeAnalysis.sqlInjection.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ff4444; margin-bottom: 1rem;">💉 SQL Injection Risks</h3>
                <div style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; padding: 1rem; border-radius: 10px;">
                    ${scan.codeAnalysis.sqlInjection.map(sql => `
                        <div style="background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; font-family: monospace;">
                            <code style="color: #ff6666;">${sql}</code>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${scan.codeAnalysis.cryptoIssues && scan.codeAnalysis.cryptoIssues.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #ffaa00; margin-bottom: 1rem;">🔐 Cryptography Issues</h3>
                <div style="background: rgba(255,170,0,0.1); border: 1px solid #ffaa00; padding: 1rem; border-radius: 10px;">
                    <ul style="color: #ccc; margin: 0; padding-left: 1.5rem;">
                        ${scan.codeAnalysis.cryptoIssues.map(issue => `
                            <li style="margin-bottom: 0.5rem;">${issue}</li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        ` : ''}

        ${!scan.codeAnalysis.hardcodedSecrets?.length &&
          !scan.codeAnalysis.insecureFunctions?.length &&
          !scan.codeAnalysis.sqlInjection?.length &&
          !scan.codeAnalysis.cryptoIssues?.length ? `
            <div style="background: rgba(0,255,136,0.1); border: 1px solid #00ff88; padding: 1.5rem; border-radius: 10px; text-align: center;">
                <p style="color: #00ff88; font-size: 1.2rem;">✅ No major code issues detected</p>
            </div>
        ` : ''}
    `;
}

function renderNetworkTab(scan) {
    if (!scan.networkSecurity) {
        return `
            <div class="no-data">
                <p style="color: #888;">No network security data available</p>
            </div>
        `;
    }

    return `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">🌐 Network Configuration</h3>
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                <div style="margin-bottom: 1rem;">
                    <span style="color: #888;">Cleartext Traffic:</span>
                    <strong style="color: ${scan.networkSecurity.clearTextTraffic ? '#ff4444' : '#00ff88'}; margin-left: 0.5rem;">
                        ${scan.networkSecurity.clearTextTraffic ? '⚠️ Allowed (Insecure)' : '✅ Blocked'}
                    </strong>
                </div>
                <div>
                    <span style="color: #888;">Certificate Pinning:</span>
                    <strong style="color: ${scan.networkSecurity.certificatePinning ? '#00ff88' : '#ffaa00'}; margin-left: 0.5rem;">
                        ${scan.networkSecurity.certificatePinning ? '✅ Enabled' : '⚠️ Not Implemented'}
                    </strong>
                </div>
            </div>
        </div>

        ${scan.networkSecurity.domains && scan.networkSecurity.domains.length > 0 ? `
            <div style="margin-bottom: 2rem;">
                <h3 style="color: #fff; margin-bottom: 1rem;">📡 Domains Contacted (${scan.networkSecurity.domains.length})</h3>
                <div style="max-height: 300px; overflow-y: auto; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                    ${scan.networkSecurity.domains.map(domain => {
                        const isSuspicious = domain.includes('.tk') || domain.includes('.ml') || domain.includes('.ga') ||
                                           domain.includes('.xyz') || domain.includes('malicious') || domain.includes('unknown');
                        return `
                            <div style="padding: 0.75rem; background: rgba(${isSuspicious ? '255,68,68' : '0,170,255'},0.1); border: 1px solid ${isSuspicious ? '#ff4444' : '#00aaff'}; border-radius: 6px; margin-bottom: 0.5rem; font-family: monospace;">
                                <code style="color: ${isSuspicious ? '#ff4444' : '#00aaff'};">
                                    ${isSuspicious ? '⚠️ ' : ''}${domain}
                                </code>
                                ${isSuspicious ? '<span style="color: #ff4444; margin-left: 1rem; font-size: 0.85rem;">(Suspicious)</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function renderCertificateTab(scan) {
    if (!scan.certificateInfo) {
        return `
            <div class="no-data">
                <p style="color: #888;">No certificate information available</p>
            </div>
        `;
    }

    const cert = scan.certificateInfo;
    const isWeakAlgo = cert.signatureAlgorithm?.includes('MD5') || cert.signatureAlgorithm?.includes('SHA1');
    const validUntil = new Date(cert.validUntil);
    const now = new Date();
    const daysUntilExpiry = Math.floor((validUntil - now) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysUntilExpiry < 90 && daysUntilExpiry > 0;
    const isExpired = daysUntilExpiry < 0;

    return `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">📜 Certificate Details</h3>
            <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 10px;">
                <div style="margin-bottom: 1rem;">
                    <p style="color: #888; margin-bottom: 0.25rem;">Subject</p>
                    <p style="color: #fff; font-family: monospace; font-size: 0.9rem;">${cert.subject}</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <p style="color: #888; margin-bottom: 0.25rem;">Issuer</p>
                    <p style="color: #fff; font-family: monospace; font-size: 0.9rem;">${cert.issuer}</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <p style="color: #888; margin-bottom: 0.25rem;">Valid From</p>
                        <p style="color: #fff;">${cert.validFrom}</p>
                    </div>
                    <div>
                        <p style="color: #888; margin-bottom: 0.25rem;">Valid Until</p>
                        <p style="color: ${isExpired ? '#ff4444' : isExpiringSoon ? '#ffaa00' : '#00ff88'};">
                            ${cert.validUntil}
                            ${isExpired ? ' ⚠️ EXPIRED' : isExpiringSoon ? ' ⚠️ Expiring Soon' : ''}
                        </p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <p style="color: #888; margin-bottom: 0.25rem;">Serial Number</p>
                        <p style="color: #00aaff; font-family: monospace; font-size: 0.9rem;">${cert.serialNumber}</p>
                    </div>
                    <div>
                        <p style="color: #888; margin-bottom: 0.25rem;">Signature Algorithm</p>
                        <p style="color: ${isWeakAlgo ? '#ff4444' : '#00ff88'}; font-family: monospace; font-size: 0.9rem;">
                            ${cert.signatureAlgorithm}
                            ${isWeakAlgo ? ' ⚠️ Weak' : ''}
                        </p>
                    </div>
                    <div>
                        <p style="color: #888; margin-bottom: 0.25rem;">Version</p>
                        <p style="color: #fff;">${cert.version}</p>
                    </div>
                </div>
            </div>
        </div>

        ${isWeakAlgo || isExpired || isExpiringSoon ? `
            <div style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; padding: 1rem; border-radius: 10px;">
                <h4 style="color: #ff4444; margin: 0 0 0.5rem 0;">⚠️ Certificate Issues Detected</h4>
                <ul style="color: #ccc; margin: 0; padding-left: 1.5rem;">
                    ${isWeakAlgo ? '<li>Weak signature algorithm detected - vulnerable to attacks</li>' : ''}
                    ${isExpired ? '<li>Certificate has expired - app may not be trusted</li>' : ''}
                    ${isExpiringSoon ? `<li>Certificate expires in ${daysUntilExpiry} days</li>` : ''}
                </ul>
            </div>
        ` : ''}
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
