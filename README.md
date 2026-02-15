# Enterprise Pharmacy POS System

A production-ready, offline-first, multi-branch Pharmacy POS built for compliance, scale, and speed.

![Status](https://img.shields.io/badge/Status-Production%20MVP-success) ![Stack](https://img.shields.io/badge/Stack-NestJS%20%2B%20React-blue)

## 🌟 Key Features

### 1. 💊 Prescription Management (Compliance)
- **Digital Rx Records**: Track patient prescriptions digitally using `Prescription` and `Doctor` entities.
- **Dispensing Control**: Enforces validation before adding "Rx-Only" items to the cart.
- **Patient History**: instant lookup of past prescriptions and doctors.

### 2. 📦 Advanced Inventory (FEFO)
- **Batch Tracking**: Tracks batch numbers and expiry dates for every product.
- **First Expired, First Out**: The POS automatically deducts stock from the batch expiring soonest to minimize waste and ensure safety.
- **Stock Receiving**: Dedicated workflows for receiving new shipments.

### 3. 🌐 Offline-First Architecture
- **Zero Downtime**: Continue selling even when the internet goes down.
- **Sync Engine**: A custom `SyncService` queues all actions (Sales, Updates) locally.
- **Auto-Recovery**: Automatically pushes changes and pulls updates when connectivity is restored.

### 4. � Loyalty Program
- **Tiered System**: Bronze, Silver, Gold tiers based on spend.
- **Point Redemption**: Seamless point calculation (`1 point per $1`) at checkout.

## 📂 Documentation
- **[Feature Status & Implementation Details](implementation_status.md)**
- **[System Architecture](docs/architecture.md)**
- **[Database Schema](docs/schema.sql)**
- **[Offline Sync Design](docs/sync_algorithm.md)**
- **[API Specification](docs/api_spec.md)**

## � Getting Started

### Prerequisites
- Docker Desktop (Recommended)
- OR Node.js v18+ & PostgreSQL 15+

### Docker Installation (Fastest)
1.  Run `start_docker.bat`
2.  Open `http://localhost`

### Manual Installation
1.  **Install Dependencies**
    ```bash
    npm install
    ```
2.  **Start the System**
    ```bash
    npm run dev
    ```
    *   **Frontend**: `http://localhost:5173`
    *   **Backend**: `http://localhost:3000`

### Database Setup
Execute the SQL script found in `docs/schema.sql` to initialize your PostgreSQL database with the required tables and enums.

## �️ Security
- **Audit Trails**: Every sensitive action is logged.
- **RBAC**: Role-Based access control (Admin, Pharmacist, Cashier).
- **Secure Auth**: JWT for API access + Local PIN for POS quick access.
