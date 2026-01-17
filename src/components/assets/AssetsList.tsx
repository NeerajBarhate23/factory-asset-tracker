import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Search, Filter, Download, QrCode, ArrowUpDown, MoreHorizontal, Eye, Plus, RefreshCw } from 'lucide-react';
import { BulkQRCodeGenerator } from './BulkQRCodeGenerator';
import { AssetRegistrationDialog } from './AssetRegistrationDialog';
import { useAssets } from '../../hooks/useAssets';
import { toast } from 'sonner';

interface AssetsListProps {
  onViewAsset: (assetId: string) => void;
}

// Mapping between database values and display values
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

export function AssetsList({ onViewAsset }: AssetsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState<string | null>(null);
  const [selectedAssetForMovement, setSelectedAssetForMovement] = useState<string | null>(null);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Use the real backend hook
  const { assets, loading, error, refetch } = useAssets();

  // State for refresh loading
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Assets refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh assets');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Apply frontend filters
  const filteredAssets = assets.filter((asset: any) => {
    const locationName = asset.current_location || asset.location_name || asset.location?.name || '';
    const assetUid = asset.asset_uid || asset.asset_tag || '';
    const matchesSearch =
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assetUid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locationName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalize category for comparison (handle both formats)
    const assetCategory = asset.category?.toLowerCase().replace(/\s+/g, '_');
    const filterCategory = categoryFilter.toLowerCase().replace(/\s+/g, '_');
    const matchesCategory = categoryFilter === 'all' || assetCategory === filterCategory;
    
    // Normalize status for comparison (handle both formats)
    const assetStatus = asset.status?.toLowerCase().replace(/\s+/g, '_');
    const filterStatus = statusFilter.toLowerCase().replace(/\s+/g, '_');
    const matchesStatus = statusFilter === 'all' || assetStatus === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAssets.length === paginatedAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(paginatedAssets.map((a) => a.id));
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'retired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCriticalityColor = (criticality: string | null | undefined) => {
    switch (criticality) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handler for printing QR code
  const handlePrintQR = (assetId: string) => {
    setSelectedAssetForQR(assetId);
    // TODO: Open QR code dialog or trigger print
    toast.info('QR Code feature - Opening QR code for printing');
  };

  // Handler for requesting movement
  const handleRequestMovement = (assetId: string) => {
    toast.info('Redirecting to movements page...');
    // You can implement navigation to movements page with pre-selected asset
  };

  // Handler for editing asset
  const handleEditAsset = (assetId: string) => {
    setSelectedAssetForEdit(assetId);
    setRegistrationDialogOpen(true);
  };

  // Helper functions to display values
  const displayCategory = (category: string) => {
    return categoryMap[category as keyof typeof categoryMap] || category;
  };

  const displayStatus = (status: string) => {
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const displayCriticality = (criticality: string | null | undefined) => {
    if (!criticality) return 'N/A';
    return criticalityMap[criticality as keyof typeof criticalityMap] || criticality;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Assets</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all factory assets
            </p>
          </div>
        </div>
        <Card className="p-6">
          <div className="text-center py-12 text-destructive">
            <p>Error loading assets: {error.message}</p>
            <Button onClick={refetch} className="mt-4">Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading && assets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Assets</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all factory assets
            </p>
          </div>
        </div>
        <Card className="p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-muted-foreground">Loading assets...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Assets</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all factory assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="min-h-[44px]" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <BulkQRCodeGenerator assets={filteredAssets} />
          <Button className="min-h-[44px]" onClick={() => setRegistrationDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Register New Asset
          </Button>
        </div>
      </div>

      {/* Asset Registration Dialog */}
      <AssetRegistrationDialog
        open={registrationDialogOpen}
        onOpenChange={(open) => {
          setRegistrationDialogOpen(open);
          if (!open) setSelectedAssetForEdit(null);
        }}
        assetId={selectedAssetForEdit}
      />

      <Card className="p-6">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 min-h-[44px]"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full lg:w-[200px] min-h-[44px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="cnc_machine">CNC Machine</SelectItem>
              <SelectItem value="tool_room_spm">Tool Room SPM</SelectItem>
              <SelectItem value="workstation">Workstation</SelectItem>
              <SelectItem value="material_handling">Material Handling</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-[200px] min-h-[44px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Under Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedAssets.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-accent rounded-lg">
            <span className="text-sm">{selectedAssets.length} selected</span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" className="min-h-[44px]">
                <QrCode className="h-4 w-4 mr-2" />
                Print QR Tags
              </Button>
              <Button variant="outline" size="sm" className="min-h-[44px]">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading assets...</p>
          </div>
        ) : paginatedAssets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No assets found</p>
          </div>
        ) : (
          <>
            {/* Table - Desktop */}
            <div className="hidden md:block rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAssets.length === paginatedAssets.length && paginatedAssets.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all assets"
                      />
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                        Asset Name <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criticality</TableHead>
                    <TableHead>Owner Dept</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAssets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedAssets.includes(asset.id)}
                          onCheckedChange={() => toggleAssetSelection(asset.id)}
                          aria-label={`Select ${asset.name}`}
                        />
                      </TableCell>
                      <TableCell onClick={() => onViewAsset(asset.id)}>
                        <p>{asset.name}</p>
                      </TableCell>
                      <TableCell onClick={() => onViewAsset(asset.id)}>
                        <span className="text-sm">{displayCategory(asset.category)}</span>
                      </TableCell>
                      <TableCell onClick={() => onViewAsset(asset.id)}>
                        <span className="text-sm">{asset.current_location || (asset as any).location || 'N/A'}</span>
                      </TableCell>
                      <TableCell onClick={() => onViewAsset(asset.id)}>
                        <Badge variant="outline" className={getStatusColor(asset.status)}>
                          {displayStatus(asset.status)}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => onViewAsset(asset.id)}>
                        <Badge variant="outline" className={getCriticalityColor(asset.criticality)}>
                          {displayCriticality(asset.criticality)}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => onViewAsset(asset.id)}>
                        <span className="text-sm">{asset.owner_department || 'N/A'}</span>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewAsset(asset.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintQR(asset.id)}>
                              <QrCode className="h-4 w-4 mr-2" />
                              Print QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRequestMovement(asset.id)}>
                              <ArrowUpDown className="h-4 w-4 mr-2" />
                              Request Movement
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditAsset(asset.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Edit Asset
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Cards - Mobile */}
            <div className="md:hidden space-y-4">
              {paginatedAssets.map((asset) => (
                <Card key={asset.id} className="p-4" onClick={() => onViewAsset(asset.id)}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedAssets.includes(asset.id)}
                      onCheckedChange={() => toggleAssetSelection(asset.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${asset.name}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="mb-1">{asset.name}</h4>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{asset.asset_tag}</code>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{displayCategory(asset.category)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="text-right">{(asset as any).location_name || (asset as any).location?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant="outline" className={getStatusColor(asset.status)}>
                            {displayStatus(asset.status)}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-muted-foreground">Criticality:</span>
                          <Badge variant="outline" className={getCriticalityColor(asset.criticality)}>
                            {displayCriticality(asset.criticality)}
                          </Badge>
                        </div>
                        {asset.owner_department && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Owner Dept:</span>
                            <span>{asset.owner_department}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of {filteredAssets.length}{' '}
                assets
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="min-h-[44px]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="min-h-[44px]"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
