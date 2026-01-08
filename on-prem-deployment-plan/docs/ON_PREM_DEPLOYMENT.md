# On-Premises Deployment Plan - Subscriber Security AI

## Overview

This document outlines the deployment plan for migrating/replicating the Subscriber Security AI system from AWS to on-premises infrastructure.

---

## Architecture Comparison: AWS vs On-Prem

| AWS Service | On-Prem Equivalent | Notes |
|-------------|-------------------|-------|
| ECS Fargate | Docker Swarm / Kubernetes | Container orchestration |
| DynamoDB | MongoDB / PostgreSQL | NoSQL or SQL database |
| Lambda | OpenFaaS / Node.js Services | Serverless functions |
| MSK (Kafka) | Apache Kafka | Message streaming |
| Splunk Cloud | Splunk Enterprise | Already have on-prem option |
| AWS Amplify | Nginx + Static Files | Web hosting |
| SNS/SES | RabbitMQ + SMTP | Notifications |
| Secrets Manager | HashiCorp Vault | Secrets management |
| CloudWatch | Prometheus + Grafana | Monitoring |
| S3 | MinIO | Object storage |

---

## On-Premises Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ON-PREMISES DATA CENTER                                              │
│                                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                    DMZ / EDGE NETWORK                                              │  │
│  │                                                                                                    │  │
│  │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                               │  │
│  │   │   LOAD BALANCER │    │    FIREWALL     │    │   VPN GATEWAY   │                               │  │
│  │   │   (HAProxy/F5)  │    │ (Cisco FTD/ASA) │    │  (WireGuard)    │                               │  │
│  │   │                 │    │                 │    │                 │                               │  │
│  │   │  • SSL Term     │    │  • URL Filter   │    │  • Site-to-Site │                               │  │
│  │   │  • Health Check │    │  • IPS/IDS      │    │  • Remote Admin │                               │  │
│  │   │  • Rate Limit   │    │  • NAT          │    │                 │                               │  │
│  │   └────────┬────────┘    └────────┬────────┘    └─────────────────┘                               │  │
│  │            │                      │                                                                │  │
│  └────────────┼──────────────────────┼────────────────────────────────────────────────────────────────┘  │
│               │                      │                                                                   │
│               ▼                      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              APPLICATION TIER (Docker Swarm / K8s)                                 │  │
│  │                                                                                                    │  │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │  │
│  │   │ P-GATEWAY   │ │ FTD-        │ │ MOBSF       │ │ ANALYTICS   │ │ POLICY-     │                │  │
│  │   │ SIMULATOR   │ │ INTEGRATION │ │ SERVER      │ │ DASHBOARD   │ │ ENFORCER    │                │  │
│  │   │             │ │             │ │             │ │             │ │             │                │  │
│  │   │ Port: 8080  │ │ Port: 5000  │ │ Port: 6000  │ │ Port: 7000  │ │ Internal    │                │  │
│  │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │  │
│  │                                                                                                    │  │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                                                │  │
│  │   │ KAFKA-      │ │ WEB         │ │ API         │                                                │  │
│  │   │ SUBSCRIBER  │ │ FRONTEND    │ │ GATEWAY     │                                                │  │
│  │   │             │ │ (Nginx)     │ │ (Kong/Nginx)│                                                │  │
│  │   │ Internal    │ │ Port: 443   │ │ Port: 8443  │                                                │  │
│  │   └─────────────┘ └─────────────┘ └─────────────┘                                                │  │
│  │                                                                                                    │  │
│  └───────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                              │                                                           │
│               ┌──────────────────────────────┴──────────────────────────────┐                           │
│               │                                                              │                           │
│               ▼                                                              ▼                           │
│  ┌───────────────────────────────────────┐  ┌───────────────────────────────────────┐                   │
│  │        MESSAGE QUEUE TIER             │  │           SERVERLESS TIER             │                   │
│  │                                       │  │         (OpenFaaS / Node.js)          │                   │
│  │   ┌─────────────────────────────┐    │  │                                       │                   │
│  │   │     APACHE KAFKA            │    │  │   ┌─────────────┐ ┌─────────────┐    │                   │
│  │   │     (3-Node Cluster)        │    │  │   │ ANOMALY-    │ │ AUTO-       │    │                   │
│  │   │                             │    │  │   │ DETECTOR    │ │ BLOCKER     │    │                   │
│  │   │   • Topic: traffic-logs     │    │  │   │             │ │             │    │                   │
│  │   │   • Topic: anomalies        │    │  │   │ ML Analysis │ │ Rule Create │    │                   │
│  │   │   • Topic: alerts           │    │  │   └─────────────┘ └─────────────┘    │                   │
│  │   │                             │    │  │                                       │                   │
│  │   └─────────────────────────────┘    │  │   ┌─────────────┐ ┌─────────────┐    │                   │
│  │                                       │  │   │ DOMAIN-     │ │ MOBSF-      │    │                   │
│  │   ┌─────────────────────────────┐    │  │   │ BLOCKER     │ │ API         │    │                   │
│  │   │     RABBITMQ                │    │  │   │             │ │             │    │                   │
│  │   │     (Notifications)         │    │  │   │ URL Filter  │ │ Scan Trigger│    │                   │
│  │   │                             │    │  │   └─────────────┘ └─────────────┘    │                   │
│  │   │   • Queue: parent-alerts    │    │  │                                       │                   │
│  │   │   • Queue: email-notifs     │    │  │   ┌─────────────┐                    │                   │
│  │   │                             │    │  │   │ TRAFFIC-LOG │                    │                   │
│  │   └─────────────────────────────┘    │  │   │ GENERATOR   │                    │                   │
│  │                                       │  │   │             │                    │                   │
│  └───────────────────────────────────────┘  │   │ Test Data   │                    │                   │
│                                              │   └─────────────┘                    │                   │
│                                              └───────────────────────────────────────┘                   │
│                                              │                                                           │
│               ┌──────────────────────────────┴──────────────────────────────┐                           │
│               │                                                              │                           │
│               ▼                                                              ▼                           │
│  ┌───────────────────────────────────────┐  ┌───────────────────────────────────────┐                   │
│  │          DATA TIER                    │  │         ANALYTICS TIER                │                   │
│  │                                       │  │                                       │                   │
│  │   ┌─────────────────────────────┐    │  │   ┌─────────────────────────────┐    │                   │
│  │   │     MONGODB CLUSTER         │    │  │   │     SPLUNK ENTERPRISE       │    │                   │
│  │   │     (3-Node ReplicaSet)     │    │  │   │                             │    │                   │
│  │   │                             │    │  │   │   • Indexer Cluster         │    │                   │
│  │   │   Collections:              │    │  │   │   • Search Head             │    │                   │
│  │   │   • traffic_logs            │    │  │   │   • MLTK Installed          │    │                   │
│  │   │   • anomalies               │    │  │   │   • Heavy Forwarder         │    │                   │
│  │   │   • blocked_domains         │    │  │   │                             │    │                   │
│  │   │   • blocked_ips             │    │  │   │   Port: 8000 (Web)          │    │                   │
│  │   │   • mobsf_scans             │    │  │   │   Port: 8088 (HEC)          │    │                   │
│  │   │   • fraud_detections        │    │  │   │   Port: 9997 (Forwarder)    │    │                   │
│  │   │                             │    │  │   │                             │    │                   │
│  │   └─────────────────────────────┘    │  │   └─────────────────────────────┘    │                   │
│  │                                       │  │                                       │                   │
│  │   ┌─────────────────────────────┐    │  │   ┌─────────────────────────────┐    │                   │
│  │   │     MINIO (S3 Compatible)   │    │  │   │   PROMETHEUS + GRAFANA      │    │                   │
│  │   │                             │    │  │   │                             │    │                   │
│  │   │   Buckets:                  │    │  │   │   • System Metrics          │    │                   │
│  │   │   • mobile-apps (APK/IPA)   │    │  │   │   • App Metrics             │    │                   │
│  │   │   • scan-reports            │    │  │   │   • Custom Dashboards       │    │                   │
│  │   │   • backups                 │    │  │   │   • Alertmanager            │    │                   │
│  │   │                             │    │  │   │                             │    │                   │
│  │   └─────────────────────────────┘    │  │   └─────────────────────────────┘    │                   │
│  │                                       │  │                                       │                   │
│  │   ┌─────────────────────────────┐    │  └───────────────────────────────────────┘                   │
│  │   │     HASHICORP VAULT         │    │                                                              │
│  │   │                             │    │                                                              │
│  │   │   • API Keys                │    │                                                              │
│  │   │   • Database Credentials    │    │                                                              │
│  │   │   • SSL Certificates        │    │                                                              │
│  │   │                             │    │                                                              │
│  │   └─────────────────────────────┘    │                                                              │
│  │                                       │                                                              │
│  └───────────────────────────────────────┘                                                              │
│                                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Server Requirements

