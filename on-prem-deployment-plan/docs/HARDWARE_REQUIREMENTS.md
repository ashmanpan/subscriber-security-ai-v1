# Hardware Requirements

## Overview

This document outlines the hardware specifications for deploying Subscriber Security AI on-premises.

## Server Specifications

### Minimum Configuration (Development/Testing)

| Role | Quantity | CPU | RAM | Storage | Network |
|------|----------|-----|-----|---------|---------|
| All-in-one | 1 | 16 cores | 64 GB | 1 TB SSD | 1 Gbps |

**Note**: Single server deployment is only suitable for development and testing.

### Recommended Configuration (Production - Small)

| Role | Quantity | CPU | RAM | Storage | Network |
|------|----------|-----|-----|---------|---------|
| Docker Host | 3 | 8 cores | 32 GB | 500 GB SSD | 10 Gbps |
| Database (MongoDB) | 3 | 8 cores | 64 GB | 1 TB NVMe | 10 Gbps |
| Kafka | 3 | 4 cores | 16 GB | 500 GB SSD | 10 Gbps |
| Splunk | 2 | 16 cores | 64 GB | 2 TB SSD | 10 Gbps |
| Load Balancer | 2 | 4 cores | 8 GB | 100 GB SSD | 10 Gbps |
| Monitoring | 1 | 4 cores | 16 GB | 500 GB SSD | 1 Gbps |
| Storage (MinIO) | 2 | 4 cores | 16 GB | 4 TB HDD | 10 Gbps |

**Total: 16 servers**

### Enterprise Configuration (Production - Large)

| Role | Quantity | CPU | RAM | Storage | Network |
|------|----------|-----|-----|---------|---------|
| Docker Host | 6 | 16 cores | 64 GB | 1 TB NVMe | 25 Gbps |
| Database (MongoDB) | 5 | 16 cores | 128 GB | 2 TB NVMe | 25 Gbps |
| Kafka | 5 | 8 cores | 32 GB | 1 TB SSD | 25 Gbps |
| Splunk Indexer | 4 | 32 cores | 128 GB | 8 TB SSD | 25 Gbps |
| Splunk Search | 2 | 16 cores | 64 GB | 1 TB SSD | 25 Gbps |
| Load Balancer | 2 | 8 cores | 16 GB | 200 GB SSD | 25 Gbps |
| Monitoring | 2 | 8 cores | 32 GB | 1 TB SSD | 10 Gbps |
| Storage (MinIO) | 4 | 8 cores | 32 GB | 20 TB HDD | 25 Gbps |

**Total: 30 servers**

## Server Specifications by Role

### Docker/Kubernetes Hosts

```
Purpose: Run containerized microservices
CPU: Intel Xeon Gold 6248R or AMD EPYC 7402P
RAM: 32-64 GB DDR4 ECC
Storage:
  - OS: 100 GB SSD
  - Docker: 400 GB NVMe (for images and containers)
Network: Dual 10/25 Gbps NIC
```

### MongoDB Servers

```
Purpose: Primary database cluster
CPU: Intel Xeon Gold 6248R or AMD EPYC 7402P
RAM: 64-128 GB DDR4 ECC
Storage:
  - OS: 100 GB SSD
  - Data: 1-2 TB NVMe (high IOPS)
  - Journal: 200 GB NVMe (separate disk)
Network: Dual 10/25 Gbps NIC
```

### Kafka Servers

```
Purpose: Message streaming cluster
CPU: Intel Xeon Silver 4214R or AMD EPYC 7302P
RAM: 16-32 GB DDR4 ECC
Storage:
  - OS: 100 GB SSD
  - Logs: 500 GB - 1 TB SSD (sequential writes)
Network: Dual 10 Gbps NIC
```

### Splunk Servers

```
Purpose: Log analytics and MLTK
CPU: Intel Xeon Gold 6248R or AMD EPYC 7452 (32 cores)
RAM: 64-128 GB DDR4 ECC
Storage:
  - OS: 100 GB SSD
  - Hot: 2 TB NVMe (recent data)
  - Warm: 8 TB SSD (older data)
Network: Dual 10/25 Gbps NIC
```

### Load Balancer Servers

```
Purpose: HAProxy/Nginx load balancing
CPU: Intel Xeon Silver 4210R or AMD EPYC 7262
RAM: 8-16 GB DDR4 ECC
Storage:
  - OS: 100 GB SSD
Network: Dual 10 Gbps NIC (critical for throughput)
```

## Network Equipment

### Switches

