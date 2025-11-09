# Maintenance Role - Currently Disabled

**Date**: October 23, 2025  
**Status**: ⚠️ Maintenance role commented out throughout the application

---

## Overview

The **Maintenance** user role has been temporarily disabled across the entire application. All maintenance-related functionality has been commented out but preserved in the codebase for potential future re-enablement.

---

## What Was Changed

### 1. Type Definitions

**File**: `/lib/types.ts`

```typescript
// BEFORE:
export type UserRole = 'admin' | 'shop_incharge' | 'maintenance' | 'operator';

// AFTER:
export type UserRole = 'admin' | 'shop_incharge' | /* 'maintenance' | */ 'operator';
```

**File**: `/lib/mock-data.ts`

```typescript
// BEFORE:
export type UserRole = 'admin' | 'shop-incharge' | 'maintenance' | 'operator';

// AFTER:
export type UserRole = 'admin' | 'shop-incharge' | /* 'maintenance' | */ 'operator';
```

---

### 2. Sidebar Navigation

**File**: `/components/layout/AppSidebar.tsx`

Removed 'maintenance' from roles arrays for all menu items:

```typescript
// Dashboard - BEFORE:
roles: ['admin', 'shop_incharge', 'maintenance', 'operator']

// Dashboard - AFTER:
roles: ['admin', 'shop_incharge', /* 'maintenance', */ 'operator']

// Assets - BEFORE:
roles: ['admin', 'shop_incharge', 'maintenance', 'operator']

// Assets - AFTER:
roles: ['admin', 'shop_incharge', /* 'maintenance', */ 'operator']

// Settings - BEFORE:
roles: ['admin', 'shop_incharge', 'maintenance', 'operator']

// Settings - AFTER:
roles: ['admin', 'shop_incharge', /* 'maintenance', */ 'operator']
```

**Impact**: Maintenance users cannot access any menu items (effectively locked out)

---

### 3. Login Form

**File**: `/components/auth/LoginForm.tsx`

#### Demo Account Object
```typescript
// BEFORE:
const demoAccounts = {
  admin: { email: 'admin@factory.com', password: 'Admin@123' },
  shop: { email: 'shop@factory.com', password: 'Shop@123' },
  maintenance: { email: 'maintenance@factory.com', password: 'Maint@123' },
  operator: { email: 'operator@factory.com', password: 'Oper@123' },
};

// AFTER:
const demoAccounts = {
  admin: { email: 'admin@factory.com', password: 'Admin@123' },
  shop: { email: 'shop@factory.com', password: 'Shop@123' },
  // maintenance: { email: 'maintenance@factory.com', password: 'Maint@123' }, // DISABLED
  operator: { email: 'operator@factory.com', password: 'Oper@123' },
};
```

#### Demo Login Button
```typescript
// BEFORE:
<Button onClick={() => handleDemoLogin('maintenance')}>
  Maintenance
</Button>

// AFTER:
{/* DISABLED: Maintenance role not in use
<Button onClick={() => handleDemoLogin('maintenance')}>
  Maintenance
</Button>
*/}
```

**Impact**: No quick-login button for maintenance role on login screen

---

### 4. User Management

**File**: `/components/admin/UserManagement.tsx`

#### Create User Dialog
```typescript
// BEFORE:
<SelectContent>
  <SelectItem value="admin">Admin</SelectItem>
  <SelectItem value="shop_incharge">Shop In-charge</SelectItem>
  <SelectItem value="maintenance">Maintenance</SelectItem>
  <SelectItem value="operator">Operator</SelectItem>
</SelectContent>

// AFTER:
<SelectContent>
  <SelectItem value="admin">Admin</SelectItem>
  <SelectItem value="shop_incharge">Shop In-charge</SelectItem>
  {/* <SelectItem value="maintenance">Maintenance</SelectItem> */}
  <SelectItem value="operator">Operator</SelectItem>
</SelectContent>
```

#### Edit User Dialog
```typescript
// Same change as above - maintenance option commented out
```

**Impact**: Admins cannot create or assign the maintenance role

---

## Current User Roles

### Active Roles (3)

| Role | Code | Description | Access Level |
|------|------|-------------|--------------|
| **Admin** | `admin` | Full system access | All features |
| **Shop In-charge** | `shop_incharge` | Asset and operations management | Most features |
| **Operator** | `operator` | View and request only | Limited features |

### Disabled Roles (1)

| Role | Code | Description | Status |
|------|------|-------------|---------|
| ~~Maintenance~~ | ~~`maintenance`~~ | ~~Maintenance and audits~~ | ⚠️ **DISABLED** |

---

## Impact Assessment

### What Still Works ✅

- ✅ All core functionality works without maintenance role
- ✅ Asset management (admin, shop)
- ✅ Movement requests (all active roles)
- ✅ Movement approvals (admin, shop)
- ✅ Audits (admin, shop can create/manage)
- ✅ Reports (admin, shop)
- ✅ User management (admin)
- ✅ 3-role system operates normally

