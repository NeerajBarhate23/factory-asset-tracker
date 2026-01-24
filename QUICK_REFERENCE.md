# Factory Asset Tracker - Quick Reference Guide

**For**: Quick review before interviews and presentations

---

## 🎯 Project Summary (30 seconds)

"Factory Asset Tracker is a full-stack web application for managing factory equipment. Built with **React + TypeScript** frontend, **Express.js** backend, and **MySQL** database. Features include asset registration with QR codes, movement tracking with approval workflows, scheduled audits, role-based access control, and real-time dashboards. Demonstrates proficiency in modern web development, REST APIs, database design, authentication, and security best practices."

---

## 🛠️ Tech Stack (Memorize This)

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **shadcn/ui** - Component library
- **Recharts** - Charts

### Backend
- **Node.js + Express** - API server
- **Prisma ORM** - Database toolkit
- **MySQL 8** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads

---

## 📊 Database Tables (6 Main)

1. **users** - Authentication, roles (ADMIN, SHOP_INCHARGE, MAINTENANCE, OPERATOR)
2. **assets** - Factory equipment (CNC machines, tools)
3. **movements** - Transfer requests with approval workflow
4. **audits** - Physical verification schedules
5. **activities** - Audit trail (who did what, when)
6. **asset_files** - Attachments (manuals, photos)

---

## 🔐 Authentication Flow

1. User logs in → Email/password
2. Backend verifies → bcrypt.compare()
3. Generate tokens → Access (15min) + Refresh (7 days)
4. Frontend stores → Send in Authorization header
5. Token expires → Auto-refresh using refresh token

---

## 🎨 Key Features (Know These Well)

1. **Asset Management** - CRUD operations, QR codes, file attachments
2. **Movement Tracking** - Request → Approve → Dispatch → Complete (with SLA)
3. **Audit Cycles** - Schedule → Scan assets → Compare → Report discrepancies
4. **Dashboard** - KPIs, charts, activity feed
5. **Reports** - CSV/PDF exports
6. **User Management** - Role-based permissions (Admin only)

---

## 🔄 Movement Workflow (Important!)

```
PENDING → APPROVED → IN_TRANSIT → COMPLETED
            ↓
         REJECTED
```

- User requests movement
- Shop Incharge/Admin approves or rejects
- If approved, moves to IN_TRANSIT
- Operator dispatches
- Receiver confirms completion

---

## 🚪 API Endpoints (Key Ones)

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Get new access token
- `POST /api/auth/logout` - Logout

### Assets
- `GET /api/assets` - List all (with filters)
- `POST /api/assets` - Create
- `GET /api/assets/:id` - Get one
- `PUT /api/assets/:id` - Update
- `DELETE /api/assets/:id` - Delete (Admin only)

### Movements
- `POST /api/movements` - Create request
- `PUT /api/movements/:id/approve` - Approve
- `PUT /api/movements/:id/complete` - Complete

---

## 👥 Role Permissions Matrix

| Action | Admin | Shop Incharge | Maintenance | Operator |
|--------|-------|---------------|-------------|----------|
| View Assets | ✅ | ✅ | ✅ | ✅ |
| Create Assets | ✅ | ✅ | ❌ | ❌ |
| Delete Assets | ✅ | ❌ | ❌ | ❌ |
| Approve Movements | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |

---

## 🏗️ Architecture Pattern

**MVC (Model-View-Controller)**

- **Model**: Prisma schema (database structure)
- **View**: React components (UI)
- **Controller**: Express controllers (business logic)

**Middleware Chain**:
```
Request → Security (Helmet)
        → CORS
        → Body Parser
        → Authentication (JWT verify)
        → Authorization (role check)
        → Validation (express-validator)
        → Controller
        → Response
```

---

## 🔒 Security Implemented

1. **Password Hashing**: bcrypt (10 salt rounds)
2. **JWT Tokens**: Stateless auth, short-lived access tokens
3. **Input Validation**: express-validator on all endpoints
4. **SQL Injection Prevention**: Prisma ORM (parameterized queries)
5. **CORS**: Restrict API access
6. **Helmet.js**: Security HTTP headers
7. **Role-Based Authorization**: Middleware checks

---

## ⚡ React Patterns Used

### Hooks
- `useState` - Local component state
- `useEffect` - Side effects, data fetching
- `useContext` - Access global state (AuthContext)
- Custom hooks - Reusable logic (useAssets, useAuth)

### Context API
```tsx
<AuthProvider>  {/* Wraps entire app */}
  <App />
</AuthProvider>

// Access anywhere:
const { user, logout } = useAuth();
```

### Component Composition
```tsx
<Dialog>
  <DialogTrigger><Button>Open</Button></DialogTrigger>
  <DialogContent>
    <DialogTitle>Title</DialogTitle>
    {/* Content */}
  </DialogContent>
</Dialog>
```

