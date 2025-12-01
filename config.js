// Configuration for Subscriber Security AI
const CONFIG = {
    ENV: 'production',

    API_ENDPOINTS: {
        // Real API endpoints - Lambda function for MobSF data
        MOBSF_INTEGRATION: 'https://6yvql2vvt0.execute-api.ap-south-1.amazonaws.com/prod',
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
