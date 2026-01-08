#!/bin/bash
# =============================================================================
# Initialize Databases and Collections
# =============================================================================

set -e

echo "============================================="
echo "  Database Initialization"
echo "============================================="
echo ""

# MongoDB Collections
echo "Creating MongoDB collections..."
docker exec subsec-mongodb1 mongosh subsec --eval '
// Traffic and Security
db.createCollection("traffic_logs");
db.createCollection("anomalies");
db.createCollection("blocked_domains");
db.createCollection("blocked_ips");
db.createCollection("firewall_rules");

// MobSF Scans
db.createCollection("mobsf_scans");
db.createCollection("app_permissions");
db.createCollection("app_trackers");

// Fraud Detection
db.createCollection("fraud_detections");
db.createCollection("betting_logs");
db.createCollection("digital_arrest_scams");
db.createCollection("investment_scams");
db.createCollection("loan_app_scams");
db.createCollection("upi_fraud");
db.createCollection("wallet_fraud");
db.createCollection("phishing_detections");
db.createCollection("crypto_scams");
db.createCollection("giftcard_scams");

// User Management
db.createCollection("subscribers");
db.createCollection("children");
db.createCollection("parent_settings");

// Create indexes
db.traffic_logs.createIndex({ "timestamp": -1 });
db.traffic_logs.createIndex({ "phoneNumber": 1 });
db.traffic_logs.createIndex({ "destDomain": 1 });
db.traffic_logs.createIndex({ "risk": 1 });

db.anomalies.createIndex({ "timestamp": -1 });
db.anomalies.createIndex({ "phoneNumber": 1 });
db.anomalies.createIndex({ "severity": 1 });

db.blocked_domains.createIndex({ "domain": 1 }, { unique: true });
db.blocked_ips.createIndex({ "ip": 1 }, { unique: true });

db.mobsf_scans.createIndex({ "scanId": 1 }, { unique: true });
db.mobsf_scans.createIndex({ "packageName": 1 });
db.mobsf_scans.createIndex({ "riskScore": -1 });

db.fraud_detections.createIndex({ "timestamp": -1 });
db.fraud_detections.createIndex({ "phoneNumber": 1 });
db.fraud_detections.createIndex({ "fraudType": 1 });

db.firewall_rules.createIndex({ "ruleName": 1 }, { unique: true });
db.firewall_rules.createIndex({ "phoneNumber": 1 });

print("Collections and indexes created successfully!");
'

echo ""
echo "Creating MinIO buckets..."
docker exec subsec-minio mc alias set local http://localhost:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin}
docker exec subsec-minio mc mb local/mobile-apps --ignore-existing
docker exec subsec-minio mc mb local/scan-reports --ignore-existing
docker exec subsec-minio mc mb local/backups --ignore-existing

echo ""
echo "============================================="
echo "  Database Initialization Complete!"
echo "============================================="
