# Container Image Registry

## Overview

This document lists all container images used in the Subscriber Security AI system and their sources.

## ECR Images (Custom Built)

These images are built specifically for this project and stored in AWS ECR.

| Image | ECR URI | Description |
|-------|---------|-------------|
| p-gateway-simulator | `567097740753.dkr.ecr.ap-south-1.amazonaws.com/parental-control:p-gateway-simulator` | P-Gateway traffic simulator |
| ftd-integration | `567097740753.dkr.ecr.ap-south-1.amazonaws.com/parental-control:ftd-integration` | Cisco FTD API integration |
| analytics-dashboard | `567097740753.dkr.ecr.ap-south-1.amazonaws.com/parental-control:analytics-dashboard` | Analytics and Splunk integration |
| kafka-subscriber | `567097740753.dkr.ecr.ap-south-1.amazonaws.com/parental-control:kafka-subscriber` | Kafka event consumer |
| policy-enforcer | `567097740753.dkr.ecr.ap-south-1.amazonaws.com/parental-control:policy-enforcer` | Policy enforcement service |

### Pulling ECR Images

```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin 567097740753.dkr.ecr.ap-south-1.amazonaws.com

# Pull all images
./scripts/pull-ecr-images.sh
```

## Docker Hub Images (Public)

These are public images pulled from Docker Hub.

### Application Images

| Image | Docker Hub | Version | Description |
|-------|------------|---------|-------------|
| MobSF | `opensecurity/mobile-security-framework-mobsf` | latest | Mobile security scanning |

### Infrastructure Images

| Image | Docker Hub | Version | Description |
|-------|------------|---------|-------------|
| MongoDB | `mongo` | 6.0 | Document database |
| Kafka | `confluentinc/cp-kafka` | 7.5.0 | Message streaming |
| ZooKeeper | `confluentinc/cp-zookeeper` | 7.5.0 | Kafka coordination |
| RabbitMQ | `rabbitmq` | 3-management | Message queue |
| Nginx | `nginx` | alpine | Web server/proxy |
| MinIO | `minio/minio` | latest | S3-compatible storage |
| Vault | `hashicorp/vault` | latest | Secrets management |
| Splunk | `splunk/splunk` | latest | Log analytics |

### Monitoring Images

| Image | Docker Hub | Version | Description |
|-------|------------|---------|-------------|
| Prometheus | `prom/prometheus` | latest | Metrics collection |
| Grafana | `grafana/grafana` | latest | Visualization |
| Alertmanager | `prom/alertmanager` | latest | Alert routing |

## Local Registry (Optional)

For air-gapped environments, set up a local registry:

```bash
# Start local registry
docker run -d -p 5000:5000 --name registry registry:2

# Re-tag and push images
docker tag 567097740753.dkr.ecr.ap-south-1.amazonaws.com/parental-control:p-gateway-simulator \
  localhost:5000/parental-control:p-gateway-simulator

docker push localhost:5000/parental-control:p-gateway-simulator
```

## Image Sizes

| Image | Size (Compressed) |
|-------|-------------------|
| p-gateway-simulator | ~150 MB |
| ftd-integration | ~120 MB |
| analytics-dashboard | ~130 MB |
| kafka-subscriber | ~100 MB |
| policy-enforcer | ~110 MB |
| mobsf | ~2.5 GB |
| splunk | ~1.5 GB |
| mongo | ~700 MB |
| kafka | ~600 MB |

**Total disk space needed**: ~8-10 GB (compressed)

## Version Pinning

For production deployments, pin image versions:

```yaml
# docker-compose.yml
services:
  mongodb:
    image: mongo:6.0.12  # Pin specific version
```

## Security Scanning

Scan images before deployment:

```bash
# Using Trivy
trivy image opensecurity/mobile-security-framework-mobsf:latest

# Using Docker Scout
docker scout cves mongo:6.0
```

## Update Policy

| Image Type | Update Frequency | Notes |
|------------|------------------|-------|
| ECR (Custom) | Per release | Coordinated with code changes |
| Infrastructure | Quarterly | Test in staging first |
| Security (MobSF) | Monthly | Security patches |
| Monitoring | Quarterly | Feature updates |
