// Configuration for Subscriber Security AI
const CONFIG = {
    ENV: 'production',

    API_ENDPOINTS: {
        // TODO: Update these with actual Load Balancer DNS when services are deployed
        MOBSF_INTEGRATION: 'http://YOUR-ALB-DNS:6000/api/v1',
        P_GATEWAY: 'http://YOUR-ALB-DNS:8080/api',
        FTD_INTEGRATION: 'http://YOUR-ALB-DNS:5000/api',
        ANALYTICS: 'http://YOUR-ALB-DNS:7000/api',
    },

    AWS: {
        REGION: 'ap-south-1',
        S3_BUCKET: 'pc-prod-mobile-apps',
        DYNAMODB_TABLE: 'pc-prod-mobsf-scans',
    },

    FEATURES: {
        REAL_TIME_MONITORING: true,
        ML_ANOMALY_DETECTION: true,
        AUTO_SCANNING: true,
        ALERTS_ENABLED: true,
    },

    REFRESH_INTERVALS: {
        DASHBOARD: 30000,
        MONITORING: 10000,
        ANALYTICS: 60000,
        SCANS: 30000,
    }
};
