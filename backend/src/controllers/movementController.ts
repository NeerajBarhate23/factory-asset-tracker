import { Request, Response } from 'express';
import { PrismaClient, MovementStatus } from '@prisma/client';
import { asyncHandler, sendSuccess, sendError } from '../utils/response';
import { logActivity } from '../utils/activityLogger';

const prisma = new PrismaClient();

/**
 * Calculate SLA status for a movement
 */
function calculateSLAStatus(movement: any) {
  const now = new Date();
  const requestDate = new Date(movement.requestDate);
  const deadlineDate = new Date(requestDate.getTime() + movement.slaHours * 60 * 60 * 1000);
  
  const elapsedMs = now.getTime() - requestDate.getTime();
  const totalMs = movement.slaHours * 60 * 60 * 1000;
  const percentElapsed = (elapsedMs / totalMs) * 100;
  
  const completionDate = movement.receivedAt || movement.completedAt;
  const isCompleted = movement.status === 'COMPLETED';
  
  let slaStatus: 'MET' | 'AT_RISK' | 'BREACHED' | 'ON_TRACK';
  
  if (isCompleted) {
    const completedMs = new Date(completionDate).getTime() - requestDate.getTime();
    slaStatus = completedMs <= totalMs ? 'MET' : 'BREACHED';
  } else {
    if (percentElapsed >= 100) {
      slaStatus = 'BREACHED';
    } else if (percentElapsed >= 80) {
      slaStatus = 'AT_RISK';
    } else {
      slaStatus = 'ON_TRACK';
    }
  }
  
  return {
    slaStatus,
    deadlineDate,
    elapsedHours: Math.floor(elapsedMs / (60 * 60 * 1000)),
    remainingHours: Math.max(0, Math.ceil((deadlineDate.getTime() - now.getTime()) / (60 * 60 * 1000))),
    percentElapsed: Math.min(100, Math.round(percentElapsed))
  };
}

// GET /api/movements - Get all movements with filters and pagination
export const getMovements = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    assetId,
    status,
    fromLocation,
    toLocation,
    requestedById,
    slaStatus,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter conditions
  const where: any = {};

  if (assetId) where.assetId = assetId as string;
  if (status) where.status = status as MovementStatus;
  if (fromLocation) where.fromLocation = { contains: fromLocation as string };
  if (toLocation) where.toLocation = { contains: toLocation as string };
  if (requestedById) where.requestedById = requestedById as string;

  // Get total count and movements
  const [total, movements] = await Promise.all([
    prisma.movement.count({ where }),
    prisma.movement.findMany({
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
            status: true
          }
        },
        requestedBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    })
  ]);

  // Add SLA status to each movement
  const movementsWithSLA = movements.map(movement => ({
    ...movement,
    sla: calculateSLAStatus(movement)
  }));

  // Filter by SLA status if requested
  let filteredMovements = movementsWithSLA;
  if (slaStatus) {
    filteredMovements = movementsWithSLA.filter(m => m.sla.slaStatus === slaStatus);
  }

  await logActivity(req, 'LIST_MOVEMENTS', 'Movement', null, `Listed ${filteredMovements.length} movements`);

  sendSuccess(res, {
    movements: filteredMovements,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: slaStatus ? filteredMovements.length : total,
      totalPages: Math.ceil((slaStatus ? filteredMovements.length : total) / limitNum)
    }
  });
});

