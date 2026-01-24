# Factory Asset Tracker - Complete Project Explanation & Interview Guide

**Version**: 2.0  
**Last Updated**: January 2026  
**Purpose**: Comprehensive guide to understand the entire project and prepare for technical interviews

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack Explained](#2-technology-stack-explained)
3. [Architecture & Design](#3-architecture--design)
4. [Database Design](#4-database-design)
5. [Authentication & Security](#5-authentication--security)
6. [Key Features Explained](#6-key-features-explained)
7. [API Endpoints](#7-api-endpoints)
8. [Frontend Components](#8-frontend-components)
9. [Concepts & Best Practices](#9-concepts--best-practices)
10. [Interview Preparation Q&A](#10-interview-preparation-qa)

---

## 1. Project Overview

### What is Factory Asset Tracker?

Factory Asset Tracker is a **full-stack web application** designed to manage and track factory assets in a manufacturing environment. It helps organizations:
- **Track assets**: Monitor location, status, and ownership of equipment
- **Manage movements**: Control and approve asset transfers between locations
- **Conduct audits**: Schedule and perform physical verification of assets
- **Generate reports**: Analyze asset utilization and performance
- **Maintain compliance**: Keep audit trails of all system activities

### Business Problem It Solves

Manufacturing facilities have hundreds of expensive assets (CNC machines, tools, equipment) that need to be:
- Located quickly when needed
- Moved between departments with proper authorization
- Audited regularly for accountability
- Tracked for maintenance and lifecycle management

This system digitizes and automates these processes, replacing manual spreadsheets and paper-based tracking.

### Asset Types Managed

1. **Tool Room SPM** (Special Purpose Machines)
2. **CNC Machines** (Computer Numerical Control)
3. **Workstations** (Assembly/work benches)
4. **Material Handling Equipment** (Forklifts, conveyors)

---

## 2. Technology Stack Explained

### Frontend Technologies

#### **React 18**
- **What**: JavaScript library for building user interfaces
- **Why**: Component-based architecture, virtual DOM for performance, large ecosystem
- **How used**: All UI components are React components with hooks for state management

#### **TypeScript**
- **What**: Typed superset of JavaScript
- **Why**: Type safety prevents bugs, better IDE support, self-documenting code
- **How used**: All `.tsx` and `.ts` files use TypeScript for type checking

#### **Tailwind CSS v4**
- **What**: Utility-first CSS framework
- **Why**: Rapid styling, consistent design system, small bundle size
- **How used**: All styling done with utility classes like `flex`, `p-4`, `bg-primary`

#### **Vite**
- **What**: Modern build tool and dev server
- **Why**: Fast hot module replacement (HMR), optimized production builds
- **How used**: `npm run dev` starts Vite dev server, `npm run build` creates production bundle

#### **shadcn/ui**
- **What**: Component library built on Radix UI primitives
- **Why**: Accessible, customizable, copy-paste components
- **How used**: UI components like Dialog, Select, Button are from shadcn/ui

#### **Recharts**
- **What**: Charting library for React
- **Why**: Easy to use, responsive charts, built for React
- **How used**: Dashboard KPI charts and trend visualizations

### Backend Technologies

#### **Node.js + Express.js**
- **What**: JavaScript runtime + web framework
- **Why**: Fast, event-driven, large ecosystem
- **How used**: REST API server handling all business logic

#### **Prisma ORM**
- **What**: Type-safe database toolkit
- **Why**: Type safety, migrations, easy queries
- **How used**: All database operations go through Prisma client

#### **MySQL 8**
- **What**: Relational database
- **Why**: ACID compliance, mature, reliable
- **How used**: Stores all application data (users, assets, movements, etc.)

#### **JWT (JSON Web Tokens)**
- **What**: Stateless authentication tokens
- **Why**: Scalable, no server-side session storage needed
- **How used**: Access tokens (15min) + refresh tokens (7 days)

#### **bcrypt**
- **What**: Password hashing library
- **Why**: Industry standard, slow hashing prevents brute force
- **How used**: Hash passwords before storing, verify on login

---

## 3. Architecture & Design

### System Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (React App)   │
└────────┬────────┘
         │ HTTP/HTTPS
         │ REST API
┌────────▼────────┐
│  Express.js     │
│  API Server     │
│  (Port 5000)    │
└────────┬────────┘
         │ Prisma ORM
         │ SQL Queries
┌────────▼────────┐
│     MySQL       │
│   Database      │
│  (Port 3306)    │
└─────────────────┘
```

### Design Patterns Used

#### **1. MVC (Model-View-Controller)**

**Model**: Prisma schema defines data structure  
**Controller**: Business logic in controllers/  
**View**: React components

#### **2. Middleware Chain Pattern**

```
Request → Security → CORS → Auth → Validation → Controller → Response
```

#### **3. Component Composition**

UI built by composing smaller reusable components

### Project Structure

```
factory-asset-tracker/
├── backend/                    # Express.js API
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, validation
│   │   ├── utils/             # Helpers
│   │   └── config/            # Configuration
│   └── prisma/
│       └── schema.prisma      # Database schema
│
├── src/                       # React frontend
│   ├── components/
│   │   ├── assets/           # Asset management
│   │   ├── movements/        # Movement tracking
│   │   ├── audits/           # Audit features
│   │   ├── dashboard/        # Dashboard widgets
│   │   └── ui/               # shadcn components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   └── App.tsx               # Main component
```

---

## 4. Database Design

### Schema Overview

The database has **6 main tables**:

1. **users** - User accounts and authentication
2. **assets** - Factory assets (machines, tools, equipment)
3. **movements** - Asset movement requests and tracking
4. **audits** - Audit schedules and results
5. **activities** - Audit trail of all actions
6. **asset_files** - File attachments for assets

### Key Tables Explained

#### **Users Table**

```sql
- id (UUID primary key)
- email (unique)
- password (bcrypt hashed)
- name
- role (ADMIN | SHOP_INCHARGE | MAINTENANCE | OPERATOR)
- department
- refresh_token
```

#### **Assets Table**

```sql
- id (UUID)
- asset_uid (unique business ID like "SPM-001")
- name
- category (TOOL_ROOM_SPM | CNC_MACHINE | WORKSTATION | MATERIAL_HANDLING)
- status (ACTIVE | MAINTENANCE | INACTIVE | RETIRED)
- location
- criticality (HIGH | MEDIUM | LOW)
- qr_code (base64 QR image)
- created_by_id (foreign key to users)
- assigned_to_id (foreign key to users)
```

#### **Movements Table**

```sql
- id (UUID)
- asset_id (foreign key)
- from_location
- to_location
- status (PENDING | APPROVED | IN_TRANSIT | COMPLETED | REJECTED)
- sla_hours (deadline)
- requested_by_id (foreign key)
- approval_date
- dispatched_at
- received_at
```

---

## 5. Authentication & Security

### Authentication Flow

1. **Login**: User enters email/password
2. **Validation**: Backend verifies credentials with bcrypt
3. **Token Generation**: Creates access token (15min) + refresh token (7 days)
4. **Authorization**: Frontend sends token in headers for protected endpoints
5. **Token Refresh**: When expired, use refresh token to get new access token

### JWT Structure

```
header.payload.signature

Payload example:
{
  "userId": "123",
  "role": "ADMIN",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Role-Based Access Control

| Feature | Admin | Shop Incharge | Maintenance | Operator |
|---------|-------|---------------|-------------|----------|
| View Assets | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Assets | ✅ | ✅ | ⚠️  | ❌ |
| Delete Assets | ✅ | ❌ | ❌ | ❌ |
| Approve Movements | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |

### Security Measures

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Stateless authentication
- **Input Validation**: express-validator on all endpoints
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **CORS**: Restricts API access to allowed domains
- **Helmet.js**: Security HTTP headers

---

## 6. Key Features Explained

### Feature 1: Asset Management

**Purpose**: Track all factory assets with detailed information

**Key Capabilities**:
- Create assets with auto-generated UID
- Generate QR codes for physical tracking
- Update asset status and location
- Attach files (manuals, photos)
- View complete asset history

**Workflow**:
1. Admin/Shop Incharge creates new asset
2. System generates unique UID (e.g., "SPM-001")
3. QR code generated and stored
4. Asset available in system
5. Can be tracked, moved, audited

### Feature 2: Movement Tracking

**Purpose**: Control asset movements with approval workflow

**States**:
```
PENDING → APPROVED → IN_TRANSIT → COMPLETED
           ↓
        REJECTED
```

**Workflow**:
1. User requests movement (asset, from, to, reason)
2. Shop Incharge/Admin reviews
3. If approved, asset goes to IN_TRANSIT
4. Operator dispatches asset
5. Receiver confirms completion
6. Movement marked COMPLETED

**SLA Tracking**: Each movement has deadline, system highlights overdue ones

### Feature 3: Audit Cycles

**Purpose**: Physical verification of assets

**Process**:
1. Schedule audit (location/category/date)
2. Auditor scans asset QR codes
3. System counts scanned assets
4. Compares with expected count
5. Flags discrepancies
6. Complete audit with notes

### Feature 4: QR Code Integration

**Content**: Asset ID + URL to view asset

**Use Cases**:
- Print and attach to physical asset
- Scan with phone to view details
- Quick asset lookup during audits
- Direct navigation to asset page

### Feature 5: Dashboard & Reports

**Dashboard Widgets**:
- KPI cards (total assets, active, pending movements)
- Charts (assets by category, status distribution)
- Activity feed (recent actions)
- Alerts (overdue movements, upcoming audits)

**Reports**:
- Asset inventory (CSV/PDF export)
- Movement history
- Audit results
- Activity logs

---

## 7. API Endpoints

### Authentication

```
POST   /api/auth/login          # Login with email/password
POST   /api/auth/refresh        # Get new access token
POST   /api/auth/logout         # Invalidate refresh token
GET    /api/auth/me             # Get current user
PUT    /api/auth/change-password # Change password
```

### Assets

```
GET    /api/assets              # List all assets (with filters)
POST   /api/assets              # Create new asset
GET    /api/assets/:id          # Get single asset
PUT    /api/assets/:id          # Update asset
DELETE /api/assets/:id          # Delete asset (admin only)
```

### Movements

```
GET    /api/movements           # List movements
POST   /api/movements           # Create movement request
PUT    /api/movements/:id/approve   # Approve movement
PUT    /api/movements/:id/reject    # Reject movement
PUT    /api/movements/:id/dispatch  # Mark dispatched
PUT    /api/movements/:id/complete  # Mark completed
```

### Audits

```
GET    /api/audits              # List audits
POST   /api/audits              # Create audit
PUT    /api/audits/:id/start    # Start audit
PUT    /api/audits/:id/scan     # Record scanned asset
PUT    /api/audits/:id/complete # Complete audit
```

### Dashboard

```
GET    /api/dashboard/kpis      # Get KPI numbers
GET    /api/dashboard/charts    # Get chart data
GET    /api/dashboard/activities # Get recent activities
```

---

## 8. Frontend Components

### Component Hierarchy

```
App.tsx
├── AuthProvider (Context)
│   ├── LoginForm (if not authenticated)
│   └── Main App (if authenticated)
│       ├── Sidebar (Navigation)
│       ├── Navbar (User menu, theme toggle)
│       └── Content Area
│           ├── DashboardView
│           ├── AssetsList
│           ├── MovementsView
│           ├── AuditsView
│           ├── ReportsView
│           └── UserManagement (Admin only)
```

### Key Patterns

#### Dialog Pattern (Modals)
```tsx
<Dialog>
  <DialogTrigger>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    {/* Content */}
  </DialogContent>
</Dialog>
```

#### Custom Hooks
```tsx
function useAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAssets().then(setAssets);
  }, []);
  
  return { assets, loading };
}
```

---

## 9. Concepts & Best Practices

### RESTful API Design

**Principles**:
- Resources as URLs (`/api/assets/:id`)
- HTTP methods (GET, POST, PUT, DELETE)
- Stateless requests
- JSON responses

### Error Handling

**Backend**:
```typescript
try {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) return errorResponse(res, 'Not found', 404);
  return successResponse(res, asset);
} catch (error) {
  return errorResponse(res, error.message, 500);
}
```

**Frontend**:
```tsx
try {
  const response = await fetch('/api/assets');
  if (!response.ok) throw new Error('Failed');
  const data = await response.json();
  setAssets(data.data);
} catch (error) {
  toast.error('Failed to load assets');
}
```

### Database Best Practices

- **Indexes**: Speed up queries on filtered columns
- **Foreign Keys**: Enforce referential integrity
- **Transactions**: Ensure atomic multi-step operations
- **Normalized Data**: Avoid duplication
- **Constraints**: Unique, not null enforce data validity

---

## 10. Interview Preparation Q&A

### General Questions

**Q: Tell me about your Factory Asset Tracker project.**

**A**: "I built a full-stack web application to track and manage factory assets. The system handles asset registration, movement tracking with approval workflows, scheduled audits, and reporting. It uses React with TypeScript for the frontend, Express.js for the REST API, and MySQL with Prisma ORM for the database. The application supports 4 user roles with different permissions and includes features like QR code generation, real-time dashboards, and comprehensive activity logging for compliance."

**Q: What was the biggest challenge?**

**A**: "The biggest challenge was implementing the movement approval workflow with SLA tracking. I had to handle multiple states (pending, approved, in-transit, completed) and ensure proper authorization at each step. I used database transactions to update the movement status, asset location, and activity log atomically. For SLA tracking, I calculated time differences between request and completion timestamps and highlighted overdue movements on the dashboard."

**Q: Why this tech stack?**

**A**:
- **React**: Component-based, reusable UI
- **TypeScript**: Type safety prevents bugs
- **Express**: Lightweight, flexible API framework
- **Prisma**: Type-safe database queries
- **MySQL**: Reliable RDBMS with ACID compliance

### Technical Questions

**Q: How did you implement authentication?**

**A**: "I implemented JWT-based authentication with access and refresh tokens. Passwords are hashed with bcrypt before storing. When users log in, they receive an access token (15 min) and refresh token (7 days). The frontend includes the access token in Authorization headers. When expired, it automatically requests a new one using the refresh token. For authorization, middleware checks user roles before allowing access to endpoints."

**Q: Explain your database schema.**

**A**: "I designed a normalized schema with 6 tables:
- **users**: Authentication and roles
- **assets**: Master data with foreign keys
- **movements**: Tracks transfers with status workflow
- **audits**: Physical verification schedules
- **activities**: Audit trail
- **asset_files**: Attachments

I used foreign keys for referential integrity, indexes on frequently queried columns, and enums to restrict values."

**Q: How do you handle errors?**

**A**: "I have centralized error handling middleware that catches all errors and returns appropriate HTTP status codes. For validation, I use express-validator to check inputs before controllers. The frontend displays user-friendly error messages using toast notifications."

**Q: What is Prisma and why use it?**

**A**: "Prisma is an ORM that provides type-safe database operations. Instead of raw SQL, I define my schema and Prisma generates a type-safe client. Benefits include TypeScript autocomplete, easy migrations, automatic joins, and SQL injection prevention through parameterized queries."

**Q: How would you scale this for 10,000 users?**

**A**:
1. **Database**: Read replicas, connection pooling, Redis cache
2. **API**: Load balancer, multiple instances, rate limiting
3. **Frontend**: Code splitting, lazy loading, CDN for static assets
4. **Monitoring**: APM tools, logging aggregation

### React Questions

**Q: How do you manage state in React?**

**A**:
- **Local state**: `useState` for component-specific data
- **Context API**: Global state (AuthContext for user session)
- **Server state**: API data with useEffect + useState

**Q: Explain useEffect.**

**A**: "useEffect runs side effects in functional components. The dependency array controls when it runs:
- Empty array `[]`: Run once on mount
- With dependencies `[filter]`: Run when filter changes
- No array: Run on every render (usually a bug)"

### Backend Questions

**Q: What is middleware in Express?**

**A**: "Middleware are functions that process requests before route handlers. They execute in order and can modify req/res, end the cycle, or call next(). I use middleware for authentication, authorization, validation, logging, and error handling."

**Q: How do you prevent SQL injection?**

**A**: "Prisma automatically uses parameterized queries which prevent SQL injection. The query builder escapes all values, making injection impossible."

### Security Questions

**Q: How do you store passwords securely?**

**A**: "I use bcrypt hashing with 10 salt rounds. bcrypt is intentionally slow to prevent brute force attacks and includes automatic salting to prevent rainbow table attacks. Never store plain text passwords."

**Q: What security measures did you implement?**

**A**:
1. Helmet.js for security headers
2. CORS restrictions
3. Input validation
4. SQL injection prevention (Prisma)
5. JWT expiration
6. Password hashing
7. Role-based authorization

### System Design Questions

**Q: How would you implement real-time notifications?**

**A**:
1. **WebSockets**: Bi-directional for live updates (Socket.io)
2. **Server-Sent Events**: One-way server to client
3. **Polling**: Fallback, but inefficient

**Q: Design file upload system.**

**A**:
1. Frontend: FormData with file
2. Backend: Multer middleware validates and saves to disk
3. Database: Store metadata (filename, size, path)
4. Production: Use S3/GCS instead of local disk
5. Security: Virus scanning, type validation, access control

---

## Conclusion

This project demonstrates proficiency in:

✅ Full-stack development (React + Express + MySQL)  
✅ Authentication & Authorization (JWT + RBAC)  
✅ Database design (Normalized schema with Prisma)  
✅ RESTful API design  
✅ Modern frontend (React hooks, TypeScript)  
✅ Security best practices  
✅ Business logic (Workflows, approvals)  
✅ Code organization (MVC pattern)

### Next Steps for Interview Prep

1. Review this document thoroughly
2. Practice explaining each section out loud
3. Run the application and test all features
4. Review actual code in the repository
5. Prepare answers to common questions
6. Be ready to discuss improvements and trade-offs

**Good luck with your interviews!**

---

*Document Version: 2.0*  
*Last Updated: January 2026*
