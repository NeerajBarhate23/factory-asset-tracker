import { useState, useEffect, useCallback } from 'react';
import { movementsApi, assetsApi } from '../lib/api-client';
import type { Movement } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export interface MovementWithAsset extends Movement {
  asset_name: string;
  asset_uid: string;
  moved_by_name: string;
}

export function useMovements() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await movementsApi.getAll({ sortBy: 'createdAt', sortOrder: 'desc' });
      setMovements(response.movements || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching movements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const createMovement = async (movementData: {
    asset_id: string;
    from_location: string;
    to_location: string;
    requested_by?: string;
    status?: string;
    reason?: string;
    sla_hours?: number;
    request_date?: string;
  }) => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Convert snake_case to camelCase for backend API
      const response = await movementsApi.create({
        assetId: movementData.asset_id,
        fromLocation: movementData.from_location,
        toLocation: movementData.to_location,
        reason: movementData.reason,
        slaHours: movementData.sla_hours || 24,
      });

      // Refresh movements list
      await fetchMovements();
      
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Error creating movement:', err);
      return { success: false, error: err.message || 'Failed to create movement' };
    }
  };

  const approveMovement = async (movementId: string, approverId: string) => {
    try {
      await movementsApi.approve(movementId);
      await fetchMovements();
      return { success: true };
    } catch (err: any) {
      console.error('Error approving movement:', err);
      return { success: false, error: err.message || 'Failed to approve movement' };
    }
  };

  const rejectMovement = async (movementId: string, rejectedBy: string, reason: string) => {
    try {
      await movementsApi.reject(movementId, reason);
      await fetchMovements();
      return { success: true };
    } catch (err: any) {
      console.error('Error rejecting movement:', err);
      return { success: false, error: err.message || 'Failed to reject movement' };
    }
  };

  const getMovementsByAsset = (assetId: string): any[] => {
    return movements.filter(m => m.assetId === assetId);
  };

  return {
    movements,
    loading,
    error,
    createMovement,
    approveMovement,
    rejectMovement,
    getMovementsByAsset,
    refetch: fetchMovements,
  };
}
