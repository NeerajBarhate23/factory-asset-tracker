import { useState, useEffect } from 'react';
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
import { Plus, Clock, CheckCircle, XCircle, QrCode } from 'lucide-react';
import { Progress } from '../ui/progress';
import { useMovements } from '../../hooks/useMovements';
import { useAssets } from '../../hooks/useAssets';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

export function MovementsView() {
  const { user } = useAuth();
  const { movements, loading, createMovement, approveMovement, rejectMovement } = useMovements();
  const { assets } = useAssets();
  
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    assetId: '',
    toLocation: '',
    reason: '',
  });

  const pendingMovements = movements.filter((m) => m.status === 'PENDING');
  const approvedMovements = movements.filter((m) => m.status === 'APPROVED');
  const inTransitMovements = movements.filter((m) => m.status === 'IN_TRANSIT');
  const completedMovements = movements.filter((m) => m.status === 'COMPLETED');

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

    // Check if asset has location
    if (!asset.location) {
      toast.error('Selected asset does not have a location set');
      return;
    }

    console.log('Submitting movement with asset:', asset);

    const result = await createMovement({
      asset_id: formData.assetId,
      from_location: asset.location,
      to_location: formData.toLocation,
      requested_by: user.id,
      status: 'Pending',
      reason: formData.reason,
      sla_hours: 24,
      request_date: new Date().toISOString(),
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

  // Get asset name by id
  const getAssetName = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) return asset.name;
    // Fallback: check if movement has embedded asset data from backend
    const movement = movements.find(m => m.assetId === assetId);
    return movement?.asset?.name || 'Unknown Asset';
  };

  // Get asset UID by id
  const getAssetUID = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) return asset.asset_uid;
    // Fallback: check if movement has embedded asset data from backend
    const movement = movements.find(m => m.assetId === assetId);
    return movement?.asset?.assetUid || '';
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
                      {asset.name} ({asset.asset_uid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="from">Current Location</Label>
              <Select value={assets.find((a) => a.id === formData.assetId)?.location || ''} disabled>
                <SelectTrigger id="from" className="min-h-[44px]">
                  <SelectValue placeholder="Select an asset first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={assets.find((a) => a.id === formData.assetId)?.location || 'none'}>
                    {assets.find((a) => a.id === formData.assetId)?.location || 'No location'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Location</Label>
              <Select 
                value={formData.toLocation} 
                onValueChange={(value) => setFormData({ ...formData, toLocation: value })}
              >
                <SelectTrigger id="to" className="min-h-[44px]">
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Production Floor A - Bay 1">Production Floor A - Bay 1</SelectItem>
                  <SelectItem value="Production Floor A - Bay 2">Production Floor A - Bay 2</SelectItem>
                  <SelectItem value="Production Floor A - Bay 3">Production Floor A - Bay 3</SelectItem>
                  <SelectItem value="Production Floor B - Bay 1">Production Floor B - Bay 1</SelectItem>
                  <SelectItem value="Production Floor B - Bay 5">Production Floor B - Bay 5</SelectItem>
                  <SelectItem value="Production Floor C">Production Floor C</SelectItem>
                  <SelectItem value="Warehouse - Zone A">Warehouse - Zone A</SelectItem>
                  <SelectItem value="Warehouse - Zone B">Warehouse - Zone B</SelectItem>
                  <SelectItem value="Tool Room - Section A">Tool Room - Section A</SelectItem>
                  <SelectItem value="Tool Room - Section B">Tool Room - Section B</SelectItem>
                  <SelectItem value="Tool Room - Section C">Tool Room - Section C</SelectItem>
                  <SelectItem value="Assembly Line 1">Assembly Line 1</SelectItem>
                  <SelectItem value="Assembly Line 2">Assembly Line 2</SelectItem>
                  <SelectItem value="Assembly Line 3">Assembly Line 3</SelectItem>
                  <SelectItem value="Maintenance Workshop">Maintenance Workshop</SelectItem>
                  <SelectItem value="Quality Control Lab">Quality Control Lab</SelectItem>
                  <SelectItem value="Shipping Dock">Shipping Dock</SelectItem>
                  <SelectItem value="Receiving Area">Receiving Area</SelectItem>
                </SelectContent>
              </Select>
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
                  <p className="mt-1">{selectedMovementData.fromLocation || selectedMovementData.from_location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">To</p>
                  <p className="mt-1">{selectedMovementData.toLocation || selectedMovementData.to_location}</p>
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
                  const assetId = movement.assetId || movement.asset_id;
                  const fromLoc = movement.fromLocation || movement.from_location;
                  const toLoc = movement.toLocation || movement.to_location;
                  const reqDate = movement.createdAt || movement.request_date;
                  const slaHrs = movement.slaHours || movement.sla_hours || 24;
                  
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
                      <Button className="min-h-[44px]">
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
                      <Button className="min-h-[44px]">
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
                      const assetId = movement.assetId || movement.asset_id;
                      const fromLoc = movement.fromLocation || movement.from_location;
                      const toLoc = movement.toLocation || movement.to_location;
                      const completedAt = movement.completedAt || movement.received_at;
                      
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
    </div>
  );
}
