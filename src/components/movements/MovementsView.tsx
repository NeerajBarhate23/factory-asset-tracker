import { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, Clock, CheckCircle, XCircle, QrCode, Camera, Keyboard } from 'lucide-react';
import { Progress } from '../ui/progress';
import { useMovements } from '../../hooks/useMovements';
import { useAssets } from '../../hooks/useAssets';
import { useLocations } from '../../hooks/useLocations';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

export function MovementsView() {
  const { user } = useAuth();
  const { movements, loading, createMovement, approveMovement, rejectMovement, dispatchMovement, completeMovement } = useMovements();
  const { assets, refetch: refetchAssets } = useAssets();
  const { locations } = useLocations();
  
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<string | null>(null);
  const [showDispatchScanner, setShowDispatchScanner] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [scanningMovement, setScanningMovement] = useState<any>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [useCameraMode, setUseCameraMode] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    assetId: '',
    toLocation: '',  // Changed from toLocationId to toLocation (TEXT)
    reason: '',
  });

  const pendingMovements = movements.filter((m) => m.status === 'Pending');
  const approvedMovements = movements.filter((m) => m.status === 'Approved');
  const inTransitMovements = movements.filter((m) => m.status === 'In Transit');
  const completedMovements = movements.filter((m) => m.status === 'Completed');

  // Debug logging
  console.log('🔍 [MovementsView] Total movements:', movements.length);
  console.log('📊 [MovementsView] Movement counts:', {
    pending: pendingMovements.length,
    approved: approvedMovements.length,
    inTransit: inTransitMovements.length,
    completed: completedMovements.length,
  });
  console.log('📦 [MovementsView] Sample movement:', movements[0]);
  console.log('🔍 [MovementsView] Movement statuses:', movements.map(m => m.status));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSLAProgress = (movement: any) => {
    // Backend returns createdAt, not request_date
    const requestDate = new Date(movement.createdAt || movement.request_date);
    const now = new Date();
    const elapsedHours = (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60);
    const slaHours = movement.slaHours || movement.sla_hours || 24;
    const percentage = Math.min((elapsedHours / slaHours) * 100, 100);
    return percentage;
  };

  // Helper to get movement fields (supports both snake_case and camelCase)
  const getField = (obj: any, snakeCase: string, camelCase: string) => {
    return obj[camelCase] !== undefined ? obj[camelCase] : obj[snakeCase];
  };

  const handleSubmitRequest = async () => {
    if (!formData.assetId || !formData.toLocation || !formData.reason || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if assets are loaded
    if (!assets || assets.length === 0) {
      toast.error('Assets are still loading. Please wait and try again.');
      return;
    }

    console.log('Looking for asset ID:', formData.assetId);
    console.log('Available assets:', assets.map((a: any) => ({ id: a.id, name: a.name })));

    const asset = assets.find((a: any) => a.id === formData.assetId);
    if (!asset) {
      console.error('Asset not found. Form data:', formData);
      console.error('All assets:', assets);
      toast.error('Asset not found. Please try selecting the asset again.');
      return;
    }

    // Check if asset has current_location
    if (!asset.current_location) {
      toast.error('Selected asset does not have a location set');
      return;
    }

    console.log('Submitting movement with asset:', asset);

    const result = await createMovement({
      asset_id: formData.assetId,
      from_location: asset.current_location,  // TEXT field
      to_location: formData.toLocation,        // TEXT field
      reason: formData.reason,
    });

    if (result.success) {
      toast.success('Movement request submitted successfully');
      setShowRequestDialog(false);
      setFormData({ assetId: '', toLocation: '', reason: '' });
    } else {
      toast.error(result.error || 'Failed to submit movement request');
    }
  };

  const handleApprove = async (movementId: string) => {
    if (!user) return;
    
    const result = await approveMovement(movementId, user.id);
    if (result.success) {
      toast.success('Movement request approved');
      setShowApprovalDialog(false);
      setSelectedMovement(null);
    } else {
      toast.error(result.error || 'Failed to approve movement');
    }
  };

  const handleReject = async (movementId: string) => {
    if (!user) return;
    
    const result = await rejectMovement(movementId, user.id, 'Rejected by manager');
    if (result.success) {
      toast.success('Movement request rejected');
      setShowApprovalDialog(false);
      setSelectedMovement(null);
    } else {
      toast.error(result.error || 'Failed to reject movement');
    }
  };

  const handleDispatch = async (movementId: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement) return;
    
    setScanningMovement(movement);
    setScannedCode('');
    setShowDispatchScanner(true);
  };

  const handleComplete = async (movementId: string) => {
    const movement = movements.find(m => m.id === movementId);
    if (!movement) return;
    
    setScanningMovement(movement);
    setScannedCode('');
    setShowReceiptScanner(true);
  };

  const extractAssetFromScannedCode = (scannedValue: string) => {
    // Check if scanned value is a URL with asset_id parameter
    try {
      const url = new URL(scannedValue);
      const assetIdParam = url.searchParams.get('asset_id');
      if (assetIdParam) {
        // Find asset by ID
        return assets.find(a => a.id === assetIdParam);
      }
    } catch {
      // Not a URL, treat as plain text (asset_uid or asset_tag)
    }
    
    // Try to find asset by UID or tag
    return assets.find(a => 
      a.asset_uid === scannedValue.trim() || 
      (a as any).asset_tag === scannedValue.trim()
    );
  };

  const confirmDispatch = async () => {
    if (!user || !scanningMovement) return;
    
    // Get the expected asset for this movement
    const expectedAsset = assets.find(a => a.id === scanningMovement.asset_id);
    if (!expectedAsset) {
      toast.error('Asset not found for this movement');
      return;
    }
    
    // Get the asset from scanned code (handles both URL and plain UID)
    const scannedAsset = extractAssetFromScannedCode(scannedCode);
    
    // Verify scanned asset matches expected asset
    if (!scannedAsset || scannedAsset.id !== expectedAsset.id) {
      const expectedCode = expectedAsset.asset_uid || (expectedAsset as any).asset_tag;
      toast.error(`QR code mismatch! Expected asset: ${expectedAsset.name} (${expectedCode})`);
      return;
    }
    
    const result = await dispatchMovement(scanningMovement.id);
    if (result.success) {
      toast.success('Asset dispatched successfully');
      setShowDispatchScanner(false);
      setScanningMovement(null);
      setScannedCode('');
    } else {
      toast.error(result.error || 'Failed to dispatch asset');
    }
  };

  const confirmReceipt = async () => {
    if (!user || !scanningMovement) return;
    
    // Get the expected asset for this movement
    const expectedAsset = assets.find(a => a.id === scanningMovement.asset_id);
    if (!expectedAsset) {
      toast.error('Asset not found for this movement');
      return;
    }
    
    // Get the asset from scanned code (handles both URL and plain UID)
    const scannedAsset = extractAssetFromScannedCode(scannedCode);
    
    // Verify scanned asset matches expected asset
    if (!scannedAsset || scannedAsset.id !== expectedAsset.id) {
      const expectedCode = expectedAsset.asset_uid || (expectedAsset as any).asset_tag;
      toast.error(`QR code mismatch! Expected asset: ${expectedAsset.name} (${expectedCode})`);
      return;
    }
    
    const result = await completeMovement(scanningMovement.id);
    if (result.success) {
      toast.success('Movement completed successfully');
      setShowReceiptScanner(false);
      setScanningMovement(null);
      setScannedCode('');
      // Refresh assets to show updated location
      await refetchAssets();
    } else {
      toast.error(result.error || 'Failed to complete movement');
    }
  };

  // Get asset name by id
  const getAssetName = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) return asset.name;
    // Fallback: check if movement has embedded asset data from backend
    const movement = movements.find(m => m.asset_id === assetId);
    return movement?.asset?.name || 'Unknown Asset';
  };

  // Get asset UID by id
  const getAssetUID = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) return asset.asset_tag || asset.asset_uid;
    // Fallback: check if movement has embedded asset data from backend
    const movement = movements.find(m => m.asset_id === assetId);
    return movement?.asset?.asset_tag || '';
  };

  // Get location name by id
  const getLocationName = (locationId: string | undefined) => {
    if (!locationId) return 'Unknown Location';
    const location = locations.find((l) => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const selectedMovementData = movements.find((m) => m.id === selectedMovement);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Asset Movements</h1>
          <p className="text-muted-foreground mt-1">
            Manage movement requests and track asset transfers
          </p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)} className="min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          New Movement Request
        </Button>
      </div>

      {/* Movement Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>New Movement Request</DialogTitle>
            <DialogDescription>
              Submit a request to move an asset to a new location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Select Asset</Label>
              <Select 
                value={formData.assetId} 
                onValueChange={(value) => setFormData({ ...formData, assetId: value })}
              >
                <SelectTrigger id="asset" className="min-h-[44px]">
                  <SelectValue placeholder="Choose an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} ({asset.asset_tag || asset.asset_uid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from">Current Location</Label>
              <Input 
                id="from"
                value={assets.find((a) => a.id === formData.assetId)?.current_location || ''}
                disabled
                placeholder="Select an asset first"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Location</Label>
              <Input 
                id="to"
                value={formData.toLocation}
                onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}
                placeholder="Enter destination location (e.g., Bay 3, Tool Room B)"
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Movement</Label>
              <Textarea 
                id="reason" 
                placeholder="Explain why this asset needs to be moved" 
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Movement Request</DialogTitle>
            <DialogDescription>
              Approve or reject the movement request
            </DialogDescription>
          </DialogHeader>
          {selectedMovementData && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Asset</p>
                  <p className="mt-1">{getAssetName(selectedMovementData.assetId || selectedMovementData.asset_id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">UID</p>
                  <p className="mt-1">{getAssetUID(selectedMovementData.assetId || selectedMovementData.asset_id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">From</p>
                  <p className="mt-1">{selectedMovementData.from_location || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">To</p>
                  <p className="mt-1">{selectedMovementData.to_location || 'Unknown'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="mt-1 text-sm">{selectedMovementData.reason}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            {selectedMovement && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedMovement)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => handleApprove(selectedMovement)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-grid">
          <TabsTrigger value="pending">
            Pending ({pendingMovements.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedMovements.length})
          </TabsTrigger>
          <TabsTrigger value="transit">
            In Transit ({inTransitMovements.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedMovements.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending">
          <Card className="p-6">
            <h3 className="mb-4">Pending Approval Requests</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : pendingMovements.length > 0 ? (
              <div className="space-y-4">
                {pendingMovements.map((movement) => {
                  const slaProgress = getSLAProgress(movement);
                  const assetId = movement.asset_id;
                  const fromLoc = movement.from_location || 'Unknown';
                  const toLoc = movement.to_location || 'Unknown';
                  const reqDate = movement.created_at || movement.createdAt;
                  const slaHrs = 24;
                  
                  return (
                    <Card key={movement.id} className="p-4 border-2">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4>{getAssetName(assetId)}</h4>
                            <Badge variant="outline" className={getStatusColor(movement.status)}>
                              {movement.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-3">
                            <div>
                              <p className="text-muted-foreground">From</p>
                              <p className="mt-0.5">{fromLoc}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">To</p>
                              <p className="mt-0.5">{toLoc}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Request Date</p>
                              <p className="mt-0.5">
                                {new Date(reqDate).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm text-muted-foreground mb-1">SLA Timer</p>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={slaProgress}
                                className="flex-1"
                              />
                              <span className="text-sm whitespace-nowrap">
                                {slaHrs}h SLA
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 lg:flex-col">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedMovement(movement.id);
                              setShowApprovalDialog(true);
                            }}
                            className="flex-1 lg:flex-none min-h-[44px]"
                          >
                            Review
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedMovement(movement.id);
                              setShowApprovalDialog(true);
                            }}
                            className="flex-1 lg:flex-none min-h-[44px]"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending movement requests</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Approved - Ready for Dispatch */}
        <TabsContent value="approved">
          <Card className="p-6">
            <h3 className="mb-4">Approved - Ready for Dispatch</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : approvedMovements.length > 0 ? (
              <div className="space-y-4">
                {approvedMovements.map((movement) => {
                  const assetId = movement.assetId || movement.asset_id;
                  const fromLoc = movement.fromLocation || movement.from_location;
                  const toLoc = movement.toLocation || movement.to_location;
                  const approvalDate = movement.approvedAt || movement.approval_date;
                  
                  return (
                  <Card key={movement.id} className="p-4 border-2">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4>{getAssetName(assetId)}</h4>
                          <Badge variant="outline" className={getStatusColor(movement.status)}>
                            {movement.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground">From</p>
                            <p className="mt-0.5">{fromLoc}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">To</p>
                            <p className="mt-0.5">{toLoc}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Approved Date</p>
                            <p className="mt-0.5">
                              {approvalDate
                                ? new Date(approvalDate).toLocaleString()
                                : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button className="min-h-[44px]" onClick={() => handleDispatch(movement.id)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Scan for Dispatch
                      </Button>
                    </div>
                  </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No approved movements ready for dispatch</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* In Transit */}
        <TabsContent value="transit">
          <Card className="p-6">
            <h3 className="mb-4">In Transit - Awaiting Receipt</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : inTransitMovements.length > 0 ? (
              <div className="space-y-4">
                {inTransitMovements.map((movement) => {
                  const assetId = movement.assetId || movement.asset_id;
                  const fromLoc = movement.fromLocation || movement.from_location;
                  const toLoc = movement.toLocation || movement.to_location;
                  const dispatchedAt = movement.dispatchedAt || movement.dispatched_at;
                  
                  return (
                  <Card key={movement.id} className="p-4 border-2">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4>{getAssetName(assetId)}</h4>
                          <Badge variant="outline" className={getStatusColor(movement.status)}>
                            {movement.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mt-3">
                          <div>
                            <p className="text-muted-foreground">From</p>
                            <p className="mt-0.5">{fromLoc}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">To</p>
                            <p className="mt-0.5">{toLoc}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Dispatched At</p>
                            <p className="mt-0.5">
                              {dispatchedAt
                                ? new Date(dispatchedAt).toLocaleString()
                                : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button className="min-h-[44px]" onClick={() => handleComplete(movement.id)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Scan for Receipt
                      </Button>
                    </div>
                  </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No movements currently in transit</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed">
          <Card className="p-6">
            <h3 className="mb-4">Completed Movements</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : completedMovements.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Asset</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Completed At</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedMovements.map((movement) => {
                      const assetId = movement.asset_id;
                      const fromLoc = movement.from_location || 'Unknown';
                      const toLoc = movement.to_location || 'Unknown';
                      const completedAt = movement.received_at || movement.updated_at;
                      
                      return (
                      <TableRow key={movement.id}>
                        <TableCell>{getAssetName(assetId)}</TableCell>
                        <TableCell>{fromLoc}</TableCell>
                        <TableCell>{toLoc}</TableCell>
                        <TableCell>
                          {completedAt
                            ? new Date(completedAt).toLocaleString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(movement.status)}>
                            {movement.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No completed movements</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dispatch Scanner Dialog */}
      <Dialog open={showDispatchScanner} onOpenChange={setShowDispatchScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Asset for Dispatch</DialogTitle>
            <DialogDescription>
              Scan the asset's QR code to verify and dispatch the movement
            </DialogDescription>
          </DialogHeader>
          
          {scanningMovement && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Movement Details:</p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Asset:</span>{' '}
                  {assets.find(a => a.id === scanningMovement.asset_id)?.name || 'Unknown'}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Expected Code:</span>{' '}
                  {assets.find(a => a.id === scanningMovement.asset_id)?.asset_uid || 
                   assets.find(a => a.id === scanningMovement.asset_id)?.asset_tag || 'N/A'}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">From:</span> {scanningMovement.from_location}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">To:</span> {scanningMovement.to_location}
                </p>
              </div>

              {/* Input Method Toggle */}
              <div className="flex gap-2 p-2 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={!useCameraMode ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setUseCameraMode(false)}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
                <Button
                  type="button"
                  variant={useCameraMode ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setUseCameraMode(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Scan QR Code
                </Button>
              </div>

              {useCameraMode ? (
                <div className="space-y-3">
                  <div className="w-full bg-black rounded-lg overflow-hidden">
                    <QrScanner
                      delay={300}
                      onError={(error: any) => {
                        console.error('QR Scanner Error:', error);
                        toast.error('Camera access denied or unavailable. Please use Manual Entry mode.');
                        setUseCameraMode(false);
                      }}
                      onScan={(result: any) => {
                        if (result?.text) {
                          setScannedCode(result.text);
                          setUseCameraMode(false);
                          toast.success(`Scanned: ${result.text}`);
                        }
                      }}
                      constraints={{
                        video: { facingMode: 'environment' }
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Position the QR code within the camera view. Code will be detected automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="dispatch-scan">Enter Asset UID / Scan with Barcode Scanner</Label>
                  <Input
                    id="dispatch-scan"
                    placeholder="Type or scan asset UID (e.g., SPM-001)..."
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    autoFocus
                    className="font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && scannedCode.trim()) {
                        confirmDispatch();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Use a USB barcode scanner to scan directly into this field
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDispatchScanner(false);
                setScanningMovement(null);
                setScannedCode('');
                setUseCameraMode(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDispatch}
              disabled={!scannedCode.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Dispatch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Scanner Dialog */}
      <Dialog open={showReceiptScanner} onOpenChange={setShowReceiptScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Asset for Receipt</DialogTitle>
            <DialogDescription>
              Scan the asset's QR code to verify and complete the movement
            </DialogDescription>
          </DialogHeader>
          
          {scanningMovement && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Movement Details:</p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Asset:</span>{' '}
                  {assets.find(a => a.id === scanningMovement.asset_id)?.name || 'Unknown'}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Expected Code:</span>{' '}
                  {assets.find(a => a.id === scanningMovement.asset_id)?.asset_uid || 
                   assets.find(a => a.id === scanningMovement.asset_id)?.asset_tag || 'N/A'}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">From:</span> {scanningMovement.from_location}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">To:</span> {scanningMovement.to_location}
                </p>
              </div>

              {/* Input Method Toggle */}
              <div className="flex gap-2 p-2 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={!useCameraMode ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setUseCameraMode(false)}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Manual Entry
                </Button>
                <Button
                  type="button"
                  variant={useCameraMode ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setUseCameraMode(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Scan QR Code
                </Button>
              </div>

              {useCameraMode ? (
                <div className="space-y-3">
                  <div className="w-full bg-black rounded-lg overflow-hidden">
                    <QrScanner
                      delay={300}
                      onError={(error: any) => {
                        console.error('QR Scanner Error:', error);
                        toast.error('Camera access denied or unavailable. Please use Manual Entry mode.');
                        setUseCameraMode(false);
                      }}
                      onScan={(result: any) => {
                        if (result?.text) {
                          setScannedCode(result.text);
                          setUseCameraMode(false);
                          toast.success(`Scanned: ${result.text}`);
                        }
                      }}
                      constraints={{
                        video: { facingMode: 'environment' }
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Position the QR code within the camera view. Code will be detected automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="receipt-scan">Enter Asset UID / Scan with Barcode Scanner</Label>
                  <Input
                    id="receipt-scan"
                    placeholder="Type or scan asset UID (e.g., SPM-001)..."
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    autoFocus
                    className="font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && scannedCode.trim()) {
                        confirmReceipt();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Use a USB barcode scanner to scan directly into this field
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReceiptScanner(false);
                setScanningMovement(null);
                setScannedCode('');
                setUseCameraMode(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReceipt}
              disabled={!scannedCode.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
