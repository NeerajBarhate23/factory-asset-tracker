import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, sendSuccess } from '../utils/response';

const prisma = new PrismaClient();

/**
 * @desc    Get dashboard KPIs
 * @route   GET /api/dashboard/kpis
 * @access  Private
 */
export const getDashboardKPIs = asyncHandler(async (req: Request, res: Response) => {
  // Get assets statistics
  const totalAssets = await prisma.asset.count();
  const activeAssets = await prisma.asset.count({ where: { status: 'ACTIVE' } });
  const inMaintenanceAssets = await prisma.asset.count({ where: { status: 'MAINTENANCE' } });
  const retiredAssets = await prisma.asset.count({ where: { status: 'RETIRED' } });
  const criticalAssets = await prisma.asset.count({ where: { criticality: 'HIGH' } });

  // Get movements statistics
  const totalMovements = await prisma.movement.count();
  const pendingMovements = await prisma.movement.count({ where: { status: 'PENDING' } });
  const approvedMovements = await prisma.movement.count({ where: { status: 'APPROVED' } });
  const inTransitMovements = await prisma.movement.count({ where: { status: 'IN_TRANSIT' } });
  const completedMovements = await prisma.movement.count({ where: { status: 'COMPLETED' } });

  // Get overdue movements (breached SLA)
  const now = new Date();
  const movements = await prisma.movement.findMany({
    where: {
      status: {
        in: ['PENDING', 'APPROVED', 'IN_TRANSIT']
      }
    },
    select: {
      requestDate: true,
      slaHours: true
    }
  });

  const overdueMovements = movements.filter(m => {
    if (!m.slaHours) return false;
    const slaDeadline = new Date(m.requestDate);
    slaDeadline.setHours(slaDeadline.getHours() + m.slaHours);
    return now > slaDeadline;
  }).length;

  // Calculate SLA compliance percentage
  const totalCompletedMovements = await prisma.movement.count({
    where: { status: 'COMPLETED' }
  });

  const completedOnTime = await prisma.movement.count({
    where: {
      status: 'COMPLETED',
      receivedAt: { not: null }
    }
  });

  // Calculate movements that met SLA
  const completedMovementsWithDetails = await prisma.movement.findMany({
    where: {
      status: 'COMPLETED',
      receivedAt: { not: null }
    },
    select: {
      requestDate: true,
      receivedAt: true,
      slaHours: true
    }
  });

  const metSLA = completedMovementsWithDetails.filter(m => {
    if (!m.slaHours || !m.receivedAt) return false;
    const slaDeadline = new Date(m.requestDate);
    slaDeadline.setHours(slaDeadline.getHours() + m.slaHours);
    return new Date(m.receivedAt) <= slaDeadline;
  }).length;

  const slaComplianceRate = totalCompletedMovements > 0
    ? ((metSLA / totalCompletedMovements) * 100).toFixed(2)
    : '0.00';

  // Get audits statistics
  const totalAudits = await prisma.audit.count();
  const scheduledAudits = await prisma.audit.count({ where: { status: 'SCHEDULED' } });
  const inProgressAudits = await prisma.audit.count({ where: { status: 'IN_PROGRESS' } });
  const completedAudits = await prisma.audit.count({ where: { status: 'COMPLETED' } });
  const discrepancyFoundAudits = await prisma.audit.count({ where: { status: 'DISCREPANCY_FOUND' } });

  // Get users statistics
  const totalUsers = await prisma.user.count();

  sendSuccess(res, {
    assets: {
      total: totalAssets,
      active: activeAssets,
      inMaintenance: inMaintenanceAssets,
      retired: retiredAssets,
      critical: criticalAssets
    },
    movements: {
      total: totalMovements,
      pending: pendingMovements,
      approved: approvedMovements,
      inTransit: inTransitMovements,
      completed: completedMovements,
      overdue: overdueMovements
    },
    audits: {
      total: totalAudits,
      scheduled: scheduledAudits,
      inProgress: inProgressAudits,
      completed: completedAudits,
      discrepancyFound: discrepancyFoundAudits
    },
    users: {
      total: totalUsers
    },
    compliance: {
      slaComplianceRate: parseFloat(slaComplianceRate),
      metSLA,
      totalCompleted: totalCompletedMovements
    }
  });
});

/**
 * @desc    Get dashboard trends
 * @route   GET /api/dashboard/trends
 * @access  Private
 */
