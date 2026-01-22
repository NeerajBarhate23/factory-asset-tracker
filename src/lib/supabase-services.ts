import { supabase } from './supabase';
import type { Asset, User, Movement } from './types';

// ============= ASSETS API =============
export const assetsService = {
  async getAll() {
    console.log('🔍 [assetsService] Starting getAll query...');
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [assetsService] Query error:', error);
      throw error;
    }
    
    console.log('✅ [assetsService] Raw data:', data?.length || 0, 'rows');
    console.log('📦 [assetsService] Sample asset:', data?.[0]);
    
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(assetData: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;

    const { data, error } = await supabase
      .from('assets')
      .insert([{
        ...assetData,
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (data) {
      await activityService.create({
        action: 'CREATE_ASSET',
        entity_type: 'Asset',
        entity_id: data.id,
        details: { name: assetData.name, asset_uid: assetData.asset_uid }
      });
    }

    return data;
  },

  async update(id: string, updates: Partial<Asset>) {
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (data) {
      await activityService.create({
        action: 'UPDATE_ASSET',
        entity_type: 'Asset',
        entity_id: data.id,
        details: { name: data.name, updates: Object.keys(updates) }
      });
    }

    return data;
  },

  async delete(id: string) {
    // Get asset info before deleting
    const asset = await this.getById(id);

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log activity
    if (asset) {
      await activityService.create({
        action: 'DELETE_ASSET',
        entity_type: 'Asset',
        entity_id: id,
        details: { name: asset.name, asset_uid: asset.asset_uid }
      });
    }
  },
};

// ============= MOVEMENTS API =============
export const movementsService = {
  async getAll() {
    console.log('🔍 [movementsService] Fetching all movements...');
    
    const { data, error } = await supabase
      .from('movements')
      .select(`
        *,
        asset:assets(*),
        requested_by_user:users!movements_requested_by_fkey(*),
        approved_by_user:users!movements_approved_by_fkey(*)
      `)
      .order('request_date', { ascending: false });

    if (error) {
      console.error('❌ [movementsService] Error fetching movements:', error);
      throw error;
    }
    
    console.log('✅ [movementsService] Movements fetched:', data?.length || 0, 'records');
    console.log('📦 [movementsService] Sample movement:', data?.[0]);
    
    return data || [];
  },

  async create(movementData: {
    asset_id: string;
    from_location: string;
    to_location: string;
    reason?: string;
  }) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;
    
    console.log('🔍 Creating movement with data:', {
      ...movementData,
      requested_by: userId,
      status: 'Pending',
      request_date: new Date().toISOString(),
      sla_hours: 24,
    });
    
    const { data, error } = await supabase
      .from('movements')
      .insert([{
        ...movementData,
        requested_by: userId,
        request_date: new Date().toISOString(),
        status: 'Pending',
        sla_hours: 24,
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating movement:', error);
      throw error;
    }

    console.log('✅ Movement created:', data);

    // Log activity
    if (data) {
      await activityService.create({
        action: 'CREATE_MOVEMENT',
        entity_type: 'Movement',
        entity_id: data.id,
        details: { 
          from_location: movementData.from_location,
          to_location: movementData.to_location,
          reason: movementData.reason 
        }
      });
    }

    return data;
  },

  async approve(id: string, notes?: string) {
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session?.user?.id;

    const { data, error } = await supabase
      .from('movements')
      .update({
        status: 'Approved',
        approved_by: userId,
        approval_date: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async reject(id: string, reason: string) {
    const { data, error } = await supabase
      .from('movements')
      .update({
        status: 'Rejected',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (data) {
      await activityService.create({
        action: 'REJECT_MOVEMENT',
        entity_type: 'Movement',
        entity_id: data.id,
        details: { reason }
      });
    }

    return data;
  },

  async updateStatus(id: string, status: 'In Transit' | 'Completed') {
    const updates: any = { status };
    
    if (status === 'In Transit') {
      updates.dispatched_at = new Date().toISOString();
    } else if (status === 'Completed') {
      updates.received_at = new Date().toISOString();
      
      // Get the movement details to update asset location
      const { data: movement } = await supabase
        .from('movements')
        .select('asset_id, to_location')
        .eq('id', id)
        .single();
      
      if (movement) {
        // Update asset's current_location to the destination
        await supabase
          .from('assets')
          .update({ current_location: movement.to_location })
          .eq('id', movement.asset_id);
      }
    }

    const { data, error } = await supabase
      .from('movements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    if (data) {
      const action = status === 'In Transit' ? 'DISPATCH_MOVEMENT' : 'COMPLETE_MOVEMENT';
      await activityService.create({
        action,
        entity_type: 'Movement',
        entity_id: data.id,
        details: {
          from_location: data.from_location,
          to_location: data.to_location,
          status
        }
      });
    }

    return data;
  },
};

// ============= MAINTENANCE API =============
export const maintenanceService = {
  async getAll() {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select(`
        *,
        asset:assets(*),
        performed_by_user:users!maintenance_records_performed_by_fkey(*)
      `)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByAssetId(assetId: string) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select(`
        *,
        performed_by_user:users!maintenance_records_performed_by_fkey(*)
      `)
      .eq('asset_id', assetId)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(maintenanceData: {
    asset_id: string;
    maintenance_type: 'preventive' | 'corrective' | 'inspection' | 'calibration';
    scheduled_date: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    cost?: number;
    notes?: string;
    next_maintenance_date?: string;
  }) {
    const { data: session } = await supabase.auth.getSession();
    
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([{
        ...maintenanceData,
        performed_by: session.session?.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('maintenance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= USERS API =============
export const usersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name');

    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= AUDITS API =============
export const auditsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('audits')
      .select(`
        *,
        auditor:users!audits_auditor_id_fkey(*)
      `)
      .order('scheduled_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(auditData: {
    location: string;
    category: string;
    scheduled_date: string;
    auditor_id?: string;
    total_assets?: number;
  }) {
    const { data, error } = await supabase
      .from('audits')
      .insert([{
        ...auditData,
        status: 'Scheduled',
        assets_scanned: 0,
        total_assets: auditData.total_assets || 0,
        discrepancies: 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('audits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('audits')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============= ACTIVITY LOGS API =============
export const activityService = {
  async getAll(limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async create(activityData: {
    action: string;
    entity_type: string;
    entity_id?: string;
    details?: Record<string, any>;
  }) {
    const { data: session } = await supabase.auth.getSession();
    
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([{
        ...activityData,
        user_id: session.session?.user?.id,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ============= FILES API =============
export const filesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        uploaded_by_user:users!files_uploaded_by_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        uploaded_by_user:users!files_uploaded_by_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByAsset(assetId: string) {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        uploaded_by_user:users!files_uploaded_by_fkey(*)
      `)
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Legacy method name for backward compatibility
  async getByAssetId(assetId: string) {
    return this.getByAsset(assetId);
  },

  async upload(file: File, assetId?: string, customName?: string) {
    const { data: session } = await supabase.auth.getSession();
    
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `assets/${assetId || 'general'}/${fileName}`;

    // Upload to Supabase Storage bucket
    const { error: uploadError } = await supabase.storage
      .from('asset-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('asset-files')
      .getPublicUrl(filePath);

    // Use custom name if provided, otherwise use original filename
    const displayName = customName || file.name;

    // Save file metadata to database
    const { data, error } = await supabase
      .from('files')
      .insert([{
        asset_id: assetId,
        filename: displayName,
        file_path: publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: session.session?.user?.id,
      }])
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      // Try to clean up uploaded file
      await supabase.storage.from('asset-files').remove([filePath]);
      throw new Error(`Failed to save file metadata: ${error.message}`);
    }
    
    return data;
  },

  async delete(id: string) {
    // First, get the file info to extract storage path
    const { data: fileData } = await supabase
      .from('files')
      .select('file_path')
      .eq('id', id)
      .single();

    // Delete from database
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Try to delete from storage if we have the path
    if (fileData?.file_path) {
      try {
        // Extract the storage path from the public URL
        const url = new URL(fileData.file_path);
        const pathParts = url.pathname.split('/storage/v1/object/public/asset-files/');
        if (pathParts.length > 1) {
          const storagePath = pathParts[1];
          await supabase.storage.from('asset-files').remove([storagePath]);
        }
      } catch (err) {
        console.warn('Failed to delete file from storage:', err);
        // Don't throw error - file metadata is already deleted
      }
    }
  },
};

// ============= DASHBOARD API =============
export const dashboardService = {
  async getStats() {
    // Get asset counts by status and compute master completeness
    const { data: assets } = await supabase
      .from('assets')
      .select('*');

    // Define required fields that constitute a "complete" asset master record
    const requiredFields = ['asset_uid', 'name', 'category', 'current_location', 'status', 'criticality'];

    const total = assets?.length || 0;
    const completeCount = (assets || []).filter((a: any) =>
      requiredFields.every(field => {
        const val = a[field];
        return val !== null && val !== undefined && String(val).trim() !== '';
      })
    ).length;

    const stats = {
      total_assets: total,
      complete_assets: completeCount,
      active_assets: assets?.filter(a => a.status === 'Active').length || 0,
      maintenance_assets: assets?.filter(a => a.status === 'Under Maintenance').length || 0,
      inactive_assets: assets?.filter(a => a.status === 'Inactive').length || 0,
      decommissioned_assets: assets?.filter(a => a.status === 'Decommissioned').length || 0,
    };

    // Get recent movements count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: movementsCount } = await supabase
      .from('movements')
      .select('*', { count: 'exact', head: true })
      .gte('request_date', sevenDaysAgo.toISOString());

    // Get assets by category
    const { data: assetsByCategory } = await supabase
      .from('assets')
      .select('category');

    const categoryCounts: any = {};
    assetsByCategory?.forEach(asset => {
      const cat = asset.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      ...stats,
      recent_movements: movementsCount || 0,
      category_counts: categoryCounts,
    };
  },

  async getRecentActivities(limit = 10) {
    return await activityService.getAll(limit);
  },
};
