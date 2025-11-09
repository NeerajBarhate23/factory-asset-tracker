import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSuccess, sendError, asyncHandler } from '../utils/response';
import { logActivity } from '../utils/activityLogger';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const prisma = new PrismaClient();
const unlinkAsync = promisify(fs.unlink);

/**
 * Upload a file and associate it with an asset
 * POST /api/files/upload
 */
export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  const { assetId, description } = req.body;
  const userId = (req as any).user.id;

  // Check if file exists
  if (!req.file) {
    return sendError(res, 'No file uploaded', 400);
  }

  // Validate asset exists
  const asset = await prisma.asset.findUnique({
    where: { id: assetId }
  });

  if (!asset) {
    // Delete uploaded file if asset doesn't exist
    await unlinkAsync(req.file.path);
    return sendError(res, 'Asset not found', 404);
  }

  // Create file record in database
  const file = await prisma.assetFile.create({
    data: {
      assetId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      uploadedById: userId
    },
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Log activity
  await logActivity(
    req,
    'FILE_UPLOAD',
    'AssetFile',
    file.id,
    `Uploaded file "${req.file.originalname}" for asset ${asset.assetUid}`
  );

  sendSuccess(res, file, 'File uploaded successfully', 201);
});

/**
 * Get file for preview (inline, not download)
 * GET /api/files/:id/preview
 */
export const previewFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Get file record
  const file = await prisma.assetFile.findUnique({
    where: { id },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true
        }
      }
    }
  });

  if (!file) {
    return sendError(res, 'File not found', 404);
  }

  // Check if file exists on disk
  if (!fs.existsSync(file.filePath)) {
    return sendError(res, 'File not found on server', 404);
  }

  // Set headers for inline preview
  res.setHeader('Content-Type', file.fileType);
  res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
  res.setHeader('Content-Length', file.fileSize.toString());

  // Stream file
  const fileStream = fs.createReadStream(file.filePath);
  fileStream.pipe(res);
});

/**
 * Get all files for a specific asset
 * GET /api/files/asset/:assetId
 */
export const getAssetFiles = asyncHandler(async (req: Request, res: Response) => {
  const { assetId } = req.params;

  // Validate asset exists
  const asset = await prisma.asset.findUnique({
    where: { id: assetId }
  });

  if (!asset) {
    return sendError(res, 'Asset not found', 404);
  }

  // Get all files for this asset
  const files = await prisma.assetFile.findMany({
    where: { assetId },
    include: {
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      uploadedAt: 'desc'
    }
  });

  // Add preview URL to each file
  const filesWithUrls = files.map(file => ({
    ...file,
    previewUrl: `/api/files/${file.id}/preview`
  }));

  sendSuccess(res, filesWithUrls, `Found ${files.length} files for asset ${asset.assetUid}`);
});

/**
 * Get file metadata by ID
 * GET /api/files/:id
 */
export const getFileById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const file = await prisma.assetFile.findUnique({
    where: { id },
    include: {
      asset: {
        select: {
          id: true,
          assetUid: true,
          name: true
        }
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!file) {
    return sendError(res, 'File not found', 404);
  }

  // Add preview URL
  const fileWithUrl = {
    ...file,
    previewUrl: `/api/files/${file.id}/preview`
  };

  sendSuccess(res, fileWithUrl, 'File retrieved successfully');
});

/**
 * Get file statistics
 * GET /api/files/stats
 */
export const getFileStats = asyncHandler(async (req: Request, res: Response) => {
  // Total files
  const totalFiles = await prisma.assetFile.count();

  // Total size
  const sizeResult = await prisma.assetFile.aggregate({
    _sum: {
      fileSize: true
    }
  });

  // Files by type (group by mime type category)
  const allFiles = await prisma.assetFile.findMany({
    select: { fileType: true }
  });

  const filesByType = allFiles.reduce((acc: any, file) => {
    const category = file.fileType.split('/')[0]; // image, application, text, etc.
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Recent uploads
  const recentUploads = await prisma.assetFile.findMany({
    take: 5,
    orderBy: {
      uploadedAt: 'desc'
    },
    include: {
      asset: {
        select: {
          assetUid: true,
          name: true
        }
      },
      uploadedBy: {
        select: {
          name: true
        }
      }
    }
  });

  const stats = {
    totalFiles,
    totalSize: sizeResult._sum?.fileSize || 0,
    totalSizeMB: ((sizeResult._sum?.fileSize || 0) / (1024 * 1024)).toFixed(2),
    filesByType,
    recentUploads: recentUploads.map(file => ({
      id: file.id,
      fileName: file.fileName,
      fileSize: file.fileSize,
      assetUid: file.asset.assetUid,
      assetName: file.asset.name,
      uploadedBy: file.uploadedBy.name,
      uploadedAt: file.uploadedAt
    }))
  };

  sendSuccess(res, stats, 'File statistics retrieved successfully');
});

/**
 * Delete a file
 * DELETE /api/files/:id
 */
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  // Get file record
  const file = await prisma.assetFile.findUnique({
    where: { id },
    include: {
      asset: {
        select: {
          assetUid: true,
          name: true
        }
      }
    }
  });

  if (!file) {
    return sendError(res, 'File not found', 404);
  }

  // Delete file from disk
  if (fs.existsSync(file.filePath)) {
    await unlinkAsync(file.filePath);
  }

  // Delete database record
  await prisma.assetFile.delete({
    where: { id }
  });

  // Log activity
  await logActivity(
    req,
    'FILE_DELETE',
    'AssetFile',
    file.id,
    `Deleted file "${file.fileName}" from asset ${file.asset.assetUid}`
  );

  sendSuccess(res, { id: file.id }, 'File deleted successfully');
});
