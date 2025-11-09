import { useState, useEffect, useCallback } from 'react';
import { assetsApi } from '../lib/api-client';
import type { Asset } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await assetsApi.getAll();
      // Handle both array response and paginated response
      const assetsData = Array.isArray(response) ? response : (response?.assets || response?.data || []);
      setAssets(assetsData);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const createAsset = async (assetData: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newAsset = await assetsApi.create(assetData);
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
      await assetsApi.update(id, updates);
      await fetchAssets();
    } catch (err) {
      console.error('Error updating asset:', err);
      throw err;
    }
  };

  const deleteAsset = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await assetsApi.delete(id);
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
    return assets.find(asset => asset.asset_uid === uid);
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
        const result = await assetsApi.getById(assetId);
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
