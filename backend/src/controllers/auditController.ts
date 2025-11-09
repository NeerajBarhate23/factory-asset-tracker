import { Request, Response } from 'express';
import { PrismaClient, AuditStatus, AssetCategory } from '@prisma/client';
import { asyncHandler, sendSuccess, sendError } from '../utils/response';
import { logActivity } from '../utils/activityLogger';

const prisma = new PrismaClient();

// GET /api/audits - Get all audits with filters and pagination
export const getAudits = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    location,
    category,
    auditorId,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter conditions
  const where: any = {};

  if (status) where.status = status as AuditStatus;
  if (location) where.location = { contains: location as string };
  if (category) where.category = category as AssetCategory;
  if (auditorId) where.auditorId = auditorId as string;

  // Get total count and audits
  const [total, audits] = await Promise.all([
    prisma.audit.count({ where }),
    prisma.audit.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
      include: {
        asset: {
          select: {
            id: true,
            assetUid: true,
            name: true,
            category: true,
            location: true
          }
        },
        auditor: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })
  ]);

  // Calculate completion percentage for each audit
  const auditsWithProgress = audits.map(audit => ({
    ...audit,
    completionPercentage: audit.totalAssets > 0
      ? Math.round((audit.assetsScanned / audit.totalAssets) * 100)
      : 0
  }));

  await logActivity(req, 'LIST_AUDITS', 'Audit', null, `Listed ${audits.length} audits`);

  sendSuccess(res, {
    audits: auditsWithProgress,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// GET /api/audits/stats - Get audit statistics
export const getAuditStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalAudits,
    auditsByStatus,
    scheduledAudits,
    completedAudits,
    totalDiscrepancies
  ] = await Promise.all([
    prisma.audit.count(),
    prisma.audit.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.audit.count({
      where: { status: 'SCHEDULED' }
    }),
    prisma.audit.findMany({
      where: { status: 'COMPLETED' },
      select: {
        assetsScanned: true,
        totalAssets: true,
        discrepancies: true
      }
    }),
    prisma.audit.aggregate({
      _sum: { discrepancies: true }
    })
  ]);

  // Calculate audit completion rate
  const totalScanned = completedAudits.reduce((sum, audit) => sum + audit.assetsScanned, 0);
  const totalExpected = completedAudits.reduce((sum, audit) => sum + audit.totalAssets, 0);
  const completionRate = totalExpected > 0 ? ((totalScanned / totalExpected) * 100).toFixed(1) : '0';

  const stats = {
    total: totalAudits,
    byStatus: auditsByStatus.reduce((acc: any, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {}),
    scheduled: scheduledAudits,
    totalDiscrepancies: totalDiscrepancies._sum.discrepancies || 0,
    completionRate: parseFloat(completionRate),
    completedCount: completedAudits.length
  };

  await logActivity(req, 'VIEW_AUDIT_STATS', 'Audit', null, 'Viewed audit statistics');

  sendSuccess(res, stats);
});

// GET /api/audits/scheduled - Get scheduled audits
export const getScheduledAudits = asyncHandler(async (req: Request, res: Response) => {
  const audits = await prisma.audit.findMany({
    where: { 
      status: 'SCHEDULED',
      scheduledDate: {
        gte: new Date() // Future scheduled audits
      }
    },
    orderBy: { scheduledDate: 'asc' },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true,
          location: true
        }
      },
      auditor: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  await logActivity(req, 'VIEW_SCHEDULED_AUDITS', 'Audit', null, `Viewed ${audits.length} scheduled audits`);

  sendSuccess(res, audits);
});

// GET /api/audits/:id - Get single audit by ID
export const getAuditById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const audit = await prisma.audit.findUnique({
    where: { id },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true,
          location: true,
          status: true
        }
      },
      auditor: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  if (!audit) {
    return sendError(res, 'Audit not found', 404);
  }

  // Add completion percentage
  const auditWithProgress = {
    ...audit,
    completionPercentage: audit.totalAssets > 0
      ? Math.round((audit.assetsScanned / audit.totalAssets) * 100)
      : 0
  };

  await logActivity(req, 'VIEW_AUDIT', 'Audit', id, `Viewed audit scheduled for ${audit.scheduledDate}`);

  sendSuccess(res, auditWithProgress);
});

