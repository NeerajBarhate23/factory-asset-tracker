# Factory Asset Tracking System - File Structure

**Last Updated**: October 15, 2025  
**Status**: ✅ Clean and Organized

---

## 📁 Complete File Structure

```
factory-asset-tracker/
│
├── 📄 App.tsx                               # Main application component
├── 📄 main.tsx                              # Vite entry point
├── 📄 index.html                            # HTML template
├── 📄 package.json                          # Dependencies and scripts
├── 📄 tsconfig.json                         # TypeScript configuration
├── 📄 vite.config.ts                        # Vite configuration
│
├── 📚 Documentation/
│   ├── README.md                            # Project overview and quick start
│   ├── SETUP.md                             # Detailed setup instructions
│   ├── DATABASE_SETUP.sql                   # Complete database setup
│   └── COMPLETE_SYSTEM_DOCUMENTATION.md     # Full technical documentation
│
├── 📂 components/                           # React components
│   │
│   ├── 📂 admin/                            # Admin-only components
│   │   └── UserManagement.tsx               # User CRUD interface
│   │
│   ├── 📂 assets/                           # Asset management
│   │   ├── AssetsList.tsx                   # Asset table view
│   │   ├── AssetDetail.tsx                  # Single asset detail page
│   │   ├── QRCodeDisplay.tsx                # QR code renderer
│   │   └── BulkQRCodeGenerator.tsx          # Batch QR generation
│   │
│   ├── 📂 audits/                           # Audit management
│   │   └── AuditsView.tsx                   # Audit list and creation
│   │
│   ├── 📂 auth/                             # Authentication
│   │   ├── LoginForm.tsx                    # Login page
│   │   ├── SetupWizard.tsx                  # Database setup guide
│   │   └── SupabaseConnectionError.tsx      # Connection error handler
│   │
│   ├── 📂 dashboard/                        # Dashboard widgets
│   │   ├── DashboardView.tsx                # Main dashboard layout
│   │   ├── KPICard.tsx                      # Metric display card
│   │   ├── ActivityFeed.tsx                 # Recent activity list
│   │   └── TrendCharts.tsx                  # Data visualization charts
│   │
│   ├── 📂 figma/                            # Figma integration (system)
│   │   └── ImageWithFallback.tsx            # Protected image component
│   │
│   ├── 📂 layout/                           # Layout components
│   │   ├── AppSidebar.tsx                   # Navigation sidebar
│   │   └── Navbar.tsx                       # Top navigation bar
│   │
│   ├── 📂 movements/                        # Movement requests
│   │   └── MovementsView.tsx                # Movement list and approval
│   │
│   ├── 📂 reports/                          # Reporting
│   │   └── ReportsView.tsx                  # Report generation and export
│   │
│   ├── 📂 settings/                         # Settings
│   │   └── SettingsView.tsx                 # User and system settings
│   │
│   └── 📂 ui/                               # shadcn/ui components (40+)
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── sidebar.tsx
│       ├── sonner.tsx                       # Toast notifications
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── tooltip.tsx
│       └── ... (35+ more components)
│
├── 📂 contexts/                             # React contexts
│   └── AuthContext.tsx                      # Authentication state management
│
├── 📂 hooks/                                # Custom React hooks
│   ├── useActivities.ts                     # Activity logs hook
│   ├── useAssets.ts                         # Assets data hook
│   ├── useAudits.ts                         # Audits data hook
│   ├── useDashboardData.ts                  # Dashboard metrics hook
│   └── useMovements.ts                      # Movements data hook
│
├── 📂 lib/                                  # Libraries and utilities
│   ├── mock-data.ts                         # Fallback/sample data
│   ├── supabase.ts                          # Supabase client initialization
│   └── types.ts                             # TypeScript type definitions
│
├── 📂 styles/                               # Styling
│   └── globals.css                          # Tailwind v4 + custom CSS
│
├── 📂 supabase/                             # Supabase integration
│   └── functions/
│       └── server/
│           ├── index.tsx                    # Edge function server (minimal)
│           └── kv_store.tsx                 # Key-value store utility (protected)
│
└── 📂 utils/                                # Helper utilities
    ├── csvExport.ts                         # CSV export functionality
    └── supabase/
        └── info.tsx                         # Supabase config (auto-generated)
```

