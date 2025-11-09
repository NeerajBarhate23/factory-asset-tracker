import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return sendError(res, 'Duplicate entry. Record already exists.', 409);
  }

  if (err.code === 'P2025') {
    return sendError(res, 'Record not found', 404);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return sendError(res, message, statusCode);
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): Response => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};
