import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../utils/response';

/**
 * Middleware to validate request data using express-validator
 */
export const validate = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return sendError(res, errorMessages, 400);
  }

  next();
};
