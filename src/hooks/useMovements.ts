import { useState, useEffect, useCallback } from 'react';
import { movementsService } from '../lib/supabase-services';
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
      const data = await movementsService.getAll();
      setMovements(data || []);
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
    from_location_id?: string;
    to_location_id?: string;
    reason?: string;
    notes?: string;
  }) => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const data = await movementsService.create(movementData);

      // Refresh movements list
      await fetchMovements();
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Error creating movement:', err);
      return { success: false, error: err.message || 'Failed to create movement' };
    }
  };

  const getMovementsByAsset = (assetId: string): any[] => {
    return movements.filter(m => m.asset_id === assetId);
  };

  const approveMovement = async (movementId: string, approverId: string) => {
    try {
      const data = await movementsService.approve(movementId);
      await fetchMovements();
      return { success: true, data };
    } catch (err: any) {
      console.error('Error approving movement:', err);
      return { success: false, error: err.message || 'Failed to approve movement' };
    }
  };

  const rejectMovement = async (movementId: string, rejectorId: string, reason: string) => {
    try {
      const data = await movementsService.reject(movementId, reason);
      await fetchMovements();
      return { success: true, data };
    } catch (err: any) {
      console.error('Error rejecting movement:', err);
      return { success: false, error: err.message || 'Failed to reject movement' };
    }
  };

  const dispatchMovement = async (movementId: string) => {
    try {
      const data = await movementsService.updateStatus(movementId, 'In Transit');
      await fetchMovements();
      return { success: true, data };
    } catch (err: any) {
      console.error('Error dispatching movement:', err);
      return { success: false, error: err.message || 'Failed to dispatch movement' };
    }
  };

  const completeMovement = async (movementId: string) => {
    try {
      const data = await movementsService.updateStatus(movementId, 'Completed');
      await fetchMovements();
      return { success: true, data };
    } catch (err: any) {
      console.error('Error completing movement:', err);
      return { success: false, error: err.message || 'Failed to complete movement' };
    }
  };

  return {
    movements,
    loading,
    error,
    createMovement,
    approveMovement,
    rejectMovement,
    dispatchMovement,
    completeMovement,
    getMovementsByAsset,
    refetch: fetchMovements,
  };
}
