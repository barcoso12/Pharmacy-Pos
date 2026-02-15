# Enterprise Pharmacy POS - Complete System Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Architectural Principles](#architectural-principles)
3. [Technical Stack](#technical-stack)
4. [System Components](#system-components)
5. [Data Flow](#data-flow)
6. [Offline-First Strategy](#offline-first-strategy)
7. [Scalability & Performance](#scalability--performance)
8. [Security Architecture](#security-architecture)

---

## System Overview

The Enterprise Pharmacy POS is a **Progressive Web Application (PWA)** designed for offline-first operation with guaranteed data consistency, real-time synchronization, and enterprise-grade security.

### Key Characteristics
- **Offline-First**: Works completely offline, auto-syncs when online
- **Multi-Branch**: Single deployment serves unlimited branches
- **Compliance-Ready**: Healthcare regulations, HIPAA-compatible
- **Zero Data Loss**: Transaction-safe with cryptographic proofs
- **Real-Time Sync**: Sub-minute synchronization with conflict resolution
- **Enterprise Scale**: Handles 10,000+ concurrent users

---

## Architectural Principles

### 1. Offline-First Design
```
Traditional System:
Client → API → Database → Response

Offline-First System:
Client (Local DB) ↔ API ↔ Database
(Works offline, syncs when connected)
```

### 2. Eventual Consistency
- Local changes are immediately applied (optimistic UI)
- Server validation happens async
- Conflicts resolved via server authority + timestamp-based rules
- User alerted if action requires reversal

### 3. Immutable Audit Trail
```
Transaction Flow:
1. User → Action → Local DB
2. Queue → Sync Service → API
3. Server → Validation → Database
4. Append-only Audit Log (immutable)
5. Sync Response → Local DB Update
```

### 4. Progressive Enhancement
```
Browser Features (in order of use):
1. IndexedDB (primary local storage)
2. Service Workers (background sync)
3. Web App Manifest (installable)
4. Notification API (alerts)
5. Device Orientation (POS terminal)
```

---

## Technical Stack

### Frontend
```
├─ Framework: React 18 (TypeScript)
├─ State: Zustand + Redux DevTools
├─ Storage: Dexie.js (IndexedDB wrapper)
├─ Sync: Custom SyncService with exponential backoff
├─ UI: Tailwind CSS + Lucide Icons
├─ Build: Vite (fast, optimized bundles)
├─ PWA: Workbox (service workers)
└─ Testing: Vitest + React Testing Library

Key Libraries:
- axios (HTTP client with interceptors)
- date-fns (date manipulation)
- zod (schema validation)
- zustand (state management)
```

### Backend
```
├─ Runtime: Node.js 20 LTS
├─ Framework: NestJS (TypeScript)
├─ Database: PostgreSQL 15+
├─ Cache: Redis (sessions, cache)
├─ ORM: TypeORM + Prisma
├─ Jobs: Bull Queue (background jobs)
├─ Logging: Winston + ELK Stack
├─ Auth: JWT + Passport.js
└─ Testing: Jest + Supertest

Key Libraries:
- @nestjs/common (core framework)
- typeorm (database ORM)
- redis (cache layer)
- bull (job queue)
- passport (authentication)
```

### Infrastructure
```
├─ Containerization: Docker
├─ Orchestration: Docker Compose (local) / Kubernetes (prod)
├─ Cloud: AWS / Azure / GCP
├─ CDN: CloudFront / Azure CDN
├─ Database Replication: PostgreSQL Streaming
├─ Load Balancing: HAProxy / nginx / AWS ALB
└─ Monitoring: Prometheus + Grafana / DataDog
```

---

## System Components

### 1. Frontend Architecture

```
┌─────────────────────────────────────────┐
│         React Application                │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────────────────────────────┐   │
│  │      Component Layer              │   │
│  │  - Pages (POS, Reports, etc)     │   │
│  │  - Shared Components             │   │
│  │  - Modal/Dialog System           │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │      State Management             │   │
│  │  - Zustand stores               │   │
│  │  - Redux DevTools               │   │
│  │  - Sync status tracking         │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │      Services Layer               │   │
│  │  - API Client (axios)            │   │
│  │  - SyncService (offline sync)    │   │
│  │  - LocalStorageService           │   │
│  │  - NotificationService           │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │      Storage Layer                │   │
│  │  ┌────────────────────────────┐   │   │
│  │  │   IndexedDB (Dexie)       │   │   │
│  │  │  - Products               │   │   │
│  │  │  - Transactions           │   │   │
│  │  │  - MutationQueue          │   │   │
│  │  │  - Customers              │   │   │
│  │  └────────────────────────────┘   │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │      Service Workers              │   │
│  │  - Background sync               │   │
│  │  - Push notifications            │   │
│  │  - Offline page serving          │   │
│  └──────────────────────────────────┘   │
│                                          │
└─────────────────────────────────────────┘
```

### 2. Backend Architecture

```
┌──────────────────────────────────────────┐
│     NestJS Application                    │
├──────────────────────────────────────────┤
│                                           │
│  ┌────────────────────────────────────┐  │
│  │      API Layer (Controllers)        │  │
│  │  - AuthController                  │  │
│  │  - SyncController                  │  │
│  │  - DiscountsController             │  │
│  │  - ReportsController               │  │
│  │  - TransactionsController          │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │      Business Logic Layer (Services)  │
│  │  - SyncService                     │  │
│  │  - DiscountRuleEngine              │  │
│  │  - ReportingService                │  │
│  │  - InventoryService                │  │
│  │  - TransactionService              │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │      Data Access Layer (Repositories)  │
│  │  - ProductRepository               │  │
│  │  - TransactionRepository           │  │
│  │  - AuditLogRepository              │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │      Middleware & Guards            │  │
│  │  - JwtAuthGuard                    │  │
│  │  - RoleGuard                       │  │
│  │  - ValidationPipe                  │  │
│  │  - LoggingInterceptor              │  │
│  └────────────────────────────────────┘  │
│                                           │
│  ┌────────────────────────────────────┐  │
│  │      Queue Workers                  │  │
│  │  - Sync worker                     │  │
│  │  - Report generation               │  │
│  │  - Email notifications             │  │
│  │  - Batch operations                │  │
│  └────────────────────────────────────┘  │
│                                           │
└──────────────────────────────────────────┘
```

### 3. Database Schema

```
Core Tables:
├─ users
│  ├─ id (UUID)
│  ├─ email (unique)
│  ├─ password_hash (Argon2)
│  ├─ role (enum: ADMIN, PHARMACIST, CASHIER, etc)
│  ├─ branch_id (foreign key)
│  ├─ is_active (boolean)
│  ├─ created_at, updated_at
│  └─ mfa_enabled, mfa_secret (TOTP)
│
├─ products
│  ├─ id (UUID)
│  ├─ sku (unique)
│  ├─ barcode (unique, indexed)
│  ├─ name, generic_name, brand_name
│  ├─ category
│  ├─ price (decimal)
│  ├─ cost (decimal)
│  ├─ stock_quantity
│  ├─ requires_prescription (boolean)
│  ├─ branch_id (for branch-specific pricing)
│  └─ updated_at (for sync delta)
│
├─ transactions (immutable)
│  ├─ id (UUID)
│  ├─ local_id (client-generated for offline support)
│  ├─ branch_id
│  ├─ user_id (cashier)
│  ├─ customer_id
│  ├─ items (JSONB array)
│  ├─ subtotal, discounts, tax, total
│  ├─ payment_methods (JSONB)
│  ├─ transaction_hash (SHA-256)
│  ├─ previous_transaction_hash (for chain)
│  ├─ server_signature (HMAC-SHA256)
│  ├─ created_at
│  └─ receipt_reprints (tracking)
│
├─ audit_log (immutable, append-only)
│  ├─ id (UUID)
│  ├─ timestamp (server time)
│  ├─ user_id
│  ├─ action (enum: LOGIN, CREATE_TRANSACTION, DISCOUNT, etc)
│  ├─ resource_type
│  ├─ resource_id
│  ├─ changes (before/after JSONB)
│  ├─ ip_address
│  ├─ user_agent
│  ├─ status (SUCCESS/FAILURE)
│  ├─ failure_reason
│  └─ cryptographic_signature
│
├─ sync_mutations (temporary queue)
│  ├─ id (UUID)
│  ├─ type (enum)
│  ├─ payload (JSONB)
│  ├─ status (PENDING, PROCESSING, SUCCESS, FAILED)
│  ├─ retry_count
│  ├─ error_message
│  ├─ created_at
│  └─ processed_at
│
├─ discounts
│  ├─ id (UUID)
│  ├─ name
│  ├─ type (PERCENTAGE, FIXED, BUY_X_TAKE_Y, BUNDLE)
│  ├─ value
│  ├─ code (optional, for coupons)
│  ├─ start_date, end_date
│  ├─ is_active
│  └─ eligibility_rules (JSONB)
│
├─ discount_audit_log
│  ├─ id (UUID)
│  ├─ discount_id
│  ├─ transaction_id
│  ├─ customer_id
│  ├─ applied_by_user_id
│  ├─ discount_amount
│  ├─ application_context (JSONB)
│  ├─ approval_required, approved_by
│  └─ applied_at
│
└─ reports_cache
   ├─ report_type
   ├─ period
   ├─ branch_id
   ├─ data (JSONB)
   ├─ generated_at
   └─ expires_at
```

---

## Data Flow

### 1. Offline Transaction Flow

```
1. Customer walks up to cashier
   ↓
2. Barcode scan → Product lookup in IndexedDB
   ↓
3. Add to cart (local, no server)
   ↓
4. Apply discount → Calculate locally
   ↓
5. Process payment → Queue for sync
   ↓
6. Print receipt → Immediate (cached)
   ↓
7. Transaction queued in MutationQueue
   ↓
8. [When online] SyncService.sync() triggers
   ↓
9. Batch mutations sent to API
   ↓
10. Server validates & processes
    ↓
11. Audit log created (immutable)
    ↓
12. Response sent to client
    ↓
13. Local MutationQueue cleared
    ↓
14. [If conflict] Server wins, client notified
```

### 2. Real-Time Inventory Update Flow

```
Admin updates product price:
↓
API receives update
↓
Database transaction (with undo log)
↓
Audit log entry (immutable)
↓
Event published to message queue
↓
All connected clients receive notification
↓
IndexedDB updated locally
↓
POS screen refreshes with new price
```

### 3. Multi-Branch Sync Flow

```
Branch A (Downtown)         Branch B (Uptown)
  ↓                           ↓
[Offline Mode]            [Offline Mode]
Customer A purchase       Customer B purchase
  ↓                           ↓
Transaction A (Queue)     Transaction B (Queue)
  ↓                           ↓
[Back Online]             [Back Online]
SyncService (Queue → API)
  ↓
Server-side sync engine
  ├─ Validate transactions
  ├─ Check inventory (FEFO)
  ├─ Apply discounts
  ├─ Create audit logs
  ├─ Update central inventory
  └─ Return deltas for both branches
  ↓
Branch A receives:         Branch B receives:
- Central price updates   - Central price updates
- Inventory from B        - Inventory from A
- New discounts           - New discounts
```

---

## Offline-First Strategy

### 1. Local Database (IndexedDB)

```typescript
// Dexie schema
const db = new Dexie('PharmacyDB');
db.version(1).stores({
  products: '&id, sku, barcode, [sku+barcode]',
  customers: '&id, phone',
  transactions: '&local_id, timestamp, status',
  mutationQueue: '&id, timestamp, status',
  syncCache: '&type, timestamp'
});
```

### 2. Sync Queue Strategy

```
Queuing Priority:
CRITICAL (sync immediately):
  - Payment transactions (must reconcile)
  - Controlled drug sales (compliance)
  - Inventory adjustments (must update)

HIGH (sync within 5 minutes):
  - Regular transactions
  - Customer updates
  - Discount applications

MEDIUM (sync within 30 minutes):
  - Analytics events
  - Non-critical audit logs
```

### 3. Conflict Detection & Resolution

```
Conflict Scenarios:

Scenario 1: Inventory Oversell
User 1 (Branch A): Sell 100 units
User 2 (Branch B): Sell 50 units
System has: 120 units
→ Server processes first transaction
→ Checks inventory: 120 - 100 = 20 remaining
→ Processes second: 20 - 50 = INSUFFICIENT
→ Second transaction marked FAILED
→ Client receives conflict notification
→ User must retry or adjust

Scenario 2: Duplicate Submit
Network timeout during sync
Client retries mutation (same ID)
Server checks: mutation ID already exists
→ Idempotent → returns same response
→ No duplicate transaction created

Scenario 3: Timestamp Conflict
Two users create transaction at same timestamp
Server uses: sequence number (transaction hash chain)
→ Earlier hash chain wins
→ Later transaction marked as CONFLICT
→ Client notified for manual resolution
```

---

## Scalability & Performance

### 1. Frontend Optimization

```
Bundle Size:
- Initial load: < 500 KB (gzipped)
- Code splitting: ~50 KB per route
- Lazy loading: Components load on demand

Performance Metrics:
- First Contentful Paint: < 2 seconds
- Time to Interactive: < 4 seconds
- Largest Contentful Paint: < 3 seconds
- Cumulative Layout Shift: < 0.1

Caching:
- Service Worker: Cache-first for assets
- IndexedDB: Full product catalog
- Redis: Session/report cache
- Browser: 1-week cache for static assets
```

### 2. Backend Scaling

```
Single Server (10-100 users):
- 2 GB RAM, 2 vCPU
- PostgreSQL local instance
- Redis cache local
- 1 Node.js process

Multi-Server (100-10,000 users):
- Load balancer (HAProxy/nginx)
- 4-8 API servers (horizontally scaled)
- PostgreSQL primary + 2 read replicas
- Redis cluster (3+ nodes)
- Message queue (Bull/RabbitMQ)
- Background workers (separate containers)

Enterprise (10,000+ users):
- Multi-region deployment
- Kubernetes orchestration
- Database sharding by region
- Global load balancer
- CDN for assets
- Multi-tier caching
```

### 3. Database Optimization

```
Indexes:
- products(sku, barcode) - Covered index
- transactions(created_at, branch_id) - For range queries
- audit_log(timestamp) - Append-only optimization
- sync_mutations(status, created_at) - Queue optimization

Partitioning:
- transactions by date (monthly)
- audit_log by date (monthly)
- products by branch (optional)

Optimization:
- Connection pooling (PgBouncer)
- Query caching (Redis)
- Vacuum & analyze (weekly)
- Statistics update (daily)
```

---

## Security Architecture

### 1. Authentication & Authorization

```
Multi-layer Authentication:
├─ Layer 1: Credential validation (email + password)
├─ Layer 2: MFA (TOTP/SMS/Email) - for admin users
├─ Layer 3: JWT token + refresh token
├─ Layer 4: Session validation (server-side)
└─ Layer 5: Device fingerprinting (suspicious login detection)

Authorization:
├─ Role-based (8 roles defined)
├─ Action-level permissions (100+ actions)
├─ Resource-level (user can only see own branch data)
└─ Data-level (customer data, prescription data)
```

### 2. Encryption & Hashing

```
Data at Rest:
- Database: AES-256 (TDE)
- Backups: AES-256
- Configuration: KMS encrypted

Data in Transit:
- All APIs: TLS 1.3
- Certificate pinning: Enabled
- HSTS: 1 year
- CSP: Strict policy

Passwords:
- Argon2id hashing
- Minimum 16 characters
- Complexity requirements enforced
- Password history: Last 5 not allowed

Sensitive Fields:
- Credit card tokens: Tokenized (not stored)
- Prescription images: Encrypted storage
- Patient names: Hashed index, encrypted value
```

### 3. Audit & Compliance

```
Immutable Audit Trail:
- Every action logged
- Cryptographically signed
- Hash-chained for integrity
- Impossible to delete (append-only)
- Automatic backup to S3

Compliance Exports:
- HIPAA-compliant format
- 7-year retention
- Digitally signed
- Tamper-evident
- Regulatory certification ready
```

---

## Implementation Roadmap

### Phase 1: Core (Weeks 1-4)
- [x] Authentication & RBAC
- [x] Offline-first sync engine
- [x] Basic POS functionality
- [x] Product management
- [x] Transaction processing

### Phase 2: Enterprise Features (Weeks 5-8)
- [x] Advanced discount engine
- [x] Comprehensive reporting
- [x] Multi-branch management
- [x] Audit logging
- [ ] PWA features (service workers, installable)

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] AI-powered forecasting
- [ ] Mobile app (React Native)
- [ ] Prescription management enhancements
- [ ] Loyalty program v2
- [ ] Integration APIs (for third-party)

### Phase 4: Production (Week 13+)
- [ ] Security certifications
- [ ] Load testing & optimization
- [ ] Documentation completion
- [ ] Training & rollout
- [ ] Ongoing support & maintenance

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p99) | < 500ms | TBD |
| Transaction Throughput | 1000 TPS | TBD |
| Sync Latency | < 30 seconds | TBD |
| Frontend Load Time | < 2 seconds | TBD |
| Offline Mode Functionality | 100% | 90% |
| Uptime (SLA) | 99.95% | TBD |
| Data Sync Reliability | 99.99% | TBD |

---

## References

- [API Reference](./API_REFERENCE.md)
- [Security & Compliance](./SECURITY_AND_COMPLIANCE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Offline Sync Algorithm](./docs/sync_algorithm.md)
