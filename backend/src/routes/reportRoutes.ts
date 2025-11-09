import { Router } from 'express';
import {
  exportAssetsToCSV,
  exportMovementsToCSV,
  exportAuditsToCSV,
  generateAuditPDF,
  getAssetHistory
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { query, param } from 'express-validator';
import { validate } from '../middleware/validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// CSV Export validation
const csvExportValidation = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
];

// GET /api/reports/assets/export - Export assets to CSV
router.get('/assets/export', exportAssetsToCSV);

// GET /api/reports/movements/export - Export movements to CSV
router.get('/movements/export', csvExportValidation, validate, exportMovementsToCSV);

// GET /api/reports/audits/export - Export audits to CSV
router.get('/audits/export', csvExportValidation, validate, exportAuditsToCSV);

// GET /api/reports/audit/:id/pdf - Generate PDF audit report
router.get('/audit/:id/pdf', param('id').isUUID(), validate, generateAuditPDF);

// GET /api/reports/asset/:id/history - Get asset history report
router.get('/asset/:id/history', param('id').isUUID(), validate, getAssetHistory);

export default router;
