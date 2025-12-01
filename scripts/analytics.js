// Analytics & Reports Page Script

let currentTimeRange = '24h';
let charts = {};

async function loadAnalytics() {
    await loadAnalyticsData();
    initializeCharts();

    // Refresh data every 60 seconds
    setInterval(async () => {
        await loadAnalyticsData();
        updateCharts();
    }, 60000);
}

async function loadAnalyticsData() {
    await loadTopThreats();
    await loadAppScanSummary();
    await loadMLTKInsights();
}

function setTimeRange(button, range) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    currentTimeRange = range;
    loadAnalyticsData();
    updateCharts();
}

async function loadTopThreats() {
    try {
        const response = await fetch(`${API_CONFIG.ANALYTICS_API}/threats/top?range=${currentTimeRange}`);

        if (response.ok) {
            const threats = await response.json();
            renderTopThreats(threats);
        } else {
            renderTopThreats([]);
        }
    } catch (error) {
        console.error('Error loading top threats:', error);
        renderTopThreats([]);
    }
}

function renderTopThreats(threats) {
    const tbody = document.getElementById('threatsTableBody');

    if (!threats || threats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data-row">No threats detected</td></tr>';
        return;
    }

    tbody.innerHTML = threats.map(threat => {
        const severityColor = getRiskColor(threat.severity);

        return `
            <tr>
                <td>${threat.type}</td>
                <td>${threat.source}</td>
                <td>${threat.child}</td>
                <td><span style="color: ${severityColor}; font-weight: 600;">${threat.severity.toUpperCase()}</span></td>
                <td>${threat.count}</td>
                <td>${formatDate(threat.lastSeen)}</td>
            </tr>
        `;
    }).join('');
}

async function loadAppScanSummary() {
    try {
        const response = await fetch(`${API_CONFIG.MOBSF_API}/scans/summary?range=${currentTimeRange}`);

        if (response.ok) {
            const summary = await response.json();
            updateAppScanSummary(summary);
        } else {
            // Use MobSF scans to calculate summary
            const scans = await getMobSFScans();
            const summary = calculateSummaryFromScans(scans.scans || []);
            updateAppScanSummary(summary);
        }
    } catch (error) {
        console.error('Error loading app scan summary:', error);
    }
}

function calculateSummaryFromScans(scans) {
    let criticalVulns = 0;
    let trackers = 0;
    let riskyPerms = 0;

    scans.forEach(scan => {
        if (scan.vulnerabilities) {
            criticalVulns += scan.vulnerabilities.critical || 0;
            criticalVulns += scan.vulnerabilities.high || 0;
        }
        trackers += scan.trackers || 0;
        if (scan.permissions) {
            const riskyPermissions = ['CAMERA', 'MICROPHONE', 'LOCATION', 'CONTACTS', 'SMS'];
            riskyPerms += scan.permissions.filter(p => riskyPermissions.includes(p)).length;
        }
    });

    return {
        totalScans: scans.length,
        criticalVulns,
        trackers,
        riskyPerms
    };
}

function updateAppScanSummary(summary) {
    document.getElementById('summaryTotalScans').textContent = summary.totalScans || 0;
    document.getElementById('summaryCriticalVulns').textContent = summary.criticalVulns || 0;
    document.getElementById('summaryTrackers').textContent = summary.trackers || 0;
    document.getElementById('summaryRiskyPerms').textContent = summary.riskyPerms || 0;
}

async function loadMLTKInsights() {
    try {
        const response = await fetch(`${API_CONFIG.ANALYTICS_API}/ml/insights?range=${currentTimeRange}`);

        if (response.ok) {
            const insights = await response.json();
            updateMLTKInsights(insights);
        } else {
            updateMLTKInsights({
                anomalyCount: 0,
                baselineDeviations: 0,
                predictedThreats: 0
            });
        }
    } catch (error) {
        console.error('Error loading MLTK insights:', error);
    }
}

function updateMLTKInsights(insights) {
    document.getElementById('anomalyCount').textContent = `${insights.anomalyCount || 0} anomalies detected`;
    document.getElementById('baselineDeviations').textContent = `${insights.baselineDeviations || 0} deviations from normal`;
    document.getElementById('predictedThreats').textContent = `${insights.predictedThreats || 0} potential threats`;
}

