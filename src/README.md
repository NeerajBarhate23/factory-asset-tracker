# Factory Asset Tracking System

A comprehensive full-stack web application for managing and tracking factory assets including Tool Room SPMs, CNC Machines, Workstations, and Material Handling Equipment with role-based access control.

## 🚀 Features

- ✅ **Asset Management** - Create, view, edit, and track factory assets
- ✅ **Movement Control** - Request, approve, and track asset movements with SLA management
- ✅ **Audit Cycles** - Schedule and conduct physical asset audits
- ✅ **Role-Based Access** - 3 active user roles with granular permissions (Admin, Shop In-charge, Operator)
- ✅ **Real-time Updates** - Live data synchronization across all connected clients
- ✅ **QR Code Generation** - Generate QR codes for asset identification
- ✅ **Dashboard & Analytics** - KPIs, charts, and activity tracking
- ✅ **Reports & Export** - Generate and export reports in CSV format
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile devices
- ✅ **Dark Mode** - Toggle between light and dark themes

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first styling
- **Vite** - Build tool and dev server
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database (via Supabase)
- **Supabase Auth** - Authentication
- **Supabase Realtime** - WebSocket live updates
- **Row Level Security** - Database-level authorization

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd factory-asset-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Project Settings → API
3. Update `/utils/supabase/info.tsx`:

```typescript
export const projectId = "your-project-id"
export const publicAnonKey = "your-anon-key"
```

### 4. Set Up Database

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `DATABASE_SETUP.sql`
4. Paste and click **RUN**
5. Wait ~30 seconds for completion

This creates:
- All database tables (users, assets, movements, audits, activity_logs)
- Row Level Security policies
- Database functions and triggers
- Sample data with 4 test users

### 5. Start Development Server

```bash
npm run dev
```

### 6. Login

Open http://localhost:5173 and login with one of the test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@factory.com | admin123 |
| Shop In-charge | shop@factory.com | shop123 |
| Operator | operator@factory.com | oper123 |

**Note**: The Maintenance role is currently disabled. See `MAINTENANCE_ROLE_DISABLED.md` for details.

## 📂 Project Structure

```
/
├── App.tsx                      # Main application component
├── components/                  # React components
│   ├── admin/                   # Admin features
│   ├── assets/                  # Asset management
│   ├── audits/                  # Audit cycles
│   ├── auth/                    # Authentication
│   ├── dashboard/               # Dashboard widgets
│   ├── layout/                  # Sidebar, navbar
│   ├── movements/               # Movement requests
│   ├── reports/                 # Reporting
│   ├── settings/                # Settings
│   └── ui/                      # UI components (shadcn)
├── contexts/                    # React contexts
├── hooks/                       # Custom React hooks
├── lib/                         # Utilities and config
├── styles/                      # Global CSS
├── utils/                       # Helper functions
├── DATABASE_SETUP.sql           # Complete database setup
└── COMPLETE_SYSTEM_DOCUMENTATION.md  # Full documentation
```

## 🔐 User Roles & Permissions

**Active Roles**: 3 (Maintenance role currently disabled)

| Feature | Admin | Shop In-charge | Operator |
|---------|-------|----------------|----------|
| View Assets | ✅ | ✅ | ✅ |
| Create/Edit Assets | ✅ | ✅ | ❌ |
| Delete Assets | ✅ | ❌ | ❌ |
| Request Movements | ✅ | ✅ | ✅ |
| Approve Movements | ✅ | ✅ | ❌ |
| Create Audits | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |

## 📊 Database Schema

### Tables

1. **users** - User profiles and roles
2. **assets** - Asset master data
3. **movements** - Movement requests and approvals
4. **audits** - Audit schedules and results
5. **activity_logs** - System activity tracking

All tables have Row Level Security (RLS) policies enforcing role-based access.

## 🔧 Configuration

### Environment Variables

Supabase configuration is stored in `/utils/supabase/info.tsx`:

```typescript
export const projectId = "your-project-id"
export const publicAnonKey = "your-anon-key"
```

### Tailwind CSS

Custom theme configuration is in `/styles/globals.css` using Tailwind v4 syntax.

## 🏗️ Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## 🚢 Deployment

### Deploy to Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

### Deploy to Netlify

1. Build: `npm run build`
2. Upload `dist/` folder to Netlify

### Environment Variables for Production

Set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📚 Documentation

- **COMPLETE_SYSTEM_DOCUMENTATION.md** - Comprehensive 50+ page guide covering:
  - Complete architecture
  - Database schema with SQL
  - All features (working and not working)
  - API routes and hooks
  - User permissions
  - Setup and deployment
  - Known issues and limitations

- **SETUP.md** - Step-by-step setup instructions

- **DATABASE_SETUP.sql** - Complete database schema and sample data

## 🐛 Troubleshooting

### "Could not find table" error
Run `DATABASE_SETUP.sql` in Supabase SQL Editor

### Connection error
Check that your Supabase project exists and credentials are correct in `/utils/supabase/info.tsx`

### "User profile not found"
Ensure you ran `DATABASE_SETUP.sql` which creates test users

### Real-time updates not working
Check browser console for WebSocket errors. Ensure Supabase Realtime is enabled in project settings.

## 🤝 Contributing

This is a production application. For changes:

1. Create a feature branch
2. Make your changes
3. Test thoroughly with all 4 user roles
4. Submit a pull request

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Backend by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For issues and questions, see `COMPLETE_SYSTEM_DOCUMENTATION.md` or open an issue in this repository.

---

**Status**: ✅ Production Ready  
**Version**: 2.0  
**Last Updated**: October 15, 2025
