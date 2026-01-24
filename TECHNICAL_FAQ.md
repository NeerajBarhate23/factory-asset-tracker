# Factory Asset Tracker - Frequently Asked Questions (FAQ)

**Purpose**: Comprehensive answers to common technical questions about the project

---

## Table of Contents

1. [Project Overview Questions](#project-overview-questions)
2. [Technology Stack Questions](#technology-stack-questions)
3. [Database Questions](#database-questions)
4. [Authentication & Security Questions](#authentication--security-questions)
5. [Frontend Questions](#frontend-questions)
6. [Backend Questions](#backend-questions)
7. [Architecture & Design Questions](#architecture--design-questions)
8. [Feature-Specific Questions](#feature-specific-questions)
9. [Performance & Scalability Questions](#performance--scalability-questions)
10. [Deployment & DevOps Questions](#deployment--devops-questions)

---

## Project Overview Questions

### Q1: What is the Factory Asset Tracker project?

**Answer**: Factory Asset Tracker is a full-stack web application designed to manage and track factory assets (CNC machines, tools, equipment) in a manufacturing environment. It provides features for asset registration, movement tracking with approval workflows, scheduled audits, role-based access control, QR code generation for physical tracking, and comprehensive reporting. The system replaces manual spreadsheet-based tracking with a digital solution that ensures accountability, compliance, and efficient asset utilization.

### Q2: What problem does it solve?

**Answer**: Manufacturing facilities face several challenges:
- **Lost productivity**: Time wasted searching for equipment
- **Lack of accountability**: No clear ownership or location tracking
- **Compliance issues**: Difficulty proving asset verification for audits
- **Movement delays**: No formal approval process for asset transfers
- **Maintenance gaps**: No tracking of maintenance schedules

This system digitizes these processes, providing real-time visibility, approval workflows, audit trails, and automated tracking through QR codes.

### Q3: Who are the users of this system?

**Answer**: The system has 4 user roles:

1. **ADMIN** - Full system access, user management, all permissions
2. **SHOP_INCHARGE** - Manage assets, approve movements, conduct audits
3. **MAINTENANCE** - Update asset status, conduct audits, limited editing
4. **OPERATOR** - View assets, request movements, read-only access

Each role has specific permissions enforced both in the UI and at the API level.

### Q4: What are the key features?

**Answer**:
1. **Asset Management**: Create, read, update, delete assets with detailed information
2. **QR Code Generation**: Auto-generate QR codes for physical asset identification
3. **Movement Tracking**: Request, approve, and track asset transfers with SLA monitoring
4. **Audit Cycles**: Schedule and conduct physical verification of assets
5. **Dashboard Analytics**: KPIs, charts, and activity feeds
6. **Reporting**: Export data in CSV/PDF formats
7. **File Attachments**: Upload manuals, photos, documents for assets
8. **Activity Logging**: Complete audit trail for compliance
9. **Role-Based Access**: Granular permissions by user role
10. **Real-time Updates**: Live data synchronization (with Supabase variant)

---

## Technology Stack Questions

### Q5: Why did you choose React for the frontend?

**Answer**: I chose React for several reasons:
- **Component-based architecture**: Promotes reusability and maintainability
- **Virtual DOM**: Efficient updates and rendering
- **Large ecosystem**: Extensive libraries and community support
- **React Hooks**: Modern state management without classes
- **Developer experience**: Great debugging tools and documentation
- **Industry standard**: Widely adopted, making collaboration easier
- **Performance**: Efficient reconciliation algorithm

### Q6: Why TypeScript instead of JavaScript?

**Answer**: TypeScript provides:
- **Type safety**: Catch errors at compile time, not runtime
- **Better IDE support**: Autocomplete, refactoring, inline documentation
- **Self-documenting code**: Types serve as inline documentation
- **Easier refactoring**: Compiler catches breaking changes
- **Better collaboration**: Types make code intent clear
- **Prevents bugs**: Many runtime errors become compile-time errors

In this project, TypeScript caught numerous potential bugs during development, especially with API response types and component props.

### Q7: Why Prisma ORM instead of raw SQL or other ORMs?

**Answer**: Prisma offers unique advantages:
- **Type safety**: Auto-generated TypeScript types for all models
- **Developer experience**: Intuitive API, great autocomplete
- **Migrations**: Easy schema versioning with `prisma migrate`
- **Relations**: Simple syntax for joins (`include`, `select`)
- **Performance**: Optimized queries, no N+1 problem
- **SQL injection prevention**: Parameterized queries by default
- **Cross-database**: Can switch between MySQL, PostgreSQL, etc.

Compared to Sequelize or TypeORM, Prisma has better TypeScript integration and simpler syntax.

### Q8: Why MySQL over PostgreSQL or MongoDB?

**Answer**: I chose MySQL because:
- **ACID compliance**: Critical for asset tracking (data integrity)
- **Mature and reliable**: Battle-tested in production
- **Relational model**: Assets, movements, users have clear relationships
- **Wide support**: Hosting availability, tooling
- **Performance**: Excellent for read-heavy workloads

For this use case, a relational database makes sense because data has clear structures and relationships. NoSQL (MongoDB) would be overkill and lose referential integrity benefits.

### Q9: Why Express.js for the backend?

**Answer**: Express is ideal for this project because:
- **Lightweight**: Minimal overhead, fast performance
- **Flexible**: Not opinionated, can structure as needed
- **Middleware ecosystem**: Rich ecosystem for auth, validation, etc.
- **Simple**: Easy to understand and maintain
- **Industry standard**: Most Node.js APIs use Express
- **Great with TypeScript**: Works seamlessly with TypeScript

---

## Database Questions

### Q10: Explain your database schema design.

**Answer**: The schema is normalized into 6 main tables:

**users**: Stores authentication and role information
**assets**: Master data for all factory equipment
**movements**: Tracks asset transfers between locations
**audits**: Physical verification schedules and results
**activities**: Audit trail of all system actions
**asset_files**: File attachments for assets

Key design decisions:
- **Foreign keys**: Maintain referential integrity (e.g., movements.asset_id → assets.id)
- **Enums**: Restrict values to valid options (role, status, category)
- **Indexes**: Speed up common queries (email, asset_uid, status)
- **UUIDs**: Unique IDs prevent collisions, good for distributed systems
- **Timestamps**: Track created_at, updated_at for all records
- **Cascade deletes**: When asset deleted, remove related movements

### Q11: What are database indexes and when did you use them?

**Answer**: Indexes are data structures that speed up queries at the cost of slower writes and more storage.

**Where I added indexes**:
- `users.email`: Fast login lookups (WHERE email = ?)
- `users.role`: Filter users by role
- `assets.asset_uid`: Search by business ID
- `assets.category`: Filter by asset type
- `assets.status`: Filter active/inactive assets
- `assets.location`: Find assets at specific location
- `movements.status`: Filter pending/completed movements
- `activities.created_at`: Recent activity queries
- `audits.scheduled_date`: Upcoming audits

**Rule of thumb**: Index columns used in WHERE, JOIN, and ORDER BY clauses with high selectivity.

### Q12: What are foreign keys and why use them?

**Answer**: Foreign keys enforce referential integrity between tables.

**Example**:
```sql
CREATE TABLE movements (
  asset_id VARCHAR(36),
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);
```

**Benefits**:
- **Data integrity**: Can't reference non-existent records
- **Cascading actions**: Auto-delete related records when parent deleted
- **Relationships**: Explicit documentation of table relationships
- **Database-level enforcement**: Can't bypass in application code

In this project, foreign keys ensure:
- Movements always reference valid assets
- Activities always reference valid users
- Can't delete user who created assets (or use CASCADE to allow)

### Q13: Explain database transactions and where you used them.

**Answer**: A transaction is a group of operations that all succeed or all fail (atomicity).

**Example from movement approval**:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update movement status
  await tx.movement.update({
    where: { id },
    data: { status: 'APPROVED', approvalDate: new Date() }
  });
  
  // 2. Update asset location
  await tx.asset.update({
    where: { id: assetId },
    data: { location: toLocation }
  });
  
  // 3. Log activity
  await tx.activity.create({
    data: { action: 'MOVEMENT_APPROVED', userId, entityId: id }
  });
});
```

**Why**: If any step fails (e.g., network error), all rollback. Prevents inconsistent state (movement approved but asset location not updated).

**ACID properties**:
- **Atomicity**: All or nothing
- **Consistency**: Valid state before and after
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed changes persist

### Q14: How did you handle database migrations?

**Answer**: I used Prisma Migrate for schema versioning:

```bash
# Create migration after schema changes
npx prisma migrate dev --name add_asset_files_table

# Apply migrations in production
npx prisma migrate deploy
```

**Process**:
1. Update `schema.prisma` with changes
2. Run `prisma migrate dev` to create migration SQL
3. Prisma tracks applied migrations in `_prisma_migrations` table
4. In production, run `prisma migrate deploy`

**Benefits**:
- Version control for database changes
- Repeatable deployments
- Rollback capability
- Team collaboration (share migration files)

---

## Authentication & Security Questions

### Q15: How does authentication work in your application?

**Answer**: I implemented JWT-based authentication:

**Login flow**:
1. User submits email/password
2. Backend validates credentials with bcrypt.compare()
3. If valid, generate:
   - Access token (15 min expiry)
   - Refresh token (7 days expiry)
4. Store refresh token in database
5. Return both tokens to client
6. Client stores tokens (localStorage or memory)
7. Client includes access token in Authorization header: `Bearer <token>`

**Token refresh flow**:
1. Access token expires
2. Client gets 401 Unauthorized
3. Client sends refresh token to `/api/auth/refresh`
4. Backend validates refresh token
5. Generate new access token
6. Client retries original request

**Logout**:
1. Client sends logout request
2. Backend invalidates refresh token in database
3. Client clears stored tokens

### Q16: How do JWT tokens work internally?

**Answer**: JWT structure: `header.payload.signature`

**Header** (base64 encoded):
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload** (base64 encoded):
```json
{
  "userId": "uuid-123",
  "role": "ADMIN",
  "iat": 1234567890,  // Issued at timestamp
  "exp": 1234568790   // Expiration timestamp
}
```

**Signature**:
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```

**How it prevents tampering**:
If someone modifies the payload (e.g., change role to ADMIN), the signature won't match. The server recalculates the signature using its SECRET_KEY and compares. Mismatch = invalid token.

**Why stateless**: Server doesn't store sessions. All needed info is in the token. This scales horizontally (multiple servers, no shared session store).

### Q17: How do you securely store passwords?

**Answer**: I use bcrypt hashing:

```typescript
// On registration
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// On login
const isValid = await bcrypt.compare(inputPassword, storedHashedPassword);
```

**Why bcrypt**:
- **Slow**: Intentionally takes ~100ms, prevents brute force
- **Salted**: Each password has unique salt, prevents rainbow tables
- **Adaptive**: Can increase cost factor as computers get faster
- **One-way**: Cannot reverse the hash to get original password

**Salt rounds**: I use 10 rounds, which is standard. Higher = more secure but slower.

**Never**:
- Store passwords in plain text
- Use fast hashes (MD5, SHA1) - can brute force millions/sec
- Use the same salt for all passwords

### Q18: How did you implement Role-Based Access Control (RBAC)?

**Answer**: RBAC enforced at multiple layers:

**1. Database**: Role stored as enum in users table
```sql
role ENUM('ADMIN', 'SHOP_INCHARGE', 'MAINTENANCE', 'OPERATOR')
```

**2. Middleware**: Check permissions before controller
```typescript
export const authorize = (...allowedRoles: Role[]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage
router.delete('/assets/:id',
  authenticate,              // Verify JWT
  authorize('ADMIN'),        // Check role
  assetController.delete
);
```

**3. Frontend**: Conditionally render UI
```tsx
{(user.role === 'ADMIN' || user.role === 'SHOP_INCHARGE') && (
  <Button onClick={handleDelete}>Delete</Button>
)}
```

**Defense in depth**: Even if attacker bypasses UI check, API middleware still enforces permissions.

### Q19: What security vulnerabilities did you protect against?

**Answer**:

**1. SQL Injection**: Prisma uses parameterized queries
```typescript
// Safe - Prisma parameterizes
await prisma.user.findUnique({ where: { email: userInput } });

// Unsafe raw SQL (avoided)
db.query(`SELECT * FROM users WHERE email = '${userInput}'`);
```

**2. XSS (Cross-Site Scripting)**: React auto-escapes content
```tsx
// Safe - React escapes
<div>{userInput}</div>

// Unsafe - dangerouslySetInnerHTML (avoided)
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**3. CSRF (Cross-Site Request Forgery)**: JWT in headers (not cookies)

**4. Password attacks**: bcrypt slow hashing, could add rate limiting

**5. Unauthorized access**: JWT validation, role checks

**6. Data exposure**: Only return necessary fields, hide sensitive data

**7. CORS attacks**: Configured allowed origins

**8. Security headers**: Helmet.js sets X-Frame-Options, CSP, etc.

---

## Frontend Questions

### Q20: How do you manage state in React?

**Answer**: I use multiple state management approaches:

**1. Local component state** (useState):
```tsx
const [isOpen, setIsOpen] = useState(false);
```
Use for: UI state, form inputs

**2. Context API** (global state):
```tsx
const { user, logout } = useAuth();
```
Use for: User session, theme

**3. Server state** (useEffect + useState):
```tsx
const [assets, setAssets] = useState([]);
useEffect(() => {
  fetch('/api/assets').then(r => r.json()).then(d => setAssets(d.data));
}, []);
```
Use for: Data from API

**4. URL state** (query parameters):
```tsx
const [searchParams] = useSearchParams();
const category = searchParams.get('category');
```
Use for: Filters, pagination

For this project size, Context API is sufficient. For larger apps, I'd consider Redux Toolkit or Zustand.

### Q21: Explain useEffect and its dependency array.

**Answer**: useEffect runs side effects in functional components.

**Three patterns**:

```tsx
// 1. Run once on mount
useEffect(() => {
  fetchData();
}, []);  // Empty array

// 2. Run when dependencies change
useEffect(() => {
  fetchAssets(category);
}, [category]);  // Runs when category changes

// 3. Run on every render (usually a bug)
useEffect(() => {
  // No dependency array
});
```

**Cleanup**:
```tsx
useEffect(() => {
  const subscription = subscribeToUpdates();
  
  return () => {
    subscription.unsubscribe();  // Cleanup on unmount
  };
}, []);
```

**Common mistake**: Missing dependencies causes stale closures.

### Q22: What are custom hooks and why use them?

**Answer**: Custom hooks extract reusable stateful logic.

**Example**:
```tsx
function useAssets(filters) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    fetch(`/api/assets?${new URLSearchParams(filters)}`)
      .then(r => r.json())
      .then(d => setAssets(d.data))
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, [filters]);
  
  return { assets, loading, error };
}

// Reuse in multiple components
const { assets, loading } = useAssets({ category: 'CNC_MACHINE' });
```

**Benefits**:
- DRY (Don't Repeat Yourself)
- Easier testing
- Cleaner components
- Share logic without HOCs or render props

### Q23: How did you handle forms in React?

**Answer**: I used controlled components with state:

```tsx
function AssetForm() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: ''
  });
  
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) {
      toast.error('Name required');
      return;
    }
    
    // Submit
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed');
      
      toast.success('Asset created');
      onClose();
    } catch (error) {
      toast.error('Failed to create asset');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
      />
      {/* More fields */}
      <button type="submit">Create</button>
    </form>
  );
}
```

For complex forms, could use React Hook Form or Formik.

---

## Backend Questions

### Q24: What is middleware in Express and how did you use it?

**Answer**: Middleware are functions that process requests before reaching route handlers.

**Signature**: `(req, res, next) => void`

**Types I used**:

**1. Application-level middleware**:
```typescript
app.use(express.json());  // Parse JSON body
app.use(helmet());        // Security headers
app.use(cors());          // CORS
```

**2. Router-level middleware**:
```typescript
router.use(authenticate);  // All routes in this router require auth
```

**3. Error-handling middleware**:
```typescript
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

**4. Route-specific middleware**:
```typescript
router.post('/assets',
  validateAsset,           // Validate input
  authenticate,            // Check JWT
  authorize('ADMIN'),      // Check role
  createAsset              // Controller
);
```

**Chain execution**: Each calls `next()` to pass to next middleware.

### Q25: How did you handle errors in the API?

**Answer**: Centralized error handling with middleware:

```typescript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Controllers throw errors
if (!asset) {
  throw new AppError('Asset not found', 404);
}

// Error handler middleware (must be last)
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      details: err.errors
    });
  }
  
  // Default to 500
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

**Benefits**:
- Consistent error format
- Centralized logging
- Clean controller code (throw instead of res.status everywhere)

### Q26: How did you validate user input?

**Answer**: I used express-validator:

```typescript
import { body, validationResult } from 'express-validator';

export const validateAsset = [
  body('assetUid')
    .notEmpty().withMessage('Asset UID required')
    .isLength({ min: 3, max: 20 }).withMessage('UID 3-20 characters'),
  
  body('name')
    .notEmpty().withMessage('Name required')
    .trim()
    .isLength({ max: 255 }).withMessage('Name too long'),
  
  body('category')
    .isIn(['TOOL_ROOM_SPM', 'CNC_MACHINE', 'WORKSTATION', 'MATERIAL_HANDLING'])
    .withMessage('Invalid category'),
  
  body('location')
    .notEmpty().withMessage('Location required'),
];

// In route
router.post('/assets', validateAsset, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process valid input
});
```

**Why validate**:
- Prevent invalid data in database
- Security (prevent injection, overflow)
- Better error messages

**Where validate**:
- Backend (always) - security layer
- Frontend (optional) - better UX

### Q27: How did you structure your API routes?

**Answer**: RESTful structure with separate route files:

```
/api/auth     - Authentication (login, logout, refresh)
/api/users    - User management (CRUD)
/api/assets   - Asset management (CRUD)
/api/movements - Movement tracking (create, approve, complete)
/api/audits   - Audit cycles (schedule, conduct, complete)
/api/files    - File uploads (upload, download, delete)
/api/reports  - Reporting (export CSV/PDF)
/api/dashboard - Dashboard data (KPIs, charts)
```

**Example route file**:
```typescript
// routes/assetRoutes.ts
import express from 'express';
import * as controller from '../controllers/assetController';
import { authenticate, authorize } from '../middleware/auth';
import { validateAsset } from '../middleware/validator';

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.post('/', authenticate, authorize('ADMIN', 'SHOP_INCHARGE'), validateAsset, controller.create);
router.get('/:id', authenticate, controller.getOne);
router.put('/:id', authenticate, authorize('ADMIN', 'SHOP_INCHARGE'), controller.update);
router.delete('/:id', authenticate, authorize('ADMIN'), controller.delete);

