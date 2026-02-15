# Enterprise Pharmacy POS - Complete Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Cloud Deployment (AWS)](#cloud-deployment-aws)
3. [Cloud Deployment (Azure)](#cloud-deployment-azure)
4. [On-Premise Deployment](#on-premise-deployment)
5. [Scaling Strategy](#scaling-strategy)
6. [Maintenance & Monitoring](#maintenance--monitoring)
7. [Backup & Recovery](#backup--recovery)

---

## Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] SSL/TLS certificates obtained
- [ ] Domain names registered and configured
- [ ] Database backups configured
- [ ] Load balancer provisioned
- [ ] Security groups/firewalls configured
- [ ] VPC/Network setup complete
- [ ] Monitoring & alerting setup
- [ ] Disaster recovery plan documented
- [ ] Compliance audit completed
- [ ] Security testing completed

### Software Requirements
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ available
- [ ] Docker & Docker Compose installed
- [ ] Redis instance available
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Secrets management system in place

### Team Requirements
- [ ] DevOps engineer assigned
- [ ] On-call rotation established
- [ ] Documentation reviewed
- [ ] Runbooks prepared
- [ ] Training completed

---

## Cloud Deployment (AWS)

### 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   AWS Architecture                   │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │            CloudFront CDN                      │  │
│  │    (Static assets, caching)                    │  │
│  └─────────────────┬──────────────────────────────┘  │
│                    │                                  │
│  ┌─────────────────▼──────────────────────────────┐  │
│  │         Application Load Balancer              │  │
│  │         (SSL/TLS termination)                  │  │
│  └─────────────────┬──────────────────────────────┘  │
│                    │                                  │
│  ┌─────────────────▼──────────────────────────────┐  │
│  │    ECS Fargate (Backend API Containers)        │  │
│  │    ├─ Task 1: API Server 1                     │  │
│  │    ├─ Task 2: API Server 2                     │  │
│  │    └─ Task N: API Server N (Auto-scaling)     │  │
│  └─────────────────┬──────────────────────────────┘  │
│                    │                                  │
│  ┌─────────────────▼──────────────────────────────┐  │
│  │     RDS PostgreSQL (Multi-AZ)                  │  │
│  │     - Primary: us-east-1a                      │  │
│  │     - Standby: us-east-1b                      │  │
│  │     - Read Replica: us-west-2 (DR)             │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────────────────────────────────┐  │
│  │  ElastiCache (Redis)                         │  │
│  │  - Cache layer                               │  │
│  │  - Session management                        │  │
│  └─────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────────────────────────────────┐  │
│  │  S3 Buckets                                  │  │
│  │  - Backups (versioning enabled)              │  │
│  │  - Audit logs (immutable)                    │  │
│  │  - Document storage                          │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2. AWS Deployment Steps

#### Step 1: Prepare Infrastructure

```bash
# Create VPC with public/private subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 # Public
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 # Private

# Create RDS PostgreSQL (Multi-AZ)
aws rds create-db-instance \
  --db-instance-identifier pharmacy-pos-db \
  --db-instance-class db.r6i.xlarge \
  --engine postgres \
  --engine-version 15.3 \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --master-username admin \
  --master-user-password ${DB_PASSWORD} \
  --publicly-accessible false \
  --db-subnet-group-name pharmacy-pos-subnet \
  --backup-retention-period 30 \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:us-east-1:xxx:key/xxx

# Create ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id pharmacy-pos-redis \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --automatic-failover-enabled \
  --multi-az-enabled

# Create S3 buckets
aws s3 mb s3://pharmacy-pos-backups-${ACCOUNT_ID}
aws s3 mb s3://pharmacy-pos-logs-${ACCOUNT_ID}

# Enable versioning for backup bucket
aws s3api put-bucket-versioning \
  --bucket pharmacy-pos-backups-${ACCOUNT_ID} \
  --versioning-configuration Status=Enabled

# Enable object lock for audit logs (immutable)
aws s3api put-object-lock-legal-hold \
  --bucket pharmacy-pos-logs-${ACCOUNT_ID} \
  --key audit-logs/
```

#### Step 2: Build & Push Docker Images

```bash
# Build backend image
docker build -t pharmacy-pos-api:latest ./apps/server
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ECR_URI}
docker tag pharmacy-pos-api:latest ${ECR_URI}/pharmacy-pos-api:latest
docker push ${ECR_URI}/pharmacy-pos-api:latest

# Build frontend image
docker build -t pharmacy-pos-web:latest ./apps/web
docker tag pharmacy-pos-web:latest ${ECR_URI}/pharmacy-pos-web:latest
docker push ${ECR_URI}/pharmacy-pos-web:latest
```

#### Step 3: Deploy ECS Service

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name pharmacy-pos-cluster

# Register task definition
aws ecs register-task-definition \
  --family pharmacy-pos-api \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 1024 \
  --memory 2048 \
  --container-definitions '[
    {
      "name": "pharmacy-pos-api",
      "image": "'${ECR_URI}'/pharmacy-pos-api:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DATABASE_URL", "value": "postgresql://..."},
        {"name": "REDIS_URL", "value": "redis://..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pharmacy-pos",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]'

# Create ECS service with auto-scaling
aws ecs create-service \
  --cluster pharmacy-pos-cluster \
  --service-name pharmacy-pos-api-service \
  --task-definition pharmacy-pos-api \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=pharmacy-pos-api,containerPort=3000

# Setup auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/pharmacy-pos-cluster/pharmacy-pos-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 3 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name pharmacy-pos-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/pharmacy-pos-cluster/pharmacy-pos-api-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration "TargetValue=70.0,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization}"
```

#### Step 4: Setup CI/CD Pipeline

```bash
# Create CodePipeline
aws codepipeline create-pipeline --cli-input-json file://pipeline.json

# Pipeline stages:
# 1. Source: GitHub (webhook)
# 2. Build: CodeBuild (tests, build, push to ECR)
# 3. Deploy: CloudFormation (update ECS service)
# 4. Approve: Manual approval for production
# 5. Prod Deploy: Update production ECS service
```

#### Step 5: Configure Monitoring

```bash
# Setup CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name pharmacy-pos-api-cpu-high \
  --alarm-description "Alert when API CPU is high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:xxx:alerts

# Enable enhanced monitoring
aws rds modify-db-instance \
  --db-instance-identifier pharmacy-pos-db \
  --enable-cloudwatch-logs-exports postgresql error general slowquery

# Setup X-Ray for request tracing
aws xray create-group \
  --group-name pharmacy-pos-api \
  --filter-expression "service(\"pharmacy-pos-api\")"
```

---

## Cloud Deployment (Azure)

### 1. Architecture Overview

```
┌──────────────────────────────────────────────┐
│       Azure App Service Architecture          │
│                                               │
│  ┌──────────────────────────────────────┐   │
│  │  Azure Front Door (Global Load Bal)  │   │
│  │  (DDoS protection, caching)           │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│  ┌──────────────▼───────────────────────┐   │
│  │  App Service (Auto-scale)             │   │
│  │  - 3-10 instances                     │   │
│  │  - .NET 8 or Node.js 20               │   │
│  │  - Deployment slots (staging)         │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│  ┌──────────────▼───────────────────────┐   │
│  │  Azure Database for PostgreSQL        │   │
│  │  - High availability zones            │   │
│  │  - Automatic backups                  │   │
│  │  - Read replicas                      │   │
│  └────────────────────────────────────┘    │
│                                              │
│  ┌───────────────────────────────────────┐ │
│  │  Azure Cache for Redis                │ │
│  │  - Premium tier (high availability)   │ │
│  └───────────────────────────────────────┘ │
│                                              │
│  ┌───────────────────────────────────────┐ │
│  │  Azure Blob Storage                   │ │
│  │  - Backups (geo-redundant)            │ │
│  │  - Audit logs (immutable)             │ │
│  └───────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 2. Azure Deployment Steps

```bash
# 1. Create resource group
az group create \
  --name pharmacy-pos-rg \
  --location eastus

# 2. Create App Service Plan (Premium P1)
az appservice plan create \
  --name pharmacy-pos-plan \
  --resource-group pharmacy-pos-rg \
  --sku P1 \
  --is-linux \
  --number-of-workers 3

# 3. Create Web App
az webapp create \
  --resource-group pharmacy-pos-rg \
  --plan pharmacy-pos-plan \
  --name pharmacy-pos-api \
  --deployment-container-image-name ${REGISTRY_URL}/pharmacy-pos-api:latest

# 4. Create PostgreSQL Database
az postgres server create \
  --resource-group pharmacy-pos-rg \
  --name pharmacy-pos-db \
  --location eastus \
  --admin-user admin \
  --admin-password ${DB_PASSWORD} \
  --sku-name GP_Gen5_4 \
  --storage-size 102400 \
  --backup-retention 30 \
  --geo-redundant-backup Enabled \
  --ssl-enforcement REQUIRED \
  --public-network-access Enabled

# 5. Create Redis Cache
az redis create \
  --resource-group pharmacy-pos-rg \
  --name pharmacy-pos-cache \
  --location eastus \
  --sku Premium \
  --vm-size p1 \
  --zones 1 2

# 6. Create Storage Account for backups
az storage account create \
  --resource-group pharmacy-pos-rg \
  --name pharmacyposbackups \
  --kind StorageV2 \
  --sku Standard_GRS

# 7. Configure auto-scaling
az monitor autoscale create \
  --resource-group pharmacy-pos-rg \
  --resource-name pharmacy-pos-plan \
  --resource-type "Microsoft.Web/serverfarms" \
  --min-count 3 \
  --max-count 10 \
  --count 3

# 8. Setup Application Insights
az monitor app-insights component create \
  --app pharmacy-pos-insights \
  --location eastus \
  --resource-group pharmacy-pos-rg \
  --kind web
```

---

## On-Premise Deployment

### 1. Hardware Requirements

```
Minimum Configuration:
- Server 1 (Primary):
  * CPU: 8 cores minimum
  * RAM: 32 GB
  * Storage: 500 GB SSD (fast I/O)
  * Network: 1 Gbps dedicated

- Server 2 (Backup):
  * Identical specs (for failover)

- Storage:
  * NAS or SAN (100 TB+ capacity)
  * RAID 6 configuration
  * Daily encrypted backups

Recommended Configuration:
- Physical or Virtual (VM preferred)
- Load Balancer (nginx/HAProxy)
- Database Cluster (PostgreSQL streaming replication)
- Redis Cluster (high availability)
```

### 2. Installation Steps

```bash
# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y \
  docker.io \
  docker-compose \
  postgresql \
  redis-server \
  nginx \
  certbot \
  python3-certbot-nginx

# 2. Clone repository
git clone https://github.com/pharmacy-pos/system.git /opt/pharmacy-pos

# 3. Create environment file
cat > /opt/pharmacy-pos/.env.production << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://admin:${DB_PASSWORD}@localhost:5432/pharmacy_pos
REDIS_URL=redis://localhost:6379
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
AWS_S3_BUCKET=pharmacy-pos-backups
AWS_REGION=us-east-1
EOF

# 4. Start services
cd /opt/pharmacy-pos
docker-compose -f docker-compose.prod.yml up -d

# 5. Run migrations
docker-compose -f docker-compose.prod.yml exec api npm run migrate

# 6. Setup SSL certificates
sudo certbot certonly --webroot -w /var/www/html \
  -d pharmacy-pos.yourdomain.com \
  -m admin@yourdomain.com \
  --agree-tos --non-interactive

# 7. Configure nginx reverse proxy
sudo cp nginx.conf /etc/nginx/sites-available/pharmacy-pos
sudo ln -s /etc/nginx/sites-available/pharmacy-pos /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# 8. Setup automated backups
sudo crontab -e
# Add: 0 2 * * * /opt/pharmacy-pos/scripts/backup.sh
```

### 3. On-Premise Scaling

```
Single Server → Two Servers (Failover):
1. Configure PostgreSQL streaming replication
2. Setup HAProxy load balancer
3. Configure Redis sentinel for cache failover
4. Test failover scenarios

Three+ Servers (Cluster):
1. PostgreSQL with read replicas
2. Redis cluster (3+ nodes)
3. Load balancer (active-passive)
4. Distributed session store
```

---

## Scaling Strategy

### 1. Horizontal Scaling (Add more servers)

```
As load increases:

Load: 100 users → 1,000 users
Action: Add 2-3 application servers
- Database: Primary + read replicas
- Cache: Redis cluster
- Load balancer: HAProxy/nginx

Load: 1,000 users → 10,000 users
Action: 
- Microservice architecture (if needed)
- Database sharding
- Dedicated reporting infrastructure
- Message queue (RabbitMQ/Kafka)

Load: 10,000+ users
Action:
- Multi-region deployment
- Global load balancing
- Database replication across regions
- Content delivery network (CDN)
```

### 2. Database Scaling

```
Query Performance:
- Add indexes on frequently searched columns
- Implement query caching (Redis)
- Archive old transactions (>7 years)
- Partitioning by date/branch

Write Performance:
- Connection pooling (PgBouncer)
- Batch inserts
- Asynchronous logging
- Write-through cache

Storage Scaling:
- Automated archival of old data
- Compression of historical records
- Distributed backups
```

### 3. Caching Strategy

```
Cache Layers:
1. Browser cache (CSS, JS, images)
2. CDN cache (static assets)
3. Application cache (Redis)
   - Product catalog
   - Customer data
   - Pricing rules
   - Report calculations
4. Database query cache

Cache Invalidation:
- On product update: invalidate product cache
- On discount change: invalidate discount cache
- On inventory change: invalidate inventory cache
- TTL-based expiration (1 hour default)
```

---

## Maintenance & Monitoring

### 1. Health Checks

```bash
# API Health endpoint
GET /api/health
Response: {
  "status": "healthy",
  "timestamp": "2026-02-01T10:00:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "disk": "ok",
    "memory": "ok"
  }
}

# Liveness probe (Kubernetes)
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

# Readiness probe
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### 2. Logging & Monitoring

```
Centralized Logging:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog or New Relic (SaaS)
- CloudWatch (AWS)

Metrics to Monitor:
- API response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Transaction throughput (TPS)
- Database connections
- Cache hit ratio
- Disk usage
- Memory usage
- CPU utilization

Alerts:
- Error rate > 1%
- Response time > 5 seconds
- Disk usage > 80%
- Cache hit ratio < 50%
- Database connection pool > 90%
```

### 3. Security Patching

```
Security Update Process:
1. Weekly vulnerability scans
2. Patch OS and dependencies monthly
3. Test patches in staging environment
4. Deploy to production during maintenance window
5. Monitor for issues post-deployment

Maintenance Window:
- Scheduled: Tuesday 2:00 AM - 4:00 AM (off-peak)
- Failover to secondary: < 30 seconds
- Backup before patching
- Rollback plan ready
```

---

## Backup & Recovery

### 1. Backup Schedule

```
Frequency:
- Transactions: Hourly
- Database: Every 4 hours
- Full backup: Daily (2 AM)
- Retention: 30 days

Location:
- Primary: AWS S3 / Azure Blob
- Secondary: On-premise NAS
- Tertiary: Offline tape (legal holds)
- Encryption: AES-256
```

### 2. Recovery Procedures

```bash
# Point-in-time recovery
./scripts/restore-database.sh \
  --timestamp "2026-02-01 15:30:00" \
  --target-database pharmacy_pos_restore

# Verification
./scripts/verify-recovery.sh \
  --source pharmacy_pos_backup \
  --target pharmacy_pos_restore \
  --sample-size 1000

# Switchover
./scripts/switchover.sh \
  --old pharmacy_pos \
  --new pharmacy_pos_restore

# Testing
./scripts/test-recovery.sh \
  --monthly yes \
  --alert-on-failure yes
```

---

## Post-Deployment Validation

- [ ] All health checks passing
- [ ] Load testing completed (5,000 concurrent users)
- [ ] Failover tested successfully
- [ ] Backup & recovery tested
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Compliance certification obtained
- [ ] Documentation reviewed by operations team
- [ ] On-call procedures documented
- [ ] Monitoring alerts configured
