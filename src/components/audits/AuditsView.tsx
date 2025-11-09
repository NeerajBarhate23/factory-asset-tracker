import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Calendar, Plus, QrCode, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { Progress } from '../ui/progress';
import { useAudits } from '../../hooks/useAudits';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

export function AuditsView() {
  const { user } = useAuth();
  const { audits, loading, createAudit, startAudit, completeAudit } = useAudits();
  
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    location: '',
    category: '',
    scheduledDate: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Scheduled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Discrepancy Found':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const scheduledAudits = audits.filter((a) => a.status === 'Scheduled');
  const inProgressAudits = audits.filter((a) => a.status === 'In Progress');
  const completedAudits = audits.filter((a) => a.status === 'Completed' || a.status === 'Discrepancy Found');

  const handleScheduleAudit = async () => {
    if (!formData.location || !formData.category || !formData.scheduledDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const result = await createAudit({
      location: formData.location,
      category: formData.category,
      scheduled_date: formData.scheduledDate,
      status: 'Scheduled',
      assets_scanned: 0,
      total_assets: 0,
      discrepancies: 0,
    });

    if (result.success) {
      toast.success('Audit scheduled successfully');
      setShowScheduleDialog(false);
      setFormData({ location: '', category: '', scheduledDate: '' });
    } else {
      toast.error(result.error || 'Failed to schedule audit');
    }
  };

  const handleStartAudit = async (auditId: string) => {
    if (!user) return;
    
    const result = await startAudit(auditId, user.id);
    if (result.success) {
      toast.success('Audit started');
      setShowScanDialog(true);
      setSelectedAudit(auditId);
    } else {
      toast.error(result.error || 'Failed to start audit');
    }
  };

  const handleCompleteAudit = async (auditId: string) => {
    const result = await completeAudit(auditId);
    if (result.success) {
      toast.success('Audit completed');
      setShowScanDialog(false);
      setSelectedAudit(null);
    } else {
      toast.error(result.error || 'Failed to complete audit');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Audit Management</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and conduct asset verification audits
          </p>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)} className="min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Audit
        </Button>
      </div>

      {/* Schedule Audit Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule New Audit</DialogTitle>
            <DialogDescription>
              Configure a new cycle count audit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                placeholder="e.g., Production Floor A" 
                className="min-h-[44px]"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category" className="min-h-[44px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNC Machine">CNC Machine</SelectItem>
                  <SelectItem value="Tool Room SPM">Tool Room SPM</SelectItem>
                  <SelectItem value="Workstation">Workstation</SelectItem>
                  <SelectItem value="Material Handling Equipment">Material Handling Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Scheduled Date</Label>
              <Input 
                id="date" 
                type="date" 
                className="min-h-[44px]"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleAudit}>
              Schedule Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Asset Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Scan Asset</DialogTitle>
            <DialogDescription>
              Scan asset QR code to verify location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
              <QrCode className="h-24 w-24 text-muted-foreground" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Position QR code within the camera frame
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScanDialog(false)}>
              Cancel
            </Button>
            {selectedAudit && (
              <Button onClick={() => handleCompleteAudit(selectedAudit)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Audit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl">{scheduledAudits.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <QrCode className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl">{inProgressAudits.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl">{completedAudits.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Scheduled Audits */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3>Scheduled Audits</h3>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : scheduledAudits.length > 0 ? (
          <div className="space-y-4">
            {scheduledAudits.map((audit) => (
              <Card key={audit.id} className="p-4 border-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4>{audit.location}</h4>
                      <Badge variant="outline" className={getStatusColor(audit.status)}>
                        {audit.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="mt-0.5">{audit.category}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Scheduled Date</p>
                        <p className="mt-0.5">{new Date(audit.scheduled_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="min-h-[44px]"
                    onClick={() => handleStartAudit(audit.id)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Start Audit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No scheduled audits</p>
          </div>
        )}
      </Card>

      {/* In Progress Audits */}
      {inProgressAudits.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4">Audits In Progress</h3>
          <div className="space-y-4">
            {inProgressAudits.map((audit) => (
              <Card key={audit.id} className="p-4 border-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4>{audit.location}</h4>
                      <Badge variant="outline" className={getStatusColor(audit.status)}>
                        {audit.status}
                      </Badge>
                    </div>
                    <Progress 
                      value={audit.total_assets > 0 ? (audit.assets_scanned / audit.total_assets) * 100 : 0} 
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {audit.assets_scanned} of {audit.total_assets} assets scanned
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="min-h-[44px]"
                      onClick={() => {
                        setSelectedAudit(audit.id);
                        setShowScanDialog(true);
                      }}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Continue Scanning
                    </Button>
                    <Button 
                      className="min-h-[44px]"
                      onClick={() => handleCompleteAudit(audit.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Completed Audits */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3>Completed Audits</h3>
          <Button variant="outline" className="min-h-[44px]">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
        {completedAudits.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Location</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Assets Scanned</TableHead>
                  <TableHead>Discrepancies</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedAudits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>{audit.location}</TableCell>
                    <TableCell>{audit.category}</TableCell>
                    <TableCell>
                      {audit.completed_date 
                        ? new Date(audit.completed_date).toLocaleDateString() 
                        : '-'}
                    </TableCell>
                    <TableCell>{audit.assets_scanned}</TableCell>
                    <TableCell>
                      {audit.discrepancies > 0 ? (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {audit.discrepancies}
                        </span>
                      ) : (
                        audit.discrepancies
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(audit.status)}>
                        {audit.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No completed audits</p>
          </div>
        )}
      </Card>
    </div>
  );
}
