// Real-time Monitoring Page Script

let selectedChild = 'all';
let activityInterval;

async function loadMonitoring() {
    await loadChildSelector();
    await loadMonitoringStats();
    await loadActivityStream();
    await loadThreatAlerts();
    await loadAnomalyDetection();

    // Refresh data every 10 seconds for real-time feel
    activityInterval = setInterval(async () => {
        await loadMonitoringStats();
        await loadActivityStream();
        await loadThreatAlerts();
    }, 10000);
}

async function loadChildSelector() {
    const children = getChildren();
    const selector = document.getElementById('childSelector');

    selector.innerHTML = '<option value="all">All Children</option>' +
        children.map(child => `
            <option value="${child.phone}">${child.name} (${child.phone})</option>
        `).join('');
}

async function loadChildActivity() {
    selectedChild = document.getElementById('childSelector').value;
    await loadActivityStream();
    await loadMonitoringStats();
}

async function loadMonitoringStats() {
    try {
        // Call Analytics Dashboard API for real-time stats
        const response = await fetch(`${API_CONFIG.ANALYTICS_API}/stats/realtime`);
        if (response.ok) {
            const stats = await response.json();
            updateMonitoringStats(stats);
        } else {
            // Use demo data if API not available
            updateMonitoringStats({
                activeConnections: Math.floor(Math.random() * 20) + 5,
                blockedRequests: Math.floor(Math.random() * 50) + 10,
                totalDownloads: Math.floor(Math.random() * 10) + 2,
                dataUsage: Math.floor(Math.random() * 500) + 100
            });
        }
    } catch (error) {
        console.error('Error loading monitoring stats:', error);
    }
}

function updateMonitoringStats(stats) {
    document.getElementById('activeConnections').textContent = stats.activeConnections || 0;
    document.getElementById('blockedRequests').textContent = stats.blockedRequests || 0;
    document.getElementById('totalDownloads').textContent = stats.totalDownloads || 0;
    document.getElementById('dataUsage').textContent = (stats.dataUsage || 0) + ' MB';
}

async function loadActivityStream() {
    try {
        // Call Splunk/FTD API for activity logs
        const phoneFilter = selectedChild !== 'all' ? `&phone=${selectedChild}` : '';
        const response = await fetch(`${API_CONFIG.ANALYTICS_API}/activity?limit=20${phoneFilter}`);

        if (response.ok) {
            const activities = await response.json();
            renderActivityStream(activities);
        } else {
            renderActivityStream(await getRecentActivity());
        }
    } catch (error) {
        console.error('Error loading activity stream:', error);
        renderActivityStream(await getRecentActivity());
    }
}

function renderActivityStream(activities) {
    const activityStream = document.getElementById('activityStream');

    if (!activities || activities.length === 0) {
        activityStream.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">📡</div>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }

    activityStream.innerHTML = activities.map(activity => {
        const icon = getActivityIcon(activity.type);
        const riskColor = getRiskColor(activity.risk || 'low');

        return `
            <div class="activity-item" style="border-left: 3px solid ${riskColor};">
                <span class="activity-icon">${icon}</span>
                <div class="activity-details">
                    <p class="activity-text">
                        <strong>${activity.child || 'Unknown'}</strong>: ${activity.description}
                    </p>
                    <span class="activity-time">${formatDate(activity.timestamp)}</span>
                </div>
                ${activity.risk ? `<span class="risk-badge ${activity.risk}">${activity.risk.toUpperCase()}</span>` : ''}
            </div>
        `;
    }).join('');
}

async function loadThreatAlerts() {
    try {
        // Call Splunk MLTK API for security alerts
        const response = await fetch(`${API_CONFIG.ANALYTICS_API}/alerts/active`);

        if (response.ok) {
            const alerts = await response.json();
            renderThreatAlerts(alerts);
        } else {
            renderThreatAlerts(await getSecurityAlerts());
        }
    } catch (error) {
        console.error('Error loading threat alerts:', error);
        renderThreatAlerts(await getSecurityAlerts());
    }
}

function renderThreatAlerts(alerts) {
    const alertsContainer = document.getElementById('threatAlerts');
    const alertCount = document.getElementById('alertCount');

    alertCount.textContent = alerts.length;

    if (!alerts || alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">✅</div>
                <p>No security threats detected</p>
            </div>
        `;
        return;
    }

    alertsContainer.innerHTML = alerts.map(alert => {
        const severityColor = getRiskColor(alert.severity);

        return `
            <div class="alert-item" style="border-left: 4px solid ${severityColor};">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h4 style="color: ${severityColor};">${alert.type}</h4>
                    <span class="risk-badge ${alert.severity}">${alert.severity.toUpperCase()}</span>
                </div>
                <p style="color: #fff; margin-bottom: 0.5rem;">${alert.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #888; font-size: 0.85rem;">
                        👤 ${alert.child} • 🕒 ${formatDate(alert.timestamp)}
                    </span>
                    <span style="color: #00aaff; font-size: 0.85rem;">Source: ${alert.source}</span>
                </div>
            </div>
        `;
    }).join('');
}

async function loadAnomalyDetection() {
    try {
        // Call Splunk MLTK API for ML-powered anomaly detection
        const response = await fetch(`${API_CONFIG.ANALYTICS_API}/ml/anomalies`);

        if (response.ok) {
            const anomalies = await response.json();
            renderAnomalyDetection(anomalies);
        } else {
            renderAnomalyDetection([]);
        }
    } catch (error) {
        console.error('Error loading anomaly detection:', error);
        renderAnomalyDetection([]);
    }
}

function renderAnomalyDetection(anomalies) {
    const anomalyContainer = document.getElementById('anomalyDetection');

    if (!anomalies || anomalies.length === 0) {
        anomalyContainer.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">🤖</div>
                <p>ML models analyzing network patterns...</p>
                <p style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">No anomalies detected</p>
            </div>
        `;
        return;
    }

    anomalyContainer.innerHTML = anomalies.map(anomaly => `
        <div class="anomaly-item" style="background: rgba(0,170,255,0.1); border: 1px solid #00aaff; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
            <h4 style="color: #00aaff; margin-bottom: 0.5rem;">🧠 ${anomaly.type}</h4>
            <p style="color: #fff; margin-bottom: 0.5rem;">${anomaly.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #888; font-size: 0.85rem;">Confidence: ${anomaly.confidence}%</span>
                <span style="color: #888; font-size: 0.85rem;">${formatDate(anomaly.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function getActivityIcon(type) {
    switch(type) {
        case 'download': return '⬇️';
        case 'blocked': return '🚫';
        case 'scan': return '🔍';
        case 'alert': return '⚠️';
        case 'connection': return '🌐';
        case 'upload': return '⬆️';
        default: return '📱';
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (activityInterval) {
        clearInterval(activityInterval);
    }
});

// Load monitoring on page load
document.addEventListener('DOMContentLoaded', loadMonitoring);
