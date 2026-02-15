# Enterprise Pharmacy POS - Complete API Reference

## Base URL
- Production: `https://api.pharmacy-pos.com`
- Staging: `https://staging-api.pharmacy-pos.com`

## Authentication

All API requests require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Obtain Token
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@pharmacy.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "refresh_token_...",
  "expiresIn": 900,
  "user": {
    "id": "user-uuid",
    "email": "user@pharmacy.com",
    "role": "PHARMACIST",
    "branchId": "branch-uuid"
  }
}
```

### Refresh Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_..."
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

---

## Sync Endpoints

### Upstream Sync (Push mutations)
```
POST /api/sync/upstream
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "mutations": [
    {
      "id": "mutation-uuid",
      "type": "CREATE_TRANSACTION",
      "payload": { ...transaction data... },
      "timestamp": 1675000000000,
      "clientBranchId": "branch-uuid",
      "clientUserId": "user-uuid"
    }
  ]
}

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:00:00Z",
  "results": [
    {
      "id": "mutation-uuid",
      "status": "SUCCESS",
      "processedAt": "2026-02-01T10:00:01Z"
    }
  ],
  "summary": {
    "total": 1,
    "succeeded": 1,
    "failed": 0,
    "conflicts": 0
  }
}
```

### Downstream Sync (Pull changes)
```
GET /api/sync/downstream?since=2026-02-01T10:00:00Z&branchId=branch-uuid
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:05:00Z",
  "since": "2026-02-01T10:00:00Z",
  "data": {
    "products": [...],
    "inventoryAdjustments": [...],
    "priceUpdates": [...],
    "prescriptions": [...],
    "customerUpdates": [...]
  },
  "summary": {
    "products": 45,
    "inventoryAdjustments": 12,
    "priceUpdates": 3,
    "prescriptions": 2,
    "customerUpdates": 8
  }
}
```

### Sync Status
```
GET /api/sync/status
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:00:00Z",
  "status": {
    "lastSyncTime": "2026-02-01T09:55:00Z",
    "pendingMutations": 5,
    "failedMutations": 0,
    "conflictMutations": 0,
    "queueHealth": "HEALTHY"
  }
}
```

---

## Discount Endpoints

### Calculate Applicable Discounts
```
POST /api/discounts/calculate
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "cartItems": [
    {
      "productId": "prod-123",
      "quantity": 2,
      "price": 50.00,
      "category": "ANTIBIOTICS"
    }
  ],
  "customerId": "cust-456",
  "customerAge": 68,
  "customerIsPWD": false,
  "customerMembershipTier": "SILVER"
}

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:00:00Z",
  "applicableDiscounts": [
    {
      "discountId": "disc-001",
      "discountName": "Senior Citizen Discount (10%)",
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "calculatedAmount": 10.00,
      "requiresApproval": false,
      "eligibilityReasons": ["SENIOR_CITIZEN"]
    }
  ],
  "summary": {
    "total": 1,
    "bestDiscount": { ...above... }
  }
}
```

### Apply Discount
```
POST /api/discounts/apply
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "discountId": "disc-001",
  "cartItems": [...],
  "transactionId": "txn-xyz",
  "customerId": "cust-456",
  "approvalRequired": false
}

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:00:00Z",
  "discountApplication": {
    "discountId": "disc-001",
    "discountName": "Senior Citizen Discount",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "calculatedAmount": 10.00,
    "requiresApproval": false,
    "auditLogId": "audit-789"
  }
}
```

### Request Discount Approval
```
POST /api/discounts/approval/request
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "discountId": "disc-001",
  "transactionId": "txn-xyz",
  "reason": "Customer is a loyal member"
}

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:00:00Z",
  "approvalWorkflow": {
    "id": "workflow-123",
    "discountId": "disc-001",
    "transactionId": "txn-xyz",
    "status": "PENDING",
    "requestedAt": "2026-02-01T10:00:00Z"
  }
}
```

### Resolve Approval
```
POST /api/discounts/approval/{workflowId}/resolve
Authorization: Bearer <TOKEN>
Content-Type: application/json

Request:
{
  "approved": true,
  "rejectionReason": null
}

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:00:00Z",
  "approvalResult": {
    "id": "workflow-123",
    "status": "APPROVED",
    "approvedAt": "2026-02-01T10:01:00Z",
    "approvedBy": "manager-uuid"
  }
}
```

### Get Discount Audit Trail
```
GET /api/discounts/audit?discountId=disc-001&startDate=2026-02-01&endDate=2026-02-28
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:00:00Z",
  "auditLogs": [
    {
      "id": "audit-001",
      "discountId": "disc-001",
      "transactionId": "txn-001",
      "customerId": "cust-456",
      "appliedByUserId": "user-123",
      "branchId": "branch-001",
      "discountAmount": 10.00,
      "approvalRequired": false,
      "appliedAt": "2026-02-01T10:00:00Z"
    }
  ],
  "summary": {
    "total": 150,
    "totalDiscountAmount": 1500.00
  }
}
```

---

## Reports Endpoints

### Daily Sales Report
```
GET /api/reports/daily-sales?date=2026-02-01&branchId=branch-123
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "timestamp": "2026-02-01T10:00:00Z",
  "report": {
    "date": "2026-02-01T00:00:00Z",
    "branchId": "branch-123",
    "summary": {
      "totalSales": 5500.00,
      "transactionCount": 45,
      "averageTransactionValue": 122.22,
      "totalDiscount": 250.00,
      "totalTax": 275.00
    },
    "byPaymentMethod": [
      { "method": "CASH", "amount": 3000.00, "count": 25 },
      { "method": "CARD", "amount": 2500.00, "count": 20 }
    ],
    "topProducts": [
      {
        "id": "prod-001",
        "name": "Aspirin 500mg",
        "quantity": 150,
        "amount": 750.00,
        "margin": 45.0
      }
    ],
    "salesByHour": [
      { "hour": "09:00", "sales": 500.00, "transactionCount": 5 }
    ],
    "discounts": {
      "totalApplied": 250.00,
      "byDiscount": [...]
    }
  }
}
```

### Monthly Sales Report
```
GET /api/reports/monthly-sales?year=2026&month=2&branchId=branch-123
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "report": {
    "year": 2026,
    "month": 2,
    "summary": {
      "totalSales": 165000.00,
      "transactionCount": 1350,
      "averageTransactionValue": 122.22,
      "totalDiscount": 7500.00,
      "totalTax": 8250.00,
      "netProfit": 45000.00
    },
    "dailyBreakdown": [...],
    "weeklyComparison": [...],
    "topProducts": [...],
    "customerSegmentation": {
      "newCustomers": 45,
      "returningCustomers": 850,
      "loyaltyMembers": 455
    }
  }
}
```

### Yearly Sales Report
```
GET /api/reports/yearly-sales?year=2026&branchId=branch-123
Authorization: Bearer <TOKEN>

