import { Router } from 'express';
import {
  getAssets,
  getAssetStats,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  generateQRCode,
  bulkGenerateQRCodes
} from '../controllers/assetController';
import { authenticate } from '../middleware/auth';
import { isAdmin, isAdminOrShopIncharge } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { body, query, param } from 'express-validator';

const router = Router();

// Validation rules
const createAssetValidation = [
  body('name').trim().notEmpty().withMessage('Asset name is required'),
  body('category')
    .isIn(['TOOL_ROOM_SPM', 'CNC_MACHINE', 'WORKSTATION', 'MATERIAL_HANDLING'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED'])
    .withMessage('Invalid status'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('criticality')
    .optional()
    .isIn(['HIGH', 'MEDIUM', 'LOW'])
    .withMessage('Invalid criticality'),
  body('ownerDepartment').optional().trim(),
  body('make').optional().trim(),
  body('model').optional().trim(),
  body('serialNumber').optional().trim(),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid date format'),
  body('warrantyExpiry').optional().isISO8601().withMessage('Invalid date format'),
  body('lastMaintenanceDate').optional().isISO8601().withMessage('Invalid date format'),
  body('nextMaintenanceDate').optional().isISO8601().withMessage('Invalid date format'),
  body('specifications').optional().trim(),
  body('notes').optional().trim(),
  body('assignedToId').optional().isUUID().withMessage('Invalid user ID')
];

const updateAssetValidation = [
  param('id').isUUID().withMessage('Invalid asset ID'),
  body('name').optional().trim().notEmpty().withMessage('Asset name cannot be empty'),
  body('category')
    .optional()
    .isIn(['TOOL_ROOM_SPM', 'CNC_MACHINE', 'WORKSTATION', 'MATERIAL_HANDLING'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED'])
    .withMessage('Invalid status'),
  body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
  body('criticality')
    .optional()
    .isIn(['HIGH', 'MEDIUM', 'LOW'])
    .withMessage('Invalid criticality'),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid date format'),
  body('warrantyExpiry').optional().isISO8601().withMessage('Invalid date format'),
  body('lastMaintenanceDate').optional().isISO8601().withMessage('Invalid date format'),
  body('nextMaintenanceDate').optional().isISO8601().withMessage('Invalid date format'),
  body('assignedToId').optional().isUUID().withMessage('Invalid user ID')
];

const listAssetsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category')
    .optional()
    .isIn(['TOOL_ROOM_SPM', 'CNC_MACHINE', 'WORKSTATION', 'MATERIAL_HANDLING'])
    .withMessage('Invalid category'),
  query('status')
    .optional()
    .isIn(['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED'])
    .withMessage('Invalid status'),
  query('criticality')
    .optional()
    .isIn(['HIGH', 'MEDIUM', 'LOW'])
    .withMessage('Invalid criticality'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'assetUid', 'status', 'location', 'criticality'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const bulkQRValidation = [
  body('assetIds')
    .isArray({ min: 1 })
    .withMessage('Asset IDs array is required'),
  body('assetIds.*')
    .isUUID()
    .withMessage('Each asset ID must be a valid UUID')
];

// All routes require authentication
router.use(authenticate);

// GET /api/assets - List assets with filters and pagination
router.get('/', listAssetsValidation, validate, getAssets);

// GET /api/assets/stats - Get asset statistics
router.get('/stats', getAssetStats);

// GET /api/assets/:id - Get single asset
router.get('/:id', param('id').isUUID(), validate, getAssetById);

// POST /api/assets - Create new asset (Admin or Shop Incharge only)
router.post('/', isAdminOrShopIncharge, createAssetValidation, validate, createAsset);

// PUT /api/assets/:id - Update asset (Admin or Shop Incharge only)
router.put('/:id', isAdminOrShopIncharge, updateAssetValidation, validate, updateAsset);

// DELETE /api/assets/:id - Delete asset (Admin only)
router.delete('/:id', isAdmin, param('id').isUUID(), validate, deleteAsset);

// GET /api/assets/:id/qr - Generate QR code for asset
router.get('/:id/qr', param('id').isUUID(), validate, generateQRCode);

// POST /api/assets/bulk-qr - Generate QR codes for multiple assets
router.post('/bulk-qr', bulkQRValidation, validate, bulkGenerateQRCodes);

export default router;
