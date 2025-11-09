import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';

/**
 * Middleware to check if user has required role(s)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return sendError(res, 'User not authenticated', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize('ADMIN');

/**
 * Check if user is admin or shop incharge
 */
export const isAdminOrShopIncharge = authorize('ADMIN', 'SHOP_INCHARGE');

/**
 * Check if user is admin, shop incharge, or maintenance
 */
export const isPrivilegedUser = authorize('ADMIN', 'SHOP_INCHARGE', 'MAINTENANCE');