---

## 💡 Interview Q&A Essentials

### Q: Biggest challenge?
**A**: "Movement workflow with SLA tracking. Used database transactions for atomic updates and calculated time differences for SLA monitoring."

### Q: Why this tech stack?
**A**: "React for component reusability, TypeScript for type safety, Express for lightweight API, Prisma for type-safe queries, MySQL for ACID compliance."

### Q: How does JWT work?
**A**: "Three parts: header.payload.signature. Payload contains user info, signature prevents tampering. Server verifies by recalculating signature with secret key."

### Q: What is Prisma?
**A**: "Type-safe ORM. Define schema, get auto-generated TypeScript client. Prevents SQL injection, provides TypeScript autocomplete, handles migrations."

### Q: How to scale for 10,000 users?
**A**: "Database: read replicas, Redis cache. API: load balancer, multiple instances, rate limiting. Frontend: code splitting, CDN. Monitoring: APM tools."

### Q: What is middleware?
**A**: "Functions that process requests before route handlers. Execute in order, can modify req/res, call next() or end cycle. Used for auth, validation, logging, errors."

### Q: Explain RBAC?
**A**: "Role-Based Access Control. Each user has a role (enum in DB). Middleware checks if role allowed for endpoint. Frontend conditionally renders based on role."

### Q: SQL injection prevention?
**A**: "Prisma uses parameterized queries automatically. Never concatenate user input into SQL strings. All values escaped/sanitized."

---

## 📁 Project Structure (Know Location)

```
/backend/
  /src/
    /controllers/    # Business logic
    /routes/         # API endpoints
    /middleware/     # Auth, validation
    /utils/          # Helpers (JWT, bcrypt)
  /prisma/
    schema.prisma    # Database schema

/src/
  /components/
    /assets/         # Asset features
    /movements/      # Movement tracking
    /dashboard/      # KPIs, charts
    /ui/             # shadcn components
  /contexts/         # AuthContext
  App.tsx            # Main component
```

---

## 🎓 Key Concepts to Explain

### REST API
- Resources as URLs (/api/assets/:id)
- HTTP methods (GET, POST, PUT, DELETE)
- Stateless
- JSON responses

### ORM (Prisma)
- Object-Relational Mapping
- Write code, not SQL
- Type-safe queries
- Auto migrations

### JWT
- JSON Web Token
- header.payload.signature
- Stateless (no server-side session)
- Self-contained

### Database Normalization
- Avoid data duplication
- Use foreign keys
- One source of truth
- Easier to maintain

### Middleware Pattern
- Functions between request and response
- Can modify, validate, authenticate
- Execute in order
- Call next() to continue chain

---

## ✅ Testing Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@factory.com | admin123 |
| Shop Incharge | shop@factory.com | shop123 |
| Operator | operator@factory.com | oper123 |

---

## 📝 Code Snippets to Know

### Prisma Query
```typescript
const assets = await prisma.asset.findMany({
  where: { status: 'ACTIVE' },
  include: { movements: true }
});
```

### JWT Middleware
```typescript
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### React Custom Hook
```tsx
function useAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/assets')
      .then(r => r.json())
      .then(d => setAssets(d.data))
      .finally(() => setLoading(false));
  }, []);
  
  return { assets, loading };
}
```

---

## 🚀 How to Run Project

```bash
# Backend
cd backend
npm install
npm run prisma:migrate
npm run dev         # Port 5000

# Frontend
npm install
npm run dev         # Port 5173
```

---

## 💪 Strengths to Highlight

1. **Full-stack**: Comfortable with both frontend and backend
2. **Type safety**: TypeScript throughout
3. **Security**: JWT, bcrypt, input validation, RBAC
4. **Best practices**: MVC, middleware, error handling
5. **Modern stack**: React hooks, Prisma ORM, Tailwind
6. **Real-world features**: Approvals, audits, SLA tracking
7. **Scalable design**: Database indexes, API structure

---

## 🎯 Remember These Numbers

- **6 database tables**
- **4 user roles**
- **8 API route modules**
- **15 min** access token expiry
- **7 days** refresh token expiry
- **10 salt rounds** for bcrypt
- **4 asset categories**
- **5 movement statuses**

---

## 📚 Further Study Topics

- GraphQL (alternative to REST)
- Redis caching
- Docker containers
- CI/CD pipelines
- WebSockets (real-time)
- Unit testing (Jest)
- Performance optimization

---

**Pro Tip**: Practice explaining the project out loud. Use the STAR method (Situation, Task, Action, Result) when discussing challenges.

---

*Quick Reference v2.0 - Last Updated: January 2026*
