import { useState, useEffect, useCallback } from 'react';
import { assetsService } from '../lib/supabase-services';
import type { Asset } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchAssets = useCallback(async () => {
    try {
      console.log('🔄 Fetching assets...');
      setLoading(true);
      const data = await assetsService.getAll();
      console.log('✅ Assets fetched:', data?.length || 0, 'assets');
      console.log('📦 Sample asset:', data?.[0]);
      setAssets(data as Asset[]);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching assets:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
      console.log('✨ Loading complete');
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const createAsset = async (assetData: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newAsset = await assetsService.create(assetData);
      await fetchAssets();
      return newAsset.id;
    } catch (err) {
      console.error('Error creating asset:', err);
      throw err;
    }
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await assetsService.update(id, updates);
      await fetchAssets();
    } catch (err) {
      console.error('Error updating asset:', err);
      throw err;
    }
  };

  const deleteAsset = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await assetsService.delete(id);
      await fetchAssets();
    } catch (err) {
      console.error('Error deleting asset:', err);
      throw err;
    }
  };

  const getAssetById = (id: string): Asset | undefined => {
    return assets.find(asset => asset.id === id);
  };

  const getAssetByUid = (uid: string): Asset | undefined => {
    return assets.find(asset => asset.asset_tag === uid || (asset as any).asset_uid === uid);
  };

  return {
    assets,
    loading,
    error,
    createAsset,
    updateAsset,
    deleteAsset,
    getAssetById,
    getAssetByUid,
    refetch: fetchAssets,
  };
}

export function useAsset(assetId: string) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        const result = await assetsService.getById(assetId);
        setAsset(result || null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching asset');
        console.error('Error fetching asset:', err);
        setAsset(null);
      } finally {
        setLoading(false);
      }
    };

    if (assetId) {
      fetchAsset();
    }
  }, [assetId]);

  return {
    asset,
    loading,
    error,
  };
}