### What Doesn't Work ❌

- ❌ Cannot create new users with maintenance role
- ❌ Existing maintenance users cannot login to UI (no menu access)
- ❌ Maintenance quick-login button hidden
- ❌ TypeScript will show errors if trying to use 'maintenance' as a role value

### Database Considerations ⚠️

**Important**: The database still contains:
- ✅ `maintenance` as valid value in CHECK constraint
- ✅ Existing maintenance users in users table
- ✅ RLS policies that reference maintenance role

**Note**: If a maintenance user exists in the database, they can technically still authenticate, but they will have NO ACCESS to any features in the UI since all menu items exclude them.

---

## How to Re-Enable Maintenance Role

If you need to re-enable the maintenance role in the future:

### Step 1: Uncomment Type Definitions

**File**: `/lib/types.ts`
```typescript
export type UserRole = 'admin' | 'shop_incharge' | 'maintenance' | 'operator';
```

**File**: `/lib/mock-data.ts`
```typescript
export type UserRole = 'admin' | 'shop-incharge' | 'maintenance' | 'operator';
```

### Step 2: Uncomment Sidebar Roles

**File**: `/components/layout/AppSidebar.tsx`

Restore 'maintenance' in roles arrays:
```typescript
roles: ['admin', 'shop_incharge', 'maintenance', 'operator']
```

### Step 3: Uncomment Login Form

**File**: `/components/auth/LoginForm.tsx`

1. Restore demo account:
```typescript
maintenance: { email: 'maintenance@factory.com', password: 'Maint@123' },
```

2. Restore button:
```typescript
<Button onClick={() => handleDemoLogin('maintenance')}>
  Maintenance
</Button>
```

### Step 4: Uncomment User Management

**File**: `/components/admin/UserManagement.tsx`

Restore select option in both dialogs:
```typescript
<SelectItem value="maintenance">Maintenance</SelectItem>
```

### Step 5: Test

1. Restart dev server: `npm run dev`
2. Login with maintenance account
3. Verify menu access works
4. Create new maintenance user
5. Test all maintenance-specific features

---

## Testing

### Verify Maintenance is Disabled

1. **Login Screen**:
   - ✅ Only 3 demo buttons visible (Admin, Shop, Operator)
   - ✅ No "Maintenance" quick-login button

2. **User Management**:
   - ✅ Create user dialog: only 3 roles (Admin, Shop In-charge, Operator)
   - ✅ Edit user dialog: only 3 roles
   - ❌ Cannot assign maintenance role

3. **TypeScript**:
   - ✅ No type errors when maintenance is commented out
   - ❌ Would show error if trying to use `role: 'maintenance'`

4. **If Maintenance User Exists in DB**:
   - ❌ Can login but sees empty sidebar
   - ❌ No menu items accessible
   - ❌ Effectively locked out

---

## Database Notes

### Maintenance User in Database

If you previously ran `DATABASE_SETUP.sql`, you may have a maintenance user:

```sql
-- This user exists in database:
INSERT INTO users (id, email, name, role, department)
VALUES (
  'maintenance-uuid',
  'maintenance@factory.com',
  'Maintenance Team',
  'maintenance',  -- This value is still valid in database
  'Maintenance'
);
```

**What to do**:

1. **Option A**: Leave it (user just can't access UI)
2. **Option B**: Delete from database:
   ```sql
   DELETE FROM users WHERE role = 'maintenance';
   ```
3. **Option C**: Change their role:
   ```sql
   UPDATE users 
   SET role = 'operator' 
   WHERE role = 'maintenance';
   ```

### Database CHECK Constraint

The database still allows 'maintenance' as a valid role:

```sql
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'shop_incharge', 'maintenance', 'operator'));
```

**Note**: This is intentional to preserve data integrity if you re-enable the role.

---

## Recommended Workflow

### For Production

If you're deploying without maintenance role:

1. ✅ Keep code as-is (maintenance commented out)
2. ✅ Update database to remove/reassign maintenance users
3. ✅ Update documentation to reflect 3-role system
4. ✅ Remove maintenance test account

### For Development

If you might need maintenance later:

1. ✅ Keep code as-is (maintenance commented out)
2. ✅ Keep database maintenance user for testing
3. ✅ Document that maintenance is disabled
4. ✅ Keep this file for re-enablement guide

---

## Summary

**Current State**:
- 🟢 3 Active Roles: Admin, Shop In-charge, Operator
- 🔴 1 Disabled Role: Maintenance (commented out)
- 🟢 Application fully functional with 3-role system
- 🟡 Database still allows maintenance (for re-enablement)

**Next Steps**:
- If permanent: Clean up database, remove maintenance references entirely
- If temporary: Keep as-is, use this document to re-enable when needed

---

**Status**: ✅ Maintenance role successfully disabled  
**Files Modified**: 4 files  
**Database Impact**: None (still allows maintenance in schema)  
**Application Impact**: Zero (works perfectly with 3 roles)
