# Splunk Enterprise Deployment on AWS EC2

## ✅ Deployment Status: ACTIVE

Splunk Enterprise v9.1.2 with Machine Learning Toolkit (MLTK) is deployed and running.

## 📊 Splunk Instance Details

| Component | Details |
|-----------|---------|
| **Instance ID** | i-0d7839127a1e71989 |
| **Instance Type** | t3.large (2 vCPU, 8 GB RAM) |
| **Public IP (EIP)** | 13.205.26.59 |
| **Private IP** | 10.0.101.28 |
| **Region** | ap-south-1 (Mumbai) |
| **Subnet** | pc-prod-public-subnet-1 (10.0.101.0/24) |
| **Storage** | 50 GB gp3 SSD |
| **Security Group** | sg-0af70dbcaa331bf40 |
| **SSH Key** | pc-prod-jumphost-key |
| **AMI** | Ubuntu 22.04 LTS |

## 🌐 Access URLs

### Splunk Web UI
- **URL**: http://13.205.26.59:8000
- **Username**: admin
- **Password**: ParentalControl@2024
- **Status**: ✅ ACTIVE

### HTTP Event Collector (HEC)
- **Endpoint**: http://13.205.26.59:8088/services/collector
- **Token**: parental-control-hec-token-2024
- **Index**: firewall
- **Status**: ✅ ACTIVE

### Internal Access (from VPC)
- **Web UI**: http://10.0.101.28:8000
- **HEC**: http://10.0.101.28:8088/services/collector
- **REST API**: https://10.0.101.28:8089

## 🔐 SSH Access

```bash
# SSH to Splunk instance
ssh -i /home/kpanse/wsl-myprojects/subscriber-security-ai-v1/keys/pc-prod-jumphost-key.pem ubuntu@13.205.26.59

# Check Splunk status
sudo /opt/splunk/bin/splunk status

# View logs
tail -f /opt/splunk/var/log/splunk/splunkd.log
```

**SSH Key Location**: `/home/kpanse/wsl-myprojects/subscriber-security-ai-v1/keys/pc-prod-jumphost-key.pem`

## 🔒 Security Group Rules (sg-0af70dbcaa331bf40)

| Port | Protocol | Purpose | Source |
|------|----------|---------|--------|
| 22 | TCP | SSH Access | 10.0.0.0/16 (VPC only) |
| 8000 | TCP | Splunk Web UI | 10.0.0.0/16 (VPC only) |
| 8088 | TCP | HTTP Event Collector (HEC) | 10.0.0.0/16 (VPC only) |
| 8089 | TCP | REST API | 10.0.0.0/16 (VPC only) |
| 9997 | TCP | Splunk Forwarder | 10.0.0.0/16 (VPC only) |

### Applying Security Group Rules

```bash
# Remove insecure 0.0.0.0/0 rules
aws ec2 revoke-security-group-ingress \
  --group-id sg-0af70dbcaa331bf40 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region ap-south-1

aws ec2 revoke-security-group-ingress \
  --group-id sg-0af70dbcaa331bf40 \
  --protocol tcp --port 8000 --cidr 0.0.0.0/0 \
  --region ap-south-1

aws ec2 revoke-security-group-ingress \
  --group-id sg-0af70dbcaa331bf40 \
  --protocol tcp --port 8088 --cidr 0.0.0.0/0 \
  --region ap-south-1

# Add VPC-only rules
aws ec2 authorize-security-group-ingress \
  --group-id sg-0af70dbcaa331bf40 \
  --protocol tcp --port 22 --cidr 10.0.0.0/16 \
  --region ap-south-1

aws ec2 authorize-security-group-ingress \
  --group-id sg-0af70dbcaa331bf40 \
  --protocol tcp --port 8000 --cidr 10.0.0.0/16 \
  --region ap-south-1

aws ec2 authorize-security-group-ingress \
  --group-id sg-0af70dbcaa331bf40 \
  --protocol tcp --port 8088 --cidr 10.0.0.0/16 \
  --region ap-south-1
```

### Access via Jump Host / Bastion

Since Splunk is now VPC-only, access via SSH tunnel through a bastion host:

```bash
# SSH tunnel for Splunk Web UI (port 8000)
ssh -i keys/pc-prod-jumphost-key.pem -L 8000:10.0.101.28:8000 ubuntu@<BASTION_IP>

# Then access Splunk at: http://localhost:8000
```

## 📦 Installed Components

| Component | Version | Status |
|-----------|---------|--------|
| Splunk Enterprise | 9.1.2 | ✅ Installed |
| Machine Learning Toolkit (MLTK) | Latest | ✅ Installed via Splunkbase |
| Python ML Libraries | numpy, scipy, scikit-learn, pandas | ✅ Installed |

## 📋 Indexes

| Index | Purpose |
|-------|---------|
| firewall | Firewall/security logs |
| security_events | Security alerts |
| ml_models | ML model storage |
| main | Default index |

## 🔗 HEC Test Commands

```bash
# Test HEC Health
curl http://13.205.26.59:8088/services/collector/health
# Expected: {"text":"HEC is healthy","code":17}

# Send Test Event
curl "http://13.205.26.59:8088/services/collector/event" \
  -H "Authorization: Splunk parental-control-hec-token-2024" \
  -d '{"event": "Test event", "sourcetype": "_json", "index": "firewall"}'
# Expected: {"text":"Success","code":0}
```

## 📊 Splunk Queries for Parental Control

```spl
# All firewall logs
index=firewall

# Blocked traffic
index=firewall action=BLOCKED

# High-risk traffic
index=firewall risk=high

# Traffic by child
index=firewall phoneNumber="+1-555-123-4567"

# Real-time traffic chart
index=firewall | timechart count by action

# Top 10 accessed domains
index=firewall | stats count by destDomain | sort -count | head 10

# ML Anomaly Detection (requires MLTK)
index=firewall | fit DensityFunction bytesReceived | where isOutlier(bytesReceived)=1
```

## 💰 Cost Estimate

| Resource | Cost (ap-south-1) |
|----------|-------------------|
| EC2 t3.large | ~$0.0832/hour (~$60/month) |
| 50 GB gp3 Storage | ~$4.00/month |
| Elastic IP | ~$3.65/month |
| Data Transfer | ~$0.09/GB |
| **Total** | **~$70-80/month** |

## 🔧 Troubleshooting

### Splunk not accessible

```bash
# SSH and check status
ssh -i /home/kpanse/wsl-myprojects/subscriber-security-ai-v1/keys/pc-prod-jumphost-key.pem ubuntu@13.205.26.59

# Check Splunk status
sudo /opt/splunk/bin/splunk status

# Restart if needed
sudo /opt/splunk/bin/splunk restart
```

### HEC not receiving data

```bash
# Test HEC health
curl http://13.205.26.59:8088/services/collector/health

# Check HEC configuration via REST API
curl -k -u admin:ParentalControl@2024 \
  "https://13.205.26.59:8089/services/data/inputs/http"
```

## 📞 Support

- Splunk Documentation: https://docs.splunk.com/
- Splunk Community: https://community.splunk.com/
- AWS EC2 Console: https://ap-south-1.console.aws.amazon.com/ec2/

---

**Last Updated**: December 17, 2025
**Status**: ✅ ACTIVE - Splunk with MLTK is fully operational
