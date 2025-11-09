import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwtHelpers';
import { sendError } from '../utils/response';

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};
