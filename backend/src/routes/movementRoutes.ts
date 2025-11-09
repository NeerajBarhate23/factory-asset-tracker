import { Router } from 'express';
import {
  getMovements,
  getMovementStats,
  getPendingMovements,
  getOverdueMovements,
  getMovementById,
  createMovement,
  approveMovement,
  rejectMovement,
  dispatchMovement,
  completeMovement
} from '../controllers/movementController';
import { authenticate } from '../middleware/auth';
import { isAdmin, isAdminOrShopIncharge } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { body, query, param } from 'express-validator';

const router = Router();

// Validation rules
const createMovementValidation = [
  body('assetId').isUUID().withMessage('Valid asset ID is required'),
  body('fromLocation').trim().notEmpty().withMessage('From location is required'),
  body('toLocation').trim().notEmpty().withMessage('To location is required'),
  body('reason').optional().trim(),
  body('notes').optional().trim(),
  body('slaHours')
    .optional()
    .isInt({ min: 1, max: 720 })
    .withMessage('SLA hours must be between 1 and 720 (30 days)')
];

const rejectMovementValidation = [
  param('id').isUUID().withMessage('Invalid movement ID'),
  body('reason').trim().notEmpty().withMessage('Rejection reason is required')
];

const listMovementsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'REJECTED'])
    .withMessage('Invalid status'),
  query('slaStatus')
    .optional()
    .isIn(['ON_TRACK', 'AT_RISK', 'BREACHED', 'MET'])
    .withMessage('Invalid SLA status'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'requestDate', 'status', 'slaHours'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// All routes require authentication
router.use(authenticate);

// GET /api/movements - List movements with filters and pagination
router.get('/', listMovementsValidation, validate, getMovements);

// GET /api/movements/stats - Get movement statistics
router.get('/stats', getMovementStats);

// GET /api/movements/pending - Get pending approval movements
router.get('/pending', getPendingMovements);

// GET /api/movements/overdue - Get overdue/at-risk movements
router.get('/overdue', getOverdueMovements);

// GET /api/movements/:id - Get single movement
router.get('/:id', param('id').isUUID(), validate, getMovementById);

// POST /api/movements - Create new movement request
router.post('/', createMovementValidation, validate, createMovement);

// PUT /api/movements/:id/approve - Approve movement (Admin or Shop Incharge only)
router.put('/:id/approve', isAdminOrShopIncharge, param('id').isUUID(), validate, approveMovement);

// PUT /api/movements/:id/reject - Reject movement (Admin or Shop Incharge only)
router.put('/:id/reject', isAdminOrShopIncharge, rejectMovementValidation, validate, rejectMovement);

// PUT /api/movements/:id/dispatch - Mark movement as dispatched
router.put('/:id/dispatch', param('id').isUUID(), validate, dispatchMovement);

// PUT /api/movements/:id/complete - Mark movement as completed
router.put('/:id/complete', param('id').isUUID(), validate, completeMovement);

export default router;
