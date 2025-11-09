import { Router } from 'express';
import {
  getAudits,
  getAuditStats,
  getScheduledAudits,
  getAuditById,
  createAudit,
  updateAudit,
  startAudit,
  completeAudit,
  deleteAudit
} from '../controllers/auditController';
import { authenticate } from '../middleware/auth';
import { isAdmin, isAdminOrShopIncharge } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { body, query, param } from 'express-validator';

const router = Router();

// Validation rules
const createAuditValidation = [
  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('location').optional().trim(),
  body('category')
    .optional()
    .isIn(['TOOL_ROOM_SPM', 'CNC_MACHINE', 'WORKSTATION', 'MATERIAL_HANDLING'])
    .withMessage('Invalid category'),
  body('assetId').optional().isUUID().withMessage('Invalid asset ID'),
  body('totalAssets')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total assets must be >= 0'),
  body('notes').optional().trim()
];

const updateAuditValidation = [
  param('id').isUUID().withMessage('Invalid audit ID'),
  body('location').optional().trim(),
  body('category')
    .optional()
    .isIn(['TOOL_ROOM_SPM', 'CNC_MACHINE', 'WORKSTATION', 'MATERIAL_HANDLING'])
    .withMessage('Invalid category'),
  body('scheduledDate').optional().isISO8601().withMessage('Invalid date format'),
  body('assetsScanned')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Assets scanned must be >= 0'),
  body('totalAssets')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total assets must be >= 0'),
  body('discrepancies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Discrepancies must be >= 0'),
  body('notes').optional().trim()
];

const completeAuditValidation = [
  param('id').isUUID().withMessage('Invalid audit ID'),
  body('assetsScanned')
    .notEmpty()
    .withMessage('Assets scanned is required')
    .isInt({ min: 0 })
    .withMessage('Assets scanned must be >= 0'),
  body('discrepancies')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Discrepancies must be >= 0'),
  body('notes').optional().trim()
];

const listAuditsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DISCREPANCY_FOUND'])
    .withMessage('Invalid status'),
  query('category')
    .optional()
    .isIn(['TOOL_ROOM_SPM', 'CNC_MACHINE', 'WORKSTATION', 'MATERIAL_HANDLING'])
    .withMessage('Invalid category'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'scheduledDate', 'status', 'discrepancies'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// All routes require authentication
router.use(authenticate);

// GET /api/audits - List audits with filters and pagination
router.get('/', listAuditsValidation, validate, getAudits);

// GET /api/audits/stats - Get audit statistics
router.get('/stats', getAuditStats);

// GET /api/audits/scheduled - Get scheduled audits
router.get('/scheduled', getScheduledAudits);

// GET /api/audits/:id - Get single audit
router.get('/:id', param('id').isUUID(), validate, getAuditById);

// POST /api/audits - Create/schedule new audit (Admin or Shop Incharge only)
router.post('/', isAdminOrShopIncharge, createAuditValidation, validate, createAudit);

// PUT /api/audits/:id - Update audit (Admin or Shop Incharge only)
router.put('/:id', isAdminOrShopIncharge, updateAuditValidation, validate, updateAudit);

// PUT /api/audits/:id/start - Start an audit
router.put('/:id/start', param('id').isUUID(), validate, startAudit);

// PUT /api/audits/:id/complete - Complete an audit
router.put('/:id/complete', completeAuditValidation, validate, completeAudit);

// DELETE /api/audits/:id - Delete audit (Admin only)
router.delete('/:id', isAdmin, param('id').isUUID(), validate, deleteAudit);

export default router;
