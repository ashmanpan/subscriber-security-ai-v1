# Splunk Architecture Analysis & Remediation Plan

## Current State Analysis

### 1. Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VPC: pc-prod-vpc (10.0.0.0/16)                        │
│                           vpc-0dfa00e0512a0e43b                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐           │
│  │    PUBLIC SUBNETS            │    │    PRIVATE SUBNETS           │           │
│  │    (Route to IGW)            │    │    (Route to NAT)            │           │
│  ├──────────────────────────────┤    ├──────────────────────────────┤           │
│  │                              │    │                              │           │
│  │  subnet-1: 10.0.101.0/24    │    │  subnet-1: 10.0.1.0/24      │           │
│  │  (ap-south-1a)               │    │  (ap-south-1a)               │           │
│  │                              │    │                              │           │
│  │  ┌────────────────────┐     │    │  ┌────────────────────┐     │           │
│  │  │  Jump Host         │     │    │  │  SPLUNK ❌         │     │           │
│  │  │  10.0.101.201      │     │    │  │  10.0.1.200        │     │           │
│  │  │  43.205.208.223    │─────┼────┼──│  EIP: 13.233.3.248 │     │           │
│  │  │  (PUBLIC IP WORKS) │     │    │  │  (EIP DOESN'T WORK)│     │           │
│  │  └────────────────────┘     │    │  └────────────────────┘     │           │
│  │                              │    │                              │           │
│  │  subnet-2: 10.0.102.0/24    │    │  subnet-2: 10.0.2.0/24      │           │
│  │  subnet-3: 10.0.103.0/24    │    │  subnet-3: 10.0.3.0/24      │           │
│  │                              │    │                              │           │
│  └──────────────────────────────┘    └──────────────────────────────┘           │
│                                                                                  │
│  Route Tables:                                                                   │
│  - Public: 0.0.0.0/0 → igw-0ab59f90987dcd7cc (Internet Gateway)                │
│  - Private: 0.0.0.0/0 → nat-0eda168013f8639d1 (NAT Gateway)                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2. Current Splunk Instance Details

| Property | Value | Issue |
|----------|-------|-------|
| Instance ID | i-094065076a0313703 | - |
| Instance Type | t3.medium | OK |
| Private IP | 10.0.1.200 | OK |
| Public IP (EIP) | 13.233.3.248 | ❌ **DOESN'T WORK** - Private subnet routes through NAT |
| Subnet | subnet-0f02112b2e6a7a65f (PRIVATE) | ❌ **ROOT CAUSE** |
| SSH Key | k8s-script-mumbai | ❌ **KEY NOT AVAILABLE** |
| Root Volume | 8 GB (gp2) | ❌ **TOO SMALL** for MLTK |
| Security Group | sg-0b24c0ba9ffc05aff | OK |

### 3. Identified Issues

#### Issue #1: PRIVATE SUBNET (Critical)
- **Problem**: Splunk is in `pc-prod-private-subnet-1` (10.0.1.0/24)
- **Impact**:
  - EIP assigned but traffic routes through NAT Gateway (outbound only)
  - Cannot receive inbound traffic from internet
  - UI not accessible even with EIP
- **Why it matters**: Splunk UI needs to be accessible for administration

#### Issue #2: SSH KEY NOT AVAILABLE (Critical)
- **Problem**: Instance uses `k8s-script-mumbai` key which is not available locally
- **Impact**: Cannot SSH to instance to install MLTK, troubleshoot, or configure
- **Workaround attempted**: EC2 Instance Connect - but key only valid for 60 seconds

#### Issue #3: DISK SIZE TOO SMALL (High)
- **Problem**: Only 8 GB root volume, was at 90% usage
- **Impact**:
  - Cannot install MLTK + DLTK (needs ~2-3 GB)
  - Cannot store ML models
  - Risk of Splunk failure due to disk full

#### Issue #4: MLTK NOT INSTALLED (High)
- **Problem**: Real MLTK not installed, only placeholder app exists
- **Impact**: ML features not functional

---

## Proposed Solutions

### Option A: Deploy New Splunk Instance in PUBLIC Subnet (Recommended)

**Advantages:**
- Clean slate with proper configuration
- Proper SSH key we control
- Larger disk for MLTK/DLTK
- Direct internet access for UI
- SSM Agent installed for remote management

**New Instance Specifications:**
| Property | Value |
|----------|-------|
| Instance Type | t3.large (2 vCPU, 8 GB RAM for ML) |
| Subnet | pc-prod-public-subnet-1 (10.0.101.0/24) |
| Root Volume | 50 GB gp3 |
| SSH Key | pc-prod-jumphost-key (already have) |
| Security Group | Existing + SSM access |
| SSM Agent | Pre-installed |
| MLTK | Pre-installed from Splunkbase |

**Steps:**
1. Create new Splunk instance in public subnet
2. Install Splunk Enterprise with SSM Agent
3. Install MLTK + Python for Scientific Computing
4. Install Deep Learning Toolkit
5. Migrate data from old instance (if any)
6. Update HEC endpoints in application
7. Terminate old instance
8. Update documentation

---

### Option B: Move Existing Instance to Public Subnet

**Note:** EC2 instances cannot be moved between subnets. Would need to:
1. Create AMI from existing instance
2. Launch new instance from AMI in public subnet
3. Associate new EIP

**Disadvantages:**
- Still stuck with 8 GB disk
- Still don't have SSH key
- More complex migration

---

### Option C: Keep in Private Subnet with ALB

**Approach:** Put Application Load Balancer in public subnet pointing to Splunk

**Disadvantages:**
- Added complexity and cost
- Still need SSH access for MLTK installation
- Overkill for single instance

---

## Recommended Action Plan: Option A (New Instance)

### Phase 1: Preparation
- [ ] Create user data script with Splunk + SSM + MLTK installation
- [ ] Identify AMI (Ubuntu 22.04 LTS)
- [ ] Plan security group rules

### Phase 2: Deploy New Splunk Instance
- [ ] Launch t3.large in pc-prod-public-subnet-1
- [ ] 50 GB gp3 root volume
- [ ] Use pc-prod-jumphost-key
- [ ] Assign Elastic IP
- [ ] Wait for Splunk installation to complete

### Phase 3: Install MLTK Components
- [ ] SSH to new instance
- [ ] Download Python for Scientific Computing from Splunkbase
- [ ] Download MLTK from Splunkbase
- [ ] Download Deep Learning Toolkit
- [ ] Install and configure
- [ ] Verify ML commands work

### Phase 4: Configuration & Migration
- [ ] Configure Splunk (admin password, HEC tokens)
- [ ] Create same indexes as old instance
- [ ] Update application HEC endpoint
- [ ] Test data ingestion

### Phase 5: Cleanup
- [ ] Verify new Splunk working
- [ ] Terminate old Splunk instance
- [ ] Release old EIP
- [ ] Update all documentation

---

## Infrastructure Summary After Fix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VPC: pc-prod-vpc (10.0.0.0/16)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PUBLIC SUBNET: pc-prod-public-subnet-1 (10.0.101.0/24)                     │
│  Route: 0.0.0.0/0 → Internet Gateway                                        │
│                                                                              │
│  ┌────────────────────────┐     ┌────────────────────────┐                  │
│  │  Jump Host             │     │  NEW SPLUNK ✅         │                  │
│  │  10.0.101.201          │     │  10.0.101.xxx          │                  │
│  │  43.205.208.223        │     │  EIP: xxx.xxx.xxx.xxx  │                  │
│  │  SSH Key: jumphost     │     │  SSH Key: jumphost     │                  │
│  └────────────────────────┘     │  SSM: Enabled          │                  │
│                                  │  Disk: 50 GB           │                  │
│                                  │  MLTK: Installed ✅    │                  │
│                                  │  DLTK: Installed ✅    │                  │
│                                  └────────────────────────┘                  │
│                                                                              │
│  Access Methods:                                                             │
│  1. Splunk UI: https://<EIP>:8000 (direct)                                 │
│  2. SSH: ssh -i jumphost-key.pem ubuntu@<EIP>                              │
│  3. SSM: aws ssm start-session --target <instance-id>                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cost Comparison

| Resource | Old Setup | New Setup |
|----------|-----------|-----------|
| Instance | t3.medium ($0.0416/hr) | t3.large ($0.0832/hr) |
| Storage | 8 GB gp2 ($0.80/mo) | 50 GB gp3 ($4.00/mo) |
| EIP | $3.65/mo (unused since private) | $3.65/mo (active) |
| **Monthly** | ~$35 | ~$70 |

**Note:** The old EIP was wasted money since it didn't work in private subnet.

---

## Decision Required

**Proceed with Option A (New Instance in Public Subnet)?**

- Yes → I will execute the plan
- No → Specify alternative approach