| Device | Quantity | Ports | Speed |
|--------|----------|-------|-------|
| Core Switch | 2 | 48 | 25 Gbps |
| Distribution Switch | 4 | 24 | 10 Gbps |
| ToR Switch | 4 | 48 | 1/10 Gbps |

### Firewall

| Device | Quantity | Throughput |
|--------|----------|------------|
| Cisco FTD 4100 | 2 (HA) | 20 Gbps |

### Recommended Vendors

- **Switches**: Cisco Nexus 9000, Arista 7050X, Dell PowerSwitch
- **Firewall**: Cisco Firepower, Palo Alto PA-5200
- **Servers**: Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem

## Storage Requirements

### Capacity Planning

| Data Type | Daily Growth | Retention | Total Storage |
|-----------|--------------|-----------|---------------|
| Traffic logs | 10 GB | 90 days | 900 GB |
| Anomaly data | 1 GB | 365 days | 365 GB |
| MobSF scans | 5 GB | 180 days | 900 GB |
| Splunk indexes | 20 GB | 90 days | 1.8 TB |
| Kafka logs | 15 GB | 7 days | 105 GB |
| MongoDB data | 5 GB | Forever | 500 GB+ |
| MinIO objects | 10 GB | 365 days | 3.6 TB |

**Total Storage Needed**: ~10 TB (with growth buffer: 15 TB)

### Storage Tiers

| Tier | Use Case | Type | IOPS |
|------|----------|------|------|
| Hot | Active data, databases | NVMe | 100K+ |
| Warm | Recent logs, indexes | SSD | 10K-50K |
| Cold | Archives, backups | HDD | 1K-5K |

## Power and Cooling

### Power Requirements

| Configuration | Servers | Power per Server | Total Power |
|---------------|---------|------------------|-------------|
| Small (16 servers) | 16 | 500W avg | 8 kW |
| Large (30 servers) | 30 | 750W avg | 22.5 kW |

**UPS Recommendation**: 2N redundancy with 15-minute runtime

### Cooling

| Configuration | Heat Output | Cooling Required |
|---------------|-------------|------------------|
| Small | 27,000 BTU/hr | 2.5 tons |
| Large | 77,000 BTU/hr | 6.5 tons |

## Rack Space

### Small Configuration

```
Rack 1 (42U):
├── 1U - Patch Panel
├── 2U - Core Switch
├── 2U - Distribution Switch
├── 1U - Firewall
├── 2U - Load Balancers (2x)
├── 6U - Docker Hosts (3x 2U)
├── 6U - MongoDB Servers (3x 2U)
├── 6U - Kafka Servers (3x 2U)
├── 4U - Splunk Servers (2x 2U)
├── 2U - Monitoring Server
├── 4U - MinIO Storage (2x 2U)
├── 4U - UPS
└── 2U - PDU
```

### Large Configuration

Requires 2-3 racks.

## Cost Estimates

### Hardware Costs (USD)

| Component | Small Config | Large Config |
|-----------|--------------|--------------|
| Servers | $150,000 | $400,000 |
| Storage | $30,000 | $100,000 |
| Network | $50,000 | $150,000 |
| Firewall | $25,000 | $75,000 |
| UPS/Power | $15,000 | $40,000 |
| Rack/Cooling | $10,000 | $35,000 |
| **Total** | **$280,000** | **$800,000** |

### Operational Costs (Monthly)

| Item | Small Config | Large Config |
|------|--------------|--------------|
| Power | $1,000 | $3,000 |
| Cooling | $500 | $1,500 |
| Maintenance | $2,000 | $5,000 |
| Licensing (Splunk) | $5,000 | $15,000 |
| **Total** | **$8,500** | **$24,500** |

## Virtualization Option

For smaller deployments, consider virtualization:

### VMware vSphere Configuration

| Physical Host | VMs |
|---------------|-----|
| Host 1 (256 GB RAM) | MongoDB x3, Kafka x3 |
| Host 2 (256 GB RAM) | Docker x3, Monitoring |
| Host 3 (256 GB RAM) | Splunk x2, MinIO x2 |

**Benefits**:
- Reduced hardware cost
- Easier management
- Flexible scaling

**Requirements**:
- VMware vSphere Enterprise Plus
- vSAN or external SAN storage
- Minimum 3 hosts for HA

## Procurement Checklist

- [ ] Server hardware (CPU, RAM, NIC)
- [ ] Storage (NVMe, SSD, HDD)
- [ ] Network switches
- [ ] Firewall appliances
- [ ] Cables (fiber, copper)
- [ ] Racks and mounting hardware
- [ ] UPS and PDUs
- [ ] Cooling infrastructure
- [ ] Software licenses (VMware, Splunk)
