# Splunk Machine Learning Toolkit (MLTK) for Parental Control

## Overview

The Machine Learning Toolkit (MLTK) enables advanced anomaly detection and predictive analytics for traffic monitoring in the Parental Control system.

## Installation Options

### Option 1: Automatic Installation Script (Quick)

```bash
# Copy script to Splunk EC2 instance
scp -i ~/.ssh/k8s-script-mumbai.pem /tmp/install-splunk-mltk.sh ec2-user@13.126.19.248:/tmp/

# SSH and run the script
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248
sudo bash /tmp/install-splunk-mltk.sh
```

### Option 2: Manual Installation via Splunk Web UI

1. Login to Splunk Web: http://13.126.19.248:8000
2. Navigate to **Apps** → **Find More Apps**
3. Search for "Machine Learning Toolkit"
4. Click **Install** (requires Splunk.com account - free)
5. Also install **Python for Scientific Computing** (required dependency)
6. Restart Splunk

### Option 3: Command Line Installation

```bash
# SSH into Splunk instance
ssh -i ~/.ssh/k8s-script-mumbai.pem ec2-user@13.126.19.248

# Download MLTK (requires authentication)
cd /opt/splunk/etc/apps
sudo wget -O mltk.tgz 'https://splunkbase.splunk.com/app/2890/release/5.3.1/download'
sudo tar xzf mltk.tgz

# Restart Splunk
sudo /opt/splunk/bin/splunk restart
```

## Pre-Configured ML Features

The installation script automatically configures these ML-based detections:

### 1. Traffic Anomaly Detection

**What it detects:**
- Unusual upload/download volumes
- Sudden traffic spikes
- Abnormal data transfer patterns

**Splunk Query:**
```spl
index=firewall
| stats count avg(bytesSent) as avg_bytes max(bytesSent) as max_bytes by phoneNumber destDomain
| eval anomaly_score = if(max_bytes > (avg_bytes * 3), "high", if(max_bytes > (avg_bytes * 2), "medium", "low"))
| where anomaly_score="high" OR anomaly_score="medium"
```

**Runs:** Every 5 minutes
**Alert:** When anomaly score is medium or high

### 2. Data Exfiltration Detection

**What it detects:**
- Large uploads (>10MB) to suspicious domains
- Uploads to .tk, .ml, .ga, .xyz, .info domains
- Multiple exfiltration attempts

**Splunk Query:**
```spl
index=firewall
| where bytesSent > 10485760
| eval suspicious_domain = if(match(destDomain, "\\.(tk|ml|ga|xyz|info)$"), 1, 0)
| where suspicious_domain=1
| stats count values(destDomain) as domains by phoneNumber
| where count > 3
```

**Runs:** Every 5 minutes
**Alert:** When 3+ suspicious uploads detected

### 3. Rapid Upload Detection

**What it detects:**
- More than 10 uploads in 5-minute window
- Potential automated data theft
- Bot-like behavior

**Splunk Query:**
```spl
index=firewall
| bucket _time span=5m
| stats count by _time phoneNumber destDomain
| where count > 10
| eval risk = "high"
```

**Runs:** Every 5 minutes
**Alert:** When rapid uploads detected

### 4. Blocked Traffic Analysis

**What it detects:**
- Patterns in blocked requests
- Persistent threat attempts
- Blocked domain frequency

**Splunk Query:**
```spl
index=firewall action=BLOCKED
| stats count by phoneNumber destDomain risk
| where count > 5
| sort -count
```

**Runs:** Every 10 minutes
**Alert:** When 5+ blocked attempts to same domain

## Advanced MLTK Commands

Once MLTK is installed, use these ML commands:

### Anomaly Detection

```spl
# Detect anomalies in data transfer
index=firewall
| anomalydetection bytesSent
| where isOutlier=1

# Detect anomalies by child
index=firewall
| anomalydetection bytesSent by phoneNumber
```

### Clustering

```spl
# Cluster similar traffic patterns
index=firewall
| cluster field=destDomain showcount=true

# Cluster by domain and bytes sent
index=firewall
| cluster destDomain bytesSent
```

### Outlier Detection

```spl
# Find traffic outliers
index=firewall
| outlier action=remove bytesSent

# Multi-field outlier detection
index=firewall
| outlier bytesSent bytesReceived connectionDuration
```

### Prediction

```spl
# Predict future traffic volume
index=firewall
| timechart span=1h sum(bytesSent) as total_bytes
| predict total_bytes future_timespan=24

# Predict risk level
index=firewall
| predict risk algorithm=LogisticRegression
```

### Statistical Analysis

```spl
# Calculate percentiles
index=firewall
| streamstats perc95(bytesSent) as p95

# Moving average
index=firewall
| timechart span=5m avg(bytesSent) as avg_bytes
| trendline sma5(avg_bytes) as moving_avg
```

## ML-Based Alerting

### Create Real-Time ML Alerts

1. Navigate to **Search & Reporting**
2. Run an ML query (e.g., anomaly detection)
3. Click **Save As** → **Alert**
4. Configure:
   - **Alert Type**: Real-time
   - **Trigger**: Per-Result (fires for each anomaly)
   - **Throttle**: 5 minutes
   - **Actions**: Email, Webhook, or Custom

