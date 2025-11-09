import { Router } from 'express';
import {
  getDashboardKPIs,
  getDashboardTrends,
  getRecentActivities
} from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { query } from 'express-validator';
import { validate } from '../middleware/validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/dashboard/kpis - Get dashboard KPIs
router.get('/kpis', getDashboardKPIs);

// GET /api/dashboard/trends - Get dashboard trends with optional period
router.get(
  '/trends',
  [
    query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
  ],
  validate,
  getDashboardTrends
);

// GET /api/dashboard/activities - Get recent activities with optional limit
router.get(
  '/activities',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  getRecentActivities
);

export default router;
