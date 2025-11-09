import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { asyncHandler, sendSuccess, sendError } from '../utils/response';
import { hashPassword } from '../utils/password';

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin, Shop Incharge)
 */
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', role, department, search } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};
  
  if (role) {
    where.role = role;
  }
  
  if (department) {
    where.department = department;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { email: { contains: search as string } },
    ];
  }

  // Get users and total count
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return sendSuccess(res, {
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  }, 'Users retrieved successfully');
});

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin, Shop Incharge, or own profile)
 */
export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  // Check if user is accessing their own profile or is admin/shop incharge
  if (
    id !== currentUserId &&
    currentUserRole !== 'ADMIN' &&
    currentUserRole !== 'SHOP_INCHARGE'
  ) {
    return sendError(res, 'You can only view your own profile', 403);
  }

  const user = await prisma.user.findUnique({
    where: { id },
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

  return sendSuccess(res, user, 'User retrieved successfully');
});

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
export const createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
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
      role,
      department,
    },
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

  // Log activity
  await prisma.activity.create({
    data: {
      userId: req.user!.id,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      details: `Created user: ${user.name} (${user.email})`,
    },
  });

  return sendSuccess(res, user, 'User created successfully', 201);
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { email, name, role, department, password } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    return sendError(res, 'User not found', 404);
  }

  // If email is being changed, check if new email is available
  if (email && email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email },
    });

    if (emailTaken) {
      return sendError(res, 'Email already in use', 409);
    }
  }

  // Prepare update data
  const updateData: any = {};
  
  if (email) updateData.email = email;
  if (name) updateData.name = name;
  if (role) updateData.role = role;
  if (department) updateData.department = department;
  if (password) {
    updateData.password = await hashPassword(password);
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
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

  // Log activity
  await prisma.activity.create({
    data: {
      userId: req.user!.id,
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: user.id,
      details: `Updated user: ${user.name}`,
    },
  });

  return sendSuccess(res, user, 'User updated successfully');
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (soft delete by setting inactive)
 * @access  Private (Admin only)
 */
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;

  // Prevent self-deletion
  if (id === currentUserId) {
    return sendError(res, 'You cannot delete your own account', 400);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  // Delete user (this is a hard delete - in production you might want soft delete)
  await prisma.user.delete({
    where: { id },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      userId: req.user!.id,
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: id,
      details: `Deleted user: ${user.name} (${user.email})`,
    },
  });

  return sendSuccess(res, null, 'User deleted successfully');
});

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin, Shop Incharge)
 */
export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get counts by role
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  // Get counts by department
  const usersByDepartment = await prisma.user.groupBy({
    by: ['department'],
    _count: true,
  });

  // Get total users
  const totalUsers = await prisma.user.count();

  // Get recent users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  return sendSuccess(res, {
    total: totalUsers,
    recent: recentUsers,
    byRole: usersByRole.map(item => ({
      role: item.role,
      count: item._count,
    })),
    byDepartment: usersByDepartment.map(item => ({
      department: item.department,
      count: item._count,
    })),
  }, 'User statistics retrieved successfully');
});
