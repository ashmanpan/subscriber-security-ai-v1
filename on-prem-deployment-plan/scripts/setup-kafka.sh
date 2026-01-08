#!/bin/bash
# =============================================================================
# Kafka Topics Setup Script
# =============================================================================

set -e

echo "============================================="
echo "  Kafka Topics Setup"
echo "============================================="
echo ""

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 15

# Check if Kafka container is running
if ! docker ps | grep -q "subsec-kafka1"; then
    echo "Error: subsec-kafka1 is not running"
    exit 1
fi

echo "Kafka is running"
echo ""

# Create topics
TOPICS=(
    "traffic-logs:3:3"
    "anomalies:3:3"
    "alerts:3:3"
    "blocked-domains:3:3"
    "blocked-ips:3:3"
    "scan-results:3:3"
    "fraud-detections:3:3"
    "parent-notifications:3:3"
)

echo "Creating Kafka topics..."
echo ""

for TOPIC_CONFIG in "${TOPICS[@]}"; do
    IFS=':' read -r TOPIC PARTITIONS REPLICAS <<< "$TOPIC_CONFIG"

    echo "Creating topic: ${TOPIC} (partitions: ${PARTITIONS}, replicas: ${REPLICAS})"

    docker exec subsec-kafka1 kafka-topics --create \
        --bootstrap-server kafka1:9092 \
        --topic ${TOPIC} \
        --partitions ${PARTITIONS} \
        --replication-factor ${REPLICAS} \
        --if-not-exists

    echo "  Created: ${TOPIC}"
done

echo ""
echo "Listing all topics..."
docker exec subsec-kafka1 kafka-topics --list --bootstrap-server kafka1:9092

echo ""
echo "============================================="
echo "  Kafka Topics Created!"
echo "============================================="
