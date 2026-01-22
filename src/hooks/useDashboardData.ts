import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../lib/supabase-services';

export interface DashboardStats {
  total_assets: number;
  complete_assets?: number;
  active_assets: number;
  maintenance_assets: number;
  inactive_assets: number;
  retired_assets: number;
  recent_movements: number;
  category_counts: Record<string, number>;
}

export interface KPIData {
  assetMasterCompleteness: {
    value: number;
    trend: number;
    status: 'good' | 'warning' | 'error';
  };
  avgTimeToLocate: {
    value: number;
    trend: number;
    status: 'good' | 'warning' | 'error';
  };
  unauthorizedMovements: {
    value: number;
    trend: number;
    status: 'good' | 'warning' | 'error';
  };
  activeAssets: {
    value: number;
    trend: number;
    status: 'good' | 'warning' | 'error';
  };
}

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const statsData = await dashboardService.getStats();
      setStats(statsData);

      const completenessPercent = statsData.total_assets > 0 
        ? ((statsData.complete_assets || 0) / statsData.total_assets) * 100 
        : 0;

      // Calculate KPI values
      setKpiData({
        assetMasterCompleteness: {
          value: Math.round(completenessPercent * 10) / 10,
          trend: 0,
          status: completenessPercent >= 90 ? 'good' : completenessPercent >= 70 ? 'warning' : 'error',
        },
        activeAssets: {
          value: statsData.active_assets,
          trend: 0,
          status: 'good',
        },
        avgTimeToLocate: {
          value: 3.2,
          trend: -0.5,
          status: 'good',
        },
        unauthorizedMovements: {
          value: 0,
          trend: 0,
          status: 'good',
        },
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    kpiData,
    loading,
    error,
    refresh: fetchDashboardData,
  };
}
