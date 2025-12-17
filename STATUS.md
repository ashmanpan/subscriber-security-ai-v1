# Project Status - Subscriber Security AI

**Last Updated:** December 17, 2025

## Overview

Parental Control Security System with MobSF, Cisco FTD, and Splunk MLTK integration.

---

## Infrastructure Status

### EC2 Instances

| Instance | Name | Type | Status | Purpose |
|----------|------|------|--------|---------|
| i-0d7839127a1e71989 | splunk-enterprise-v2 | t3.large | ✅ Running | Splunk + MLTK |
| i-056085f587cb6cf4e | pc-prod-jumphost | t3.micro | ✅ Running | Bastion host |
| i-0028cd5e3558d206e | ftdv-parental-control | c5.xlarge | ✅ Running | Cisco FTD Firewall |

### Splunk Enterprise

| Component | Details |
|-----------|---------|
| Instance | i-0d7839127a1e71989 (t3.large) |
| Private IP | 10.0.101.28 |
| Public IP (EIP) | 13.205.26.59 |
| Web UI | http://10.0.101.28:8000 (VPC only) |
| HEC Endpoint | http://10.0.101.28:8088 |
| MLTK | ✅ Installed |
| Access | VPC only (secured) |

### AWS Amplify

| App | Status | URL |
|-----|--------|-----|
| subscriber-security-ai | ✅ Deployed | https://d3eyem2qvmij75.amplifyapp.com |

### DynamoDB Tables (23 tables)

| Category | Tables |
|----------|--------|
| Core | pc-prod-traffic-logs, pc-prod-anomalies, pc-prod-mobsf-scans |
| Blocking | pc-prod-blocked-domains, pc-prod-blocked-ips |
| Fraud Detection | pc-prod-betting-logs, pc-prod-digital-arrest-scams, pc-prod-investment-scams, pc-prod-loan-app-scams, pc-prod-upi-fraud, pc-prod-wallet-fraud |

### Lambda Functions

| Function | Status | Purpose |
|----------|--------|---------|
| traffic-log-generator | ✅ Active | Generate test traffic |
| anomaly-detector | ✅ Active | ML anomaly detection |
| auto-blocker | ✅ Active | Automatic blocking |
| domain-blocker | ✅ Active | Domain blocking |
| mobsf-api | ✅ Active | MobSF integration |

### Security Groups

| Security Group | Ports | Access |
|----------------|-------|--------|
| sg-0af70dbcaa331bf40 (Splunk) | 22, 8000, 8088, 8089, 9997 | VPC only (10.0.0.0/16) |
| sg-0b24c0ba9ffc05aff (splunk-enterprise-sg) | 22, 8000, 8088 | VPC only (10.0.0.0/16) |
| sg-0ca16741bf7232886 (ftdv-data-sg) | All | VPC only (10.0.0.0/16) |
| sg-0c97a6f5ffaa3bbcf (pc-prod-jumphost-sg) | 22 | Open (bastion) |

---

## Completed Items

- [x] Web Dashboard (7 pages) deployed on AWS Amplify
- [x] Splunk Enterprise v2 with MLTK installed
- [x] DynamoDB tables created (23 tables)
- [x] Lambda functions deployed (5 functions)
- [x] Cisco FTD firewall running
- [x] Jump host / bastion configured
- [x] Security groups hardened (no 0.0.0.0/0 on sensitive ports)
- [x] Documentation complete (10 markdown files)
- [x] Old Splunk instance terminated (i-094065076a0313703)
- [x] Unused EIP released (13.233.3.248)

---

## Pending Items

### Critical Priority

| Task | Status | Notes |
|------|--------|-------|
| Enable DynamoDB Streams | ❌ Pending | pc-prod-traffic-logs needs StreamEnabled=true |
| Deploy Splunk Forwarder Lambda | ❌ Pending | Forward DynamoDB → Splunk HEC |
| Create Secrets Manager entry | ❌ Pending | pc-prod-splunk-config for HEC token |

### High Priority

| Task | Status | Notes |
|------|--------|-------|
| Create Splunk Dashboards | ❌ Pending | Traffic monitoring, anomaly detection |
| Configure Splunk Alerts | ❌ Pending | High-risk traffic, data exfiltration |
| Update config.js | ❌ Pending | Replace placeholder API endpoints |
| Configure CORS | ❌ Pending | Backend services for Amplify domain |

### Financial Fraud Protection (Design Complete)

| Use Case | Implementation Status |
|----------|----------------------|
| Fake Shopping App Detection | ❌ Lambda not deployed |
| In-App Purchase Fraud | ❌ Lambda not deployed |
| Phishing Detection | ❌ Lambda not deployed |
| Cryptocurrency Scam Prevention | ❌ Lambda not deployed |
| Gift Card Scam Detection | ❌ Lambda not deployed |

---

## Cost Summary

| Resource | Monthly Cost |
|----------|--------------|
| EC2 (3 active instances) | ~$145 |
| DynamoDB | ~$10-20 |
| Lambda | ~$5 |
| Amplify | ~$5 |
| NAT Gateway | ~$35 |
| **Total** | **~$200-210/month** |

---

## Access Information

### Splunk (via SSH tunnel)

```bash
# Create SSH tunnel through bastion
ssh -i keys/pc-prod-jumphost-key.pem -L 8000:10.0.101.28:8000 ubuntu@43.205.208.223

# Access Splunk at: http://localhost:8000
# Username: admin
# Password: ParentalControl@2024
```

### Web Dashboard

- URL: https://d3eyem2qvmij75.amplifyapp.com
- Login: Demo mode (any credentials)

### GitHub Repository

- URL: https://github.com/ashmanpan/subscriber-security-ai-v1

---

## Recent Changes

| Date | Change |
|------|--------|
| 2025-12-17 | Terminated old Splunk instance, released EIP |
| 2025-12-17 | Hardened security groups (VPC-only access) |
| 2025-12-17 | Added CLAUDE.md with security best practices |
| 2025-12-11 | Deployed Splunk Enterprise v2 with MLTK |
| 2025-12-02 | Initial Amplify deployment |
