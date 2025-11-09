import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { isAdmin, isAdminOrShopIncharge } from '../middleware/authorize';
import { validate } from '../middleware/validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin, Shop Incharge)
 */
router.get(
  '/',
  isAdminOrShopIncharge,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['ADMIN', 'SHOP_INCHARGE', 'MAINTENANCE', 'OPERATOR']).withMessage('Invalid role'),
    query('department').optional().isString().withMessage('Department must be a string'),
    query('search').optional().isString().withMessage('Search must be a string'),
    validate,
  ],
  getUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin, Shop Incharge)
 */
router.get(
  '/stats',
  isAdminOrShopIncharge,
  getUserStats
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin, Shop Incharge, or own profile)
 */
router.get(
  '/:id',
  [
    body('id').optional().isUUID().withMessage('Invalid user ID format'),
    validate,
  ],
  getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post(
  '/',
  isAdmin,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role')
      .isIn(['ADMIN', 'SHOP_INCHARGE', 'MAINTENANCE', 'OPERATOR'])
      .withMessage('Invalid role'),
    body('department').notEmpty().withMessage('Department is required'),
    validate,
  ],
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  isAdmin,
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('role')
      .optional()
      .isIn(['ADMIN', 'SHOP_INCHARGE', 'MAINTENANCE', 'OPERATOR'])
      .withMessage('Invalid role'),
    body('department').optional().notEmpty().withMessage('Department cannot be empty'),
    validate,
  ],
  updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  isAdmin,
  deleteUser
);

export default router;
