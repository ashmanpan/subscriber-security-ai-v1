#!/bin/bash

echo "========================================="
echo "Splunk Integration Setup for Parental Control"
echo "========================================="
echo ""

# Check if Splunk credentials are provided
if [ -z "$SPLUNK_HEC_URL" ] || [ -z "$SPLUNK_HEC_TOKEN" ]; then
    echo "⚠️  Please provide Splunk credentials:"
    echo ""
    echo "Set environment variables:"
    echo "  export SPLUNK_HEC_URL='https://your-splunk-instance:8088/services/collector'"
    echo "  export SPLUNK_HEC_TOKEN='your-hec-token-here'"
    echo "  export SPLUNK_INDEX='firewall'  # Optional, defaults to 'firewall'"
    echo ""
    echo "Then run this script again."
    exit 1
fi

REGION="ap-south-1"
INDEX="${SPLUNK_INDEX:-firewall}"

echo "📋 Configuration:"
echo "  Splunk HEC URL: $SPLUNK_HEC_URL"
echo "  Splunk Index: $INDEX"
echo "  AWS Region: $REGION"
echo ""

# Step 1: Store Splunk credentials in Secrets Manager
echo "🔐 Step 1/5: Storing Splunk credentials in AWS Secrets Manager..."

aws secretsmanager create-secret \
  --name pc-prod-splunk-config \
  --description "Splunk HEC configuration for Parental Control firewall logs" \
  --secret-string "{\"hec_url\":\"$SPLUNK_HEC_URL\",\"hec_token\":\"$SPLUNK_HEC_TOKEN\",\"index\":\"$INDEX\"}" \
  --region $REGION 2>&1 | grep -v "ResourceExistsException" || true

echo "✅ Splunk credentials stored"
echo ""

# Step 2: Create IAM role for Lambda
echo "🔑 Step 2/5: Creating IAM role for Splunk forwarder Lambda..."

ROLE_NAME="splunk-forwarder-role"

cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --region $REGION 2>&1 | grep -v "EntityAlreadyExists" || true

# Attach policies
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --region $REGION 2>&1 || true

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess \
  --region $REGION 2>&1 || true

# Create policy for Secrets Manager access
cat > /tmp/secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:$REGION:*:secret:pc-prod-splunk-config-*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name SecretsManagerAccess \
  --policy-document file:///tmp/secrets-policy.json \
  --region $REGION 2>&1 || true

echo "✅ IAM role created"
echo ""

# Step 3: Build and deploy Lambda function
echo "📦 Step 3/5: Building Splunk forwarder Lambda function..."

cd /tmp/lambda-splunk-forwarder
npm install --silent 2>&1 > /dev/null

echo "  Packaging Lambda function..."
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

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"

echo "  Creating Lambda function..."
aws lambda create-function \
  --function-name splunk-forwarder \
  --runtime nodejs18.x \
  --role $ROLE_ARN \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256 \
  --region $REGION 2>&1 | grep -v "ResourceConflictException" || \
aws lambda update-function-code \
  --function-name splunk-forwarder \
  --zip-file fileb://function.zip \
  --region $REGION

echo "✅ Lambda function deployed"
echo ""

# Wait for IAM propagation
echo "⏳ Waiting for IAM role propagation (30 seconds)..."
sleep 30

# Step 4: Enable DynamoDB Streams
echo "🔄 Step 4/5: Enabling DynamoDB Streams on traffic logs table..."

aws dynamodb update-table \
  --table-name pc-prod-traffic-logs \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region $REGION 2>&1 | grep -v "ResourceInUseException" || true

# Get stream ARN
STREAM_ARN=$(aws dynamodb describe-table \
  --table-name pc-prod-traffic-logs \
  --region $REGION \
  --query 'Table.LatestStreamArn' \
  --output text)

echo "✅ DynamoDB Streams enabled"
echo "  Stream ARN: $STREAM_ARN"
echo ""

# Step 5: Create event source mapping
echo "🔗 Step 5/5: Connecting DynamoDB Stream to Lambda..."

aws lambda create-event-source-mapping \
  --function-name splunk-forwarder \
  --event-source-arn $STREAM_ARN \
  --starting-position LATEST \
  --batch-size 100 \
  --region $REGION 2>&1 | grep -v "ResourceConflictException" || true

echo "✅ Event source mapping created"
echo ""

echo "========================================="
echo "✅ Splunk Integration Setup Complete!"
echo "========================================="
echo ""
echo "📊 Next Steps:"
echo ""
echo "1. Verify Splunk is receiving data:"
echo "   - Search in Splunk: index=$INDEX"
echo ""
echo "2. Generate test traffic:"
echo "   aws lambda invoke \\"
echo "     --function-name traffic-log-generator \\"
echo "     --cli-binary-format raw-in-base64-out \\"
echo "     --payload '{\"count\": 20}' \\"
echo "     --region $REGION \\"
echo "     /tmp/test.json"
echo ""
echo "3. Check Splunk forwarder logs:"
echo "   aws logs tail /aws/lambda/splunk-forwarder --follow --region $REGION"
echo ""
echo "4. Create Splunk dashboards and alerts (see SPLUNK_INTEGRATION.md)"
echo ""
echo "🎉 All firewall logs will now be automatically forwarded to Splunk!"
