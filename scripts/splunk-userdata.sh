#!/bin/bash
# Splunk Enterprise Installation Script with MLTK
# For Ubuntu 22.04 LTS on AWS EC2

set -e
exec > >(tee /var/log/splunk-install.log) 2>&1

echo "=========================================="
echo "Splunk Enterprise Installation Starting"
echo "Date: $(date)"
echo "=========================================="

# Variables
SPLUNK_VERSION="9.1.2"
SPLUNK_BUILD="b6b9c8185839"
SPLUNK_HOME="/opt/splunk"
SPLUNK_USER="splunk"
SPLUNK_ADMIN_USER="admin"
SPLUNK_ADMIN_PASS="ParentalControl@2024"
HEC_TOKEN="parental-control-hec-token-2024"

# Update system
echo "=== Updating system packages ==="
apt-get update
apt-get upgrade -y

# Install dependencies
echo "=== Installing dependencies ==="
apt-get install -y wget curl unzip python3 python3-pip awscli jq

# Install SSM Agent
echo "=== Installing SSM Agent ==="
snap install amazon-ssm-agent --classic
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service

# Create splunk user
echo "=== Creating splunk user ==="
useradd -m -s /bin/bash $SPLUNK_USER || true

# Download Splunk Enterprise
echo "=== Downloading Splunk Enterprise $SPLUNK_VERSION ==="
cd /tmp
wget -O splunk.deb "https://download.splunk.com/products/splunk/releases/${SPLUNK_VERSION}/linux/splunk-${SPLUNK_VERSION}-${SPLUNK_BUILD}-linux-2.6-amd64.deb"

# Install Splunk
echo "=== Installing Splunk ==="
dpkg -i splunk.deb

# Accept license and set admin credentials
echo "=== Configuring Splunk ==="
$SPLUNK_HOME/bin/splunk start --accept-license --answer-yes --no-prompt --seed-passwd "$SPLUNK_ADMIN_PASS"
$SPLUNK_HOME/bin/splunk stop

# Set ownership
chown -R $SPLUNK_USER:$SPLUNK_USER $SPLUNK_HOME

# Enable boot start
echo "=== Enabling boot start ==="
$SPLUNK_HOME/bin/splunk enable boot-start -user $SPLUNK_USER --accept-license --answer-yes --no-prompt

# Configure HTTP Event Collector (HEC)
echo "=== Configuring HEC ==="
cat > $SPLUNK_HOME/etc/system/local/inputs.conf << 'INPUTS'
[http]
disabled = 0
port = 8088
enableSSL = 0
dedicatedIoThreads = 2

[http://parental-control-hec]
disabled = 0
token = parental-control-hec-token-2024
index = firewall
indexes = firewall,main,_internal
sourcetype = _json
INPUTS

# Create firewall index
echo "=== Creating indexes ==="
cat > $SPLUNK_HOME/etc/system/local/indexes.conf << 'INDEXES'
[firewall]
homePath = $SPLUNK_DB/firewall/db
coldPath = $SPLUNK_DB/firewall/colddb
thawedPath = $SPLUNK_DB/firewall/thaweddb
maxTotalDataSizeMB = 10240
frozenTimePeriodInSecs = 2592000

[security_events]
homePath = $SPLUNK_DB/security_events/db
coldPath = $SPLUNK_DB/security_events/colddb
thawedPath = $SPLUNK_DB/security_events/thaweddb
maxTotalDataSizeMB = 5120

[ml_models]
homePath = $SPLUNK_DB/ml_models/db
coldPath = $SPLUNK_DB/ml_models/colddb
thawedPath = $SPLUNK_DB/ml_models/thaweddb
maxTotalDataSizeMB = 2048
INDEXES

# Configure web settings
cat > $SPLUNK_HOME/etc/system/local/web.conf << 'WEB'
[settings]
enableSplunkWebSSL = false
httpport = 8000
startwebserver = 1
WEB

# Configure server settings
cat > $SPLUNK_HOME/etc/system/local/server.conf << 'SERVER'
[general]
serverName = splunk-parental-control

[httpServer]
acceptFrom = *
SERVER

# Set ownership again
chown -R $SPLUNK_USER:$SPLUNK_USER $SPLUNK_HOME

# Start Splunk
echo "=== Starting Splunk ==="
systemctl start Splunkd

# Wait for Splunk to be ready
echo "=== Waiting for Splunk to start ==="
sleep 30

# Verify Splunk is running
for i in {1..30}; do
    if curl -s http://localhost:8000 > /dev/null 2>&1; then
        echo "Splunk Web UI is ready!"
        break
    fi
    echo "Waiting for Splunk... ($i/30)"
    sleep 10
done

# Install Python ML packages for MLTK
echo "=== Installing Python ML packages ==="
pip3 install numpy scipy scikit-learn pandas matplotlib

# Save configuration info
echo "=== Saving configuration ==="
cat > /home/ubuntu/splunk-config.txt << CONFIG
========================================
Splunk Enterprise Configuration
========================================
Instance Created: $(date)

Web UI:
  URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000
  Username: $SPLUNK_ADMIN_USER
  Password: $SPLUNK_ADMIN_PASS

HTTP Event Collector (HEC):
  Endpoint: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8088/services/collector
  Token: $HEC_TOKEN
  Index: firewall

REST API:
  Endpoint: https://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8089
  Username: $SPLUNK_ADMIN_USER
  Password: $SPLUNK_ADMIN_PASS

SSH Access:
  User: ubuntu
  Key: pc-prod-jumphost-key.pem

Internal Access (from VPC):
  Web UI: http://$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4):8000
  HEC: http://$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4):8088/services/collector

MLTK Status: Pending manual installation from Splunkbase
========================================
CONFIG

chmod 644 /home/ubuntu/splunk-config.txt
chown ubuntu:ubuntu /home/ubuntu/splunk-config.txt

# Test HEC
echo "=== Testing HEC endpoint ==="
curl -s http://localhost:8088/services/collector/health || echo "HEC not ready yet"

echo "=========================================="
echo "Splunk Enterprise Installation Complete!"
echo "=========================================="
echo "Web UI: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000"
echo "HEC Endpoint: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8088/services/collector"
echo "Admin: $SPLUNK_ADMIN_USER / $SPLUNK_ADMIN_PASS"
echo "=========================================="