### Minimum Hardware Specifications

| Server Role | CPU | RAM | Storage | Quantity | OS |
|-------------|-----|-----|---------|----------|-----|
| **Container Host (Docker/K8s)** | 8 cores | 32 GB | 500 GB SSD | 3 | Ubuntu 22.04 / RHEL 9 |
| **Database Server (MongoDB)** | 8 cores | 64 GB | 1 TB NVMe | 3 | Ubuntu 22.04 / RHEL 9 |
| **Kafka Cluster** | 4 cores | 16 GB | 500 GB SSD | 3 | Ubuntu 22.04 / RHEL 9 |
| **Splunk Enterprise** | 16 cores | 64 GB | 2 TB SSD | 2 | Ubuntu 22.04 / RHEL 9 |
| **Load Balancer** | 4 cores | 8 GB | 100 GB SSD | 2 | Ubuntu 22.04 |
| **MinIO Storage** | 4 cores | 16 GB | 4 TB HDD | 2 | Ubuntu 22.04 |
| **Monitoring (Prometheus/Grafana)** | 4 cores | 16 GB | 500 GB SSD | 1 | Ubuntu 22.04 |

**Total: 16-17 servers** (can be reduced with virtualization)

### Network Requirements

| Requirement | Specification |
|-------------|---------------|
| Internal Network | 10 Gbps between servers |
| Internet Bandwidth | 1 Gbps (for updates, threat intel) |
| VPN | Site-to-site or remote access |
| Firewall | Cisco FTD/ASA or equivalent |
| DNS | Internal DNS server |
| NTP | Time synchronization |