export const getDashboardTrends = asyncHandler(async (req: Request, res: Response) => {
  const { period = '30' } = req.query; // days
  const days = parseInt(period as string);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Asset trends - registrations over time
  const assetsByDay = await prisma.asset.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: startDate
      }
    },
    _count: true
  });

  // Group by date (remove time component)
  const assetTrends: { [key: string]: number } = {};
  assetsByDay.forEach(item => {
    const date = new Date(item.createdAt).toISOString().split('T')[0];
    assetTrends[date] = (assetTrends[date] || 0) + item._count;
  });

  // Movement trends - movements over time
  const movementsByDay = await prisma.movement.groupBy({
    by: ['requestDate'],
    where: {
      requestDate: {
        gte: startDate
      }
    },
    _count: true
  });

  const movementTrends: { [key: string]: number } = {};
  movementsByDay.forEach(item => {
    const date = new Date(item.requestDate).toISOString().split('T')[0];
    movementTrends[date] = (movementTrends[date] || 0) + item._count;
  });

  // Movement frequency by location
  const movementsByLocation = await prisma.movement.groupBy({
    by: ['fromLocation'],
    where: {
      requestDate: {
        gte: startDate
      }
    },
    _count: true
  });

  const locationFrequency = movementsByLocation.map(item => ({
    location: item.fromLocation,
    count: item._count
  }));

  // Audit trends - audits over time
  const auditsByDay = await prisma.audit.groupBy({
    by: ['scheduledDate'],
    where: {
      scheduledDate: {
        gte: startDate
      }
    },
    _count: true
  });

  const auditTrends: { [key: string]: number } = {};
  auditsByDay.forEach(item => {
    const date = new Date(item.scheduledDate).toISOString().split('T')[0];
    auditTrends[date] = (auditTrends[date] || 0) + item._count;
  });

  // Audit completion rate over time
  const completedAuditsByDay = await prisma.audit.groupBy({
    by: ['scheduledDate'],
    where: {
      scheduledDate: {
        gte: startDate
      },
      status: 'COMPLETED'
    },
    _count: true
  });

  const completedAuditTrends: { [key: string]: number } = {};
  completedAuditsByDay.forEach(item => {
    const date = new Date(item.scheduledDate).toISOString().split('T')[0];
    completedAuditTrends[date] = (completedAuditTrends[date] || 0) + item._count;
  });

  // Calculate completion rates by date
  const auditCompletionRates: { [key: string]: number } = {};
  Object.keys(auditTrends).forEach(date => {
    const total = auditTrends[date];
    const completed = completedAuditTrends[date] || 0;
    auditCompletionRates[date] = total > 0 ? (completed / total) * 100 : 0;
  });

  // SLA breach trends
  const movements = await prisma.movement.findMany({
    where: {
      requestDate: {
        gte: startDate
      },
      status: 'COMPLETED'
    },
    select: {
      requestDate: true,
      receivedAt: true,
      slaHours: true
    }
  });

  const slaBreachTrends: { [key: string]: { total: number; breached: number } } = {};
  movements.forEach(m => {
    if (!m.receivedAt || !m.slaHours) return;
    
    const date = new Date(m.requestDate).toISOString().split('T')[0];
    if (!slaBreachTrends[date]) {
      slaBreachTrends[date] = { total: 0, breached: 0 };
    }
    
    slaBreachTrends[date].total++;
    
    const slaDeadline = new Date(m.requestDate);
    slaDeadline.setHours(slaDeadline.getHours() + m.slaHours);
    
    if (new Date(m.receivedAt) > slaDeadline) {
      slaBreachTrends[date].breached++;
    }
  });

  const slaBreachRates: { [key: string]: number } = {};
  Object.keys(slaBreachTrends).forEach(date => {
    const { total, breached } = slaBreachTrends[date];
    slaBreachRates[date] = total > 0 ? (breached / total) * 100 : 0;
  });

  sendSuccess(res, {
    period: days,
    assetTrends: Object.entries(assetTrends).map(([date, count]) => ({ date, count })),
    movementTrends: Object.entries(movementTrends).map(([date, count]) => ({ date, count })),
    locationFrequency,
    auditTrends: Object.entries(auditTrends).map(([date, count]) => ({ date, count })),
    auditCompletionRates: Object.entries(auditCompletionRates).map(([date, rate]) => ({ date, rate: parseFloat(rate.toFixed(2)) })),
    slaBreachRates: Object.entries(slaBreachRates).map(([date, rate]) => ({ date, rate: parseFloat(rate.toFixed(2)) }))
  });
});

/**
 * @desc    Get recent activities
 * @route   GET /api/dashboard/activities
 * @access  Private
 */
export const getRecentActivities = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '50' } = req.query;
  const limitNum = parseInt(limit as string);

  // Fetch recent activities with user information
  const activities = await prisma.activity.findMany({
    take: limitNum,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  // Transform activities with better formatting
  const formattedActivities = activities.map(activity => ({
    id: activity.id,
    action: activity.action,
    entityType: activity.entityType,
    entityId: activity.entityId,
    details: activity.details,
    ipAddress: activity.ipAddress,
    userAgent: activity.userAgent,
    createdAt: activity.createdAt,
    user: {
      id: activity.user.id,
      name: activity.user.name,
      email: activity.user.email,
      role: activity.user.role
    }
  }));

  sendSuccess(res, {
    activities: formattedActivities,
    total: formattedActivities.length
  });
});
