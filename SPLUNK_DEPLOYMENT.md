# Splunk Enterprise Deployment on AWS EC2

## ✅ Deployment Status: IN PROGRESS

Splunk Enterprise is currently being installed on EC2. Installation takes approximately 5-10 minutes.

## 📊 Splunk Instance Details

| Component | Details |
|-----------|---------|
| **Instance ID** | i-0294a69a8cb12c442 |
| **Instance Type** | t3.medium (2 vCPU, 4 GB RAM) |
| **Public IP** | 13.126.19.248 |
| **Private IP** | 10.0.1.160 |
| **Region** | ap-south-1 (Mumbai) |
| **Storage** | 30 GB gp3 SSD |
| **Security Group** | sg-0b24c0ba9ffc05aff |

## 🌐 Access URLs

### Splunk Web UI
- **URL**: http://13.126.19.248:8000
- **Username**: admin
- **Password**: ParentalControl@2024
- **Status**: Installing (wait 5-10 minutes after instance launch)

### HTTP Event Collector (HEC)
- **Endpoint**: http://13.126.19.248:8088/services/collector
- **Token**: Will be auto-generated during installation
- **Index**: firewall
- **Status**: Configuring automatically

## 🔒 Security Group Rules

| Port | Protocol | Purpose | Source |
|------|----------|---------|--------|
| 8000 | TCP | Splunk Web UI | 0.0.0.0/0 |
| 8088 | TCP | HTTP Event Collector (HEC) | 0.0.0.0/0 |
| 22 | TCP | SSH Access | 0.0.0.0/0 |

## 📋 What's Being Installed

The user data script is automatically:

1. ✅ Installing Splunk Enterprise 9.1.2
2. ✅ Setting admin password: `ParentalControl@2024`
3. ✅ Creating `firewall` index for logs
4. ✅ Enabling HTTP Event Collector (HEC)
5. ✅ Creating HEC token: `parental-control-token`
6. ✅ Configuring auto-start on boot
7. ✅ Saving configuration to `/home/ec2-user/splunk-config.txt`

## ⏳ Checking Installation Status

### Option 1: Check via SSH

```bash
# SSH into instance (requires k8s-script-mumbai.pem key)
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248

# Check if Splunk is running
sudo /opt/splunk/bin/splunk status

# View installation logs
tail -f /opt/splunk/var/log/splunk/splunkd.log

# Get HEC token
cat /home/ec2-user/splunk-config.txt
```

### Option 2: Check via Browser

1. Wait 5-10 minutes after instance launch
2. Open: http://13.126.19.248:8000
3. Login with admin / ParentalControl@2024
4. If loading, Splunk is starting up
5. If error, wait a few more minutes

### Option 3: Check HEC Endpoint

```bash
# Test HEC endpoint (should return JSON)
curl http://13.126.19.248:8088/services/collector/health

# Expected response: {"text":"HEC is healthy","code":17}
```

## 🔗 Next Steps (After Installation Completes)

### 1. Verify Splunk is Running

```bash
# Should show Splunk Web on port 8000
curl -I http://13.126.19.248:8000
```

### 2. Get HEC Token

```bash
# SSH and retrieve token
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248 "cat /opt/splunk/hec-token.txt"
```

### 3. Store HEC Token in AWS Secrets Manager

```bash
# Replace YOUR_HEC_TOKEN with actual token
export SPLUNK_HEC_TOKEN="YOUR_HEC_TOKEN"

aws secretsmanager create-secret \
  --name pc-prod-splunk-config \
  --description "Splunk HEC configuration" \
  --secret-string "{\"hec_url\":\"http://13.126.19.248:8088/services/collector\",\"hec_token\":\"$SPLUNK_HEC_TOKEN\",\"index\":\"firewall\"}" \
  --region ap-south-1
```

### 4. Deploy Lambda Forwarder