// POST /api/audits - Create/schedule new audit
export const createAudit = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const {
    location,
    category,
    scheduledDate,
    assetId,
    totalAssets = 0,
    notes
  } = req.body;

  // If specific asset audit, verify asset exists
  if (assetId) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return sendError(res, 'Asset not found', 404);
    }
  }

  // Create audit
  const audit = await prisma.audit.create({
    data: {
      location: location || null,
      category: category || null,
      scheduledDate: new Date(scheduledDate),
      status: 'SCHEDULED',
      assetId: assetId || null,
      auditorId: userId,
      totalAssets: parseInt(totalAssets),
      notes
    },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true
        }
      },
      auditor: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  await logActivity(
    req,
    'CREATE_AUDIT',
    'Audit',
    audit.id,
    `Scheduled audit for ${location || category || 'asset ' + assetId} on ${scheduledDate}`
  );

  sendSuccess(res, audit, 'Audit scheduled successfully', 201);
});

// PUT /api/audits/:id - Update audit
export const updateAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    location,
    category,
    scheduledDate,
    assetsScanned,
    totalAssets,
    discrepancies,
    notes
  } = req.body;

  // Check if audit exists
  const existingAudit = await prisma.audit.findUnique({ where: { id } });
  if (!existingAudit) {
    return sendError(res, 'Audit not found', 404);
  }

  // Update audit
  const audit = await prisma.audit.update({
    where: { id },
    data: {
      ...(location !== undefined && { location }),
      ...(category !== undefined && { category }),
      ...(scheduledDate && { scheduledDate: new Date(scheduledDate) }),
      ...(assetsScanned !== undefined && { assetsScanned: parseInt(assetsScanned) }),
      ...(totalAssets !== undefined && { totalAssets: parseInt(totalAssets) }),
      ...(discrepancies !== undefined && { discrepancies: parseInt(discrepancies) }),
      ...(notes !== undefined && { notes })
    },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true
        }
      },
      auditor: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  await logActivity(req, 'UPDATE_AUDIT', 'Audit', id, `Updated audit details`);

  sendSuccess(res, audit, 'Audit updated successfully');
});

// PUT /api/audits/:id/start - Start an audit
export const startAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if audit exists
  const existingAudit = await prisma.audit.findUnique({ where: { id } });
  if (!existingAudit) {
    return sendError(res, 'Audit not found', 404);
  }

  if (existingAudit.status !== 'SCHEDULED') {
    return sendError(res, `Cannot start audit with status: ${existingAudit.status}`, 400);
  }

  // Start audit
  const audit = await prisma.audit.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS'
    },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true
        }
      },
      auditor: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  await logActivity(req, 'START_AUDIT', 'Audit', id, `Started audit`);

  sendSuccess(res, audit, 'Audit started successfully');
});

// PUT /api/audits/:id/complete - Complete an audit
export const completeAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { assetsScanned, discrepancies = 0, notes } = req.body;

  // Check if audit exists
  const existingAudit = await prisma.audit.findUnique({ where: { id } });
  if (!existingAudit) {
    return sendError(res, 'Audit not found', 404);
  }

  if (existingAudit.status !== 'IN_PROGRESS') {
    return sendError(res, `Cannot complete audit with status: ${existingAudit.status}`, 400);
  }

  // Determine final status based on discrepancies
  const finalStatus = discrepancies > 0 ? 'DISCREPANCY_FOUND' : 'COMPLETED';

  // Complete audit
  const audit = await prisma.audit.update({
    where: { id },
    data: {
      status: finalStatus,
      completedDate: new Date(),
      assetsScanned: parseInt(assetsScanned),
      discrepancies: parseInt(discrepancies),
      ...(notes && { notes })
    },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true
        }
      },
      auditor: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  const completionPercentage = audit.totalAssets > 0
    ? Math.round((audit.assetsScanned / audit.totalAssets) * 100)
    : 0;

  await logActivity(
    req,
    'COMPLETE_AUDIT',
    'Audit',
    id,
    `Completed audit: ${audit.assetsScanned}/${audit.totalAssets} scanned, ${audit.discrepancies} discrepancies (${completionPercentage}%)`
  );

  sendSuccess(res, {
    ...audit,
    completionPercentage
  }, 'Audit completed successfully');
});

// DELETE /api/audits/:id - Delete audit
export const deleteAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if audit exists
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) {
    return sendError(res, 'Audit not found', 404);
  }

  // Delete audit
  await prisma.audit.delete({ where: { id } });

  await logActivity(req, 'DELETE_AUDIT', 'Audit', id, `Deleted audit scheduled for ${audit.scheduledDate}`);

  sendSuccess(res, null, 'Audit deleted successfully');
});
