#!/bin/bash
# =============================================================================
# MongoDB Replica Set Setup Script
# =============================================================================

set -e

echo "============================================="
echo "  MongoDB Replica Set Setup"
echo "============================================="
echo ""

# Wait for MongoDB containers to be ready
echo "Waiting for MongoDB containers to be ready..."
sleep 10

# Check if containers are running
for i in 1 2 3; do
    if ! docker ps | grep -q "subsec-mongodb${i}"; then
        echo "Error: subsec-mongodb${i} is not running"
        exit 1
    fi
done

echo "All MongoDB containers are running"
echo ""

# Initialize replica set
echo "Initializing replica set..."
docker exec subsec-mongodb1 mongosh --eval '
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb1:27017", priority: 2 },
    { _id: 1, host: "mongodb2:27017", priority: 1 },
    { _id: 2, host: "mongodb3:27017", priority: 1 }
  ]
})
'

echo ""
echo "Waiting for replica set to elect primary..."
sleep 10

# Check replica set status
echo "Checking replica set status..."
docker exec subsec-mongodb1 mongosh --eval 'rs.status()'

echo ""
echo "============================================="
echo "  MongoDB Replica Set Initialized!"
echo "============================================="
echo ""
echo "Connection string:"
echo "  mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0"