export default router;
```

---

## Architecture & Design Questions

### Q28: Explain the MVC pattern in your project.

**Answer**:

**Model** (Data layer):
- Prisma schema defines data structure
- ORM handles database operations
- Location: `prisma/schema.prisma`

**View** (Presentation layer):
- React components render UI
- No business logic, just display
- Location: `src/components/`

**Controller** (Business logic layer):
- Express controllers process requests
- Validate, transform, interact with models
- Location: `backend/src/controllers/`

**Flow**:
```
User clicks button → React component → API call → Express route → Middleware chain → Controller → Prisma → Database → Response → Update component state → Re-render
```

**Benefits**:
- Separation of concerns
- Easier testing (test logic without UI)
- Reusable components
- Maintainable code

### Q29: What design patterns did you use?

**Answer**:

**1. Repository Pattern**: Prisma abstracts data access
**2. Middleware Pattern**: Request processing chain
**3. Factory Pattern**: Prisma client creation
**4. Singleton Pattern**: Database connection
**5. Observer Pattern**: React state updates trigger re-renders
**6. Composition Pattern**: React component composition
**7. Strategy Pattern**: Different authentication strategies

### Q30: How would you add a new feature?

**Answer**: Example - Add "Asset Categories" management:

**1. Update database**:
```prisma
// schema.prisma
model AssetCategoryConfig {
  id          String @id @default(uuid())
  name        String @unique
  description String?
  icon        String?
}
```

**2. Create migration**:
```bash
npx prisma migrate dev --name add_asset_category_config
```

**3. Add backend routes**:
```typescript
// routes/categoryRoutes.ts
router.get('/categories', getCategories);
router.post('/categories', authorize('ADMIN'), createCategory);
```

**4. Add controller**:
```typescript
// controllers/categoryController.ts
export const getCategories = async (req, res) => {
  const categories = await prisma.assetCategoryConfig.findMany();
  return successResponse(res, categories);
};
```

**5. Create frontend component**:
```tsx
// components/admin/CategoryManagement.tsx
export function CategoryManagement() {
  const { categories, loading } = useCategories();
  // UI to list, create, edit, delete categories
}
```

**6. Add to navigation** (Admin only)

**7. Test**:
- Unit tests for controller
- Integration test for API
- Manual testing in UI

---

## Feature-Specific Questions

### Q31: How does the QR code feature work?

**Answer**:

**Generation**:
```typescript
import QRCode from 'qrcode';

