import { useState, useEffect, useCallback } from 'react';
import { maintenanceService } from '../lib/supabase-services';
import { useAuth } from '../contexts/AuthContext';

export function useMaintenance(assetId?: string) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchMaintenance = useCallback(async () => {
    try {
      setLoading(true);
      const data = assetId 
        ? await maintenanceService.getByAssetId(assetId)
        : await maintenanceService.getAll();
      setMaintenanceRecords(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching maintenance records:', err);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetchMaintenance();
  }, [fetchMaintenance]);

  const createMaintenance = async (maintenanceData: {
    asset_id: string;
    maintenance_type: 'preventive' | 'corrective' | 'inspection' | 'calibration';
    scheduled_date: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    cost?: number;
    notes?: string;
    next_maintenance_date?: string;
  }) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = await maintenanceService.create(maintenanceData);
      await fetchMaintenance();
      return { success: true, data };
    } catch (err: any) {
      console.error('Error creating maintenance record:', err);
      return { success: false, error: err.message || 'Failed to create maintenance record' };
    }
  };

  const updateMaintenance = async (id: string, updates: any) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const data = await maintenanceService.update(id, updates);
      await fetchMaintenance();
      return { success: true, data };
    } catch (err: any) {
      console.error('Error updating maintenance record:', err);
      return { success: false, error: err.message || 'Failed to update maintenance record' };
    }
  };

  return {
    maintenanceRecords,
    loading,
    error,
    createMaintenance,
    updateMaintenance,
    refetch: fetchMaintenance,
  };
}
