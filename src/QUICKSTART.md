# Quick Start Guide

## Factory Asset Tracking System - SQLite Edition

This application runs entirely in your browser with no backend required!

## 🚀 Getting Started

### 1. Open the Application
Simply load the application in your web browser. That's it!

### 2. Login
Use one of the default accounts:

**Admin Account**
- Email: `admin@factory.com`
- Password: `admin123`

**Shop In-charge Account**  
- Email: `shop@factory.com`
- Password: `shop123`

**Operator Account**
- Email: `operator@factory.com`  
- Password: `operator123`

### 3. Start Using
The application comes pre-loaded with sample data:
- 4 sample assets
- 3 user accounts
- Example categories and locations

## 📚 Main Features

### Dashboard
- Overview of all assets
- Status breakdown (Active, Maintenance, Inactive)
- Recent activity feed
- Quick statistics

### Assets Management
- View all assets
- Create new assets
- Edit asset details
- Generate QR codes
- Bulk QR code generation
- Filter by category and status

### Movements
- Track asset movements
- Record location changes
- Movement history
- Approval workflows (for Shop In-charge)

### Audits
- Schedule asset audits
- Record audit findings
- Track asset condition
- View audit history

### Reports (Admin/Shop In-charge only)
- Asset inventory reports
- Movement history reports
- Audit compliance reports
- Custom date range filtering

### User Management (Admin only)
- Create new users
- Assign roles (Admin, Shop In-charge, Operator)
- Edit user details
- Delete users

## 🎯 Role Permissions

### Admin
- Full system access
- User management
- All asset operations
- Reports and analytics
- Database export/import

### Shop In-charge
- Asset management
- Movement approvals
- Audit management
- Reports viewing
- Cannot manage users

### Operator
- View assets
- Request movements
- View assigned assets
- Limited reporting
- Cannot create/edit assets

## 💾 Database Management

### Export Your Data
1. Go to **Settings**
2. Click **Export Database**
3. Save the `.db` file to your computer

### Import Data
1. Go to **Settings**
2. Click **Import Database**
3. Select your `.db` backup file
4. App will reload with restored data

### Reset Database
1. Go to **Settings**
2. Click **Reset Database**
3. Type "RESET" to confirm
4. Database returns to initial state with sample data

## 🔍 Common Tasks

### Add a New Asset
1. Go to **Assets** page
2. Click **Add Asset** button
3. Fill in asset details:
   - Asset UID (unique identifier)
   - Name
   - Category (Tool Room SPM, CNC Machine, Workstation, Material Handling)
   - Location
   - Optional: Make, Model, Serial Number, etc.
4. Click **Create Asset**

### Move an Asset
1. Go to **Assets** page
2. Click on an asset to view details
3. Click **Move Asset** button
4. Enter new location and reason
5. Click **Submit Movement**

### Generate QR Codes
**Single Asset:**
1. Go to asset detail page
2. Click **Generate QR Code**
3. Download or print

**Bulk Generation:**
1. Go to **Assets** page
2. Click **Bulk Generate QR Codes**
3. Select assets
4. Click **Generate**
5. Download all or print

### Create a New User (Admin Only)
1. Go to **Users** (Admin menu)
2. Click **Create User**
3. Enter email, password, name, and role
4. Click **Create User**

## 🔧 Troubleshooting

### Can't Login?
- Make sure you're using the correct email and password
- Try refreshing the page
- Check browser console for errors

### Data Not Saving?
- Ensure you're not in private/incognito mode
- Data saves automatically every 5 seconds
- Check IndexedDB is enabled in browser settings

### Want to Start Fresh?
1. Go to Settings
2. Use **Reset Database** feature
3. Or clear browser data for this site

## 🌐 Browser Requirements

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## 📱 Mobile Support

The application is fully responsive and works on:
- Tablets
- Smartphones
- Desktop computers

## 💡 Tips

1. **Regular Backups**: Export your database regularly
2. **Test First**: Try features with sample data before using real data
3. **QR Codes**: Print QR codes and attach to physical assets for quick scanning
4. **Roles**: Assign appropriate roles based on user responsibilities
5. **Movements**: Use the movement tracking for compliance and audit trails

## 🎓 Best Practices

### Asset UIDs
- Use consistent naming: `SPM-001`, `CNC-045`, `WS-012`
- Keep them short but descriptive
- Include category prefix for easy identification

### Locations
- Use specific locations: "Production Floor - Bay A3"
- Maintain a standard location list
- Update immediately when moving assets

### Audits
- Schedule regular audits for critical assets
- Document issues thoroughly
- Follow up on recommendations

### Users
- Remove inactive users promptly
- Use least privilege principle for roles
- Change default passwords

## 📞 Support

For technical issues:
1. Check the browser console (F12)
2. Try resetting the database
3. Export your data before troubleshooting
4. Ensure sql.js is loading properly

---

**Version**: SQLite Edition  
**Last Updated**: November 2, 2025  
**Database**: SQLite (in-browser)
