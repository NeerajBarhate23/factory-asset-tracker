# Factory Asset Tracker - Backend API

REST API for Factory Asset Management System built with Node.js, Express, Prisma, and MySQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MySQL 8+ running locally
- MySQL root password: `Neeraj@23`

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate

# Start development server
npm run dev
```

The server will start on http://localhost:5000

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/                # Configuration files
│   │   ├── config.ts          # Environment config
│   │   └── database.ts        # Prisma client
│   ├── controllers/           # Route controllers
│   │   └── authController.ts  # Auth endpoints
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts            # JWT authentication
│   │   ├── authorize.ts       # Role-based access
│   │   ├── errorHandler.ts    # Error handling
│   │   ├── upload.ts          # File upload
│   │   └── validator.ts       # Request validation
│   ├── routes/                # API routes
│   │   └── authRoutes.ts      # Auth routes
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── jwt.ts             # JWT helpers
│   │   ├── password.ts        # Password hashing
│   │   ├── qrcode.ts          # QR code generation
│   │   └── response.ts        # API responses
│   ├── app.ts                 # Express app
│   └── server.ts              # Server entry point
├── uploads/                   # File uploads directory
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

## 🔐 Authentication

### JWT-based authentication with refresh tokens

**Access Token**: Expires in 15 minutes  
**Refresh Token**: Expires in 7 days

### Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/register` - Register user (Admin only)

## 🗄️ Database

### MySQL Configuration

Database: `factory_asset_tracker`  
Host: `localhost:3306`  
User: `root`  
Password: `Neeraj@23`

### Tables

- `users` - User accounts
- `assets` - Factory assets
- `movements` - Asset movements
- `audits` - Audit records
- `activities` - Activity logs
- `asset_files` - File attachments

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Build
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio (DB GUI)

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
```

## 🔧 Environment Variables

Create `.env` file in backend directory:

```env
DATABASE_URL="mysql://root:Neeraj@23@localhost:3306/factory_asset_tracker"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
MAX_FILE_SIZE=5242880
UPLOAD_DIR="./uploads"
```

## 🧪 Testing

Tests will be created using Jest and Supertest.

```bash
npm test
```

## 🚀 Deployment

### Build for production

```bash
npm run build
```

### Run production server

```bash
npm start
```

## 📚 API Documentation

### Authentication Required

All endpoints except `/api/auth/login` and `/api/auth/refresh` require authentication.

Send JWT token in Authorization header:

```
Authorization: Bearer <access_token>
```

### Role-Based Access Control

- **ADMIN**: Full access to all features
- **SHOP_INCHARGE**: Manage assets and approve movements
- **MAINTENANCE**: Update asset status and conduct audits
- **OPERATOR**: View assets and create movement requests

## ⚡ Features

- ✅ JWT authentication with refresh tokens
- ✅ Bcrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ Input validation with express-validator
- ✅ File upload with Multer
- ✅ QR code generation
- ✅ Activity logging
- ✅ Error handling
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Request logging (Morgan)

## 🔒 Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens for stateless authentication
- Refresh token rotation
- Role-based authorization
- Input validation on all endpoints
- SQL injection protection (Prisma ORM)
- XSS protection (Helmet)
- CORS configuration

## 📧 Support

For issues or questions, please create an issue in the repository.

## 📄 License

MIT License
