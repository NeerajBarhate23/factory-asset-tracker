# SQLite Migration Guide

## Overview

The Factory Asset Tracking System has been successfully migrated from Supabase to **SQLite running in the browser** using sql.js. This provides a completely local, self-contained database solution with no external dependencies.

## Key Changes

### Database Technology
- **From**: Supabase (PostgreSQL cloud database)
- **To**: SQLite (in-browser via sql.js)
- **Storage**: IndexedDB for persistence
- **Auto-save**: Every 5 seconds + on page unload

### Architecture Benefits
1. ✅ **No External Dependencies** - Everything runs locally in your browser
2. ✅ **Instant Setup** - No API keys or configuration required  
3. ✅ **Easy Testing** - Quick reset and sample data generation
4. ✅ **Data Portability** - Export/import database as .db files
5. ✅ **Privacy** - All data stays on your device

## How It Works

### Database Initialization
The database is automatically initialized when you first load the application:

```typescript
import { initDatabase } from './lib/database';

// Called automatically in AuthContext
await initDatabase();
```

### Data Persistence
- Data is automatically saved to IndexedDB every 5 seconds
- Also saved when you close the browser tab/window
- Database is restored from IndexedDB on next visit

### Sample Data
On first initialization, the database is seeded with:
- 3 default users (admin, shop in-charge, operator)
- 4 sample assets (one of each category)
- Initial activity logs

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@factory.com | admin123 |
| Shop In-charge | shop@factory.com | shop123 |
| Operator | operator@factory.com | operator123 |

## Database Management

### Export Database
1. Go to Settings
2. Click "Export Database"
3. Downloads a .db file to your computer

### Import Database  
1. Go to Settings
2. Click "Import Database"
3. Select a previously exported .db file
4. Page will reload with restored data

### Reset Database
1. Go to Settings
2. Click "Reset Database"
3. Confirm the action (type "RESET")
4. Database is cleared and reseeded with sample data

## Development

### Database Location
- **Code**: `/lib/database.ts`
- **Storage**: Browser's IndexedDB under name "FactoryAssetDB"

### Database Schema
Tables:
- `users` - User accounts and authentication
- `assets` - Asset master data
- `movements` - Asset movement history
- `audits` - Asset audit records
- `activities` - System activity log

### Querying Data
```typescript
import { query, exec, generateId } from './lib/database';

// Select query
const users = query<User>('SELECT * FROM users WHERE role = ?', ['admin']);

// Insert/Update/Delete
exec('INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)', 
  [generateId(), 'test@example.com', 'Test User', 'operator']);

// Single row
const user = getOne<User>('SELECT * FROM users WHERE id = ?', [userId]);
```

### Hooks
All data access hooks have been updated:
- `useAssets()` - Asset management
- `useMovements()` - Movement tracking  
- `useAudits()` - Audit management
- `useActivities()` - Activity logs
- `useDashboardData()` - Dashboard statistics

## Browser Support

SQLite (sql.js) works in all modern browsers:
- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)

## File Changes

### New Files
- `/lib/database.ts` - SQLite database implementation

### Modified Files
- `/contexts/AuthContext.tsx` - Local authentication
- `/hooks/useAssets.ts` - SQLite queries
- `/hooks/useMovements.ts` - SQLite queries
- `/hooks/useAudits.ts` - SQLite queries
- `/hooks/useActivities.ts` - SQLite queries
- `/hooks/useDashboardData.ts` - SQLite queries
- `/components/admin/UserManagement.tsx` - Local user management
- `/components/auth/LoginForm.tsx` - Simplified login
- `/components/settings/SettingsView.tsx` - Database management UI
- `/lib/types.ts` - Updated type definitions
- `/App.tsx` - Removed Supabase dependencies

### Deleted Files
- `/lib/supabase.ts`
- `/components/auth/SetupWizard.tsx`
- `/components/auth/SupabaseConnectionError.tsx`
- `/DATABASE_SETUP.sql`
- `/supabase/` directory (if needed in future)

## Testing

### Quick Test Workflow
1. Login with any default account
2. Create/edit/delete assets
3. Test movements and audits
4. Export database
5. Reset database
6. Import previously exported database
7. Verify data is restored

### Database Inspection
You can inspect the IndexedDB data in your browser:
1. Open DevTools (F12)
2. Go to Application/Storage tab
3. Find IndexedDB → FactoryAssetDB
4. View stored database

## Troubleshooting

### Database Not Loading
- Clear browser cache and reload
- Check browser console for errors
- Try resetting database from Settings

### Data Not Persisting
- Ensure you're not in incognito/private mode
- Check IndexedDB permissions in browser settings
- Try exporting before closing browser

### Performance Issues
- SQLite in browser is fast for typical datasets
- Recommended limit: <10,000 assets
- For larger datasets, consider server-side SQLite

## Future Enhancements

Possible improvements:
- Add database encryption
- Implement data sync across devices
- Add database versioning/migrations
- Export to CSV/Excel formats
- Implement full-text search

## Support

For issues or questions:
1. Check browser console for errors
2. Try resetting the database
3. Export your data before troubleshooting
4. Check that sql.js is loading correctly

---

**Migration completed**: November 2, 2025  
**Database**: SQLite 3.x (via sql.js)  
**Storage**: IndexedDB
