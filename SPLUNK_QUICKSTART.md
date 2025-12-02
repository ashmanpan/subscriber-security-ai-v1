# Splunk Quick Start Guide - Parental Control System

## 🎯 Current Status

**Splunk Instance:** Installing (takes 5-10 minutes)
- **Instance ID:** i-0294a69a8cb12c442
- **Public IP:** 13.126.19.248
- **Instance Type:** t3.medium (2 vCPU, 4 GB RAM)

## ⚡ Quick Access

### Splunk Web UI
```
URL:      http://13.126.19.248:8000
Username: admin
Password: ParentalControl@2024
```

### HTTP Event Collector (HEC)
```
Endpoint: http://13.126.19.248:8088/services/collector
Index:    firewall
Token:    Auto-generated (get from instance)
```

## 📋 Step-by-Step Setup

### Step 1: Wait for Splunk to Finish Installing

```bash
# Check if Splunk is ready (run every minute until you get HTTP 200)
curl -I http://13.126.19.248:8000

# Expected output when ready:
# HTTP/1.1 200 OK
```

### Step 2: Get the HEC Token

```bash
# SSH into the instance
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248

# Get the HEC token
cat /home/ec2-user/splunk-config.txt

# Or get it directly
cat /opt/splunk/hec-token.txt
```

###Step 3: Install Machine Learning Toolkit (MLTK)

```bash
# Copy installation script to instance
scp -i ~/.ssh/k8s-script-mumbai.pem /tmp/install-splunk-mltk.sh ec2-user@13.126.19.248:/tmp/

# SSH and run it
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248
sudo bash /tmp/install-splunk-mltk.sh
```

**OR** install via Splunk Web UI:
1. Login to http://13.126.19.248:8000
2. Go to Apps → Find More Apps
3. Search "Machine Learning Toolkit"
4. Click Install (requires free Splunk.com account)

### Step 4: Store HEC Token in AWS Secrets Manager

```bash
# Replace YOUR_HEC_TOKEN with actual token from Step 2
export SPLUNK_HEC_TOKEN="your-actual-token-here"

aws secretsmanager create-secret \
  --name pc-prod-splunk-config \
  --description "Splunk HEC configuration" \
  --secret-string "{\"hec_url\":\"http://13.126.19.248:8088/services/collector\",\"hec_token\":\"$SPLUNK_HEC_TOKEN\",\"index\":\"firewall\"}" \
  --region ap-south-1
```

### Step 5: Deploy Lambda Forwarder

```bash
cd /tmp/lambda-splunk-forwarder

# Install dependencies
npm install

# Package Lambda function
python3 -c "
import zipfile, os
with zipfile.ZipFile('function.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipf.write('index.js', 'index.js')
    zipf.write('package.json', 'package.json')
    for root, dirs, files in os.walk('node_modules'):
        for file in files:
            file_path = os.path.join(root, file)
            zipf.write(file_path, file_path)
"

# Create Lambda function
aws lambda create-function \
  --function-name splunk-forwarder \
  --runtime nodejs18.x \
  --role arn:aws:iam::567097740753:role/splunk-forwarder-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --region ap-south-1
```

### Step 6: Enable DynamoDB Streams

```bash
# Enable streams on traffic logs table
aws dynamodb update-table \
  --table-name pc-prod-traffic-logs \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region ap-south-1

# Get stream ARN
STREAM_ARN=$(aws dynamodb describe-table \
  --table-name pc-prod-traffic-logs \
  --region ap-south-1 \
  --query 'Table.LatestStreamArn' \
  --output text)

# Connect Lambda to DynamoDB Stream
aws lambda create-event-source-mapping \
  --function-name splunk-forwarder \
  --event-source-arn $STREAM_ARN \
  --starting-position LATEST \
  --batch-size 100 \
  --region ap-south-1
```

### Step 7: Test the Integration

```bash
# Generate test traffic
aws lambda invoke \
  --function-name traffic-log-generator \
  --cli-binary-format raw-in-base64-out \
  --payload '{"count": 20}' \
  --region ap-south-1 \
  /tmp/test.json

# Wait 30 seconds, then check Splunk
# In Splunk Web UI, run: index=firewall | head 20
```

## 🔍 Splunk Queries Cheat Sheet

### Basic Queries

```spl
# All firewall logs
index=firewall

# Last 100 logs
index=firewall | head 100

# Blocked traffic only
index=firewall action=BLOCKED

# High-risk traffic
index=firewall risk=high

# Traffic from specific child
index=firewall phoneNumber="+1-555-123-4567"

# Suspicious domains
index=firewall destDomain IN ("*.tk", "*.ml", "*.ga", "*.xyz")
```

### ML Queries (After MLTK Installation)

```spl
# Anomaly detection
index=firewall | anomalydetection bytesSent | where isOutlier=1

# Traffic clustering
index=firewall | cluster destDomain bytesSent

# Predict future traffic
index=firewall | timechart span=1h sum(bytesSent) as traffic | predict traffic future_timespan=24

# Outlier detection
index=firewall | outlier bytesSent bytesReceived
```

### Analytics Queries

