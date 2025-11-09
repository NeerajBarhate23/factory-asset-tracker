# Factory Asset Tracking - Setup Guide

## 🚀 Complete Setup in 3 Easy Steps

### Step 1: Run the Database Setup SQL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. If you don't have a project, click **New Project** and create one
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `DATABASE_SETUP.sql` file
6. Paste it into the SQL editor
7. Click **Run** (or press Ctrl/Cmd + Enter)

**What this does:**
- Creates 5 tables: `users`, `assets`, `movements`, `audits`, `activity_logs`
- Sets up indexes for performance
- Enables Row Level Security (RLS) with proper policies
- Creates helper functions and triggers
- **Populates sample data** including users, assets, movements, and audits

### Step 2: Create Auth Users in Supabase

The SQL script created database records with placeholder IDs. Now create the actual auth users:

1. In Supabase Dashboard, go to **Authentication** > **Users**
2. Click **Add User** > **Create new user**
3. Create these 4 users (one at a time):

**Admin User:**
- Email: `admin@factory.com`
- Password: `Admin@123` (or your choice)
- Check "Auto Confirm User" ✓

**Shop Manager:**
- Email: `shop@factory.com`
- Password: `Shop@123` (or your choice)
- Check "Auto Confirm User" ✓

**Maintenance Lead:**
- Email: `maintenance@factory.com`
- Password: `Maint@123` (or your choice)
- Check "Auto Confirm User" ✓

**Operator:**
- Email: `operator@factory.com`
- Password: `Oper@123` (or your choice)
- Check "Auto Confirm User" ✓

4. **IMPORTANT:** After creating each user, copy their UUID from the users list

### Step 3: Link Auth Users to Database Records

Now update the database records with the real auth UUIDs:

1. Go back to **SQL Editor**
2. Create a new query
3. Run these UPDATE statements (replace the UUIDs with the ones you copied):

```sql
-- Update admin user
UPDATE users 
SET id = 'PASTE_ADMIN_UUID_HERE' 
WHERE email = 'admin@factory.com';

-- Update shop manager
UPDATE users 
SET id = 'PASTE_SHOP_UUID_HERE' 
WHERE email = 'shop@factory.com';

-- Update maintenance lead
UPDATE users 
SET id = 'PASTE_MAINTENANCE_UUID_HERE' 
WHERE email = 'maintenance@factory.com';

-- Update operator
UPDATE users 
SET id = 'PASTE_OPERATOR_UUID_HERE' 
WHERE email = 'operator@factory.com';
```

4. Click **Run**

## ✅ You're Done!

Now you can:
1. Go to your app
2. Login with any of the user credentials you created
3. Start using the system with pre-populated sample data!

---

## 📊 What's Included in Sample Data

### Users (4 roles)
- **Admin** - Full system access
- **Shop Manager** - Can approve movements, manage assets in their dept
- **Maintenance Lead** - Can view/update all assets
- **Operator** - Can view assets and create movement requests

### Assets (12 items)
- 3 Tool Room SPMs
- 3 CNC Machines
- 3 Workstations
- 3 Material Handling Equipment

### Movement Requests (3 examples)
- 1 Approved request
- 1 Pending request (visible to shop manager)
- 1 Completed request

### Audits (3 examples)
- 1 Scheduled future audit
- 1 Completed audit
- 1 In-progress audit

### Activity Logs
- Recent system activities for all users

---

## 🔐 Access Control Features

### ✅ Cross-Role Visibility (As Requested)

**Assets added by Admin are visible to everyone:**
- Admins can create/edit/delete all assets
- Shop Managers see assets in their department
- Maintenance sees all assets (they maintain everything)
- Operators can view all assets (read-only)

**Movement requests by Operators are visible to Shop Managers:**
- Operators can create and view movement requests
- Shop Managers can see ALL movement requests and approve/reject them
- Admins can see and manage all movements
- Maintenance can view all movements

**Full CRUD Support:**
- ✅ Create - Add new assets, movements, audits
- ✅ Read - View data based on role permissions
- ✅ Update - Edit existing records
- ✅ Delete - Remove records (admin/shop manager)

---

## 🌍 Location Tracking (Phase 2)

Location fields are included in the database but are **optional**:
- `assets.current_location` - Where the asset is now
- `movements.from_location` - Starting location
- `movements.to_location` - Destination location
- `audits.location` - Where the audit takes place

You can leave these blank for now or start using them right away!

---

## 👥 Adding More Users

To add additional users:

1. Create auth user in **Authentication > Users**
2. Run SQL to create database record:

```sql
INSERT INTO users (id, email, name, role, department)
VALUES (
  'AUTH_USER_UUID_HERE',  -- UUID from auth.users
  'newuser@factory.com',
  'New User Name',
  'operator',  -- or 'admin', 'shop_incharge', 'maintenance'
  'Production'
);
```

---

## 🆕 Adding More Assets

You can add assets through the UI or via SQL:

```sql
INSERT INTO assets (asset_uid, name, category, current_location, status, criticality, owner_department, created_by)
VALUES (
  'CNC-004',
  'CNC Router Machine',
  'CNC Machine',
  'Shop Floor C1',
  'Active',
  'High',
  'Production',
  'YOUR_USER_UUID_HERE'
);
```

---

## ❓ Troubleshooting

### "Invalid login credentials" error
- Make sure you created the auth user in Step 2
- Verify you updated the database user ID in Step 3
- The UUID in the database must match the auth user's UUID

### Can't see any data after login
- Check that you completed Step 3 (UPDATE statements)
- Verify you're logged in with one of the 4 sample users
- Check browser console for error messages

### "Row Level Security policy violation"
- This means your user role doesn't have permission
- Verify your user has the correct role in the users table
- Check that you ran the complete DATABASE_SETUP.sql file

### Operator can't see assets added by admin
- This should work if RLS policies are set up correctly
- Re-run the DATABASE_SETUP.sql file to ensure policies are correct
- Check browser console for specific error messages

### Shop manager can't see operator's movement requests
- Verify the operator's movement was actually created
- Check that the shop manager is logged in (not operator)
- Refresh the page after creating a movement request

---

## 🔄 Need to Start Over?

If you need to reset everything:

1. Go to SQL Editor
2. Run `DATABASE_SETUP.sql` again (it drops and recreates everything)
3. Follow Steps 2 and 3 again to create auth users and link them

---

## 📖 Database Schema Overview

```
users
├── id (UUID, primary key, matches auth.users)
├── email
├── name
├── role (admin/shop_incharge/maintenance/operator)
└── department

assets
├── id (UUID, primary key)
├── asset_uid (unique identifier, e.g., "CNC-001")
├── name
├── category
├── status
├── owner_department
└── created_by (references users)

movements
├── id (UUID, primary key)
├── asset_id (references assets)
├── requested_by (references users)
├── approved_by (references users)
├── status (Pending/Approved/Completed/Rejected)
└── timestamps

audits
├── id (UUID, primary key)
├── location
├── scheduled_date
├── status (Scheduled/In Progress/Completed)
├── auditor_id (references users)
└── statistics

activity_logs
├── id (UUID, primary key)
├── user_id (references users)
├── action (CREATE/UPDATE/DELETE/etc)
├── entity_type (asset/movement/audit)
└── description
```

---

**Need help?** Check the `DATABASE_SETUP.sql` file for the complete schema and comments.
