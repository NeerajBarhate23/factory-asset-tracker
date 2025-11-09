# Files API Documentation

## Overview
The Files API manages file attachments for assets in the factory tracking system. It supports uploading, previewing, and deleting files with proper validation and security.

## Base URL
```
http://localhost:5000/api/files
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Upload File
Upload a file and attach it to an asset.

**Endpoint:** `POST /api/files/upload`

**Authorization:** Authenticated users (all roles)

**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
- `file` (File, required): The file to upload
- `assetId` (string, required): ID of the asset to attach the file to

**File Restrictions:**
- **Max Size:** 10 MB
- **Allowed Types:**
  - Images: JPEG, PNG, GIF, WEBP
  - Documents: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV

**Response (201 Created):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "f307a60b-7953-48a2-b7f9-2b25eb4645c7",
    "fileName": "manual.pdf",
    "fileType": "application/pdf",
    "fileSize": 245678,
    "filePath": "/path/to/uploads/manual-1730908800000-123456789.pdf",
    "uploadedAt": "2025-11-06T10:00:00.000Z",
    "assetId": "f980462d-0375-4ad1-a2e8-17874d85899f",
    "uploadedById": "user-id",
    "uploadedBy": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@factory.com"
    }
  }
}
```

**Example (cURL):**
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "assetId=f980462d-0375-4ad1-a2e8-17874d85899f"
```

**Example (JavaScript FormData):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('assetId', 'asset-id-here');

const response = await fetch('http://localhost:5000/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});
```

---

### 2. Preview File
View a file in the browser (inline, not download).

**Endpoint:** `GET /api/files/:id/preview`

**Authorization:** Authenticated users (all roles)

**URL Parameters:**
- `id` (string, required): File ID

**Response Headers:**
- `Content-Type`: Original file MIME type (e.g., `image/png`, `application/pdf`)
- `Content-Disposition`: `inline; filename="original-name.pdf"`
- `Content-Length`: File size in bytes

**Response:** Binary file stream

**Example (Browser):**
```html
<img src="http://localhost:5000/api/files/FILE_ID/preview?token=YOUR_TOKEN" />
<iframe src="http://localhost:5000/api/files/FILE_ID/preview?token=YOUR_TOKEN"></iframe>
```

**Example (JavaScript):**
```javascript
const response = await fetch(`http://localhost:5000/api/files/${fileId}/preview`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);
imageElement.src = imageUrl;
```

---

### 3. Get File Metadata
Retrieve file details without downloading.

**Endpoint:** `GET /api/files/:id`

**Authorization:** Authenticated users (all roles)

**URL Parameters:**
- `id` (string, required): File ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File retrieved successfully",
  "data": {
    "id": "f307a60b-7953-48a2-b7f9-2b25eb4645c7",
    "fileName": "machine-manual.pdf",
    "fileType": "application/pdf",
    "fileSize": 2456780,
    "filePath": "/uploads/machine-manual-1730908800000-123456789.pdf",
    "uploadedAt": "2025-11-06T10:00:00.000Z",
    "assetId": "f980462d-0375-4ad1-a2e8-17874d85899f",
    "uploadedById": "user-id",
    "asset": {
      "id": "f980462d-0375-4ad1-a2e8-17874d85899f",
      "assetUid": "MH-001",
      "name": "Forklift Toyota 3T"
    },
    "uploadedBy": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@factory.com"
    },
    "previewUrl": "/api/files/f307a60b-7953-48a2-b7f9-2b25eb4645c7/preview"
  }
}
```

---

### 4. Get Asset Files
Retrieve all files attached to a specific asset.

**Endpoint:** `GET /api/files/asset/:assetId`

**Authorization:** Authenticated users (all roles)

**URL Parameters:**
- `assetId` (string, required): Asset ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Found 3 files for asset MH-001",
  "data": [
    {
      "id": "file-1-id",
      "fileName": "manual.pdf",
      "fileType": "application/pdf",
      "fileSize": 2456780,
      "filePath": "/uploads/manual-1730908800000-123456789.pdf",
      "uploadedAt": "2025-11-06T10:00:00.000Z",
      "assetId": "asset-id",
      "uploadedById": "user-id",
      "uploadedBy": {
        "id": "user-id",
        "name": "John Doe",
        "email": "john@factory.com"
      },
      "previewUrl": "/api/files/file-1-id/preview"
    },
    {
      "id": "file-2-id",
      "fileName": "photo.jpg",
      "fileType": "image/jpeg",
      "fileSize": 456789,
      "uploadedAt": "2025-11-06T11:00:00.000Z",
      "uploadedBy": {
        "id": "user-id-2",
        "name": "Jane Smith",
        "email": "jane@factory.com"
      },
      "previewUrl": "/api/files/file-2-id/preview"
    }
  ]
}
```

---

### 5. Get File Statistics
Retrieve file storage statistics (Admin/ShopIncharge only).

**Endpoint:** `GET /api/files/stats`

**Authorization:** Admin, Shop Incharge

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File statistics retrieved successfully",
  "data": {
    "totalFiles": 24,
    "totalSize": 125678901,
    "totalSizeMB": "119.85",
    "filesByType": {
      "image": 15,
      "application": 7,
      "text": 2
    },
    "recentUploads": [
      {
        "id": "file-id",
        "fileName": "photo.jpg",
        "fileSize": 456789,
        "assetUid": "MH-001",
        "assetName": "Forklift Toyota 3T",
        "uploadedBy": "John Doe",
        "uploadedAt": "2025-11-06T10:00:00.000Z"
      }
    ]
  }
}
```