---

## Deployment Phases

### Phase 1: Infrastructure Setup (Week 1-2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: INFRASTRUCTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DAY 1-3: Network & Security                                        │
│  ├── Configure VLANs (Management, Application, Data, DMZ)          │
│  ├── Setup Firewall rules                                           │
│  ├── Configure Load Balancer (HAProxy)                              │
│  └── Setup VPN for remote access                                    │
│                                                                     │
│  DAY 4-7: Base Infrastructure                                       │
│  ├── Install OS on all servers                                      │
│  ├── Configure SSH, users, sudo                                     │
│  ├── Setup NTP, DNS                                                 │
│  ├── Install Docker on container hosts                              │
│  └── Setup Docker Swarm or Kubernetes cluster                       │
│                                                                     │
│  DAY 8-10: Storage & Secrets                                        │
│  ├── Deploy MinIO cluster                                           │
│  ├── Deploy HashiCorp Vault                                         │
│  ├── Configure backup storage                                       │
│  └── Setup SSL certificates (Let's Encrypt or internal CA)         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Data Tier (Week 2-3)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: DATA TIER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DAY 1-3: MongoDB Cluster                                           │
│  ├── Deploy 3-node MongoDB replica set                              │
│  ├── Configure authentication                                       │
│  ├── Create databases and collections                               │
│  ├── Setup indexes for performance                                  │
│  └── Configure backup schedule                                      │
│                                                                     │
│  DAY 4-5: Kafka Cluster                                             │
│  ├── Deploy 3-node Kafka cluster with ZooKeeper                     │
│  ├── Create topics (traffic-logs, anomalies, alerts)               │
│  ├── Configure retention policies                                   │
│  └── Setup Kafka Connect for MongoDB sink                           │
│                                                                     │
│  DAY 6-7: Splunk Enterprise                                         │
│  ├── Install Splunk Enterprise                                      │
│  ├── Configure indexers and search head                             │
│  ├── Install MLTK and Python for Scientific Computing              │
│  ├── Setup HEC endpoint                                             │
│  └── Create indexes (firewall, anomalies, scans)                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Application Tier (Week 3-4)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: APPLICATION TIER                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DAY 1-2: Build Container Images                                    │
│  ├── p-gateway-simulator                                            │
│  ├── ftd-integration                                                │
│  ├── mobsf-server                                                   │
│  ├── analytics-dashboard                                            │
│  ├── policy-enforcer                                                │
│  ├── kafka-subscriber                                               │
│  └── Push to local container registry                               │
│                                                                     │
│  DAY 3-4: Deploy Microservices                                      │
│  ├── Deploy all containers to Docker Swarm/K8s                      │
│  ├── Configure service discovery                                    │
│  ├── Setup health checks                                            │
│  └── Configure resource limits                                      │
│                                                                     │
│  DAY 5-6: Serverless Functions (OpenFaaS)                           │
│  ├── Deploy OpenFaaS                                                │
│  ├── Deploy anomaly-detector function                               │
│  ├── Deploy auto-blocker function                                   │
│  ├── Deploy domain-blocker function                                 │
│  ├── Deploy mobsf-api function                                      │
│  └── Deploy traffic-log-generator function                          │
│                                                                     │
│  DAY 7: Web Frontend                                                │
│  ├── Deploy Nginx with static files                                 │
│  ├── Configure SSL                                                  │
│  ├── Update config.js with on-prem endpoints                        │
│  └── Test all pages                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 4: Integration & Testing (Week 4-5)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PHASE 4: INTEGRATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  DAY 1-2: Cisco FTD Integration                                     │
│  ├── Configure FTD management access                                │
│  ├── Setup API credentials                                          │
│  ├── Test rule creation via API                                     │
│  └── Verify traffic blocking                                        │
│                                                                     │
│  DAY 3-4: End-to-End Testing                                        │
│  ├── Test P-Gateway traffic simulation                              │
│  ├── Test MobSF APK scanning                                        │
│  ├── Test anomaly detection                                         │
│  ├── Test auto-blocking                                             │
│  └── Test parent dashboard                                          │
│                                                                     │
│  DAY 5-6: Monitoring Setup                                          │
│  ├── Deploy Prometheus                                              │
│  ├── Deploy Grafana                                                 │
│  ├── Create dashboards                                              │
│  ├── Configure alerts                                               │
│  └── Test alerting                                                  │
│                                                                     │
│  DAY 7: Documentation & Training                                    │
│  ├── Update runbooks                                                │
│  ├── Document troubleshooting steps                                 │
│  └── Train operations team                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Docker Compose for On-Prem Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  # ===========================================
  # API GATEWAY
  # ===========================================
  nginx:
    image: nginx:alpine
    container_name: nginx-gateway
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./frontend:/usr/share/nginx/html
    depends_on:
      - p-gateway
      - ftd-integration
      - mobsf-server
      - analytics-dashboard
    networks:
      - frontend
      - backend
    restart: always

  # ===========================================
  # MICROSERVICES
  # ===========================================
  p-gateway:
    build: ./services/p-gateway
    container_name: p-gateway-simulator
    environment:
      - KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
      - MONGODB_URI=mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0
      - FTD_API_URL=http://ftd-integration:5000
    ports:
      - "8080:8080"
    networks:
      - backend
    restart: always

  ftd-integration:
    build: ./services/ftd-integration
    container_name: ftd-integration
    environment:
      - FTD_HOST=${FTD_HOST}
      - FTD_USERNAME=${FTD_USERNAME}
      - FTD_PASSWORD=${FTD_PASSWORD}
      - MONGODB_URI=mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0
      - VAULT_ADDR=http://vault:8200
    ports:
      - "5000:5000"
    networks:
      - backend
    restart: always

  mobsf-server:
    image: opensecurity/mobile-security-framework-mobsf:latest
    container_name: mobsf-server
    environment:
      - MOBSF_API_KEY=${MOBSF_API_KEY}
    ports:
      - "6000:8000"
    volumes:
      - mobsf-data:/home/mobsf/.MobSF
    networks:
      - backend
    restart: always

  analytics-dashboard:
    build: ./services/analytics-dashboard
    container_name: analytics-dashboard
    environment:
      - SPLUNK_HOST=splunk
      - SPLUNK_PORT=8089
      - SPLUNK_TOKEN=${SPLUNK_TOKEN}
      - MONGODB_URI=mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0
    ports:
      - "7000:7000"
    networks:
      - backend
    restart: always

  policy-enforcer:
    build: ./services/policy-enforcer
    container_name: policy-enforcer
    environment:
      - KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
      - MONGODB_URI=mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0
      - FTD_API_URL=http://ftd-integration:5000
    networks:
      - backend
    restart: always

  kafka-subscriber:
    build: ./services/kafka-subscriber
    container_name: kafka-subscriber
    environment:
      - KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
      - MONGODB_URI=mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0
      - SPLUNK_HEC_URL=http://splunk:8088
      - SPLUNK_HEC_TOKEN=${SPLUNK_HEC_TOKEN}
    networks:
      - backend
    restart: always

  # ===========================================
  # SERVERLESS FUNCTIONS (OpenFaaS Alternative)
  # ===========================================
  anomaly-detector:
    build: ./functions/anomaly-detector
    container_name: anomaly-detector
    environment:
      - MONGODB_URI=mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0
      - KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
    networks:
      - backend
    restart: always

  auto-blocker:
    build: ./functions/auto-blocker
    container_name: auto-blocker
    environment:
      - MONGODB_URI=mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0
      - FTD_API_URL=http://ftd-integration:5000
      - RABBITMQ_URL=amqp://rabbitmq:5672
    networks:
      - backend
    restart: always

  domain-blocker:
    build: ./functions/domain-blocker
    container_name: domain-blocker
    environment:
      - MONGODB_URI=mongodb://mongodb1:27017,mongodb2:27017,mongodb3:27017/subsec?replicaSet=rs0
      - FTD_API_URL=http://ftd-integration:5000
    networks:
      - backend
    restart: always

  # ===========================================
  # MESSAGE QUEUE
  # ===========================================
  kafka1:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka1
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka1:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
    depends_on:
      - zookeeper
    networks:
      - backend
    restart: always

  kafka2:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka2
    environment:
      KAFKA_BROKER_ID: 2
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka2:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
    depends_on:
      - zookeeper
    networks:
      - backend
    restart: always

  kafka3:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka3
    environment:
      KAFKA_BROKER_ID: 3
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka3:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 3
    depends_on:
      - zookeeper
    networks:
      - backend
    restart: always

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    networks:
      - backend
    restart: always

  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    networks:
      - backend
    restart: always

  # ===========================================
  # DATABASE
  # ===========================================
  mongodb1:
    image: mongo:6.0
    container_name: mongodb1
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongodb1-data:/data/db
    networks:
      - backend
    restart: always

  mongodb2:
    image: mongo:6.0
    container_name: mongodb2
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongodb2-data:/data/db
    networks:
      - backend
    restart: always

  mongodb3:
    image: mongo:6.0
    container_name: mongodb3
    command: mongod --replSet rs0 --bind_ip_all
    volumes:
      - mongodb3-data:/data/db
    networks:
      - backend
    restart: always

  # ===========================================
  # OBJECT STORAGE
  # ===========================================
  minio:
    image: minio/minio:latest
    container_name: minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio-data:/data
    networks:
      - backend
    restart: always

  # ===========================================
  # SECRETS MANAGEMENT
  # ===========================================
  vault:
    image: hashicorp/vault:latest
    container_name: vault
    ports:
      - "8200:8200"
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_TOKEN}
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
    cap_add:
      - IPC_LOCK
    networks:
      - backend
    restart: always

  # ===========================================
  # MONITORING
  # ===========================================
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - backend
    restart: always

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - backend
    restart: always

  # ===========================================
  # SPLUNK (Standalone for Dev/Small Deploy)
  # ===========================================
  splunk:
    image: splunk/splunk:latest
    container_name: splunk
    ports:
      - "8000:8000"   # Web UI
      - "8088:8088"   # HEC
      - "8089:8089"   # Management
      - "9997:9997"   # Forwarder
    environment:
      SPLUNK_START_ARGS: --accept-license
      SPLUNK_PASSWORD: ${SPLUNK_PASSWORD}
      SPLUNK_HEC_TOKEN: ${SPLUNK_HEC_TOKEN}
    volumes:
      - splunk-data:/opt/splunk/var
    networks:
      - backend
    restart: always

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