// GET /api/movements/stats - Get movement statistics
export const getMovementStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalMovements,
    movementsByStatus,
    pendingMovements,
    allActiveMovements
  ] = await Promise.all([
    prisma.movement.count(),
    prisma.movement.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.movement.count({
      where: { status: 'PENDING' }
    }),
    prisma.movement.findMany({
      where: {
        status: {
          in: ['PENDING', 'APPROVED', 'IN_TRANSIT']
        }
      }
    })
  ]);

  // Calculate SLA metrics
  let onTrack = 0;
  let atRisk = 0;
  let breached = 0;

  allActiveMovements.forEach(movement => {
    const sla = calculateSLAStatus(movement);
    if (sla.slaStatus === 'ON_TRACK') onTrack++;
    else if (sla.slaStatus === 'AT_RISK') atRisk++;
    else if (sla.slaStatus === 'BREACHED') breached++;
  });

  const stats = {
    total: totalMovements,
    byStatus: movementsByStatus.reduce((acc: any, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {}),
    pending: pendingMovements,
    slaMetrics: {
      onTrack,
      atRisk,
      breached,
      totalActive: allActiveMovements.length
    }
  };

  await logActivity(req, 'VIEW_MOVEMENT_STATS', 'Movement', null, 'Viewed movement statistics');

  sendSuccess(res, stats);
});

// GET /api/movements/pending - Get pending approval movements
export const getPendingMovements = asyncHandler(async (req: Request, res: Response) => {
  const movements = await prisma.movement.findMany({
    where: { status: 'PENDING' },
    orderBy: { requestDate: 'asc' },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true,
          criticality: true
        }
      },
      requestedBy: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  const movementsWithSLA = movements.map(movement => ({
    ...movement,
    sla: calculateSLAStatus(movement)
  }));

  await logActivity(req, 'VIEW_PENDING_MOVEMENTS', 'Movement', null, `Viewed ${movements.length} pending movements`);

  sendSuccess(res, movementsWithSLA);
});

// GET /api/movements/overdue - Get overdue movements
export const getOverdueMovements = asyncHandler(async (req: Request, res: Response) => {
  const movements = await prisma.movement.findMany({
    where: {
      status: {
        in: ['PENDING', 'APPROVED', 'IN_TRANSIT']
      }
    },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true,
          criticality: true
        }
      },
      requestedBy: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  const movementsWithSLA = movements
    .map(movement => ({
      ...movement,
      sla: calculateSLAStatus(movement)
    }))
    .filter(m => m.sla.slaStatus === 'BREACHED' || m.sla.slaStatus === 'AT_RISK');

  await logActivity(req, 'VIEW_OVERDUE_MOVEMENTS', 'Movement', null, `Viewed ${movementsWithSLA.length} overdue/at-risk movements`);

  sendSuccess(res, movementsWithSLA);
});

// GET /api/movements/:id - Get single movement by ID
export const getMovementById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const movement = await prisma.movement.findUnique({
    where: { id },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true,
          category: true,
          status: true,
          criticality: true
        }
      },
      requestedBy: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  if (!movement) {
    return sendError(res, 'Movement not found', 404);
  }

  const movementWithSLA = {
    ...movement,
    sla: calculateSLAStatus(movement)
  };

  await logActivity(req, 'VIEW_MOVEMENT', 'Movement', id, `Viewed movement for asset ${movement.asset.assetUid}`);

  sendSuccess(res, movementWithSLA);
});

// POST /api/movements - Create new movement request
export const createMovement = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const {
    assetId,
    fromLocation,
    toLocation,
    reason,
    notes,
    slaHours = 24
  } = req.body;

  // Check if asset exists
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return sendError(res, 'Asset not found', 404);
  }

  // Create movement request
  const movement = await prisma.movement.create({
    data: {
      assetId,
      fromLocation,
      toLocation,
      reason,
      notes,
      slaHours: parseInt(slaHours),
      status: 'PENDING',
      requestedById: userId
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
      requestedBy: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  const movementWithSLA = {
    ...movement,
    sla: calculateSLAStatus(movement)
  };

  await logActivity(
    req,
    'CREATE_MOVEMENT',
    'Movement',
    movement.id,
    `Created movement request for ${asset.assetUid} from ${fromLocation} to ${toLocation}`
  );

  sendSuccess(res, movementWithSLA, 'Movement request created successfully', 201);
});

// PUT /api/movements/:id/approve - Approve movement request
export const approveMovement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  // Check if movement exists
  const existingMovement = await prisma.movement.findUnique({
    where: { id },
    include: { asset: true }
  });

  if (!existingMovement) {
    return sendError(res, 'Movement not found', 404);
  }

  if (existingMovement.status !== 'PENDING') {
    return sendError(res, `Cannot approve movement with status: ${existingMovement.status}`, 400);
  }

  // Approve movement
  const movement = await prisma.movement.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvalDate: new Date(),
      approvedById: userId
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
      requestedBy: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  const movementWithSLA = {
    ...movement,
    sla: calculateSLAStatus(movement)
  };

  await logActivity(
    req,
    'APPROVE_MOVEMENT',
    'Movement',
    id,
    `Approved movement for ${existingMovement.asset.assetUid}`
  );

  sendSuccess(res, movementWithSLA, 'Movement approved successfully');
});