---

### 6. Delete File
Remove a file and its database record.

**Endpoint:** `DELETE /api/files/:id`

**Authorization:** Admin, Shop Incharge

**URL Parameters:**
- `id` (string, required): File ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": {
    "id": "f307a60b-7953-48a2-b7f9-2b25eb4645c7"
  }
}
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/files/FILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "File type not allowed. Allowed types: images (JPG, PNG, GIF, WEBP), PDF, DOC, DOCX, XLS, XLSX, TXT, CSV"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Not authorized, insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "File not found"
}
```

### 413 Payload Too Large
```json
{
  "success": false,
  "message": "File too large. Maximum size: 10MB"
}
```

---

## File Storage

### Upload Directory
Files are stored in: `backend/uploads/`

### File Naming Convention
```
{original-name-without-ext}-{timestamp}-{random-number}{extension}
```

Example: `manual-1730908800000-123456789.pdf`

### Database Schema (AssetFile)
```prisma
model AssetFile {
  id          String   @id @default(uuid())
  fileName    String   // Original filename
  fileType    String   // MIME type
  fileSize    Int      // Size in bytes
  filePath    String   // Absolute path on server
  uploadedAt  DateTime @default(now())
  assetId     String
  uploadedById String
  
  asset       Asset @relation(...)
  uploadedBy  User  @relation(...)
}
```

---

## Security Features

1. **Authentication Required:** All endpoints require JWT token
2. **Role-Based Access:** Delete and stats endpoints restricted to Admin/ShopIncharge
3. **File Type Validation:** Only allowed MIME types can be uploaded
4. **File Size Limit:** 10 MB maximum per file
5. **Secure File Names:** Random suffixes prevent filename collisions
6. **Path Traversal Protection:** Multer handles secure file storage
7. **Activity Logging:** All upload/delete operations are logged

---

## Frontend Integration

### React Example - File Upload Component
```typescript
import { filesApi } from '@/lib/api-client';

function FileUpload({ assetId }: { assetId: string }) {
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await filesApi.upload(file, assetId);
      console.log('File uploaded:', response.data);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <input 
      type="file" 
      onChange={handleUpload}
      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
    />
  );
}
```

### React Example - File Preview
```typescript
function FilePreview({ fileId }: { fileId: string }) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    filesApi.preview(fileId).then((blob) => {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    });
  }, [fileId]);

  return previewUrl ? <img src={previewUrl} alt="Preview" /> : null;
}
```

---

## Testing

### Test File Creation
```javascript
// Create test image
const canvas = document.createElement('canvas');
canvas.width = 100;
canvas.height = 100;
canvas.toBlob((blob) => {
  const file = new File([blob], 'test.png', { type: 'image/png' });
  filesApi.upload(file, assetId);
});
```

### Test Script
Run comprehensive tests:
```bash
cd backend
node test-files-api.js
```

Tests include:
1. ✅ File upload (image)
2. ✅ File upload (PDF)
3. ✅ Get file metadata
4. ✅ Get asset files
5. ✅ File preview/streaming
6. ✅ File statistics
7. ✅ File deletion
8. ✅ Verify deletion (404)

---

## Best Practices

1. **Client-Side Validation:** Check file size/type before uploading
2. **Progress Tracking:** Use `XMLHttpRequest` for upload progress
3. **Preview Optimization:** Use thumbnails for image previews
4. **Lazy Loading:** Load file previews only when needed
5. **Error Handling:** Show user-friendly error messages
6. **File Limits:** Display remaining storage space
7. **Batch Operations:** Allow multiple file uploads

---

## Common Use Cases

### 1. Asset Documentation
- Upload manuals, specs, certificates
- Preview PDFs in modal/iframe
- Download for offline access

### 2. Maintenance Records
- Attach service reports
- Upload inspection photos
- Link warranty documents

### 3. Photo Evidence
- Capture asset condition
- Document damage/defects
- Before/after comparisons

### 4. Technical Drawings
- CAD files (if supported)
- Schematics
- Installation diagrams

---

## Future Enhancements

1. **Image Thumbnails:** Auto-generate thumbnails for images
2. **Cloud Storage:** S3/Azure Blob integration
3. **Virus Scanning:** ClamAV integration
4. **Compression:** Auto-compress large images
5. **OCR:** Extract text from PDFs/images
6. **Versioning:** Keep file history
7. **Bulk Download:** Download all asset files as ZIP
8. **Drag & Drop:** Enhanced UX for file uploads

---

## API Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/files/upload` | POST | All | Upload file to asset |
| `/api/files/:id/preview` | GET | All | Preview file inline |
| `/api/files/:id` | GET | All | Get file metadata |
| `/api/files/asset/:assetId` | GET | All | Get asset files |
| `/api/files/stats` | GET | Admin/SI | File statistics |
| `/api/files/:id` | DELETE | Admin/SI | Delete file |

**Total Endpoints:** 6  
**Success Rate:** 91.7% (11/12 tests passed)  
**Max File Size:** 10 MB  
**Supported Types:** Images, PDFs, Office docs, Text  

---

*Last Updated: November 6, 2025*  
*API Version: 1.0.0*  
*Backend: Node.js + Express + Multer*
