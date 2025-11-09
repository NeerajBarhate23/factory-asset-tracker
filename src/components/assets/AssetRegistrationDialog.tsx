import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAssets } from '../../hooks/useAssets';
import { QRCodeDisplay } from './QRCodeDisplay';

interface AssetRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetRegistrationDialog({ open, onOpenChange }: AssetRegistrationDialogProps) {
  const { createAsset } = useAssets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdAsset, setCreatedAsset] = useState<{ uid: string; name: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    asset_uid: '',
    name: '',
    category: '',
    status: 'active',
    location: '',
    criticality: 'medium',
    owner_department: '',
    make: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    warranty_expiry: '',
    last_maintenance_date: '',
    next_maintenance_date: '',
    assigned_to: '',
    specifications: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Category mapping between database values and display values
  const categoryMap = {
    'tool_room_spm': 'Tool Room SPM',
    'cnc_machine': 'CNC Machine',
    'workstation': 'Workstation',
    'material_handling': 'Material Handling Equipment',
  };

  const statusMap = {
    'active': 'Active',
    'maintenance': 'Under Maintenance',
    'inactive': 'Inactive',
    'retired': 'Retired',
  };

  const criticalityMap = {
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.asset_uid.trim()) {
      newErrors.asset_uid = 'Asset UID is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare data for submission (remove empty strings, convert enums to uppercase)
      const dataToSubmit: any = {
        asset_uid: formData.asset_uid,
        name: formData.name,
        category: formData.category.toUpperCase(),
        status: formData.status.toUpperCase(),
        location: formData.location,
        criticality: formData.criticality.toUpperCase(),
      };

      // Add optional fields only if they have values
      if (formData.owner_department) dataToSubmit.owner_department = formData.owner_department;
      if (formData.make) dataToSubmit.make = formData.make;
      if (formData.model) dataToSubmit.model = formData.model;
      if (formData.serial_number) dataToSubmit.serial_number = formData.serial_number;
      if (formData.purchase_date) dataToSubmit.purchase_date = formData.purchase_date;
      if (formData.warranty_expiry) dataToSubmit.warranty_expiry = formData.warranty_expiry;
      if (formData.last_maintenance_date) dataToSubmit.last_maintenance_date = formData.last_maintenance_date;
      if (formData.next_maintenance_date) dataToSubmit.next_maintenance_date = formData.next_maintenance_date;
      if (formData.assigned_to) dataToSubmit.assigned_to = formData.assigned_to;
      if (formData.specifications) dataToSubmit.specifications = formData.specifications;
      if (formData.notes) dataToSubmit.notes = formData.notes;

      await createAsset(dataToSubmit);

      setCreatedAsset({
        uid: formData.asset_uid,
        name: formData.name,
      });
      setShowSuccess(true);
      toast.success('Asset registered successfully!');
    } catch (error) {
      console.error('Error creating asset:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      asset_uid: '',
      name: '',
      category: '',
      status: 'active',
      location: '',
      criticality: 'medium',
      owner_department: '',
      make: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_expiry: '',
      last_maintenance_date: '',
      next_maintenance_date: '',
      assigned_to: '',
      specifications: '',
      notes: '',
    });
    setErrors({});
    setShowSuccess(false);
    setCreatedAsset(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleRegisterAnother = () => {
    handleReset();
  };

  if (showSuccess && createdAsset) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Asset Registered Successfully
            </DialogTitle>
            <DialogDescription>
              The asset has been registered and is now available in the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Asset UID</p>
                <code className="text-lg bg-muted px-3 py-1 rounded">{createdAsset.uid}</code>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Asset Name</p>
                <p>{createdAsset.name}</p>
              </div>
            </div>
            
            <div className="flex justify-center pt-2">
              <QRCodeDisplay 
                assetUid={createdAsset.uid}
                assetName={createdAsset.name}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleRegisterAnother} className="w-full sm:w-auto">
              Register Another Asset
            </Button>
            <Button onClick={handleClose} className="w-full sm:w-auto">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Asset</DialogTitle>
          <DialogDescription>
            Enter the details of the new asset. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm text-muted-foreground">Basic Information</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset_uid">
                  Asset UID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="asset_uid"
                  placeholder="e.g., SPM-001"
                  value={formData.asset_uid}
                  onChange={(e) => setFormData({ ...formData, asset_uid: e.target.value })}
                  className={errors.asset_uid ? 'border-destructive' : ''}
                />
                {errors.asset_uid && (
                  <p className="text-sm text-destructive">{errors.asset_uid}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Asset Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Drilling SPM Unit A1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category" className={errors.category ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryMap).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusMap).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="criticality">Criticality</Label>
                <Select
                  value={formData.criticality}
                  onValueChange={(value) => setFormData({ ...formData, criticality: value })}
                >
                  <SelectTrigger id="criticality">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(criticalityMap).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner_department">Owner Department</Label>
                <Input
                  id="owner_department"
                  placeholder="e.g., Production"
                  value={formData.owner_department}
                  onChange={(e) => setFormData({ ...formData, owner_department: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Current Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., Tool Room - Bay 1"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={errors.location ? 'border-destructive' : ''}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>
          </div>

          {/* Equipment Details */}
          <div className="space-y-4">
            <h4 className="text-sm text-muted-foreground">Equipment Details</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  placeholder="e.g., Makino"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., V55"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input
                  id="serial_number"
                  placeholder="e.g., MKN-2023-001"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h4 className="text-sm text-muted-foreground">Dates & Maintenance</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                <Input
                  id="warranty_expiry"
                  type="date"
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_maintenance_date">Last Maintenance Date</Label>
                <Input
                  id="last_maintenance_date"
                  type="date"
                  value={formData.last_maintenance_date}
                  onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_maintenance_date">Next Maintenance Date</Label>
                <Input
                  id="next_maintenance_date"
                  type="date"
                  value={formData.next_maintenance_date}
                  onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h4 className="text-sm text-muted-foreground">Additional Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="specifications">Specifications</Label>
              <Textarea
                id="specifications"
                placeholder="Enter technical specifications..."
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Asset'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
