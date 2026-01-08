# Network Architecture

## Overview

This document describes the network topology for the on-premises deployment of Subscriber Security AI.

## Network Diagram

```
                                    INTERNET
                                        │
                                        │
                              ┌─────────▼─────────┐
                              │   EDGE FIREWALL   │
                              │   (Cisco FTD)     │
                              │   Public IP       │
                              └─────────┬─────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
           ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
           │      DMZ        │ │   APPLICATION   │ │    DATA TIER    │
           │   VLAN 20       │ │    VLAN 30      │ │    VLAN 40      │
           │ 10.10.20.0/24   │ │ 10.10.30.0/24   │ │ 10.10.40.0/24   │
           └─────────────────┘ └─────────────────┘ └─────────────────┘
                    │                   │                   │
                    └───────────────────┼───────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │   MANAGEMENT      │
                              │    VLAN 100       │
                              │ 10.10.100.0/24    │
                              └───────────────────┘
```

## VLAN Configuration

### VLAN 10 - Edge/Firewall (10.10.10.0/24)

| Device | IP Address | Purpose |
|--------|------------|---------|
| Cisco FTD | 10.10.10.1 | Primary firewall |
| HAProxy 1 | 10.10.10.10 | Load balancer (primary) |
| HAProxy 2 | 10.10.10.11 | Load balancer (standby) |
| VIP | 10.10.10.100 | Virtual IP for HA |

### VLAN 20 - DMZ (10.10.20.0/24)

| Device | IP Address | Purpose |
|--------|------------|---------|
| Nginx 1 | 10.10.20.10 | Web server/reverse proxy |
| Nginx 2 | 10.10.20.11 | Web server/reverse proxy |
| API Gateway | 10.10.20.20 | Kong/Nginx API gateway |
| VPN Gateway | 10.10.20.30 | WireGuard VPN |

### VLAN 30 - Application (10.10.30.0/24)

| Device | IP Address | Purpose |
|--------|------------|---------|
| Docker Host 1 | 10.10.30.10 | Swarm manager |
| Docker Host 2 | 10.10.30.11 | Swarm worker |
| Docker Host 3 | 10.10.30.12 | Swarm worker |
| OpenFaaS | 10.10.30.20 | Serverless functions |
| MobSF | 10.10.30.30 | Mobile security scanning |

### VLAN 40 - Data (10.10.40.0/24)

| Device | IP Address | Purpose |
|--------|------------|---------|
| MongoDB 1 | 10.10.40.10 | Primary database |
| MongoDB 2 | 10.10.40.11 | Secondary database |
| MongoDB 3 | 10.10.40.12 | Secondary database |
| Kafka 1 | 10.10.40.20 | Kafka broker |
| Kafka 2 | 10.10.40.21 | Kafka broker |
| Kafka 3 | 10.10.40.22 | Kafka broker |
| ZooKeeper | 10.10.40.25 | Kafka coordination |
| MinIO | 10.10.40.30 | Object storage |
| Vault | 10.10.40.40 | Secrets management |

### VLAN 50 - Analytics (10.10.50.0/24)

| Device | IP Address | Purpose |
|--------|------------|---------|
| Splunk Indexer 1 | 10.10.50.10 | Log indexing |
| Splunk Indexer 2 | 10.10.50.11 | Log indexing |
| Splunk Search Head | 10.10.50.20 | Search and UI |
| Prometheus | 10.10.50.30 | Metrics collection |
| Grafana | 10.10.50.31 | Visualization |

### VLAN 100 - Management (10.10.100.0/24)

| Device | IP Address | Purpose |
|--------|------------|---------|
| Jump Host | 10.10.100.10 | SSH bastion |
| Ansible | 10.10.100.20 | Configuration management |
| GitLab | 10.10.100.30 | Source control & CI/CD |
| Jenkins | 10.10.100.40 | CI/CD pipelines |

## Firewall Rules

### Internet → DMZ

| Source | Destination | Port | Protocol | Action |
|--------|-------------|------|----------|--------|
| Any | 10.10.20.10-11 | 80, 443 | TCP | Allow |
| Admin IPs | 10.10.20.30 | 51820 | UDP | Allow |
| Any | Any | Any | Any | Deny |

