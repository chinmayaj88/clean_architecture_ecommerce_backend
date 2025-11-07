# Cloud Architecture (AWS-Style)

## Table of Contents

1. [Overview](#overview)
2. [Amazon-Style Architecture](#amazon-style-architecture)
3. [Master Region Architecture](#master-region-architecture)
4. [Service Architecture](#service-architecture)
5. [Infrastructure Components](#infrastructure-components)
6. [Network Architecture](#network-architecture)
7. [Security Architecture](#security-architecture)
8. [Complete System Architecture](#complete-system-architecture)

---

## Overview

This platform follows **Amazon's enterprise-grade cloud architecture** patterns, designed for massive scale, high availability, and global distribution. The architecture leverages AWS services and best practices used by major e-commerce platforms.

### Architecture Principles

- ✅ **Master Region Pattern**: Central management and coordination
- ✅ **Multi-Region Active-Active**: Global distribution with low latency
- ✅ **Service Mesh**: Inter-service communication and observability
- ✅ **Infrastructure as Code**: All infrastructure defined and versioned
- ✅ **Security by Design**: Multiple layers of security

---

## Amazon-Style Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Global Infrastructure                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Route 53 (Global DNS)                                   │  │
│  │  - Geographic routing                                    │  │
│  │  - Health-based routing                                  │  │
│  │  - Latency-based routing                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  CloudFront (Global CDN)                                 │  │
│  │  - 200+ edge locations                                   │  │
│  │  - Static asset delivery                                 │  │
│  │  - API response caching                                  │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Region 1     │ │  Region 2     │ │  Region 3     │
│  (us-east-1)  │ │  (eu-west-1)  │ │  (ap-south-1)│
│  (Master)     │ │  (Active)     │ │  (Active)     │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Master Region Pattern (Amazon-Style)

```
┌─────────────────────────────────────────────────────────────┐
│                    Master Region (us-east-1)                │
│                    N. Virginia, USA                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Global Management Layer                             │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │ Route 53     │  │ CloudFront   │  │ CloudWatch│ │  │
│  │  │ (DNS)        │  │ (CDN)        │  │ (Monitor) │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │ S3 (Global)  │  │ IAM (Global) │  │ Config   │ │  │
│  │  │ (Assets)     │  │ (Security)   │  │ (Global) │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Centralized Services                                 │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │ Service      │  │ Feature      │  │ Deployment│ │  │
│  │  │ Discovery    │  │ Flags        │  │ Pipeline │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │ Analytics    │  │ Logging      │  │ Backup    │ │  │
│  │  │ Aggregation  │  │ Aggregation  │  │ Storage   │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Regional Application Services (Same as other regions)│  │
│  │                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │ Auth Service │  │ User Service │  │ Product  │ │  │
│  │  └──────────────┘  └──────────────┘  │ Service  │ │  │
│  │                                      └──────────┘ │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │ Order Service│  │ Payment      │  │ Cart     │ │  │
│  │  └──────────────┘  │ Service      │  │ Service  │ │  │
│  │                    └──────────────┘  └──────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Master Region Architecture

### Master Region Components

#### 1. Global DNS (Route 53)

```
Route 53 Architecture:

┌─────────────────────────────────────────┐
│  Route 53 (Global DNS)                  │
│                                         │
│  Health Checks:                         │
│  - Regional health monitoring           │
│  - Automatic failover                   │
│  - Latency-based routing                │
│                                         │
│  Routing Policies:                      │
│  - Geographic routing                   │
│  - Weighted routing                     │
│  - Failover routing                     │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Regional Endpoints                     │
│  - api-us.example.com → us-east-1      │
│  - api-eu.example.com → eu-west-1      │
│  - api-ap.example.com → ap-south-1     │
└─────────────────────────────────────────┘
```

#### 2. Global CDN (CloudFront)

```
CloudFront Distribution:

Origin (Master Region):
┌──────────────┐
│  S3 Bucket   │
│  (Static)    │
└──────┬───────┘
       │
       │ Distribution to 200+ Edge Locations
       │
┌──────┼──────────────────────────────────┐
│      │                                    │
▼      ▼                                    ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│Edge 1│  │Edge 2│  │Edge 3│  │Edge N│
│(US)  │  │(EU)  │  │(AP)  │  │(...) │
└──────┘  └──────┘  └──────┘  └──────┘

Cache Behavior:
- Static assets: TTL 1 year
- API responses: TTL 5 minutes
- Dynamic content: No cache
```

#### 3. Global Monitoring (CloudWatch)

```
CloudWatch Architecture:

Master Region:
┌─────────────────────────────────────────┐
│  CloudWatch (Global)                    │
│                                         │
│  Metrics Aggregation:                  │
│  - Regional metrics                    │
│  - Cross-region dashboards             │
│  - Global alerts                       │
│                                         │
│  Log Aggregation:                      │
│  - Centralized logging                 │
│  - Log analysis                        │
│  - Audit trails                        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Regional CloudWatch                    │
│  - Regional metrics                    │
│  - Regional logs                       │
│  - Regional alarms                     │
└─────────────────────────────────────────┘
```

---

## Service Architecture

### Kubernetes-Based Service Deployment

```
Kubernetes Cluster Architecture:

┌─────────────────────────────────────────────────────────┐
│  EKS Cluster (Regional)                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Control Plane (Managed by AWS)                 │  │
│  │  - API Server                                   │  │
│  │  - etcd                                         │  │
│  │  - Scheduler                                    │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Worker Nodes (Auto-Scaling Group)               │  │
│  │                                                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │  │
│  │  │ Node 1   │  │ Node 2   │  │ Node N   │     │  │
│  │  │         │  │         │  │         │     │  │
│  │  │ Pods:   │  │ Pods:   │  │ Pods:   │     │  │
│  │  │ - Auth  │  │ - User  │  │ - Order │     │  │
│  │  │ - Cart  │  │ - Product│ │ - Payment│     │  │
│  │  └──────────┘  └──────────┘  └──────────┘     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Service Mesh (Istio/App Mesh)                  │  │
│  │  - Service discovery                            │  │
│  │  - Load balancing                               │  │
│  │  - Circuit breakers                             │  │
│  │  - Observability                                │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Service Deployment Pattern

```
Service Deployment:

┌─────────────────────────────────────────┐
│  Application Load Balancer (ALB)        │
│  - SSL termination                      │
│  - Health checks                        │
│  - Request routing                      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Kubernetes Service (ClusterIP)         │
│  - Internal load balancing              │
│  - Service discovery                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Pods (Replicas)                        │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │ Pod 1    │  │ Pod 2    │  │ Pod N│ │
│  │          │  │          │  │      │ │
│  │ Container│  │ Container│  │ Cont │ │
│  │ - App    │  │ - App    │  │ - App│ │
│  │ - Sidecar│  │ - Sidecar│  │ - Sid│ │
│  └──────────┘  └──────────┘  └──────┘ │
└─────────────────────────────────────────┘
```

---

## Infrastructure Components

### Compute Layer

```
Compute Architecture:

┌─────────────────────────────────────────┐
│  EKS (Kubernetes)                        │
│                                         │
│  Node Groups:                           │
│  - General purpose (m5.large)           │
│  - Compute optimized (c5.xlarge)        │
│  - Memory optimized (r5.2xlarge)       │
│                                         │
│  Auto-Scaling:                          │
│  - Cluster Autoscaler                   │
│  - Horizontal Pod Autoscaler           │
│  - Vertical Pod Autoscaler              │
└─────────────────────────────────────────┘
```

### Data Layer

```
Database Architecture:

┌─────────────────────────────────────────┐
│  RDS (PostgreSQL)                       │
│                                         │
│  Primary Instance:                      │
│  - db.r5.4xlarge                        │
│  - Multi-AZ deployment                  │
│  - Automated backups                   │
│                                         │
│  Read Replicas:                        │
│  - 10+ read replicas                    │
│  - Cross-AZ distribution                │
│  - Auto-scaling                         │
└─────────────────────────────────────────┘

Cache Architecture:

┌─────────────────────────────────────────┐
│  ElastiCache (Redis)                    │
│                                         │
│  Cluster Mode:                          │
│  - 3 shards                             │
│  - 2 replicas per shard                 │
│  - Auto-failover                        │
│                                         │
│  Use Cases:                             │
│  - Session store                        │
│  - Application cache                    │
│  - Rate limiting                        │
└─────────────────────────────────────────┘
```

### Messaging Layer

```
Event-Driven Architecture:

┌─────────────────────────────────────────┐
│  SNS (Simple Notification Service)       │
│                                         │
│  Topics:                                │
│  - user.events                          │
│  - order.events                         │
│  - product.events                       │
│                                         │
│  Cross-Region Replication:              │
│  - Events replicated to all regions     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  SQS (Simple Queue Service)             │
│                                         │
│  Queues:                                │
│  - Standard queues (high throughput)    │
│  - FIFO queues (ordering)               │
│                                         │
│  Features:                              │
│  - Dead-letter queues                   │
│  - Visibility timeout                   │
│  - Long polling                         │
└─────────────────────────────────────────┘
```

### Storage Layer

```
Storage Architecture:

┌─────────────────────────────────────────┐
│  S3 (Simple Storage Service)            │
│                                         │
│  Buckets:                               │
│  - Static assets (CloudFront origin)    │
│  - Application logs                    │
│  - Database backups                    │
│  - Data warehouse                      │
│                                         │
│  Features:                              │
│  - Versioning                           │
│  - Lifecycle policies                   │
│  - Cross-region replication             │
│  - Encryption (SSE-KMS)                 │
└─────────────────────────────────────────┘
```

---

## Network Architecture

### VPC Architecture

```
VPC Design (Per Region):

┌─────────────────────────────────────────┐
│  VPC (10.0.0.0/16)                      │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Public Subnets                 │  │
│  │  - 10.0.1.0/24 (AZ-1)           │  │
│  │  - 10.0.2.0/24 (AZ-2)           │  │
│  │  - 10.0.3.0/24 (AZ-3)           │  │
│  │                                 │  │
│  │  Resources:                     │  │
│  │  - Load Balancers               │  │
│  │  - NAT Gateways                 │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Private Subnets (App)           │  │
│  │  - 10.0.10.0/24 (AZ-1)          │  │
│  │  - 10.0.11.0/24 (AZ-2)          │  │
│  │  - 10.0.12.0/24 (AZ-3)          │  │
│  │                                 │  │
│  │  Resources:                     │  │
│  │  - EKS Worker Nodes             │  │
│  │  - Application Services         │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Private Subnets (Data)          │  │
│  │  - 10.0.20.0/24 (AZ-1)          │  │
│  │  - 10.0.21.0/24 (AZ-2)          │  │
│  │  - 10.0.22.0/24 (AZ-3)          │  │
│  │                                 │  │
│  │  Resources:                     │  │
│  │  - RDS Databases                │  │
│  │  - ElastiCache                  │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Network Security

```
Security Layers:

┌─────────────────────────────────────────┐
│  Network ACLs (Stateless)               │
│  - Subnet-level filtering               │
│  - Allow/deny rules                     │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Security Groups (Stateful)             │
│  - Instance-level firewall             │
│  - Inbound/outbound rules               │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  WAF (Web Application Firewall)        │
│  - Application-level protection        │
│  - DDoS protection                      │
│  - Bot protection                       │
└─────────────────────────────────────────┘
```

---

## Security Architecture

### Multi-Layer Security

```
Security Architecture:

Layer 1: Network Security
┌─────────────────────────────────────────┐
│  - VPC isolation                        │
│  - Security groups                      │
│  - Network ACLs                         │
│  - WAF                                  │
└─────────────────────────────────────────┘
              │
              ▼
Layer 2: Application Security
┌─────────────────────────────────────────┐
│  - IAM roles                            │
│  - Service mesh (mTLS)                  │
│  - API authentication                  │
│  - Rate limiting                        │
└─────────────────────────────────────────┘
              │
              ▼
Layer 3: Data Security
┌─────────────────────────────────────────┐
│  - Encryption at rest (KMS)             │
│  - Encryption in transit (TLS)          │
│  - Secrets management                   │
│  - Data masking                         │
└─────────────────────────────────────────┘
```

### IAM Architecture

```
IAM Structure:

┌─────────────────────────────────────────┐
│  IAM (Identity and Access Management)   │
│                                         │
│  Roles:                                 │
│  - EKS Service Role                     │
│  - Node Group Role                     │
│  - Application Roles (per service)      │
│                                         │
│  Policies:                              │
│  - Least privilege                      │
│  - Service-specific permissions        │
│  - Cross-account access                 │
└─────────────────────────────────────────┘
```

---

## Complete System Architecture

### End-to-End Architecture

```
Complete System Flow:

User Request:
┌─────────────────────────────────────────┐
│  User (Browser/Mobile)                   │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Route 53 (DNS Resolution)              │
│  - Geographic routing                   │
│  - Health-based routing                  │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  CloudFront (CDN)                       │
│  - Static asset caching                 │
│  - API response caching                 │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  WAF (Web Application Firewall)         │
│  - DDoS protection                      │
│  - Bot protection                       │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Application Load Balancer (ALB)        │
│  - SSL termination                      │
│  - Request routing                      │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  API Gateway (Kong/AWS API Gateway)     │
│  - Authentication                       │
│  - Rate limiting                        │
│  - Request transformation               │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Service Mesh (Istio/App Mesh)          │
│  - Service discovery                    │
│  - Load balancing                       │
│  - Circuit breakers                     │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Microservices (Kubernetes Pods)        │
│  - Auth Service                         │
│  - User Service                         │
│  - Product Service                      │
│  - Order Service                        │
│  - Payment Service                      │
└──────────────────┬───────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Data Layer                             │
│  - RDS (PostgreSQL)                     │
│  - ElastiCache (Redis)                  │
│  - S3 (Storage)                         │
└─────────────────────────────────────────┘
```

---

## Best Practices

### 1. Master Region Responsibilities

```
Master Region Handles:
- Global DNS management
- CDN origin
- Centralized monitoring
- Global configuration
- Deployment orchestration
- Analytics aggregation
```

### 2. Regional Independence

```
Each Region:
- Self-contained services
- Regional databases
- Regional cache
- Regional monitoring
- Can operate independently
```

### 3. Infrastructure as Code

```
All Infrastructure:
- Terraform/CloudFormation
- Version controlled
- Automated deployment
- Repeatable across regions
```

---

## Next Steps

1. Explore [Enterprise Deployment](./06-enterprise-deployment.md) for enterprise patterns
2. Review [Management Strategy](./07-management-strategy.md) for operations
3. Study [Scaling Architecture](./03-scaling-architecture.md) for scaling strategies

---

**Last Updated**: 2024  
**Architecture Model**: AWS Enterprise-Grade (Amazon-Style)