const qrData = {
  assetId: asset.id,
  assetUid: asset.assetUid,
  url: `${process.env.FRONTEND_URL}?asset_id=${asset.id}`
};

const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));

// Store in database
await prisma.asset.update({
  where: { id: asset.id },
  data: { qrCode: qrCodeDataURL }
});
```

**Usage**:
1. QR code displayed in UI (base64 data URL)
2. User prints QR code
3. Attach physical sticker to asset
4. Scan with phone camera
5. Opens URL with `?asset_id=uuid` parameter
6. App detects param, navigates to asset detail page

**Benefits**:
- Quick asset lookup
- Reduces manual searching
- Useful during audits

### Q32: Explain the movement approval workflow.

**Answer**:

**States**:
```
PENDING → APPROVED → IN_TRANSIT → COMPLETED
          ↓
       REJECTED
```

**Flow**:

**1. Request** (Any user):
```typescript
POST /api/movements
{
  "assetId": "uuid",
  "toLocation": "Shop Floor B",
  "reason": "Production requirement",
  "slaHours": 24
}
```

**2. Approval** (Shop Incharge/Admin):
```typescript
PUT /api/movements/:id/approve
// Updates: status = 'APPROVED', approvalDate = now
```

**3. Dispatch** (Operator):
```typescript
PUT /api/movements/:id/dispatch
// Updates: status = 'IN_TRANSIT', dispatchedAt = now
```

**4. Completion** (Receiver):
```typescript
PUT /api/movements/:id/complete
// Updates: status = 'COMPLETED', receivedAt = now, asset.location = toLocation
```

**SLA Tracking**:
```typescript
const slaDeadline = new Date(movement.requestDate);
slaDeadline.setHours(slaDeadline.getHours() + movement.slaHours);

