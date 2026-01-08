#!/bin/bash
# =============================================================================
# Pull ECR Images for On-Premises Deployment
# =============================================================================
# This script pulls custom images from AWS ECR and optionally re-tags them
# for a local registry
# =============================================================================

set -e

# Configuration
ECR_REGISTRY="567097740753.dkr.ecr.ap-south-1.amazonaws.com"
ECR_REPO="parental-control"
AWS_REGION="ap-south-1"
LOCAL_REGISTRY="${LOCAL_REGISTRY:-localhost:5000}"

# Image tags to pull
IMAGES=(
    "p-gateway-simulator"
    "ftd-integration"
    "analytics-dashboard"
    "kafka-subscriber"
    "policy-enforcer"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Subscriber Security AI - ECR Image Puller  ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Login to ECR
echo -e "${YELLOW}Logging in to AWS ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to login to ECR${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully logged in to ECR${NC}"
echo ""

# Pull each image
echo -e "${YELLOW}Pulling images from ECR...${NC}"
echo ""

for IMAGE in "${IMAGES[@]}"; do
    FULL_IMAGE="${ECR_REGISTRY}/${ECR_REPO}:${IMAGE}"
    echo -e "Pulling ${YELLOW}${IMAGE}${NC}..."

    docker pull ${FULL_IMAGE}

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully pulled ${IMAGE}${NC}"

        # Optionally re-tag for local registry
        if [ -n "${RETAG_LOCAL}" ]; then
            LOCAL_IMAGE="${LOCAL_REGISTRY}/${ECR_REPO}:${IMAGE}"
            docker tag ${FULL_IMAGE} ${LOCAL_IMAGE}
            echo -e "  Tagged as ${LOCAL_IMAGE}"
        fi
    else
        echo -e "${RED}Failed to pull ${IMAGE}${NC}"
    fi
    echo ""
done

# Pull Docker Hub images
echo -e "${YELLOW}Pulling Docker Hub images...${NC}"
echo ""

DOCKERHUB_IMAGES=(
    "opensecurity/mobile-security-framework-mobsf:latest"
    "mongo:6.0"
    "confluentinc/cp-kafka:7.5.0"
    "confluentinc/cp-zookeeper:7.5.0"
    "rabbitmq:3-management"
    "nginx:alpine"
    "minio/minio:latest"
    "hashicorp/vault:latest"
    "prom/prometheus:latest"
    "grafana/grafana:latest"
    "splunk/splunk:latest"
    "prom/alertmanager:latest"
)

for IMAGE in "${DOCKERHUB_IMAGES[@]}"; do
    echo -e "Pulling ${YELLOW}${IMAGE}${NC}..."
    docker pull ${IMAGE}

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully pulled ${IMAGE}${NC}"
    else
        echo -e "${RED}Failed to pull ${IMAGE}${NC}"
    fi
    echo ""
done

# Summary
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Image Pull Complete!                       ${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo "ECR Images pulled:"
for IMAGE in "${IMAGES[@]}"; do
    echo "  - ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE}"
done
echo ""
echo "Docker Hub Images pulled:"
for IMAGE in "${DOCKERHUB_IMAGES[@]}"; do
    echo "  - ${IMAGE}"
done
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Update .env file with your configuration"
echo "  2. Run: docker-compose up -d"
echo "  3. Initialize MongoDB replica set: ./scripts/setup-mongodb.sh"
echo "  4. Create Kafka topics: ./scripts/setup-kafka.sh"
