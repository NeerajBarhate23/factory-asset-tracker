import jwt from 'jsonwebtoken';
import config from '../config/config';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  // @ts-ignore - JWT type definition issue with expiresIn
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  // @ts-ignore - JWT type definition issue with expiresIn
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const secret = String(config.jwtSecret);
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const secret = String(config.jwtRefreshSecret);
    return jwt.verify(token, secret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