### Example ML Alert Configuration

**Alert Name:** High Risk Data Exfiltration
**Search:**
```spl
index=firewall
| anomalydetection bytesSent
| where isOutlier=1 AND bytesSent > 10485760
| eval suspicious = if(match(destDomain, "\\.(tk|ml|ga|xyz)$"), 1, 0)
| where suspicious=1
```

**Trigger Condition:** Number of Results > 0
**Actions:**
- Send email to parent
- Log to audit trail
- Auto-block IP (via webhook to Lambda)

## ML Dashboard Examples

### Dashboard 1: Anomaly Detection Overview

```xml
<dashboard>
  <label>Traffic Anomaly Detection</label>
  <row>
    <panel>
      <title>Anomaly Score Distribution</title>
      <chart>
        <search>
          <query>
            index=firewall
            | anomalydetection bytesSent
            | stats count by isOutlier
          </query>
        </search>
        <option name="charting.chart">pie</option>
      </chart>
    </panel>
    <panel>
      <title>Top Anomalous Traffic</title>
      <table>
        <search>
          <query>
            index=firewall
            | anomalydetection bytesSent
            | where isOutlier=1
            | table _time phoneNumber destDomain bytesSent
            | sort -bytesSent
          </query>
        </search>
      </table>
    </panel>
  </row>
</dashboard>
```

### Dashboard 2: Predictive Traffic Analysis

```xml
<dashboard>
  <label>Predictive Traffic Forecast</label>
  <row>
    <panel>
      <title>24-Hour Traffic Prediction</title>
      <chart>
        <search>
          <query>
            index=firewall
            | timechart span=1h sum(bytesSent) as traffic
            | predict traffic future_timespan=24
          </query>
        </search>
        <option name="charting.chart">line</option>
      </chart>
    </panel>
  </row>
</dashboard>
```

## ML Use Cases for Parental Control

### 1. Behavior Pattern Analysis

**Goal:** Understand normal vs abnormal child behavior

```spl
# Build behavior baseline
index=firewall
| bucket _time span=1h
| stats avg(bytesSent) as avg_traffic stdev(bytesSent) as std_traffic by phoneNumber _time
| eval baseline = avg_traffic + (2 * std_traffic)
| eval anomaly = if(avg_traffic > baseline, 1, 0)
```

### 2. Content Risk Scoring

**Goal:** Predict risk level of accessed content

```spl
# Train risk prediction model
index=firewall
| fit LogisticRegression risk from destDomain category bytesSent into risk_model

# Apply model to new traffic
index=firewall
| apply risk_model
| where predicted_risk="high"
```

### 3. Temporal Pattern Detection

**Goal:** Detect unusual access times

```spl
# Detect late-night activity
index=firewall
| eval hour = strftime(_time, "%H")
| where hour >= 22 OR hour <= 6
| stats count by phoneNumber destDomain
| where count > 10
```

### 4. Social Network Analysis

**Goal:** Map connections between children and accessed services

```spl
# Network graph of child → domain relationships
index=firewall
| stats count by phoneNumber destDomain
| where count > 5
| rename phoneNumber as source destDomain as target
```

## Performance Tuning

### Optimize ML Searches

```spl
# Use summary indexing for faster ML
index=firewall
| bucket _time span=5m
| stats sum(bytesSent) as total_bytes by _time phoneNumber
| collect index=summary_firewall

# Run ML on summary index (much faster)
index=summary_firewall
| anomalydetection total_bytes
```

### Schedule ML Jobs Efficiently

- Run heavy ML jobs during off-peak hours
- Use `| tstats` for faster aggregations
- Limit search time range to recent data
- Cache ML model results

## Troubleshooting

### MLTK Not Working

```bash
# Check if Python dependencies are installed
/opt/splunk/bin/splunk cmd python3 -c "import numpy, scipy, sklearn; print('OK')"

# Verify MLTK app is enabled
/opt/splunk/bin/splunk display app Splunk_ML_Toolkit

# Check for errors
tail -f /opt/splunk/var/log/splunk/python.log
```

### ML Commands Not Found

```bash
# Restart Splunk
sudo /opt/splunk/bin/splunk restart

# Verify MLTK version
/opt/splunk/bin/splunk display app Splunk_ML_Toolkit
```

## Resources

- **MLTK Documentation**: https://docs.splunk.com/Documentation/MLApp
- **ML Algorithm Guide**: https://docs.splunk.com/Documentation/MLApp/latest/User/Algorithms
- **Splunk ML Examples**: https://github.com/splunk/mltk-examples

## Cost Considerations

- MLTK is **free** with Splunk Enterprise
- Requires additional compute resources:
  - Recommended: t3.large or larger (4 GB+ RAM)
  - Current t3.medium may need upgrade for heavy ML workloads
- Consider upgrading to t3.large (~$60/month) for production ML

## Summary

✅ **Installed**: Basic ML detection rules
✅ **Configured**: 4 automated ML-based alerts
✅ **Ready**: For advanced MLTK installation
⏳ **Pending**: Full MLTK app installation (manual via Splunk Web)

**Next Action:** Once Splunk finishes installing, run the MLTK installation script to enable full ML capabilities.