Response (structure similar to monthly report)
```

### End of Day Reconciliation
```
GET /api/reports/eod-reconciliation?date=2026-02-01&branchId=branch-123
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "report": {
    "date": "2026-02-01T00:00:00Z",
    "branchId": "branch-123",
    "shift": {
      "startTime": "09:00 AM",
      "endTime": "09:00 PM",
      "duration": "12 hours"
    },
    "transactions": {
      "count": 45,
      "totalAmount": 5500.00,
      "byPaymentMethod": [
        { "method": "CASH", "expected": 3000.00, "actual": 3010.50, "variance": 10.50 }
      ]
    },
    "inventory": {
      "itemsSold": 250,
      "stockAdjustments": 5,
      "expiredItemsRemoved": 2,
      "damagedItemsRemoved": 1
    },
    "financialSummary": {
      "cashCollected": 3000.00,
      "expenses": 500.00,
      "netCash": 2500.00
    },
    "issues": []
  }
}
```

### Inventory Valuation Report
```
GET /api/reports/inventory-valuation?asOfDate=2026-02-01&branchId=branch-123
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "report": {
    "asOfDate": "2026-02-01T00:00:00Z",
    "branchId": "branch-123",
    "summary": {
      "totalItems": 15000,
      "totalValue": 450000.00,
      "averageCost": 30.00,
      "averageSellPrice": 45.00
    },
    "byCategory": [...],
    "expiryForecasting": {
      "daysToExpiry": [
        {
          "range": "0-7 days",
          "items": 25,
          "value": 1250.00,
          "recommendation": "URGENT: Mark down or dispose"
        }
      ]
    },
    "lowStockAlert": [...],
    "overStockAlert": [...]
  }
}
```

### Profit & Margin Analysis
```
GET /api/reports/profit-margin?startDate=2026-02-01&endDate=2026-02-28&branchId=branch-123
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "report": {
    "period": {
      "startDate": "2026-02-01T00:00:00Z",
      "endDate": "2026-02-28T23:59:59Z"
    },
    "summary": {
      "totalRevenue": 165000.00,
      "totalCost": 110000.00,
      "grossProfit": 55000.00,
      "grossMarginPercentage": 33.33,
      "operatingExpenses": 10000.00,
      "netProfit": 45000.00,
      "netMarginPercentage": 27.27
    },
    "byCategory": [...],
    "byProduct": [...],
    "marginTrend": [...]
  }
}
```

### Expiry Forecasting
```
GET /api/reports/expiry-forecasting?branchId=branch-123
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "report": {
    "riskAssessment": {
      "critical": 25,
      "high": 150,
      "medium": 500,
      "low": 14000
    },
    "expiredItems": [
      {
        "productId": "prod-001",
        "name": "Expired Product",
        "batchNumber": "BATCH-001",
        "expiryDate": "2026-01-31",
        "quantity": 50,
        "value": 2500.00
      }
    ],
    "wastePrediction": {
      "estimatedWeeklyWaste": 500.00,
      "estimatedMonthlyWaste": 2000.00,
      "topWastedCategories": [...]
    },
    "recommendations": [...]
  }
}
```

### Multi-Branch Comparison
```
GET /api/reports/multi-branch-comparison?startDate=2026-02-01&endDate=2026-02-28
Authorization: Bearer <TOKEN>

Response:
{
  "success": true,
  "report": {
    "period": {...},
    "branchComparison": [
      {
        "branchId": "branch-001",
        "branchName": "Downtown Pharmacy",
        "sales": 165000.00,
        "transactions": 1350,
        "averageTransaction": 122.22,
        "margin": 27.27,
        "inventory": 450000.00,
        "ranking": 1
      }
    ],
    "topPerformer": {...},
    "bottomPerformer": {...},
    "benchmark": {
      "averageSalesPerBranch": 150000.00,
      "averageMarginPerBranch": 28.0,
      "averageInventoryPerBranch": 425000.00
    },
    "insights": [...]
  }
}
```

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Sync conflict detected |
| 429 | Too Many Requests - Rate limited |
| 500 | Server Error - Internal error |
| 503 | Service Unavailable - Maintenance |

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "DISCOUNT_CALCULATION_FAILED",
    "message": "Unable to calculate discount",
    "details": {
      "reason": "Discount eligibility criteria not met"
    },
    "timestamp": "2026-02-01T10:00:00Z",
    "traceId": "trace-uuid"
  }
}
```

---

## Rate Limiting

All endpoints are rate-limited per user:
- Standard: 1,000 requests/hour
- Premium: 10,000 requests/hour

Headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
