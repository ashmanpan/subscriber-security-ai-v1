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

    // Build detailed view
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
                <p><strong>File Hash:</strong> <code style="color: #00aaff;">${scan.fileHash}</code></p>
                <p><strong>Scanned:</strong> ${formatDate(scan.scannedAt)}</p>
                <p><strong>Status:</strong> <span style="color: #00ff88;">${scan.status}</span></p>
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">🚨 Vulnerabilities</h3>
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
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${scan.permissions?.map(perm => `
                    <span style="background: rgba(0,170,255,0.2); color: #00aaff; border: 1px solid #00aaff; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem;">
                        ${perm}
                    </span>
                `).join('') || '<p style="color: #888;">No permissions data</p>'}
            </div>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">📊 Trackers Detected</h3>
            <div style="background: rgba(255,170,0,0.1); border: 1px solid #ffaa00; padding: 1.5rem; border-radius: 10px; text-align: center;">
                <div style="font-size: 3rem; font-weight: 700; color: #ffaa00;">${scan.trackers || 0}</div>
                <div style="color: #888; margin-top: 0.5rem;">Third-party trackers found</div>
            </div>
        </div>

        <div style="margin-bottom: 1rem;">
            <h3 style="color: #fff; margin-bottom: 1rem;">💡 Recommendations</h3>
            <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 10px;">
                ${scan.riskScore >= 7 ? `
                    <p style="color: #ff4444; margin-bottom: 0.5rem;">⚠️ <strong>High Risk App - Not Recommended</strong></p>
                    <p style="color: #888;">This app has significant security concerns. Consider blocking it or monitoring usage closely.</p>
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

    modal.classList.add('show');
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
