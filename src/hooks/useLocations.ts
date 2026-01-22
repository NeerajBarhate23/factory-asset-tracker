import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Location } from '../lib/types';

export function useLocations() {
  // Locations are now TEXT fields, not a separate table
  // This hook is kept for backward compatibility but returns empty data
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchLocations = useCallback(async () => {
    // No-op: locations are now stored as text in assets and movements
    setLocations([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const createLocation = async (locationData: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  }) => {
    // No-op: locations are now text fields
    console.warn('createLocation is deprecated - locations are now text fields');
    return '';
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    // No-op: locations are now text fields
    console.warn('updateLocation is deprecated - locations are now text fields');
  };

  const deleteLocation = async (id: string) => {
    // No-op: locations are now text fields
    console.warn('deleteLocation is deprecated - locations are now text fields');
  };

  return {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    refetch: fetchLocations,
  };
}