const isOverdue = new Date() > slaDeadline && movement.status !== 'COMPLETED';
```

**Transaction for completion**:
```typescript
await prisma.$transaction([
  prisma.movement.update({ where: { id }, data: { status: 'COMPLETED' } }),
  prisma.asset.update({ where: { id: assetId }, data: { location: toLocation } }),
  prisma.activity.create({ data: activityLog })
]);
```

### Q33: How do audits work?

**Answer**:

**Scheduling**:
```typescript
POST /api/audits
{
  "location": "Shop Floor A",
  "category": "CNC_MACHINE",
  "scheduledDate": "2026-02-01T09:00:00Z",
  "totalAssets": 15
}
```

**Conducting**:
1. Auditor starts audit: `PUT /api/audits/:id/start`
2. Scan each asset's QR code: `PUT /api/audits/:id/scan` with assetId
3. System increments assetsScanned count
4. Complete audit: `PUT /api/audits/:id/complete`

**Discrepancy detection**:
```typescript
const audit = await prisma.audit.findUnique({ where: { id } });
const discrepancies = Math.abs(audit.totalAssets - audit.assetsScanned);

if (discrepancies > 0) {
  await prisma.audit.update({
    where: { id },
    data: { status: 'DISCREPANCY_FOUND', discrepancies }
  });
}
```

**Purpose**:
- Physical verification matches system records
- Identify missing/extra assets
- Compliance requirement

---

## Performance & Scalability Questions

### Q34: How would you optimize database queries?

**Answer**:

**1. Use indexes**:
```sql
CREATE INDEX idx_assets_location ON assets(location);
```

**2. Avoid N+1 queries** (use Prisma include):
```typescript
// Bad: N+1 queries
const movements = await prisma.movement.findMany();
for (const m of movements) {
  const asset = await prisma.asset.findUnique({ where: { id: m.assetId } });
}

