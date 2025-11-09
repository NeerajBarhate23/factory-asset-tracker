import { Request, Response } from 'express';
import { PrismaClient, AssetCategory, AssetStatus, Criticality } from '@prisma/client';
import QRCode from 'qrcode';
import { asyncHandler, sendSuccess, sendError } from '../utils/response';
import { logActivity } from '../utils/activityLogger';

const prisma = new PrismaClient();

// GET /api/assets - Get all assets with filters and pagination
export const getAssets = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    category,
    status,
    location,
    criticality,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter conditions
  const where: any = {};

  if (category) where.category = category as AssetCategory;
  if (status) where.status = status as AssetStatus;
  if (location) where.location = { contains: location as string };
  if (criticality) where.criticality = criticality as Criticality;
  
  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { assetUid: { contains: search as string } },
      { make: { contains: search as string } },
      { model: { contains: search as string } },
      { serialNumber: { contains: search as string } }
    ];
  }

  // Get total count and assets
  const [total, assets] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder as 'asc' | 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true }
        },
        _count: {
          select: {
            movements: true,
            audits: true,
            files: true
          }
        }
      }
    })
  ]);

  await logActivity(req, 'LIST_ASSETS', 'Asset', null, `Listed ${assets.length} assets with filters`);

  sendSuccess(res, {
    assets,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// GET /api/assets/stats - Get asset statistics
export const getAssetStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalAssets,
    assetsByCategory,
    assetsByStatus,
    assetsByCriticality,
    recentAssets
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.groupBy({
      by: ['category'],
      _count: { id: true }
    }),
    prisma.asset.groupBy({
      by: ['status'],
      _count: { id: true }
    }),
    prisma.asset.groupBy({
      by: ['criticality'],
      _count: { id: true }
    }),
    prisma.asset.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })
  ]);

  const stats = {
    total: totalAssets,
    byCategory: assetsByCategory.reduce((acc: any, item) => {
      acc[item.category] = item._count.id;
      return acc;
    }, {}),
    byStatus: assetsByStatus.reduce((acc: any, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {}),
    byCriticality: assetsByCriticality.reduce((acc: any, item) => {
      acc[item.criticality] = item._count.id;
      return acc;
    }, {}),
    recentlyAdded: recentAssets
  };

  await logActivity(req, 'VIEW_ASSET_STATS', 'Asset', null, 'Viewed asset statistics');

  sendSuccess(res, stats);
});

// GET /api/assets/:id - Get single asset by ID
export const getAssetById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, role: true }
      },
      movements: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          requestedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      audits: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          auditor: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      files: {
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    }
  });

  if (!asset) {
    return sendError(res, 'Asset not found', 404);
  }

  await logActivity(req, 'VIEW_ASSET', 'Asset', id, `Viewed asset: ${asset.name}`);

  sendSuccess(res, asset);
});

