# CLAUDE.md - Project Guidelines for AI Assistants

## AWS Security Best Practices

### 1. Security Groups - NEVER Allow 0.0.0.0/0

**CRITICAL**: Never create or allow security group rules with `0.0.0.0/0` (open to internet) for:
- SSH (port 22)
- RDP (port 3389)
- Database ports (3306, 5432, 27017, 6379, etc.)
- Admin interfaces (Splunk 8000, Elasticsearch 9200, etc.)
- Any internal service ports

**Allowed exceptions (with caution)**:
- HTTP/HTTPS (80/443) for public-facing web servers behind load balancers
- Bastion/Jump hosts SSH - but prefer restricting to known admin IP ranges

**Best practices**:
```bash
# Check for open security groups
aws ec2 describe-security-groups --region ap-south-1 \
  --filters "Name=ip-permission.cidr,Values=0.0.0.0/0" \
  --query 'SecurityGroups[*].[GroupId,GroupName]'

# Restrict to VPC CIDR instead
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp --port 22 --cidr 10.0.0.0/16
```

**Access pattern**: Use SSH tunnels or AWS Systems Manager Session Manager for accessing internal services.

### 2. S3 Buckets - NEVER Allow Public Access

**CRITICAL**: Never create S3 buckets with public access enabled.

**Always enable**:
- Block Public ACLs
- Ignore Public ACLs
- Block Public Policy
- Restrict Public Buckets

**Best practices**:
```bash
# Check bucket public access settings
aws s3api get-public-access-block --bucket BUCKET_NAME

# Enable all public access blocks
aws s3api put-public-access-block --bucket BUCKET_NAME \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

**For public content**: Use CloudFront with Origin Access Control (OAC) instead of making buckets public.

### 3. Secrets Management

- Never hardcode credentials in code
- Use AWS Secrets Manager or Parameter Store
- Never commit `.pem` files or API keys to git
- Add sensitive patterns to `.gitignore`:
  ```
  keys/
  *.pem
  .env
  credentials.json
  ```

### 4. IAM Best Practices

- Use least-privilege permissions
- Never use root account for daily operations
- Enable MFA for all human users
- Use IAM roles for EC2/Lambda instead of access keys

## Project-Specific Notes

### Security Groups in This Project

| Security Group | Purpose | Required Access |
|----------------|---------|-----------------|
| sg-0af70dbcaa331bf40 | Splunk VM | VPC only (10.0.0.0/16) |
| pc-prod-jumphost-sg | Bastion host | Restrict to admin IPs |

### Splunk Access

Access Splunk via SSH tunnel through bastion:
```bash
ssh -i keys/pc-prod-jumphost-key.pem -L 8000:10.0.101.28:8000 ubuntu@<BASTION_IP>
# Then access: http://localhost:8000
```
