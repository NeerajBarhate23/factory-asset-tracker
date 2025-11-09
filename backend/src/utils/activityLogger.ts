import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Log user activity to the Activity table
 * @param req - Express request object
 * @param action - Action performed (e.g., 'CREATE_ASSET', 'UPDATE_USER')
 * @param entityType - Type of entity (e.g., 'Asset', 'User', 'Movement')
 * @param entityId - ID of the entity (optional)
 * @param details - Additional details about the action (optional)
 */
export async function logActivity(
  req: Request,
  action: string,
  entityType: string,
  entityId: string | null,
  details?: string
): Promise<void> {
  try {
    const user = (req as any).user;
    const userId = user?.id;

    if (!userId) {
      console.warn('Cannot log activity: No user ID found in request');
      return;
    }

    await prisma.activity.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get('user-agent') || null
      }
    });
  } catch (error) {
    // Don't throw error for activity logging failures
    // Just log to console
    console.error('Failed to log activity:', error);
  }
}