// POST /api/assets - Create new asset
export const createAsset = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  const {
    name,
    category,
    status = 'ACTIVE',
    location,
    criticality = 'MEDIUM',
    ownerDepartment,
    make,
    model,
    serialNumber,
    purchaseDate,
    warrantyExpiry,
    lastMaintenanceDate,
    nextMaintenanceDate,
    specifications,
    notes,
    assignedToId
  } = req.body;

  // Generate unique asset UID
  const assetCount = await prisma.asset.count();
  const assetUid = `ASSET-${String(assetCount + 1).padStart(6, '0')}`;

  // Create asset
  const asset = await prisma.asset.create({
    data: {
      assetUid,
      name,
      category,
      status,
      location,
      criticality,
      ownerDepartment,
      make,
      model,
      serialNumber,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
      lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      specifications,
      notes,
      createdById: userId,
      assignedToId: assignedToId || null
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  await logActivity(req, 'CREATE_ASSET', 'Asset', asset.id, `Created asset: ${asset.name} (${asset.assetUid})`);

  sendSuccess(res, asset, 'Asset created successfully', 201);
});

// PUT /api/assets/:id - Update asset
export const updateAsset = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    category,
    status,
    location,
    criticality,
    ownerDepartment,
    make,
    model,
    serialNumber,
    purchaseDate,
    warrantyExpiry,
    lastMaintenanceDate,
    nextMaintenanceDate,
    specifications,
    notes,
    assignedToId
  } = req.body;

  // Check if asset exists
  const existingAsset = await prisma.asset.findUnique({ where: { id } });
  if (!existingAsset) {
    return sendError(res, 'Asset not found', 404);
  }

  // Update asset
  const asset = await prisma.asset.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(category && { category }),
      ...(status && { status }),
      ...(location && { location }),
      ...(criticality && { criticality }),
      ...(ownerDepartment && { ownerDepartment }),
      ...(make && { make }),
      ...(model && { model }),
      ...(serialNumber && { serialNumber }),
      ...(purchaseDate && { purchaseDate: new Date(purchaseDate) }),
      ...(warrantyExpiry && { warrantyExpiry: new Date(warrantyExpiry) }),
      ...(lastMaintenanceDate && { lastMaintenanceDate: new Date(lastMaintenanceDate) }),
      ...(nextMaintenanceDate && { nextMaintenanceDate: new Date(nextMaintenanceDate) }),
      ...(specifications && { specifications }),
      ...(notes && { notes }),
      ...(assignedToId !== undefined && { assignedToId: assignedToId || null })
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true }
      },
      assignedTo: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  await logActivity(req, 'UPDATE_ASSET', 'Asset', id, `Updated asset: ${asset.name}`);

  sendSuccess(res, asset, 'Asset updated successfully');
});

// DELETE /api/assets/:id - Delete asset
export const deleteAsset = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if asset exists
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return sendError(res, 'Asset not found', 404);
  }

  // Delete asset (cascade will delete related movements, audits, files)
  await prisma.asset.delete({ where: { id } });

  await logActivity(req, 'DELETE_ASSET', 'Asset', id, `Deleted asset: ${asset.name} (${asset.assetUid})`);

  sendSuccess(res, null, 'Asset deleted successfully');
});

// GET /api/assets/:id/qr - Generate QR code for asset
export const generateQRCode = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if asset exists
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return sendError(res, 'Asset not found', 404);
  }

  // Generate QR code URL (includes asset UID for deep linking)
  const qrData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?asset=${asset.assetUid}`;

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  // Optionally save QR code to database
  await prisma.asset.update({
    where: { id },
    data: { qrCode: qrCodeDataUrl }
  });

  await logActivity(req, 'GENERATE_QR', 'Asset', id, `Generated QR code for asset: ${asset.assetUid}`);

  sendSuccess(res, { 
    assetUid: asset.assetUid,
    qrCode: qrCodeDataUrl,
    url: qrData
  });
});

// POST /api/assets/bulk-qr - Generate QR codes for multiple assets
export const bulkGenerateQRCodes = asyncHandler(async (req: Request, res: Response) => {
  const { assetIds } = req.body;

  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    return sendError(res, 'Asset IDs array is required', 400);
  }

  // Get all assets
  const assets = await prisma.asset.findMany({
    where: { id: { in: assetIds } }
  });

  if (assets.length === 0) {
    return sendError(res, 'No assets found', 404);
  }

  // Generate QR codes for all assets
  const qrCodes = await Promise.all(
    assets.map(async (asset) => {
      const qrData = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?asset=${asset.assetUid}`;
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2
      });

      // Update asset with QR code
      await prisma.asset.update({
        where: { id: asset.id },
        data: { qrCode: qrCodeDataUrl }
      });

      return {
        id: asset.id,
        assetUid: asset.assetUid,
        name: asset.name,
        qrCode: qrCodeDataUrl
      };
    })
  );

  await logActivity(req, 'BULK_GENERATE_QR', 'Asset', null, `Generated QR codes for ${qrCodes.length} assets`);

  sendSuccess(res, { 
    count: qrCodes.length,
    qrCodes 
  });
});
