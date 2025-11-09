// Shared TypeScript types for the application

export type UserRole = 'admin' | 'shop_incharge' | 'operator' | 'ADMIN' | 'SHOP_INCHARGE' | 'OPERATOR' | 'MAINTENANCE';

export type AssetCategory = 'tool_room_spm' | 'cnc_machine' | 'workstation' | 'material_handling' | 'TOOL_ROOM_SPM' | 'CNC_MACHINE' | 'WORKSTATION' | 'MATERIAL_HANDLING';
export type AssetStatus = 'active' | 'maintenance' | 'inactive' | 'retired' | 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'RETIRED';
export type AssetCriticality = 'high' | 'medium' | 'low' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  asset_uid: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  location: string;
  criticality?: AssetCriticality | null;
  owner_department?: string | null;
  make?: string | null;
  model?: string | null;
  serial_number?: string | null;
  purchase_date?: string | null;
  warranty_expiry?: string | null;
  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;
  assigned_to?: string | null;
  specifications?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Movement {
  id: string;
  asset_id: string;
  from_location: string;
  to_location: string;
  moved_by: string;
  moved_at: string;
  reason?: string | null;
  notes?: string | null;
}

export interface Audit {
  id: string;
  asset_id: string;
  audited_by: string;
  audited_at: string;
  status: string;
  condition?: string | null;
  issues_found?: string | null;
  recommendations?: string | null;
  photos?: string | null;
}

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: string | null;
  created_at: string;
}

export interface KPIData {
  assetMasterCompleteness: {
    value: number;
    trend: number;
    status: 'good' | 'warning' | 'critical';
  };
  activeAssets: {
    value: number;
    trend: number;
    status: 'good' | 'warning' | 'critical';
  };
  avgTimeToLocate: {
    value: number;
    trend: number;
    status: 'good' | 'warning' | 'critical';
  };
  unauthorizedMovements: {
    value: number;
    trend: number;
    status: 'good' | 'warning' | 'critical';
  };
}