```bash
cd /tmp/lambda-splunk-forwarder
npm install

# Package Lambda
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

# Create IAM role
aws iam create-role \
  --role-name splunk-forwarder-role \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --region ap-south-1

# Attach policies
aws iam attach-role-policy \
  --role-name splunk-forwarder-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name splunk-forwarder-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess

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

### 5. Enable DynamoDB Streams

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

# Connect Lambda to stream
aws lambda create-event-source-mapping \
  --function-name splunk-forwarder \
  --event-source-arn $STREAM_ARN \
  --starting-position LATEST \
  --batch-size 100 \
  --region ap-south-1
```

### 6. Test Integration

```bash
# Generate test traffic
aws lambda invoke \
  --function-name traffic-log-generator \
  --cli-binary-format raw-in-base64-out \
  --payload '{"count": 20}' \
  --region ap-south-1 \
  /tmp/test.json

# Check Splunk for logs (wait 30 seconds)
# In Splunk Web UI: index=firewall
```

## 📊 Splunk Queries for Parental Control

Once logs are flowing, use these searches:

```spl
# All firewall logs
index=firewall

# Blocked traffic
index=firewall action=BLOCKED

# High-risk traffic
index=firewall risk=high

# Traffic by child
index=firewall phoneNumber="+1-555-123-4567"

# Suspicious domains
index=firewall destDomain IN ("*.tk", "*.ml", "*.ga", "*.xyz")

# Large uploads (potential data exfiltration)
index=firewall bytesSent>10485760

# Real-time traffic chart
index=firewall
| timechart count by action

# Top 10 accessed domains
index=firewall
| stats count by destDomain
| sort -count
| head 10
```

## 🎨 Creating Splunk Dashboards

1. Login to Splunk Web UI
2. Navigate to Dashboards → Create New Dashboard
3. Name: "Parental Control Monitoring"
4. Add panels with above queries
5. Set auto-refresh: 30 seconds

### Recommended Panels:

1. **Traffic Volume** (Line chart)
   - Query: `index=firewall | timechart count`

2. **Blocked vs Allowed** (Pie chart)
   - Query: `index=firewall | stats count by action`

3. **Risk Distribution** (Bar chart)
   - Query: `index=firewall | stats count by risk`

4. **Top Domains** (Table)
   - Query: `index=firewall | stats count by destDomain | sort -count | head 20`

5. **Children Activity** (Heatmap)
   - Query: `index=firewall | stats count by phoneNumber, hour`

## 💰 Cost Estimate

| Resource | Cost (ap-south-1) |
|----------|-------------------|
| EC2 t3.medium | ~$0.0416/hour (~$30/month) |
| 30 GB gp3 Storage | ~$2.40/month |
| Data Transfer (outbound) | ~$0.09/GB |
| **Total** | **~$35-40/month** |

## 🔧 Troubleshooting

### Splunk not accessible after 10 minutes

```bash
# SSH and check status
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248
sudo /opt/splunk/bin/splunk status

# Check logs
tail -100 /opt/splunk/var/log/splunk/splunkd.log

# Restart if needed
sudo /opt/splunk/bin/splunk restart
```

### HEC not receiving data

```bash
# Test HEC health
curl http://13.126.19.248:8088/services/collector/health

# Check HEC configuration
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248
sudo /opt/splunk/bin/splunk http-event-collector list -uri https://localhost:8089 -auth admin:ParentalControl@2024
```

### Lambda not forwarding logs

```bash
# Check Lambda logs
aws logs tail /aws/lambda/splunk-forwarder --follow --region ap-south-1

# Test Lambda directly
aws lambda invoke \
  --function-name splunk-forwarder \
  --payload '{"Records":[]}' \
  --region ap-south-1 \
  /tmp/test-response.json
```

## 📞 Support

- Splunk Documentation: https://docs.splunk.com/
- Splunk Community: https://community.splunk.com/
- AWS EC2 Console: https://ap-south-1.console.aws.amazon.com/ec2/

---

**Instance Launch Time**: December 2, 2025
**Expected Ready Time**: 5-10 minutes after launch
**Status**: 🟡 Installing... Check back in 5 minutes

**Quick Health Check**: `curl http://13.126.19.248:8000` (should return HTML if ready)
