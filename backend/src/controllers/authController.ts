import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler, sendSuccess, sendError } from '../utils/response';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtHelpers';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Admin only through separate endpoint)
 * @access  Public (will be restricted in routes)
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role, department } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return sendError(res, 'User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || 'OPERATOR',
      department,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      createdAt: true,
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      details: `User ${email} registered`,
    },
  });

  return sendSuccess(res, user, 'User registered successfully', 201);
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Generate tokens
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Save refresh token to database
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      details: `User ${email} logged in`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Return tokens and user data
  return sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    },
    accessToken,
    refreshToken,
  }, 'Login successful');
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 'Refresh token is required', 400);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }

  // Check if token matches database
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user || user.refreshToken !== refreshToken) {
    return sendError(res, 'Invalid refresh token', 401);
  }

  // Generate new access token
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = generateAccessToken(tokenPayload);

  return sendSuccess(res, {
    accessToken: newAccessToken,
  }, 'Token refreshed successfully');
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Private
 */
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  // Remove refresh token from database
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      action: 'USER_LOGOUT',
      entityType: 'AUTH',
      details: `User logged out`,
    },
  });

  return sendSuccess(res, null, 'Logout successful');
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return sendSuccess(res, user);
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    return sendError(res, 'User not authenticated', 401);
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    return sendError(res, 'Current password is incorrect', 401);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: userId,
      details: 'User changed password',
    },
  });

  return sendSuccess(res, null, 'Password changed successfully');
});
