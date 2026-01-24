# Factory Asset Tracker

A comprehensive full-stack web application for managing and tracking factory assets including Tool Room SPMs, CNC Machines, Workstations, and Material Handling Equipment with role-based access control.

## 📚 **NEW: Complete Project Documentation**

**Want to understand this entire project?** We've created comprehensive documentation to explain everything:

### Quick Start Documentation
- **[SUMMARY.md](./SUMMARY.md)** - Start here! Overview of all documentation
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⭐ - 10-minute quick review guide
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - How to navigate all docs

### Comprehensive Guides
- **[PROJECT_EXPLANATION.md](./PROJECT_EXPLANATION.md)** ⭐ - Complete 50+ page guide with 100+ interview Q&A
- **[TECHNICAL_FAQ.md](./TECHNICAL_FAQ.md)** ⭐ - 40+ detailed technical questions and answers

**These guides cover:**
- Complete technology stack explanations (React, TypeScript, Express, Prisma, MySQL)
- Architecture and design patterns
- Database design and relationships
- Authentication & security implementation
- All features explained with workflows
- Interview preparation with detailed Q&A
- Code examples and best practices

---

## 🚀 Quick Start

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on http://localhost:5173

### Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup database
npm run prisma:migrate

# Start backend server
npm run dev
```

The backend API will run on http://localhost:5000

---

## 📖 More Documentation

- **Frontend**: See [src/README.md](./src/README.md) for frontend documentation
- **Backend**: See [backend/README.md](./backend/README.md) for backend API documentation
- **Setup Guide**: See [src/SETUP.md](./src/SETUP.md) for detailed setup instructions
- **Complete System**: See [src/COMPLETE_SYSTEM_DOCUMENTATION.md](./src/COMPLETE_SYSTEM_DOCUMENTATION.md)

---

## 🎯 Project Overview

Factory Asset Tracker is a full-stack application that helps manufacturing facilities:
- **Track assets**: Monitor location, status, and ownership of equipment
- **Manage movements**: Control and approve asset transfers with approval workflows
- **Conduct audits**: Schedule and perform physical verification of assets
- **Generate reports**: Analyze asset utilization and performance
- **Maintain compliance**: Keep audit trails of all system activities

### Key Features
✅ Asset Management with QR code generation  
✅ Movement tracking with approval workflows  
✅ Audit cycles and physical verification  
✅ Role-based access control (4 user roles)  
✅ Dashboard with KPIs and analytics  
✅ Reports export (CSV/PDF)  
✅ Real-time updates  
✅ Dark mode support  

---

## 🛠️ Technology Stack

**Frontend**: React 18, TypeScript, Tailwind CSS, Vite, shadcn/ui  
**Backend**: Node.js, Express.js, Prisma ORM, MySQL  
**Authentication**: JWT with bcrypt  
**Security**: Helmet, CORS, Input validation, RBAC  

---

## 👤 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@factory.com | admin123 |
| Shop Incharge | shop@factory.com | shop123 |
| Operator | operator@factory.com | oper123 |

---

## 📄 License

This project is part of the Factory Asset Tracker system. Original design: https://www.figma.com/design/bGwFQw1S3DCPm7EHAJmN62/ASSET-TRACKER

---

**For complete project understanding, interview preparation, and technical details, see the documentation files listed above! 📚**