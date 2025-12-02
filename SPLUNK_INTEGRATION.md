# Splunk Integration for Firewall Logs

## Overview

This document describes how to integrate firewall logs (traffic logs) from the Parental Control system with Splunk for advanced analytics and monitoring.

## Architecture

```
Traffic Generation → DynamoDB → Lambda Forwarder → Splunk HEC → Splunk Dashboard
```

## Option 1: Splunk HTTP Event Collector (HEC) - Recommended

### Prerequisites

1. **Splunk Instance**: You need a running Splunk instance (Cloud or Enterprise)
   - Splunk Cloud: https://www.splunk.com/en_us/products/splunk-cloud-platform.html
   - Splunk Enterprise: Self-hosted

2. **HEC Token**: Create an HTTP Event Collector token in Splunk
   - Navigate to Settings → Data Inputs → HTTP Event Collector
   - Click "New Token"
   - Name: `parental-control-logs`
   - Source type: `_json`
   - Index: `firewall` (or create new index)
   - Copy the generated token

### Implementation Steps

#### 1. Store Splunk Credentials in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name pc-prod-splunk-config \
  --description "Splunk HEC configuration" \
  --secret-string '{
    "hec_url": "https://YOUR-SPLUNK-INSTANCE:8088/services/collector",
    "hec_token": "YOUR-HEC-TOKEN-HERE",
    "index": "firewall"
  }' \
  --region ap-south-1
```

#### 2. Create Lambda Function for Splunk Forwarding

The Lambda function `/tmp/lambda-splunk-forwarder/index.js` will:
- Listen to DynamoDB Streams from `pc-prod-traffic-logs`
- Format logs for Splunk
- Send to Splunk HEC endpoint

#### 3. Enable DynamoDB Streams

```bash
aws dynamodb update-table \
  --table-name pc-prod-traffic-logs \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region ap-south-1
```

#### 4. Deploy Lambda Forwarder

The forwarder Lambda will be triggered automatically for every new traffic log entry.

### Splunk Search Queries

Once logs are in Splunk, use these queries:

```spl
# All traffic logs
index=firewall sourcetype=_json

# Blocked traffic only
index=firewall action=BLOCKED

# High-risk traffic
index=firewall risk=high

# Traffic by child
index=firewall phoneNumber="+1-555-123-4567"

# Suspicious domains (data exfiltration)
index=firewall destDomain IN ("*.tk", "*.ml", "*.ga", "*.xyz")

# Large uploads (potential data exfiltration)
index=firewall bytesSent>10485760

# Time-based analysis
index=firewall
| timechart count by action

# Top accessed domains
index=firewall
| stats count by destDomain
| sort -count
| head 20
```

### Splunk Dashboard (XML)

Create a dashboard in Splunk with panels for:
- Real-time traffic monitoring
- Blocked vs allowed traffic
- Top accessed domains
- Children activity heatmap
- Risk level distribution
- Data exfiltration alerts

## Option 2: CloudWatch Logs to Splunk Add-on

If using CloudWatch Logs, install the Splunk Add-on for AWS:

1. Install "Splunk Add-on for AWS" from Splunkbase
2. Configure CloudWatch Logs ingestion
3. Point to CloudWatch Log Group: `/aws/lambda/traffic-log-generator`

## Option 3: Direct API Integration

For custom analytics, create Lambda function that:
- Queries DynamoDB directly
- Sends batches to Splunk HEC
- Runs on schedule (every 5 minutes)

## Monitoring & Alerts

### Splunk Alerts to Create

1. **High-Risk Traffic Alert**
```spl
index=firewall risk=high
| stats count by phoneNumber, destDomain
| where count > 5
```

2. **Data Exfiltration Alert**
```spl
index=firewall bytesSent>10485760
| eval suspicious_domain=if(match(destDomain, "\\.(tk|ml|ga|xyz)$"), "yes", "no")
| where suspicious_domain="yes"
```

3. **Excessive Blocking Alert**
```spl
index=firewall action=BLOCKED
| stats count by phoneNumber
| where count > 20
```

## Testing Splunk Integration

```bash
# Generate test traffic
aws lambda invoke \
  --function-name traffic-log-generator \
  --cli-binary-format raw-in-base64-out \
  --payload '{"count": 100}' \
  --region ap-south-1 \
  /tmp/test.json

# Verify logs in Splunk
# Search: index=firewall | head 100
```

## Cost Considerations

- **Splunk Cloud**: Charged per GB ingested per day
- **Estimate**: ~100-500 MB/day for demo (very low cost)
- **Production**: Scale based on actual traffic volume

## Security

- HEC token stored in AWS Secrets Manager (encrypted)
- HTTPS only for HEC endpoint
- IAM role with minimal permissions
- VPC endpoint for Secrets Manager (optional)

## Next Steps

1. Set up Splunk instance (Cloud or Enterprise)
2. Create HEC token
3. Deploy Lambda forwarder
4. Enable DynamoDB Streams
5. Create Splunk dashboard
6. Set up alerts

---

**Status**: Ready to implement
**Effort**: 2-3 hours
**Dependencies**: Splunk instance with HEC enabled

For immediate demo without Splunk, the current ML-based anomaly detection with DynamoDB queries provides similar functionality.
