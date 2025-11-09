import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import { upload } from '../middleware/upload';
import {
  uploadFile,
  previewFile,
  getAssetFiles,
  getFileById,
  getFileStats,
  deleteFile
} from '../controllers/fileController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/files/upload
 * @desc    Upload a file and attach to an asset
 * @access  Private (Admin, ShopIncharge, Operator)
 */
router.post(
  '/upload',
  upload.single('file'),
  [
    body('assetId')
      .notEmpty()
      .withMessage('Asset ID is required')
      .isString()
      .withMessage('Asset ID must be a string')
  ],
  validate,
  uploadFile
);

/**
 * @route   GET /api/files/stats
 * @desc    Get file statistics
 * @access  Private (Admin, ShopIncharge)
 */
router.get(
  '/stats',
  authorize('ADMIN', 'SHOP_INCHARGE'),
  getFileStats
);

/**
 * @route   GET /api/files/asset/:assetId
 * @desc    Get all files for a specific asset
 * @access  Private
 */
router.get(
  '/asset/:assetId',
  [
    param('assetId')
      .notEmpty()
      .withMessage('Asset ID is required')
      .isString()
      .withMessage('Asset ID must be a string')
  ],
  validate,
  getAssetFiles
);

/**
 * @route   GET /api/files/:id
 * @desc    Get file metadata by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id')
      .notEmpty()
      .withMessage('File ID is required')
      .isString()
      .withMessage('File ID must be a string')
  ],
  validate,
  getFileById
);

/**
 * @route   GET /api/files/:id/preview
 * @desc    Preview file in browser (inline, not download)
 * @access  Private
 */
router.get(
  '/:id/preview',
  [
    param('id')
      .notEmpty()
      .withMessage('File ID is required')
      .isString()
      .withMessage('File ID must be a string')
  ],
  validate,
  previewFile
);

/**
 * @route   DELETE /api/files/:id
 * @desc    Delete a file
 * @access  Private (Admin, ShopIncharge)
 */
router.delete(
  '/:id',
  authorize('ADMIN', 'SHOP_INCHARGE'),
  [
    param('id')
      .notEmpty()
      .withMessage('File ID is required')
      .isString()
      .withMessage('File ID must be a string')
  ],
  validate,
  deleteFile
);

export default router;
