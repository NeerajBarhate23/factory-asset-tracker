import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string | number;
  jwtRefreshExpiresIn: string | number;
  frontendUrl: string;
  maxFileSize: number;
  uploadDir: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
  uploadDir: process.env.UPLOAD_DIR || './uploads',
};

// Validate required environment variables
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (config.jwtSecret === 'fallback-secret-change-me' && config.nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

export default config;
