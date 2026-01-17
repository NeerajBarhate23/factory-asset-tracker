// Shared TypeScript types for the application
// Based on COMPLETE_SYSTEM_DOCUMENTATION.md

export type UserRole = 'admin' | 'shop_incharge' | 'maintenance' | 'operator';

export type AssetCategory = 'Tool Room SPM' | 'CNC Machine' | 'Workstation' | 'Material Handling Equipment';
export type AssetStatus = 'Active' | 'Inactive' | 'Under Maintenance' | 'Decommissioned';
export type AssetCriticality = 'High' | 'Medium' | 'Low';

export type MovementStatus = 'Pending' | 'Approved' | 'In Transit' | 'Completed' | 'Rejected';
export type AuditStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Discrepancy Found';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Asset {
  id: string;
  asset_uid: string;
  name: string;
  category: AssetCategory;
  current_location: string;
  status: AssetStatus;
  criticality: AssetCriticality;
  owner_department?: string;
  qr_code?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Movement {
  id: string;
  asset_id: string;
  from_location: string;
  to_location: string;
  requested_by: string;
  approved_by?: string;
  status: MovementStatus;
  reason?: string;
  sla_hours: number;
  request_date: string;
  approval_date?: string;
  dispatched_at?: string;
  received_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Audit {
  id: string;
  location: string;
  category: string;
  scheduled_date: string;
  completed_date?: string;
  status: AuditStatus;
  auditor_id?: string;
  assets_scanned: number;
  total_assets: number;
  discrepancies: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
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
}

// Legacy type for backward compatibility
export type Location = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  created_at?: string;
  updated_at?: string;
};