```spl
# Top 10 accessed domains
index=firewall | stats count by destDomain | sort -count | head 10

# Traffic volume over time
index=firewall | timechart span=5m sum(bytesSent) as total_bytes

# Risk distribution
index=firewall | stats count by risk | sort -count

# Blocked vs Allowed
index=firewall | stats count by action

# Children activity heatmap
index=firewall | bucket _time span=1h | stats count by _time phoneNumber
```

## 🎨 Creating Your First Dashboard

1. Login to Splunk Web: http://13.126.19.248:8000
2. Go to **Dashboards** → **Create New Dashboard**
3. Name: "Parental Control Monitoring"
4. Add panels:

**Panel 1: Traffic Volume**
- Visualization: Line Chart
- Query: `index=firewall | timechart span=5m count`

**Panel 2: Blocked vs Allowed**
- Visualization: Pie Chart
- Query: `index=firewall | stats count by action`

**Panel 3: Top Domains**
- Visualization: Table
- Query: `index=firewall | stats count by destDomain | sort -count | head 20`

**Panel 4: Risk Distribution**
- Visualization: Bar Chart
- Query: `index=firewall | stats count by risk`

5. Set auto-refresh: 30 seconds

## 🚨 Setting Up Alerts

### Alert 1: High-Risk Traffic

1. Search: `index=firewall risk=high`
2. Save As → Alert
3. Alert Type: Real-time
4. Trigger: Number of Results > 5
5. Throttle: 5 minutes
6. Actions: Email notification

### Alert 2: Data Exfiltration

1. Search: `index=firewall bytesSent>10485760 | eval suspicious=if(match(destDomain, "\\.(tk|ml|ga|xyz)$"), 1, 0) | where suspicious=1`
2. Save As → Alert
3. Alert Type: Scheduled (every 5 minutes)
4. Trigger: Number of Results > 0
5. Actions: Email + Webhook

### Alert 3: Blocked Traffic Spike

1. Search: `index=firewall action=BLOCKED | stats count by phoneNumber | where count > 10`
2. Save As → Alert
3. Alert Type: Scheduled (every 10 minutes)
4. Trigger: Number of Results > 0
5. Actions: Email notification

## 📊 ML-Based Detections (Auto-Configured)

The installation script pre-configures these ML searches:

1. **Traffic Anomaly Detection** - Runs every 5 min
2. **Data Exfiltration Detection** - Runs every 5 min
3. **Rapid Upload Detection** - Runs every 5 min
4. **Blocked Traffic Analysis** - Runs every 10 min

View them: Search & Reporting → Searches & Reports

## 🔧 Troubleshooting

### Splunk not accessible
```bash
# SSH and check status
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248
sudo /opt/splunk/bin/splunk status

# Check logs
tail -100 /opt/splunk/var/log/splunk/splunkd.log

# Restart if needed
sudo /opt/splunk/bin/splunk restart
```

### No data in Splunk
```bash
# Test HEC endpoint
curl http://13.126.19.248:8088/services/collector/health

# Check Lambda forwarder logs
aws logs tail /aws/lambda/splunk-forwarder --follow --region ap-south-1

# Manually send test event
curl -X POST http://13.126.19.248:8088/services/collector \
  -H "Authorization: Splunk YOUR_HEC_TOKEN" \
  -d '{"event":"test","sourcetype":"_json","index":"firewall"}'
```

### MLTK not working
```bash
# Verify Python packages
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248
/opt/splunk/bin/splunk cmd python3 -c "import numpy, scipy, sklearn; print('OK')"

# Check MLTK app
/opt/splunk/bin/splunk display app Splunk_ML_Toolkit
```

## 📚 Documentation Links

- **Main Documentation**: [SPLUNK_INTEGRATION.md](./SPLUNK_INTEGRATION.md)
- **Deployment Guide**: [SPLUNK_DEPLOYMENT.md](./SPLUNK_DEPLOYMENT.md)
- **ML Toolkit Guide**: [SPLUNK_MLTK.md](./SPLUNK_MLTK.md)
- **Splunk Docs**: https://docs.splunk.com/

## 💰 Cost Estimate

- EC2 t3.medium: ~$30/month
- Storage (30 GB): ~$2.40/month
- Data transfer: ~$3/month
- **Total**: ~$35-40/month

**Recommended for Production:**
- Upgrade to t3.large for ML workloads: ~$60/month
- Add EBS snapshots for backup: +$5/month

## ✅ Checklist

- [ ] Splunk instance launched (i-0294a69a8cb12c442)
- [ ] Splunk web accessible (http://13.126.19.248:8000)
- [ ] HEC token retrieved
- [ ] MLTK installed
- [ ] Secrets Manager configured
- [ ] Lambda forwarder deployed
- [ ] DynamoDB Streams enabled
- [ ] Test traffic generated
- [ ] Data visible in Splunk
- [ ] Dashboard created
- [ ] Alerts configured

---

**Quick Status Check**: `curl -I http://13.126.19.248:8000`

**Current Status**: 🟡 Splunk Installing (wait 5-10 min)

**Need Help?** Check the detailed guides in the documentation files above.
