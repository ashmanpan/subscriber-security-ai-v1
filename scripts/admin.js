// Admin Console Script

let statusCheckInterval;
let logsInterval;

async function loadAdminConsole() {
    await checkAllServiceStatus();
    await loadDatabaseStats();
    await refreshSystemLogs();

    // Auto-refresh status every 15 seconds
    statusCheckInterval = setInterval(checkAllServiceStatus, 15000);
    logsInterval = setInterval(refreshSystemLogs, 30000);
}

async function checkAllServiceStatus() {
    await checkPGatewayStatus();
    await checkMobSFStatus();
    await checkFTDStatus();
    await checkAnalyticsStatus();
}

async function checkPGatewayStatus() {
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINTS.P_GATEWAY}/health`);
        updateServiceStatus('pgw', response.ok);

        if (response.ok) {
            const data = await response.json();
            document.getElementById('pgwStatusText').textContent = data.status || 'Running';
        }
    } catch (error) {
        updateServiceStatus('pgw', false);
        console.error('P-Gateway health check failed:', error);
    }
}

async function checkMobSFStatus() {
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINTS.MOBSF_INTEGRATION}/health`);
        updateServiceStatus('mobsf', response.ok);

        if (response.ok) {
            const data = await response.json();
            document.getElementById('mobsfStatusText').textContent = data.status || 'Running';
        }
    } catch (error) {
        updateServiceStatus('mobsf', false);
        console.error('MobSF health check failed:', error);
    }
}

async function checkFTDStatus() {
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINTS.FTD_INTEGRATION}/health`);
        updateServiceStatus('ftd', response.ok);

        if (response.ok) {
            const data = await response.json();
            document.getElementById('ftdStatusText').textContent = data.status || 'Running';
        }
    } catch (error) {
        updateServiceStatus('ftd', false);
        console.error('FTD health check failed:', error);
    }
}

async function checkAnalyticsStatus() {
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINTS.ANALYTICS}/health`);
        updateServiceStatus('analytics', response.ok);

        if (response.ok) {
            const data = await response.json();
            document.getElementById('analyticsStatusText').textContent = data.status || 'Running';
        }
    } catch (error) {
        updateServiceStatus('analytics', false);
        console.error('Analytics health check failed:', error);
    }
}

function updateServiceStatus(service, isActive) {
    const dot = document.getElementById(`${service}Dot`);
    const text = document.getElementById(`${service}StatusText`);
    const card = document.getElementById(`${service}Status`);

    if (isActive) {
        dot.classList.add('active');
        dot.style.background = '#00ff88';
        text.textContent = 'Running';
        text.style.color = '#00ff88';
        card.classList.add('active');
        card.classList.remove('inactive');
    } else {
        dot.classList.remove('active');
        dot.style.background = '#ff4444';
        text.textContent = 'Offline';
        text.style.color = '#ff4444';
        card.classList.remove('active');
        card.classList.add('inactive');
    }
}