// Good: Single query with join
const movements = await prisma.movement.findMany({
  include: { asset: true }
});
```

**3. Select only needed fields**:
```typescript
// Don't fetch qrCode (large base64 string) if not needed
await prisma.asset.findMany({
  select: { id: true, name: true, location: true }
});
```

**4. Pagination**:
```typescript
await prisma.asset.findMany({
  skip: (page - 1) * limit,
  take: limit
});
```

**5. Use database aggregations**:
```typescript
// Count in database, not in application
const count = await prisma.asset.count({ where: { status: 'ACTIVE' } });
```

### Q35: How would you scale this application for 10,000 concurrent users?

**Answer**:

**Database**:
- **Read replicas**: Route reads to replicas, writes to primary
- **Connection pooling**: Prisma has built-in pooling
- **Redis cache**: Cache frequently accessed data (asset list, user profiles)
- **Database sharding**: Partition by location or category if data grows huge

**Backend**:
- **Load balancer**: Distribute requests across multiple servers (nginx, AWS ALB)
- **Horizontal scaling**: Run multiple API instances
- **Rate limiting**: Prevent abuse (express-rate-limit)
- **API caching**: Cache GET responses with ETags
- **Async processing**: Use queues (Bull, RabbitMQ) for heavy operations

**Frontend**:
- **Code splitting**: Load components on demand
- **Lazy loading**: Import components dynamically
- **CDN**: Serve static assets from CDN
- **Service workers**: Cache assets, offline support
- **Virtual scrolling**: For large lists (react-virtual)

**Monitoring**:
- **APM**: Application Performance Monitoring (New Relic, DataDog)
- **Logging**: Centralized logs (ELK stack)
- **Alerts**: Set up alerts for errors, high latency

### Q36: How would you implement caching?

**Answer**:

**1. Browser caching** (HTTP headers):
```typescript
res.set('Cache-Control', 'public, max-age=3600');  // Cache for 1 hour
```

**2. Redis caching** (application level):
```typescript
import Redis from 'ioredis';
const redis = new Redis();