volumes:
  mongodb1-data:
  mongodb2-data:
  mongodb3-data:
  mobsf-data:
  minio-data:
  prometheus-data:
  grafana-data:
  splunk-data:
```

---

## Environment Variables (.env)

```bash
# Cisco FTD
FTD_HOST=192.168.1.100
FTD_USERNAME=admin
FTD_PASSWORD=your-ftd-password

# Splunk
SPLUNK_PASSWORD=ParentalControl@2024
SPLUNK_TOKEN=your-splunk-token
SPLUNK_HEC_TOKEN=your-hec-token

# MobSF
MOBSF_API_KEY=your-mobsf-api-key

# MinIO
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=your-minio-password

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=your-rabbitmq-password

# Vault
VAULT_TOKEN=your-vault-token

# Grafana
GRAFANA_PASSWORD=your-grafana-password

# MongoDB (if using auth)
MONGODB_USER=admin
MONGODB_PASSWORD=your-mongodb-password
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ON-PREM NETWORK TOPOLOGY                                             │
│                                                                                                          │
│   INTERNET                                                                                               │
│       │                                                                                                  │
│       ▼                                                                                                  │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                              FIREWALL / EDGE (VLAN 10 - 10.10.10.0/24)                            │ │
│   │                                                                                                    │ │
│   │   ┌─────────────────┐                      ┌─────────────────┐                                    │ │
│   │   │  Cisco FTD      │                      │  HAProxy LB     │                                    │ │
│   │   │  10.10.10.1     │                      │  10.10.10.10    │                                    │ │
│   │   │                 │                      │  10.10.10.11    │                                    │ │
│   │   │  Ext: Public IP │                      │  (HA Pair)      │                                    │ │
│   │   └─────────────────┘                      └─────────────────┘                                    │ │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                              │                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                              DMZ (VLAN 20 - 10.10.20.0/24)                                        │ │
│   │                                                                                                    │ │
│   │   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                               │ │
│   │   │  Web Frontend   │    │  API Gateway    │    │  VPN Gateway    │                               │ │
│   │   │  10.10.20.10    │    │  10.10.20.20    │    │  10.10.20.30    │                               │ │
│   │   │  (Nginx)        │    │  (Kong/Nginx)   │    │  (WireGuard)    │                               │ │
│   │   └─────────────────┘    └─────────────────┘    └─────────────────┘                               │ │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                              │                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                           APPLICATION (VLAN 30 - 10.10.30.0/24)                                   │ │
│   │                                                                                                    │ │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │ │
│   │   │ Docker Host │ │ Docker Host │ │ Docker Host │ │ OpenFaaS    │ │ MobSF       │                │ │
│   │   │ 10.10.30.10 │ │ 10.10.30.11 │ │ 10.10.30.12 │ │ 10.10.30.20 │ │ 10.10.30.30 │                │ │
│   │   │ (Swarm Mgr) │ │ (Worker)    │ │ (Worker)    │ │             │ │             │                │ │
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │ │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                              │                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                              DATA (VLAN 40 - 10.10.40.0/24)                                       │ │
│   │                                                                                                    │ │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │ │
│   │   │ MongoDB     │ │ MongoDB     │ │ MongoDB     │ │ Kafka       │ │ Kafka       │                │ │
│   │   │ 10.10.40.10 │ │ 10.10.40.11 │ │ 10.10.40.12 │ │ 10.10.40.20 │ │ 10.10.40.21 │                │ │
│   │   │ (Primary)   │ │ (Secondary) │ │ (Secondary) │ │             │ │             │                │ │
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘                │ │
│   │                                                                                                    │ │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                                                │ │
│   │   │ Kafka       │ │ MinIO       │ │ Vault       │                                                │ │
│   │   │ 10.10.40.22 │ │ 10.10.40.30 │ │ 10.10.40.40 │                                                │ │
│   │   │             │ │             │ │             │                                                │ │
│   │   └─────────────┘ └─────────────┘ └─────────────┘                                                │ │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                              │                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                           ANALYTICS (VLAN 50 - 10.10.50.0/24)                                     │ │
│   │                                                                                                    │ │
│   │   ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐                   │ │
│   │   │  Splunk Indexer     │    │  Splunk Search Head │    │  Prometheus/Grafana │                   │ │
│   │   │  10.10.50.10        │    │  10.10.50.20        │    │  10.10.50.30        │                   │ │
│   │   │  10.10.50.11        │    │                     │    │                     │                   │ │
│   │   └─────────────────────┘    └─────────────────────┘    └─────────────────────┘                   │ │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                              │                                                           │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                           MANAGEMENT (VLAN 100 - 10.10.100.0/24)                                  │ │
│   │                                                                                                    │ │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                        │ │
│   │   │ Jump Host   │    │ Ansible     │    │ GitLab      │    │ Jenkins     │                        │ │
│   │   │ 10.10.100.10│    │ 10.10.100.20│    │ 10.10.100.30│    │ 10.10.100.40│                        │ │
│   │   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘                        │ │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Hybrid Cloud Architecture (AWS + On-Prem)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    HYBRID DEPLOYMENT                                                    │
│                                                                                                          │
│   ┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐              │
│   │          ON-PREMISES                │         │              AWS                    │              │
│   │                                     │         │                                     │              │
│   │   ┌───────────────────────────┐    │         │    ┌───────────────────────────┐   │              │
│   │   │ Primary Production        │    │   VPN   │    │ DR / Overflow             │   │              │
│   │   │                           │◄───┼─────────┼───►│                           │   │              │
│   │   │ • All microservices       │    │  Site   │    │ • Backup services         │   │              │
│   │   │ • Primary database        │    │   to    │    │ • Read replicas           │   │              │
│   │   │ • Splunk Enterprise       │    │  Site   │    │ • Amplify frontend        │   │              │
│   │   │ • FTD Firewall            │    │         │    │ • CloudWatch logs         │   │              │
│   │   └───────────────────────────┘    │         │    └───────────────────────────┘   │              │
│   │                                     │         │                                     │              │
│   │   Use Cases:                        │         │    Use Cases:                       │              │
│   │   • Production traffic              │         │    • Disaster recovery              │              │
│   │   • Sensitive data processing       │         │    • Traffic overflow               │              │
│   │   • Regulatory compliance           │         │    • Global CDN (CloudFront)       │              │
│   │   • Low latency requirements        │         │    • Managed services backup        │              │
│   │                                     │         │                                     │              │
│   └─────────────────────────────────────┘         └─────────────────────────────────────┘              │
│                                                                                                          │
│   Data Sync:                                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐              │
│   │  MongoDB (On-Prem) ──── Change Streams ────► MongoDB Atlas (AWS)                    │              │
│   │  Splunk (On-Prem) ──── Forwarder ────────► Splunk Cloud (DR)                       │              │
│   │  MinIO (On-Prem) ────── mc mirror ────────► S3 (AWS Backup)                        │              │
│   └─────────────────────────────────────────────────────────────────────────────────────┘              │
│                                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Cost Comparison: AWS vs On-Prem