async function startPGatewaySimulator() {
    try {
        showNotification('Starting P-Gateway Simulator...');

        const response = await fetch(`${CONFIG.API_ENDPOINTS.P_GATEWAY}/simulator/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscriberCount: parseInt(document.getElementById('subscriberCount').value),
                trafficRate: parseInt(document.getElementById('trafficRate').value),
                apkDownloadChance: parseInt(document.getElementById('apkDownloadChance').value),
                ipaDownloadChance: parseInt(document.getElementById('ipaDownloadChance').value),
                maliciousTrafficChance: parseInt(document.getElementById('maliciousTrafficChance').value)
            })
        });

        if (response.ok) {
            const data = await response.json();
            showNotification('P-Gateway Simulator started successfully!');
            await checkPGatewayStatus();
            addLog('SUCCESS', `P-Gateway Simulator started with ${document.getElementById('subscriberCount').value} subscribers`);
        } else {
            throw new Error('Failed to start simulator');
        }
    } catch (error) {
        console.error('Error starting P-Gateway Simulator:', error);
        showNotification('Failed to start P-Gateway Simulator', 'error');
        addLog('ERROR', `Failed to start P-Gateway Simulator: ${error.message}`);
    }
}

async function stopPGatewaySimulator() {
    try {
        showNotification('Stopping P-Gateway Simulator...');

        const response = await fetch(`${CONFIG.API_ENDPOINTS.P_GATEWAY}/simulator/stop`, {
            method: 'POST'
        });

        if (response.ok) {
            showNotification('P-Gateway Simulator stopped');
            await checkPGatewayStatus();
            addLog('INFO', 'P-Gateway Simulator stopped');
        } else {
            throw new Error('Failed to stop simulator');
        }
    } catch (error) {
        console.error('Error stopping P-Gateway Simulator:', error);
        showNotification('Failed to stop P-Gateway Simulator', 'error');
        addLog('ERROR', `Failed to stop P-Gateway Simulator: ${error.message}`);
    }
}

function updateSimulatorConfig(event) {
    event.preventDefault();
    showNotification('Simulator configuration saved. Restart simulator to apply changes.');
    addLog('INFO', 'Simulator configuration updated');
}

function resetSimulatorConfig() {
    document.getElementById('subscriberCount').value = '100';
    document.getElementById('trafficRate').value = '10';
    document.getElementById('apkDownloadChance').value = '5';
    document.getElementById('ipaDownloadChance').value = '5';
    document.getElementById('maliciousTrafficChance').value = '2';
    showNotification('Configuration reset to defaults');
}

async function triggerManualScan(event) {
    event.preventDefault();

    const fileUrl = document.getElementById('scanFileUrl').value;
    const fileName = document.getElementById('scanFileName').value;
    const phoneNumber = document.getElementById('scanPhoneNumber').value;

    try {
        showNotification('Triggering manual scan...');

        const response = await fetch(`${CONFIG.API_ENDPOINTS.MOBSF_INTEGRATION}/scan/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileUrl,
                fileName,
                phoneNumber: phoneNumber || 'manual-scan'
            })
        });

        if (response.ok) {
            const data = await response.json();
            showNotification(`Scan triggered successfully! Scan ID: ${data.scanId}`);
            addLog('SUCCESS', `Manual scan triggered for ${fileName}`);
            document.getElementById('manualScanForm').reset();
        } else {
            throw new Error('Failed to trigger scan');
        }
    } catch (error) {
        console.error('Error triggering manual scan:', error);
        showNotification('Failed to trigger scan', 'error');
        addLog('ERROR', `Failed to trigger manual scan: ${error.message}`);
    }
}

async function refreshSystemLogs() {
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINTS.ANALYTICS}/logs/recent?limit=50`);

        if (response.ok) {
            const logs = await response.json();
            renderSystemLogs(logs);
        }
    } catch (error) {
        console.error('Error fetching system logs:', error);
    }
}

function renderSystemLogs(logs) {
    const logsContainer = document.getElementById('systemLogs');

    if (!logs || logs.length === 0) {
        logsContainer.innerHTML = '<div style="color: #888;">No recent logs</div>';
        return;
    }

    logsContainer.innerHTML = logs.map(log => {
        const color = getLogColor(log.level);
        return `<div style="color: ${color}; margin-bottom: 0.5rem;">
            [${formatDate(log.timestamp)}] [${log.level}] ${log.message}
        </div>`;
    }).join('');

    // Auto-scroll to bottom
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function addLog(level, message) {
    const logsContainer = document.getElementById('systemLogs');
    const color = getLogColor(level);
    const timestamp = new Date().toISOString();

    const logEntry = document.createElement('div');
    logEntry.style.color = color;
    logEntry.style.marginBottom = '0.5rem';
    logEntry.textContent = `[${formatDate(timestamp)}] [${level}] ${message}`;

    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function getLogColor(level) {
    switch(level) {
        case 'ERROR': return '#ff4444';
        case 'WARN': return '#ffaa00';
        case 'SUCCESS': return '#00ff88';
        case 'INFO': return '#00aaff';
        default: return '#888';
    }
}

async function loadDatabaseStats() {
    try {
        // Get MobSF scan stats
        const scans = await getMobSFScans();
        document.getElementById('dbTotalScans').textContent = scans.total || scans.scans?.length || 0;

        // Get subscriber stats from localStorage
        const children = getChildren();
        document.getElementById('dbActiveSubscribers').textContent = children.length;

        // Get alerts (would come from Splunk/Analytics API)
        const alerts = await getSecurityAlerts();
        document.getElementById('dbTotalAlerts').textContent = alerts.length;

        // Storage stats (demo - would come from AWS API)
        document.getElementById('dbStorageUsed').textContent = Math.floor(Math.random() * 1000) + 100 + ' MB';

    } catch (error) {
        console.error('Error loading database stats:', error);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (statusCheckInterval) clearInterval(statusCheckInterval);
    if (logsInterval) clearInterval(logsInterval);
});

// Load admin console on page load
document.addEventListener('DOMContentLoaded', loadAdminConsole);
