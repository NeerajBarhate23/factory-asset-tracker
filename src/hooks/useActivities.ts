import { useState, useEffect, useCallback } from 'react';
import { activityService } from '../lib/supabase-services';
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
      const data = await activityService.getAll(limit);
      setActivities(data as any);
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
