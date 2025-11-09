# Movements API Documentation

## Overview
Complete REST API for managing asset movements with approval workflow, SLA monitoring, location tracking, and movement history.

## Base URL
```
http://localhost:5000/api/movements
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header.

## Key Features
- ✅ **Approval Workflow**: PENDING → APPROVED → IN_TRANSIT → COMPLETED
- ✅ **SLA Monitoring**: Real-time tracking of movement deadlines
- ✅ **Location Tracking**: Automatic asset location updates on completion
- ✅ **Status Filtering**: Filter by movement status and SLA status
- ✅ **Activity Logging**: All actions logged for audit trail

---

## SLA Status Types

| Status | Description |
|--------|-------------|
| `ON_TRACK` | Movement is progressing normally (< 80% of SLA time elapsed) |
| `AT_RISK` | Movement is approaching deadline (80-100% of SLA time elapsed) |
| `BREACHED` | Movement has exceeded SLA deadline |
| `MET` | Completed movement finished within SLA deadline |

---

## Endpoints

### 1. GET /api/movements
List all movements with pagination, filters, and SLA status.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `assetId` (string) - Filter by asset UUID
- `status` (string) - Filter by status: `PENDING`, `APPROVED`, `IN_TRANSIT`, `COMPLETED`, `REJECTED`
- `fromLocation` (string) - Filter by source location (partial match)
- `toLocation` (string) - Filter by destination location (partial match)
- `requestedById` (string) - Filter by requester UUID
- `slaStatus` (string) - Filter by SLA status: `ON_TRACK`, `AT_RISK`, `BREACHED`, `MET`
- `sortBy` (string, default: `createdAt`) - Sort field
- `sortOrder` (string, default: `desc`) - Sort order: `asc` or `desc`

**Response:**
```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": "uuid",
        "assetId": "uuid",
        "fromLocation": "Shop Floor A",
        "toLocation": "Shop Floor B",
        "status": "IN_TRANSIT",
        "slaHours": 24,
        "requestDate": "2025-11-06T10:00:00Z",
        "asset": {...},
        "requestedBy": {...},
        "sla": {
          "slaStatus": "ON_TRACK",
          "deadlineDate": "2025-11-07T10:00:00Z",
          "elapsedHours": 2,
          "remainingHours": 22,
          "percentElapsed": 8
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 2. GET /api/movements/stats
Get movement statistics with SLA metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 120,
    "byStatus": {
      "PENDING": 15,
      "APPROVED": 8,
      "IN_TRANSIT": 12,
      "COMPLETED": 80,
      "REJECTED": 5
    },
    "pending": 15,
    "slaMetrics": {
      "onTrack": 20,
      "atRisk": 5,
      "breached": 10,
      "totalActive": 35
    }
  }
}
```

---

### 3. GET /api/movements/pending
Get all pending approval movements, sorted by request date (oldest first).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "PENDING",
      "asset": {...},
      "requestedBy": {...},
      "sla": {...}
    }
  ]
}
```

---

### 4. GET /api/movements/overdue
Get movements that are overdue or at risk of missing SLA.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "IN_TRANSIT",
      "sla": {
        "slaStatus": "BREACHED",
        "remainingHours": -5
      }
    }
  ]
}
```

---

### 5. GET /api/movements/:id
Get detailed information about a single movement.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assetId": "uuid",
    "fromLocation": "Shop Floor A",
    "toLocation": "Shop Floor B",
    "status": "IN_TRANSIT",
    "reason": "Production requirement",
    "notes": "Handle with care",
    "slaHours": 24,
    "requestDate": "2025-11-06T10:00:00Z",
    "approvalDate": "2025-11-06T10:30:00Z",
    "dispatchedAt": "2025-11-06T11:00:00Z",
    "receivedAt": null,
    "asset": {...},
    "requestedBy": {...},
    "sla": {...}
  }
}
```

---

### 6. POST /api/movements
Create a new movement request.

**Request Body:**
```json
{
  "assetId": "uuid",
  "fromLocation": "Shop Floor A - Section 1",
  "toLocation": "Shop Floor B - Section 3",
  "reason": "Asset required for urgent production",
  "notes": "Handle with care",
  "slaHours": 24
}
```

**Validation:**
- `assetId` (required) - Valid UUID
- `fromLocation` (required) - Non-empty string
- `toLocation` (required) - Non-empty string
- `reason` (optional) - String
- `notes` (optional) - String
- `slaHours` (optional, default: 24) - Integer between 1 and 720 (30 days)

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "Movement request created successfully",
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "sla": {
      "slaStatus": "ON_TRACK",
      "remainingHours": 24
    }
  }
}
```

---

### 7. PUT /api/movements/:id/approve
Approve a pending movement request.

**Authorization:** Admin or Shop Incharge only

**Requirements:**
- Movement must be in `PENDING` status

**Response:**
```json
{
  "success": true,
  "message": "Movement approved successfully",
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvalDate": "2025-11-06T10:30:00Z",
    "approvedById": "uuid"
  }
}
```

---

### 8. PUT /api/movements/:id/reject
Reject a pending movement request.

**Authorization:** Admin or Shop Incharge only

**Request Body:**
```json
{
  "reason": "Asset not available at source location"
}
```

**Requirements:**
- Movement must be in `PENDING` status
- Rejection reason is required

**Response:**
```json
{
  "success": true,
  "message": "Movement rejected successfully",
  "data": {
    "id": "uuid",
    "status": "REJECTED"
  }
}
```

---

### 9. PUT /api/movements/:id/dispatch
Mark an approved movement as dispatched (in transit).

**Requirements:**
- Movement must be in `APPROVED` status

**Response:**
```json
{
  "success": true,
  "message": "Movement dispatched successfully",
  "data": {
    "id": "uuid",
    "status": "IN_TRANSIT",
    "dispatchedAt": "2025-11-06T11:00:00Z"
  }
}
```

---

### 10. PUT /api/movements/:id/complete
Mark a movement as completed and update asset location.

**Requirements:**
- Movement must be in `IN_TRANSIT` status

**Side Effects:**
- Updates the asset's `location` field to `toLocation`
- Calculates final SLA status (MET or BREACHED)

**Response:**
```json
{
  "success": true,
  "message": "Movement completed successfully",
  "data": {
    "id": "uuid",
    "status": "COMPLETED",
    "receivedAt": "2025-11-06T15:00:00Z",
    "sla": {
      "slaStatus": "MET",
      "elapsedHours": 5
    }
  }
}
```

---

## Movement Workflow

### Complete Lifecycle:
```
1. CREATE      → PENDING (User creates request)
2. APPROVE     → APPROVED (Admin/Shop Incharge approves)
3. DISPATCH    → IN_TRANSIT (Asset is in transit)
4. COMPLETE    → COMPLETED (Asset received, location updated)