// PUT /api/movements/:id/reject - Reject movement request
export const rejectMovement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Check if movement exists
  const existingMovement = await prisma.movement.findUnique({
    where: { id },
    include: { asset: true }
  });

  if (!existingMovement) {
    return sendError(res, 'Movement not found', 404);
  }

  if (existingMovement.status !== 'PENDING') {
    return sendError(res, `Cannot reject movement with status: ${existingMovement.status}`, 400);
  }

  // Reject movement
  const movement = await prisma.movement.update({
    where: { id },
    data: {
      status: 'REJECTED',
      notes: reason || existingMovement.notes
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
      requestedBy: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  await logActivity(
    req,
    'REJECT_MOVEMENT',
    'Movement',
    id,
    `Rejected movement for ${existingMovement.asset.assetUid}: ${reason || 'No reason provided'}`
  );

  sendSuccess(res, movement, 'Movement rejected successfully');
});

// PUT /api/movements/:id/dispatch - Mark movement as dispatched
export const dispatchMovement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if movement exists
  const existingMovement = await prisma.movement.findUnique({
    where: { id },
    include: { asset: true }
  });

  if (!existingMovement) {
    return sendError(res, 'Movement not found', 404);
  }

  if (existingMovement.status !== 'APPROVED') {
    return sendError(res, `Cannot dispatch movement with status: ${existingMovement.status}`, 400);
  }

  // Mark as dispatched
  const movement = await prisma.movement.update({
    where: { id },
    data: {
      status: 'IN_TRANSIT',
      dispatchedAt: new Date()
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
      requestedBy: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  const movementWithSLA = {
    ...movement,
    sla: calculateSLAStatus(movement)
  };

  await logActivity(
    req,
    'DISPATCH_MOVEMENT',
    'Movement',
    id,
    `Dispatched ${existingMovement.asset.assetUid} from ${movement.fromLocation}`
  );

  sendSuccess(res, movementWithSLA, 'Movement dispatched successfully');
});

// PUT /api/movements/:id/complete - Mark movement as completed
export const completeMovement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if movement exists
  const existingMovement = await prisma.movement.findUnique({
    where: { id },
    include: { asset: true }
  });

  if (!existingMovement) {
    return sendError(res, 'Movement not found', 404);
  }

  if (existingMovement.status !== 'IN_TRANSIT') {
    return sendError(res, `Cannot complete movement with status: ${existingMovement.status}`, 400);
  }

  // Mark as completed and update asset location
  const [movement] = await Promise.all([
    prisma.movement.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        receivedAt: new Date()
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
        requestedBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    }),
    // Update asset location
    prisma.asset.update({
      where: { id: existingMovement.assetId },
      data: { location: existingMovement.toLocation }
    })
  ]);

  const movementWithSLA = {
    ...movement,
    sla: calculateSLAStatus(movement)
  };

  await logActivity(
    req,
    'COMPLETE_MOVEMENT',
    'Movement',
    id,
    `Completed movement of ${existingMovement.asset.assetUid} to ${movement.toLocation}. SLA: ${movementWithSLA.sla.slaStatus}`
  );

  sendSuccess(res, movementWithSLA, 'Movement completed successfully');
});