function initializeCharts() {
    // Threat Trends Chart
    const threatCtx = document.getElementById('threatTrendsChart').getContext('2d');
    charts.threatTrends = new Chart(threatCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'High Severity',
                data: [],
                borderColor: '#ff4444',
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                tension: 0.4
            }, {
                label: 'Medium Severity',
                data: [],
                borderColor: '#ffaa00',
                backgroundColor: 'rgba(255, 170, 0, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#888' },
                    grid: { color: '#333' }
                },
                x: {
                    ticks: { color: '#888' },
                    grid: { color: '#333' }
                }
            }
        }
    });

    // App Risk Distribution Chart
    const riskCtx = document.getElementById('appRiskChart').getContext('2d');
    charts.appRisk = new Chart(riskCtx, {
        type: 'doughnut',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#ff4444', '#ffaa00', '#00ff88'],
                borderColor: '#0a0a0a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            }
        }
    });

    // Network Activity Chart
    const networkCtx = document.getElementById('networkActivityChart').getContext('2d');
    charts.networkActivity = new Chart(networkCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Data Usage (MB)',
                data: [],
                backgroundColor: '#00aaff',
                borderColor: '#0088cc',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#888' },
                    grid: { color: '#333' }
                },
                x: {
                    ticks: { color: '#888' },
                    grid: { color: '#333' }
                }
            }
        }
    });

    // Data Usage by Child Chart
    const dataUsageCtx = document.getElementById('dataUsageChart').getContext('2d');
    charts.dataUsage = new Chart(dataUsageCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Data Usage (MB)',
                data: [],
                backgroundColor: '#00ff88',
                borderColor: '#00cc66',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    labels: { color: '#fff' }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: '#888' },
                    grid: { color: '#333' }
                },
                y: {
                    ticks: { color: '#888' },
                    grid: { color: '#333' }
                }
            }
        }
    });

    // Load initial chart data
    updateCharts();
}

async function updateCharts() {
    try {
        // Update Threat Trends
        const threatResponse = await fetch(`${API_CONFIG.ANALYTICS_API}/charts/threats?range=${currentTimeRange}`);
        if (threatResponse.ok) {
            const threatData = await threatResponse.json();
            charts.threatTrends.data.labels = threatData.labels;
            charts.threatTrends.data.datasets[0].data = threatData.high;
            charts.threatTrends.data.datasets[1].data = threatData.medium;
            charts.threatTrends.update();
        }

        // Update App Risk Distribution
        const scans = await getMobSFScans();
        const riskCounts = {
            high: scans.scans?.filter(s => getRiskLevel(s.riskScore) === 'high').length || 0,
            medium: scans.scans?.filter(s => getRiskLevel(s.riskScore) === 'medium').length || 0,
            low: scans.scans?.filter(s => getRiskLevel(s.riskScore) === 'low').length || 0
        };
        charts.appRisk.data.datasets[0].data = [riskCounts.high, riskCounts.medium, riskCounts.low];
        charts.appRisk.update();

        // Update Network Activity (demo data - replace with real API)
        const networkLabels = generateTimeLabels(currentTimeRange);
        const networkData = networkLabels.map(() => Math.floor(Math.random() * 500) + 100);
        charts.networkActivity.data.labels = networkLabels;
        charts.networkActivity.data.datasets[0].data = networkData;
        charts.networkActivity.update();

        // Update Data Usage by Child
        const children = getChildren();
        charts.dataUsage.data.labels = children.map(c => c.name);
        charts.dataUsage.data.datasets[0].data = children.map(() => Math.floor(Math.random() * 1000) + 200);
        charts.dataUsage.update();

    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function generateTimeLabels(range) {
    const labels = [];
    const now = new Date();

    switch(range) {
        case '24h':
            for (let i = 23; i >= 0; i--) {
                labels.push(`${i}h ago`);
            }
            break;
        case '7d':
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            }
            break;
        case '30d':
            for (let i = 29; i >= 0; i -= 3) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            }
            break;
        default:
            labels.push('Week 1', 'Week 2', 'Week 3', 'Week 4');
    }

    return labels;
}

async function exportReport() {
    showNotification('Generating report... This feature will export analytics data to PDF.');
    // TODO: Implement PDF export functionality
}

// Load analytics on page load
document.addEventListener('DOMContentLoaded', loadAnalytics);