export const getAssets = async (req, res) => {
  const cacheKey = `assets:${JSON.stringify(req.query)}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Query database
  const assets = await prisma.asset.findMany();
  
  // Store in cache (expire after 5 minutes)
  await redis.setex(cacheKey, 300, JSON.stringify(assets));
  
  return res.json(assets);
};
```

**3. Cache invalidation** (on updates):
```typescript
export const updateAsset = async (req, res) => {
  await prisma.asset.update({ where: { id }, data });
  
  // Invalidate cache
  await redis.del('assets:*');  // Or be more specific
  
  return res.json(asset);
};
```

---

## Deployment & DevOps Questions

### Q37: How would you deploy this application to production?

**Answer**:

**Option 1: Traditional hosting**
1. **Backend**: Deploy to VPS (DigitalOcean, AWS EC2)
   - Use PM2 to keep Node.js running
   - Nginx reverse proxy
   - SSL certificate (Let's Encrypt)
2. **Frontend**: Build and deploy to Netlify or Vercel
3. **Database**: Managed MySQL (AWS RDS, PlanetScale)

**Option 2: Containerized (Docker)**
1. Create Dockerfile for backend and frontend
2. Use Docker Compose for local development
3. Deploy to Kubernetes or AWS ECS

**Option 3: Serverless**
1. Backend → AWS Lambda + API Gateway
2. Frontend → Vercel/Netlify
3. Database → AWS RDS or Supabase

**Environment variables**:
```bash
# Production .env
DATABASE_URL="mysql://..."
JWT_SECRET="long-random-string"
NODE_ENV="production"
FRONTEND_URL="https://app.example.com"
```

**SSL/HTTPS**: Required in production for security

### Q38: How would you set up CI/CD?

**Answer**: GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run build
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          ssh user@server 'cd /app && git pull && npm install && npm run build && pm2 restart app'
```

**Steps**:
1. Push to main branch
2. Run tests
3. Build application
4. Deploy to server
5. Restart application

### Q39: How would you monitor the application in production?

**Answer**:

**1. Error tracking**: Sentry
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: process.env.SENTRY_DSN });

app.use(Sentry.Handlers.errorHandler());
```

**2. Logging**: Winston + ELK stack
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Asset created', { assetId: asset.id, userId: user.id });
```

**3. Performance**: New Relic or DataDog
- Track API response times
- Database query performance
- Memory/CPU usage

**4. Uptime monitoring**: Pingdom, UptimeRobot
- Alert if site goes down
- Check every 1-5 minutes

**5. Dashboard**: Grafana
- Visualize metrics
- Custom dashboards

---

## Conclusion

This FAQ covers the most common questions you'll encounter in technical interviews about this project. Practice explaining these concepts out loud, as verbal communication is as important as technical knowledge in interviews.

**Pro Tips**:
1. Use the STAR method (Situation, Task, Action, Result) for behavioral questions
2. Always explain your reasoning ("I chose X because...")
3. Mention trade-offs ("X is faster but Y is more maintainable")
4. Be honest about what you don't know ("I haven't used that, but here's how I'd approach it")
5. Show enthusiasm for the technologies you used

Good luck with your interviews!

---

*FAQ Version 2.0 - Last Updated: January 2026*
