// Configuration for Subscriber Security AI
// Update these endpoints based on your deployment

const CONFIG = {
    // Environment: 'development' or 'production'
    ENV: 'production',

    // API Endpoints - Update these with your actual ECS service endpoints
    API_ENDPOINTS: {
        // MobSF Integration Service (ECS Service)
        MOBSF_INTEGRATION: 'http://pc-prod-mobsf-integration.internal:6000/api/v1',

        // P-Gateway (Main API Gateway)
        P_GATEWAY: 'http://pc-prod-p-gateway.internal:8080/api',

        // FTD Integration Service
        FTD_INTEGRATION: 'http://pc-prod-ftd-integration.internal:5000/api',

        // Analytics Dashboard Service
        ANALYTICS: 'http://pc-prod-analytics-dashboard.internal:7000/api',

        // For local development, use localhost
        // MOBSF_INTEGRATION: 'http://localhost:6000/api/v1',
        // P_GATEWAY: 'http://localhost:8080/api',
        // FTD_INTEGRATION: 'http://localhost:5000/api',
        // ANALYTICS: 'http://localhost:7000/api',
    },

    // AWS Resources
    AWS: {
        REGION: 'ap-south-1',
        S3_BUCKET: 'pc-prod-mobile-apps',
        DYNAMODB_TABLE: 'pc-prod-mobsf-scans',
    },

    // Feature Flags
    FEATURES: {
        REAL_TIME_MONITORING: true,
        ML_ANOMALY_DETECTION: true,
        AUTO_SCANNING: true,
        ALERTS_ENABLED: true,
    },

    // Refresh Intervals (milliseconds)
    REFRESH_INTERVALS: {
        DASHBOARD: 30000,  // 30 seconds
        MONITORING: 10000,  // 10 seconds
        ANALYTICS: 60000,   // 1 minute
        SCANS: 30000,       // 30 seconds
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
