# Assets API Documentation

## Overview
Complete REST API for managing factory assets with QR code generation, filtering, pagination, and activity logging.

## Base URL
```
http://localhost:5000/api/assets
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header.

## Endpoints

### 1. GET /api/assets
List all assets with pagination and filters.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10, max: 100) - Items per page
- `category` (string) - Filter by category: `TOOL_ROOM_SPM`, `CNC_MACHINE`, `WORKSTATION`, `MATERIAL_HANDLING`
- `status` (string) - Filter by status: `ACTIVE`, `MAINTENANCE`, `INACTIVE`, `RETIRED`
- `location` (string) - Filter by location (partial match)
- `criticality` (string) - Filter by criticality: `HIGH`, `MEDIUM`, `LOW`
- `search` (string) - Search in name, assetUid, make, model, serialNumber
- `sortBy` (string, default: `createdAt`) - Sort field
- `sortOrder` (string, default: `desc`) - Sort order: `asc` or `desc`

**Response:**
```json
{
  "success": true,
  "data": {
    "assets": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

**Test:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/assets?page=1&limit=10&category=CNC_MACHINE"
```

---

### 2. GET /api/assets/stats
Get asset statistics grouped by category, status, and criticality.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "byCategory": {
      "CNC_MACHINE": 20,
      "TOOL_ROOM_SPM": 15,
      "WORKSTATION": 10,
      "MATERIAL_HANDLING": 5
    },
    "byStatus": {
      "ACTIVE": 45,
      "MAINTENANCE": 3,
      "INACTIVE": 2
    },
    "byCriticality": {
      "HIGH": 15,
      "MEDIUM": 25,
      "LOW": 10
    },
    "recentlyAdded": 8
  }
}
```

---

### 3. GET /api/assets/:id
Get detailed information about a single asset including movements, audits, and files.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assetUid": "ASSET-000001",
    "name": "CNC Machine XYZ",
    "category": "CNC_MACHINE",
    "status": "ACTIVE",
    "location": "Shop Floor A",
    "criticality": "HIGH",
    "createdBy": {...},
    "assignedTo": {...},
    "movements": [...],
    "audits": [...],
    "files": [...]
  }
}
```

---

### 4. POST /api/assets
Create a new asset.

**Authorization:** Admin or Shop Incharge only

**Request Body:**
```json
{
  "name": "CNC Milling Machine XYZ-1000",
  "category": "CNC_MACHINE",
  "location": "Shop Floor A - Section 2",
  "criticality": "HIGH",
  "status": "ACTIVE",
  "ownerDepartment": "Production",
  "make": "Haas",
  "model": "VF-2",
  "serialNumber": "SN123456789",
  "purchaseDate": "2023-01-15",
  "warrantyExpiry": "2026-01-15",
  "specifications": "3-axis vertical machining center",
  "notes": "Primary machine for precision parts",
  "assignedToId": "user-uuid-optional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Asset created successfully",
  "data": {
    "id": "uuid",
    "assetUid": "ASSET-000005",
    "name": "CNC Milling Machine XYZ-1000",
    ...
  }
}
```

---

### 5. PUT /api/assets/:id
Update an existing asset.

**Authorization:** Admin or Shop Incharge only

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "status": "MAINTENANCE",
  "location": "New Location",
  "notes": "Updated notes"
}
```

---

### 6. DELETE /api/assets/:id
Delete an asset (cascades to movements, audits, files).

**Authorization:** Admin only

**Response:**
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

---

### 7. GET /api/assets/:id/qr
Generate QR code for an asset.

**Response:**
```json
{
  "success": true,
  "data": {
    "assetUid": "ASSET-000005",
    "qrCode": "data:image/png;base64,...",
    "url": "http://localhost:3000?asset=ASSET-000005"
  }
}
```

The QR code is a data URL that can be directly embedded in an `<img>` tag:
```html
<img src="data:image/png;base64,..." alt="QR Code" />
```

---

### 8. POST /api/assets/bulk-qr
Generate QR codes for multiple assets at once.

**Request Body:**
```json
{
  "assetIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 3,
    "qrCodes": [
      {
        "id": "uuid1",
        "assetUid": "ASSET-000001",
        "name": "Machine 1",
        "qrCode": "data:image/png;base64,..."
      },
      ...
    ]
  }
}
```

---

## Validation Rules

### Category (enum)
- `TOOL_ROOM_SPM`
- `CNC_MACHINE`
- `WORKSTATION`
- `MATERIAL_HANDLING`

### Status (enum)
- `ACTIVE`
- `MAINTENANCE`
- `INACTIVE`
- `RETIRED`

### Criticality (enum)
- `HIGH`
- `MEDIUM`
- `LOW`

---

## Activity Logging

All asset operations are automatically logged to the `Activity` table with:
- User ID
- Action type (e.g., `CREATE_ASSET`, `UPDATE_ASSET`, `GENERATE_QR`)
- Entity type and ID
- Details description
- IP address and user agent
- Timestamp

---

## Frontend Integration

The Assets API is integrated into the frontend via `api-client.ts`:

```typescript
import { assetsApi } from '@/lib/api-client';

// List assets
const result = await assetsApi.getAll({ 
  page: 1, 
  limit: 10, 
  category: 'CNC_MACHINE' 
});

// Get single asset
const asset = await assetsApi.getById(assetId);

// Create asset
const newAsset = await assetsApi.create(assetData);

// Update asset
const updated = await assetsApi.update(assetId, updateData);

// Delete asset
await assetsApi.delete(assetId);

// Get statistics
const stats = await assetsApi.getStats();

// Generate QR code
const qr = await assetsApi.generateQR(assetId);

// Bulk QR generation
const qrCodes = await assetsApi.bulkGenerateQR([id1, id2, id3]);
```

---

## Test Results

✅ **10/10 tests passed (100% success rate)**

1. ✅ Login
2. ✅ Create Asset
3. ✅ Get All Assets
4. ✅ Get Asset by ID
5. ✅ Update Asset
6. ✅ Get Asset Statistics
7. ✅ Generate QR Code
8. ✅ Filter Assets by Category
9. ✅ Bulk Generate QR Codes
10. ✅ Delete Asset

**Test file:** `backend/test-assets-api.js`

---

## Next Steps

- ✅ Assets API (Complete)
- ⏳ Movements API
- ⏳ Audits API
- ⏳ Files API (upload/download)
- ⏳ Reports API
- ⏳ Dashboard API
