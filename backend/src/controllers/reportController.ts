import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, sendSuccess, sendError } from '../utils/response';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

/**
 * @desc    Export assets to CSV
 * @route   GET /api/reports/assets/export
 * @access  Private
 */
export const exportAssetsToCSV = asyncHandler(async (req: Request, res: Response) => {
  const { 
    category, 
    status, 
    criticality, 
    location
  } = req.query;

  // Build filter conditions
  const where: any = {};
  if (category) where.category = category;
  if (status) where.status = status;
  if (criticality) where.criticality = criticality;
  if (location) where.location = { contains: location as string };

  // Fetch assets with related data
  const assets = await prisma.asset.findMany({
    where,
    include: {
      createdBy: {
        select: { name: true, email: true }
      },
      assignedTo: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Transform data for CSV
  const csvData = assets.map(asset => ({
    'Asset UID': asset.assetUid,
    'Name': asset.name,
    'Category': asset.category,
    'Status': asset.status,
    'Criticality': asset.criticality || 'N/A',
    'Current Location': asset.location,
    'Purchase Date': asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A',
    'Warranty Expiry': asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'N/A',
    'Make': asset.make || 'N/A',
    'Model': asset.model || 'N/A',
    'Serial Number': asset.serialNumber || 'N/A',
    'Owner Department': asset.ownerDepartment || 'N/A',
    'Assigned To': asset.assignedTo?.name || 'Unassigned',
    'Created By': asset.createdBy.name,
    'Created At': new Date(asset.createdAt).toLocaleDateString(),
    'Notes': asset.notes || 'N/A'
  }));

  // Convert to CSV
  const parser = new Parser();
  const csv = parser.parse(csvData);

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=assets-export-${Date.now()}.csv`);
  
  res.send(csv);
});

/**
 * @desc    Export movements to CSV
 * @route   GET /api/reports/movements/export
 * @access  Private
 */
export const exportMovementsToCSV = asyncHandler(async (req: Request, res: Response) => {
  const { 
    status, 
    fromLocation, 
    toLocation,
    slaStatus,
    startDate,
    endDate
  } = req.query;

  // Build filter conditions
  const where: any = {};
  if (status) where.status = status;
  if (fromLocation) where.fromLocation = { contains: fromLocation as string };
  if (toLocation) where.toLocation = { contains: toLocation as string };
  if (slaStatus) {
    // Will calculate SLA status in application layer
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  // Fetch movements with related data
  const movements = await prisma.movement.findMany({
    where,
    include: {
      asset: {
        select: { assetUid: true, name: true }
      },
      requestedBy: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Transform data for CSV
  const csvData = movements.map(movement => {
    const slaDeadline = new Date(movement.requestDate);
    slaDeadline.setHours(slaDeadline.getHours() + movement.slaHours);
    const now = new Date();
    let slaStatusCalc = 'ON_TRACK';
    
    if (movement.status === 'COMPLETED' || movement.status === 'REJECTED') {
      const completedAt = movement.receivedAt || now;
      slaStatusCalc = completedAt <= slaDeadline ? 'MET' : 'BREACHED';
    } else {
      const hoursRemaining = (slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursRemaining < 0) slaStatusCalc = 'BREACHED';
      else if (hoursRemaining < movement.slaHours * 0.2) slaStatusCalc = 'AT_RISK';
    }

    return {
      'Movement ID': movement.id.substring(0, 8),
      'Asset UID': movement.asset.assetUid,
      'Asset Name': movement.asset.name,
      'From Location': movement.fromLocation,
      'To Location': movement.toLocation,
      'Status': movement.status,
      'SLA Hours': movement.slaHours,
      'SLA Status': slaStatusCalc,
      'Requested By': movement.requestedBy.name,
      'Request Date': new Date(movement.requestDate).toLocaleString(),
      'Approval Date': movement.approvalDate ? new Date(movement.approvalDate).toLocaleString() : 'N/A',
      'Dispatched At': movement.dispatchedAt ? new Date(movement.dispatchedAt).toLocaleString() : 'N/A',
      'Received At': movement.receivedAt ? new Date(movement.receivedAt).toLocaleString() : 'N/A',
      'Reason': movement.reason || 'N/A',
      'Notes': movement.notes || 'N/A'
    };
  });

  // Convert to CSV
  const parser = new Parser();
  const csv = parser.parse(csvData);

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=movements-export-${Date.now()}.csv`);
  
  res.send(csv);
});

/**
 * @desc    Export audits to CSV
 * @route   GET /api/reports/audits/export
 * @access  Private
 */
export const exportAuditsToCSV = asyncHandler(async (req: Request, res: Response) => {
  const { 
    status, 
    location,
    startDate,
    endDate
  } = req.query;

  // Build filter conditions
  const where: any = {};
  if (status) where.status = status;
  if (location) where.location = { contains: location as string };
  if (startDate || endDate) {
    where.scheduledDate = {};
    if (startDate) where.scheduledDate.gte = new Date(startDate as string);
    if (endDate) where.scheduledDate.lte = new Date(endDate as string);
  }

  // Fetch audits with related data
  const audits = await prisma.audit.findMany({
    where,
    include: {
      auditor: {
        select: { name: true, email: true }
      },
      asset: {
        select: { assetUid: true, name: true }
      }
    },
    orderBy: { scheduledDate: 'desc' }
  });

  // Transform data for CSV
  const csvData = audits.map(audit => ({
    'Audit ID': audit.id.substring(0, 8),
    'Location': audit.location || 'All Locations',
    'Asset': audit.asset ? `${audit.asset.assetUid} - ${audit.asset.name}` : 'All Assets',
    'Status': audit.status,
    'Scheduled Date': new Date(audit.scheduledDate).toLocaleDateString(),
    'Completed Date': audit.completedDate ? new Date(audit.completedDate).toLocaleDateString() : 'N/A',
    'Auditor': audit.auditor.name,
    'Total Assets': audit.totalAssets || 0,
    'Assets Scanned': audit.assetsScanned || 0,
    'Discrepancies': audit.discrepancies || 0,
    'Notes': audit.notes || 'N/A'
  }));

  // Convert to CSV
  const parser = new Parser();
  const csv = parser.parse(csvData);

  // Set headers for file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=audits-export-${Date.now()}.csv`);
  
  res.send(csv);
});

/**
 * @desc    Generate PDF audit report
 * @route   GET /api/reports/audit/:id/pdf
 * @access  Private
 */
export const generateAuditPDF = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Fetch audit with all related data
  const audit = await prisma.audit.findUnique({
    where: { id },
    include: {
      auditor: {
        select: { name: true, email: true, role: true }
      },
      asset: {
        select: { assetUid: true, name: true, location: true }
      }
    }
  });

  if (!audit) {
    return sendError(res, 'Audit not found', 404);
  }

  // Get audit activities
  const activities = await prisma.activity.findMany({
    where: {
      entityType: 'audit',
      entityId: id
    },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename=audit-report-${audit.id.substring(0, 8)}.pdf`);

  // Pipe PDF to response
  doc.pipe(res);

  // Add header
  doc.fontSize(20).text('Audit Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);

  // Add audit details
  doc.fontSize(14).text('Audit Information', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text(`Audit ID: ${audit.id.substring(0, 8)}`);
  doc.text(`Location: ${audit.location || 'All Locations'}`);
  doc.text(`Asset: ${audit.asset ? `${audit.asset.assetUid} - ${audit.asset.name}` : 'All Assets'}`);
  doc.text(`Status: ${audit.status}`);
  doc.text(`Scheduled Date: ${new Date(audit.scheduledDate).toLocaleDateString()}`);
  doc.text(`Completed Date: ${audit.completedDate ? new Date(audit.completedDate).toLocaleDateString() : 'Not completed'}`);
  doc.text(`Auditor: ${audit.auditor.name} (${audit.auditor.email})`);
  doc.moveDown(2);

  // Add progress section
  doc.fontSize(14).text('Progress', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text(`Total Assets: ${audit.totalAssets || 0}`);
  doc.text(`Assets Scanned: ${audit.assetsScanned || 0}`);
  const completion = audit.totalAssets > 0 ? Math.round((audit.assetsScanned / audit.totalAssets) * 100) : 0;
  doc.text(`Completion: ${completion}%`);
  doc.text(`Discrepancies Found: ${audit.discrepancies || 0}`);
  doc.moveDown(2);

  // Add notes section
  if (audit.notes) {
    doc.fontSize(14).text('Notes', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(audit.notes, { align: 'justify' });
    doc.moveDown(2);
  }

  // Add activity log
  if (activities.length > 0) {
    doc.addPage();
    doc.fontSize(14).text('Activity Log', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(9);
    
    activities.forEach((activity, index) => {
      doc.text(`${index + 1}. ${activity.action} by ${activity.user.name} - ${new Date(activity.createdAt).toLocaleString()}`);
      if (activity.details) {
        doc.text(`   ${activity.details}`, { indent: 20 });
      }
      doc.moveDown(0.3);
    });
  }

  // Add footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).text(
      `Page ${i + 1} of ${pageCount}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }

  // Finalize PDF
  doc.end();
});

/**
 * @desc    Get asset history report
 * @route   GET /api/reports/asset/:id/history
 * @access  Private
 */
export const getAssetHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if asset exists
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: { name: true, email: true }
      },
      assignedTo: {
        select: { name: true, email: true }
      }
    }
  });

  if (!asset) {
    return sendError(res, 'Asset not found', 404);
  }

  // Get all movements for this asset
  const movements = await prisma.movement.findMany({
    where: { assetId: id },
    include: {
      requestedBy: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get all audits that included this asset
  const audits = await prisma.audit.findMany({
    where: { assetId: id },
    include: {
      auditor: {
        select: { name: true }
      }
    },
    orderBy: { scheduledDate: 'desc' }
  });

  // Get all activities for this asset
  const activities = await prisma.activity.findMany({
    where: {
      entityType: 'asset',
      entityId: id
    },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Get all files for this asset
  const files = await prisma.assetFile.findMany({
    where: { assetId: id },
    include: {
      uploadedBy: {
        select: { name: true }
      }
    },
    orderBy: { uploadedAt: 'desc' }
  });

  const history = {
    asset: {
      id: asset.id,
      assetUid: asset.assetUid,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      criticality: asset.criticality,
      location: asset.location,
      purchaseDate: asset.purchaseDate,
      warrantyExpiry: asset.warrantyExpiry,
      make: asset.make,
      model: asset.model,
      serialNumber: asset.serialNumber,
      ownerDepartment: asset.ownerDepartment,
      createdBy: asset.createdBy,
      assignedTo: asset.assignedTo,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    },
    movements: movements.map(m => ({
      id: m.id,
      fromLocation: m.fromLocation,
      toLocation: m.toLocation,
      status: m.status,
      requestedBy: m.requestedBy.name,
      requestDate: m.requestDate,
      approvalDate: m.approvalDate,
      dispatchedAt: m.dispatchedAt,
      receivedAt: m.receivedAt
    })),
    audits: audits.map(a => ({
      id: a.id,
      location: a.location,
      status: a.status,
      auditor: a.auditor.name,
      scheduledDate: a.scheduledDate,
      completedDate: a.completedDate,
      notes: a.notes
    })),
    activities: activities.map(a => ({
      id: a.id,
      action: a.action,
      user: a.user.name,
      details: a.details,
      createdAt: a.createdAt
    })),
    files: files.map(f => ({
      id: f.id,
      fileName: f.fileName,
      fileType: f.fileType,
      uploadedBy: f.uploadedBy.name,
      uploadedAt: f.uploadedAt
    })),
    statistics: {
      totalMovements: movements.length,
      completedMovements: movements.filter(m => m.status === 'COMPLETED').length,
      totalAudits: audits.length,
      completedAudits: audits.filter(a => a.status === 'COMPLETED').length,
      totalFiles: files.length,
      totalActivities: activities.length
    }
  };

  return sendSuccess(res, history, 'Asset history retrieved successfully');
});