| Component | AWS Monthly | On-Prem (Amortized 3yr) | Notes |
|-----------|-------------|-------------------------|-------|
| Compute (ECS/Docker) | $145 | $50 | 3 servers @ $5K each |
| Database (DynamoDB/MongoDB) | $20 | $30 | 3-node cluster |
| Message Queue (MSK/Kafka) | $150 | $20 | 3-node cluster |
| Object Storage (S3/MinIO) | $10 | $10 | 4TB storage |
| Splunk | $0 (existing) | $0 (existing) | License already owned |
| Load Balancer | $20 | $5 | HAProxy on VM |
| NAT Gateway | $35 | $0 | Not needed on-prem |
| Secrets Manager | $5 | $0 | Vault is free |
| Monitoring | $10 | $0 | Prometheus/Grafana free |
| **Total** | **~$395/month** | **~$115/month** | 70% savings |

**Break-even point**: ~18 months (hardware cost / monthly savings)

---

## Checklist

### Pre-Deployment
- [ ] Hardware procurement and rack installation
- [ ] Network infrastructure (switches, cabling)
- [ ] Firewall configuration
- [ ] OS installation on all servers
- [ ] Docker/Kubernetes installation
- [ ] SSL certificates

### Deployment
- [ ] MongoDB cluster setup
- [ ] Kafka cluster setup
- [ ] Splunk Enterprise installation
- [ ] MinIO deployment
- [ ] Vault configuration
- [ ] Container registry setup
- [ ] Build all container images
- [ ] Deploy microservices
- [ ] Deploy serverless functions
- [ ] Deploy web frontend
- [ ] Configure API gateway

### Integration
- [ ] FTD API integration testing
- [ ] MobSF scan testing
- [ ] Kafka message flow testing
- [ ] Splunk HEC ingestion testing
- [ ] End-to-end traffic flow testing
- [ ] Parent dashboard testing

### Operations
- [ ] Monitoring dashboards created
- [ ] Alerting configured
- [ ] Backup procedures documented
- [ ] Runbooks written
- [ ] Team training completed
- [ ] DR procedures tested

---

## Next Steps

1. **Confirm server specifications** - Review hardware requirements
2. **Network design approval** - Finalize VLAN and firewall rules
3. **Procurement** - Order servers if not already available
4. **Schedule deployment** - Plan maintenance windows
5. **Assign team members** - Define roles and responsibilities

---

**Document Version**: 1.0
**Created**: January 2026
**Author**: Subscriber Security AI Team
