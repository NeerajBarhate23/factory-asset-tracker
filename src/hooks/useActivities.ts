import { useState, useEffect, useCallback } from 'react';
// TODO: Implement activities API backend integration
// import { query } from '../lib/database';
import type { Activity } from '../lib/types';

export interface ActivityWithUser extends Activity {
  user_name: string;
  user_email: string;
}

export function useActivities(limit: number = 50) {
  const [activities, setActivities] = useState<ActivityWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with backend API call
      const results: ActivityWithUser[] = [];
      setActivities(results);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
}
