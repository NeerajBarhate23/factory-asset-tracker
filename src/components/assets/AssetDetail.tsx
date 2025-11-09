import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ArrowLeft, Edit, QrCode, Download, FileText, Image as ImageIcon, Upload, Trash2, Eye } from 'lucide-react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { FileUploadDialog } from './FileUploadDialog';
import { useAsset } from '../../hooks/useAssets';
import { useMovements } from '../../hooks/useMovements';
import { useFiles } from '../../hooks/useFiles';
import { filesApi } from '../../lib/api-client';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface AssetDetailProps {
  assetId: string;
  onBack: () => void;
}

export function AssetDetail({ assetId, onBack }: AssetDetailProps) {
  const { asset, loading, error } = useAsset(assetId);
  const { movements } = useMovements({ assetId });
  const { files, loading: filesLoading, downloadFile, deleteFile } = useFiles(assetId);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading asset details...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-destructive">{error || 'Asset not found'}</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Under Maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMovementStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCriticalityColor = (criticality: string | null) => {
    switch (criticality) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1>{asset.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-muted px-2 py-1 rounded">{asset.asset_uid}</code>
              <Badge variant="outline" className={getStatusColor(asset.status)}>
                {asset.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <QRCodeDisplay 
            assetUid={asset.asset_uid}
            assetName={asset.name}
          />
          <Button className="min-h-[44px]">
            <Edit className="h-4 w-4 mr-2" />
            Edit Asset
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="movements" className="flex-1 sm:flex-none">Movement History</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 sm:flex-none">Documents & Photos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QR Code Preview */}
            <Card className="p-6 flex flex-col items-center justify-center">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mb-4 p-2 border-2 border-border">
                <QRCodeDisplay
                  assetUid={asset.asset_uid}
                  assetName={asset.name}
                  mode="url"
                  size={384}
                  showButton={false}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground mb-3">
                QR Code Preview
              </p>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </Card>

            {/* Asset Specifications */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="mb-4">Asset Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p>{asset.category || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant="outline" className={getStatusColor(asset.status)}>
                    {asset.status || '-'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Criticality</p>
                  <Badge variant="outline" className={getCriticalityColor(asset.criticality)}>
                    {asset.criticality || '-'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Owner Department</p>
                  <p>{asset.owner_department || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Location</p>
                  <p>{asset.current_location || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created Date</p>
                  <p>{asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Movement History Tab */}
        <TabsContent value="movements">
          <Card className="p-6">
            <h3 className="mb-4">Movement History</h3>
            {movements.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Request Date</TableHead>
                      <TableHead>From Location</TableHead>
                      <TableHead>To Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.request_date).toLocaleString()}
                        </TableCell>
                        <TableCell>{movement.from_location}</TableCell>
                        <TableCell>{movement.to_location}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getMovementStatusColor(movement.status)}>
                            {movement.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {movement.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No movement history available for this asset</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Documents & Photos Tab */}
        <TabsContent value="documents">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3>Documents & Photos</h3>
              <Button 
                className="min-h-[44px]"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>

            {/* Files list */}
            {filesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents or photos uploaded yet</p>
                <p className="text-sm mt-2">Upload equipment manuals, photos, or maintenance logs</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => {
                  const isImage = file.file_type?.startsWith('image/') || false;
                  const isPdf = file.file_type?.includes('pdf') || false;
                  const previewUrl = filesApi.getPreviewUrl(file.id);
                  
                  return (
                    <Card key={file.id} className="p-4">
                      <div className="flex flex-col gap-3">
                        {/* File preview/icon */}
                        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {isImage ? (
                            <img 
                              src={previewUrl} 
                              alt={file.file_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to icon if image fails to load
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center">
                              {isPdf ? (
                                <FileText className="h-12 w-12 text-red-500" />
                              ) : (
                                <FileText className="h-12 w-12 text-gray-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" title={file.file_name}>
                            {file.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(file.file_size / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={async () => {
                              try {
                                // Open preview in new tab
                                window.open(previewUrl, '_blank');
                              } catch (error) {
                                toast.error('Failed to preview file');
                              }
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => downloadFile(file)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this file?')) {
                                try {
                                  await deleteFile(file.id);
                                  toast.success('File deleted successfully');
                                } catch (error) {
                                  toast.error('Failed to delete file');
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      {asset && (
        <FileUploadDialog
          assetId={asset.id}
          assetName={asset.name}
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />
      )}
    </div>
  );
}