### DMZ → Application

| Source | Destination | Port | Protocol | Action |
|--------|-------------|------|----------|--------|
| 10.10.20.0/24 | 10.10.30.0/24 | 8080 | TCP | Allow (P-Gateway) |
| 10.10.20.0/24 | 10.10.30.0/24 | 5000 | TCP | Allow (FTD API) |
| 10.10.20.0/24 | 10.10.30.0/24 | 6000 | TCP | Allow (MobSF) |
| 10.10.20.0/24 | 10.10.30.0/24 | 7000 | TCP | Allow (Analytics) |
| Any | Any | Any | Any | Deny |

### Application → Data

| Source | Destination | Port | Protocol | Action |
|--------|-------------|------|----------|--------|
| 10.10.30.0/24 | 10.10.40.10-12 | 27017 | TCP | Allow (MongoDB) |
| 10.10.30.0/24 | 10.10.40.20-22 | 9092 | TCP | Allow (Kafka) |
| 10.10.30.0/24 | 10.10.40.25 | 2181 | TCP | Allow (ZooKeeper) |
| 10.10.30.0/24 | 10.10.40.30 | 9000 | TCP | Allow (MinIO) |
| 10.10.30.0/24 | 10.10.40.40 | 8200 | TCP | Allow (Vault) |
| Any | Any | Any | Any | Deny |

### Application → Analytics

| Source | Destination | Port | Protocol | Action |
|--------|-------------|------|----------|--------|
| 10.10.30.0/24 | 10.10.50.10-11 | 9997 | TCP | Allow (Splunk Fwd) |
| 10.10.30.0/24 | 10.10.50.20 | 8088 | TCP | Allow (HEC) |
| 10.10.30.0/24 | 10.10.50.30 | 9090 | TCP | Allow (Prometheus) |
| Any | Any | Any | Any | Deny |

### Management → All

| Source | Destination | Port | Protocol | Action |
|--------|-------------|------|----------|--------|
| 10.10.100.0/24 | Any | 22 | TCP | Allow (SSH) |
| 10.10.100.0/24 | Any | 443 | TCP | Allow (HTTPS) |
| 10.10.100.10 | Any | Any | Any | Allow (Jump Host) |

## DNS Configuration

### Internal DNS Records

```
; Forward Zone: subsec.local
nginx.subsec.local.        IN A    10.10.20.10
api.subsec.local.          IN A    10.10.20.20
vpn.subsec.local.          IN A    10.10.20.30

mongodb.subsec.local.      IN A    10.10.40.10
mongodb.subsec.local.      IN A    10.10.40.11
mongodb.subsec.local.      IN A    10.10.40.12

kafka.subsec.local.        IN A    10.10.40.20
kafka.subsec.local.        IN A    10.10.40.21
kafka.subsec.local.        IN A    10.10.40.22

splunk.subsec.local.       IN A    10.10.50.20
grafana.subsec.local.      IN A    10.10.50.31
```

## Load Balancing

### HAProxy Configuration

```
frontend http_front
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/subsec.pem
    default_backend nginx_back

backend nginx_back
    balance roundrobin
    server nginx1 10.10.20.10:80 check
    server nginx2 10.10.20.11:80 check backup
```

## Network Security

### Segmentation Rules

1. **DMZ is isolated** - Can only communicate with Application tier on specific ports
2. **Data tier is protected** - Only accessible from Application tier
3. **Management is restricted** - Only from Jump Host
4. **Analytics is internal** - No direct internet access

### Encryption

- All external traffic: TLS 1.2+
- Internal API traffic: TLS (optional, recommended)
- Database connections: TLS with certificates
- Kafka: SASL/TLS

## Bandwidth Requirements

| Traffic Type | Estimated Bandwidth |
|--------------|---------------------|
| Web traffic | 100 Mbps |
| API traffic | 200 Mbps |
| Database replication | 500 Mbps |
| Kafka streaming | 1 Gbps |
| Splunk forwarding | 200 Mbps |

**Total recommended**: 10 Gbps backbone between VLANs