Alternative:
2. REJECT      → REJECTED (Admin/Shop Incharge rejects)
```

### Status Transitions:
- `PENDING` → `APPROVED` (via approve endpoint)
- `PENDING` → `REJECTED` (via reject endpoint)
- `APPROVED` → `IN_TRANSIT` (via dispatch endpoint)
- `IN_TRANSIT` → `COMPLETED` (via complete endpoint)

**Invalid transitions are rejected with 400 error.**

---

## SLA Monitoring Algorithm

```javascript
// Calculate SLA status
const elapsedMs = now - requestDate;
const totalMs = slaHours * 60 * 60 * 1000;
const percentElapsed = (elapsedMs / totalMs) * 100;

if (status === 'COMPLETED') {
  return completionTime <= deadline ? 'MET' : 'BREACHED';
} else {
  if (percentElapsed >= 100) return 'BREACHED';
  if (percentElapsed >= 80) return 'AT_RISK';
  return 'ON_TRACK';
}
```

### Example SLA Timeline (24 hours):
- **0-19 hours**: 🟢 ON_TRACK
- **19-24 hours**: 🟡 AT_RISK
- **24+ hours**: 🔴 BREACHED
- **Completed ≤24h**: ✅ MET

---

## Activity Logging

All movement operations are automatically logged:
- `CREATE_MOVEMENT` - Movement request created
- `APPROVE_MOVEMENT` - Movement approved
- `REJECT_MOVEMENT` - Movement rejected (with reason)
- `DISPATCH_MOVEMENT` - Asset dispatched
- `COMPLETE_MOVEMENT` - Movement completed (with SLA status)
- `LIST_MOVEMENTS` - Movements listed
- `VIEW_MOVEMENT` - Single movement viewed
- `VIEW_PENDING_MOVEMENTS` - Pending movements viewed
- `VIEW_OVERDUE_MOVEMENTS` - Overdue movements viewed
- `VIEW_MOVEMENT_STATS` - Statistics viewed

---

## Frontend Integration

The Movements API is integrated into the frontend via `api-client.ts`:

```typescript
import { movementsApi } from '@/lib/api-client';

// List movements
const result = await movementsApi.getAll({ 
  page: 1, 
  limit: 10, 
  status: 'PENDING',
  slaStatus: 'AT_RISK'
});

// Get single movement
const movement = await movementsApi.getById(movementId);

// Create movement request
const newMovement = await movementsApi.create({
  assetId: 'uuid',
  fromLocation: 'Shop Floor A',
  toLocation: 'Shop Floor B',
  slaHours: 24
});

// Approve movement
const approved = await movementsApi.approve(movementId);

// Reject movement
await movementsApi.reject(movementId, 'Asset not available');

// Dispatch movement
await movementsApi.dispatch(movementId);

// Complete movement
await movementsApi.complete(movementId);

// Get statistics
const stats = await movementsApi.getStats();

// Get pending movements
const pending = await movementsApi.getPending();

// Get overdue movements
const overdue = await movementsApi.getOverdue();
```

---

## Test Results

✅ **13/13 tests passed (100% success rate)**

1. ✅ Login
2. ✅ Get Test Asset
3. ✅ Create Movement Request
4. ✅ Get All Movements
5. ✅ Get Movement by ID
6. ✅ Get Pending Movements
7. ✅ Get Movement Statistics
8. ✅ Approve Movement
9. ✅ Dispatch Movement
10. ✅ Complete Movement
11. ✅ Get Overdue Movements
12. ✅ Filter Movements by Status
13. ✅ Create and Reject Movement

**Test file:** `backend/test-movements-api.js`

---

## Error Handling

### Common Errors:

**404 Not Found**
```json
{
  "success": false,
  "error": "Movement not found"
}
```

**400 Bad Request - Invalid Status Transition**
```json
{
  "success": false,
  "error": "Cannot approve movement with status: COMPLETED"
}
```

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": "From location is required"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Access denied. Admin or Shop Incharge role required"
}
```

---

## Next Steps

- ✅ Authentication API (Complete)
- ✅ User Management API (Complete)
- ✅ Assets API (Complete)
- ✅ **Movements API (Complete)**
- ⏳ Audits API
- ⏳ Files API (upload/download)
- ⏳ Reports API
- ⏳ Dashboard API
