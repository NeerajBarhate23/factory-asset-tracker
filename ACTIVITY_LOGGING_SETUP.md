# Setup Instructions for Activity Logging

## Step 1: Create the activity_logs table in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from `create-activity-logs-table.sql`
4. Click **Run** to execute the SQL

## What this does:

- Creates the `activity_logs` table to track all user actions
- Sets up indexes for better query performance
- Enables Row Level Security (RLS)
- Creates policies so authenticated users can view all activities and insert their own

## Step 2: Test the system

After creating the table:

1. **Register a new asset** - You should see "CREATE_ASSET" activity
2. **Edit an asset** - You should see "UPDATE_ASSET" activity  
3. **Delete an asset** - You should see "DELETE_ASSET" activity
4. **Create a movement request** - You should see "CREATE_MOVEMENT" activity
5. **Approve a movement** - You should see "APPROVE_MOVEMENT" activity
6. **Dispatch a movement** - You should see "DISPATCH_MOVEMENT" activity
7. **Complete a movement** - You should see "COMPLETE_MOVEMENT" activity

## Viewing Activities

Activities will now appear in:
- **Dashboard > Recent Activity** section
- Shows one-liner descriptions of each action
- Displays user who performed the action and timestamp

## Troubleshooting

If activities don't appear:
1. Check that the table was created successfully
2. Verify RLS policies are enabled
3. Check browser console for any errors
4. Make sure you're logged in (activities require authentication)