---

## 📊 Statistics

### Component Count
- **Total Components**: 50+
- **Page Components**: 12
- **UI Components**: 40+
- **Custom Hooks**: 5
- **Context Providers**: 1

### File Count by Type
- **TypeScript/TSX**: ~70 files
- **CSS**: 1 file (globals.css)
- **Configuration**: 5 files (package.json, tsconfig, vite, etc.)
- **Documentation**: 4 files
- **SQL**: 1 file (database setup)

### Lines of Code (Approximate)
- **Frontend Code**: ~8,000 lines
- **Database Schema**: ~600 lines
- **Documentation**: ~2,000 lines
- **Total**: ~10,600 lines

---

## 🗂️ Directory Purposes

### `/components`
All React UI components organized by feature area.

**Subdirectories**:
- `admin/` - Admin-only features (user management)
- `assets/` - Asset CRUD and QR codes
- `audits/` - Audit scheduling and tracking
- `auth/` - Login, setup wizard, error screens
- `dashboard/` - KPIs, charts, activity feed
- `figma/` - System integration components (protected)
- `layout/` - Sidebar, navbar, app shell
- `movements/` - Movement requests and approvals
- `reports/` - Report generation
- `settings/` - User and system configuration
- `ui/` - Reusable UI components from shadcn/ui

### `/contexts`
React Context API providers for global state management.

**Files**:
- `AuthContext.tsx` - Authentication state, user profile, login/logout

### `/hooks`
Custom React hooks for data fetching and business logic.

**Files**:
- `useActivities.ts` - Fetch activity logs with real-time updates
- `useAssets.ts` - Asset CRUD operations with filters
- `useAudits.ts` - Audit data management
- `useDashboardData.ts` - Aggregate KPI calculations
- `useMovements.ts` - Movement request workflows

### `/lib`
Core libraries, configurations, and type definitions.

**Files**:
- `mock-data.ts` - Fallback data for error states
- `supabase.ts` - Supabase client singleton
- `types.ts` - TypeScript interfaces for all entities

### `/styles`
Global CSS and Tailwind configuration.

**Files**:
- `globals.css` - Tailwind v4 setup, CSS variables, dark mode

### `/supabase`
Supabase backend integration (minimal, mostly RLS-based).

**Structure**:
- `functions/server/` - Edge functions (minimal usage)
  - `index.tsx` - Server entry (not currently used)
  - `kv_store.tsx` - Key-value store (protected, do not modify)

### `/utils`
Helper functions and utilities.

**Files**:
- `csvExport.ts` - CSV file generation for reports
- `supabase/info.tsx` - Supabase project credentials (auto-generated)

---

## 🚫 Removed Files

The following files/directories were removed during cleanup:

### Deleted Documentation
- ❌ `FIREBASE_MIGRATION_GUIDE.md` - Firebase alternative (not needed)
- ❌ `FIXES_APPLIED.md` - Temporary fix log (outdated)
- ❌ `NEW_SUPABASE_PROJECT.md` - Duplicate setup guide
- ❌ `PROJECT_DOCUMENTATION.md` - Redundant documentation
- ❌ `START_HERE.md` - Replaced by README.md
- ❌ `SUPABASE_FIX.md` - Temporary troubleshooting (outdated)

### Deleted Backend
- ❌ `/backend/` - Entire MERN stack implementation (deprecated)
  - All Express.js controllers, routes, models
  - MongoDB configuration
  - Legacy authentication middleware
  - **Reason**: Replaced by Supabase, no longer used

### Deleted Components
- ❌ `components/dashboard/DashboardViewWithAPI.tsx` - Old version
- ❌ `components/auth/SetupChecker.tsx` - Unused
- ❌ `components/auth/SetupInstructions.tsx` - Unused
- ❌ `components/common/RequireRole.tsx` - Not referenced

