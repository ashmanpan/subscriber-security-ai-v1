# On-Premises Deployment Plan - Subscriber Security AI

## Overview

This folder contains all documentation, scripts, and configuration files needed to deploy the Subscriber Security AI system on-premises.

## Folder Structure

```
on-prem-deployment-plan/
├── README.md                    # This file
├── docker-compose.yml           # Main Docker Compose configuration
├── docker-compose.dev.yml       # Development/testing configuration
├── .env.example                 # Environment variables template
│
├── docs/
│   ├── ON_PREM_DEPLOYMENT.md    # Detailed deployment guide
│   ├── IMAGE_REGISTRY.md        # Container image sources
│   ├── NETWORK_ARCHITECTURE.md  # Network topology and VLANs
│   └── HARDWARE_REQUIREMENTS.md # Server specifications
│
├── scripts/
│   ├── pull-ecr-images.sh       # Pull images from AWS ECR
│   ├── setup-mongodb.sh         # MongoDB cluster setup
│   ├── setup-kafka.sh           # Kafka cluster setup
│   ├── setup-vault.sh           # HashiCorp Vault setup
│   ├── init-databases.sh        # Initialize databases
│   └── backup.sh                # Backup script
│
├── docker/
│   ├── Dockerfile.anomaly-detector
│   ├── Dockerfile.auto-blocker
│   ├── Dockerfile.domain-blocker
│   └── Dockerfile.traffic-generator
│
├── nginx/
│   ├── nginx.conf               # Main Nginx configuration
│   └── ssl/                     # SSL certificates (gitignored)
│
└── prometheus/
    ├── prometheus.yml           # Prometheus configuration
    └── alerts.yml               # Alert rules
```

## Quick Start

### 1. Prerequisites

- Docker 24.0+ and Docker Compose 2.20+
- 16+ GB RAM (minimum for single-node testing)
- 100 GB+ disk space
- Access to AWS ECR (for custom images)

### 2. Setup

```bash
# Clone and navigate
cd on-prem-deployment-plan

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Pull ECR images (requires AWS credentials)
./scripts/pull-ecr-images.sh

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Access Services

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Web Dashboard | https://localhost | - |
| Splunk | http://localhost:8000 | admin / (from .env) |
| Grafana | http://localhost:3000 | admin / (from .env) |
| RabbitMQ | http://localhost:15672 | (from .env) |
| MinIO Console | http://localhost:9001 | (from .env) |

## Documentation

- [Detailed Deployment Guide](docs/ON_PREM_DEPLOYMENT.md)
- [Image Registry Info](docs/IMAGE_REGISTRY.md)
- [Network Architecture](docs/NETWORK_ARCHITECTURE.md)
- [Hardware Requirements](docs/HARDWARE_REQUIREMENTS.md)

## Architecture

```
                                    ┌─────────────────┐
                                    │   Load Balancer │
                                    │   (Nginx/HAProxy)│
                                    └────────┬────────┘
                                             │
        ┌────────────────────────────────────┼────────────────────────────────────┐
        │                                    │                                    │
        ▼                                    ▼                                    ▼
┌───────────────┐                  ┌───────────────┐                    ┌───────────────┐
│  P-Gateway    │                  │  FTD          │                    │  MobSF        │
│  Simulator    │                  │  Integration  │                    │  Server       │
└───────┬───────┘                  └───────┬───────┘                    └───────┬───────┘
        │                                  │                                    │
        └──────────────────────────────────┼────────────────────────────────────┘
                                           │
                                           ▼
                                  ┌───────────────┐
                                  │    Kafka      │
                                  │   Cluster     │
                                  └───────┬───────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
           │   MongoDB     │     │    Splunk     │     │  Prometheus   │
           │   Cluster     │     │   Enterprise  │     │  + Grafana    │
           └───────────────┘     └───────────────┘     └───────────────┘
```

## Support

For issues or questions, check:
1. [Troubleshooting Guide](docs/ON_PREM_DEPLOYMENT.md#troubleshooting)
2. Container logs: `docker-compose logs -f <service>`
3. System metrics: Grafana dashboards

---

**Version:** 1.0
**Last Updated:** January 2026