### Deleted Services
- ❌ `/services/api.ts` - Old REST API service (replaced by direct Supabase calls)

---

## 📝 Key Files Explained

### `App.tsx`
**Purpose**: Main application component  
**Contains**:
- View routing logic (dashboard, assets, movements, etc.)
- Authentication state handling
- Layout composition (sidebar + main content)
- Loading and error states

### `main.tsx`
**Purpose**: Application entry point  
**Contains**:
- React root rendering
- Provider wrapping (Auth, Tooltip, Sidebar)
- Global CSS import

### `DATABASE_SETUP.sql`
**Purpose**: Complete database initialization  
**Contains**:
- Table creation (users, assets, movements, audits, activity_logs)
- Row Level Security (RLS) policies
- Database functions and triggers
- Sample data (4 test users, ~50 assets)
- **Must run this in Supabase SQL Editor**

### `lib/supabase.ts`
**Purpose**: Supabase client configuration  
**Contains**:
- Client initialization
- Database type definitions
- Singleton instance for app-wide use

### `contexts/AuthContext.tsx`
**Purpose**: Authentication state management  
**Contains**:
- Sign in/sign out functions
- User profile fetching
- Session management
- Database setup checking
- Connection error handling

### `styles/globals.css`
**Purpose**: Global styling and Tailwind configuration  
**Contains**:
- CSS custom properties (colors, spacing)
- Dark mode variables
- Typography base styles
- Tailwind v4 theme configuration

---

## 🔒 Protected Files

**Do not modify these files**:

1. `/components/figma/ImageWithFallback.tsx` - System component
2. `/supabase/functions/server/kv_store.tsx` - System utility
3. `/utils/supabase/info.tsx` - Auto-generated by platform

---

## 🎯 File Naming Conventions

### Components
- **PascalCase** for component files: `AssetsList.tsx`, `DashboardView.tsx`
- **Descriptive names**: `UserManagement.tsx` not `Users.tsx`

### Hooks
- **camelCase** starting with `use`: `useAssets.ts`, `useDashboardData.ts`

### Utilities
- **camelCase**: `csvExport.ts`

### Types
- **PascalCase** for interfaces: `User`, `Asset`, `Movement`
- **PascalCase** for type unions: `UserRole`, `AssetStatus`

---

## 📦 Dependencies Overview

### Core Dependencies
- `react`, `react-dom` - UI framework
- `@supabase/supabase-js` - Backend client
- `typescript` - Type safety
- `tailwindcss` - Styling
- `vite` - Build tool

### UI Libraries
- `@radix-ui/*` - Headless UI components (via shadcn)
- `lucide-react` - Icons
- `recharts` - Charts
- `sonner` - Toast notifications

### Utilities
- `date-fns` - Date formatting
- `clsx`, `tailwind-merge` - Class name utilities

**See `package.json` for complete list**

---

## 🔄 Migration History

### v1.0 (MERN Stack) → v2.0 (Supabase)

**What Changed**:
- ❌ Removed: Express.js + MongoDB backend
- ✅ Added: Supabase (PostgreSQL + Auth + Realtime)
- ✅ Updated: All hooks to use Supabase client
- ✅ Updated: Authentication to use Supabase Auth
- ✅ Added: Row Level Security for authorization

**Why**:
- Simpler architecture
- Real-time updates out of the box
- Better security with RLS
- Easier deployment (no backend server needed)
- Free tier sufficient for production use

---

## 📚 Related Documentation

- **README.md** - Quick start guide
- **SETUP.md** - Detailed setup instructions
- **COMPLETE_SYSTEM_DOCUMENTATION.md** - Full technical documentation (50+ pages)
- **DATABASE_SETUP.sql** - Database schema and sample data

---

**Status**: ✅ Clean and Ready for Production  
**Last Cleanup**: October 15, 2025
