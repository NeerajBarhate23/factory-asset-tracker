import { useState, useEffect, useCallback } from 'react';
// TODO: Implement dashboard API backend integration
// import { query } from '../lib/database';

export interface DashboardStats {
  total_assets: number;
  active_assets: number;
  maintenance_assets: number;
  inactive_assets: number;
  recent_movements: number;
  recent_audits: number;
  tool_room_spm_count: number;
  cnc_machine_count: number;
  workstation_count: number;
  material_handling_count: number;
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

      // TODO: Replace with backend API calls
      // Temporary empty data until backend integration
      const total = 0;
      const active = 0;
      const maintenance = 0;
      const inactive = 0;
      const recentMovements = 0;
      const recentAudits = 0;
      const toolRoomSpm = 0;
      const cncMachine = 0;
      const workstation = 0;
      const materialHandling = 0;
      const assetsWithCompleteData = 0;

      const statsData = {
        total_assets: total,
        active_assets: active,
        maintenance_assets: maintenance,
        inactive_assets: inactive,
        recent_movements: recentMovements,
        recent_audits: recentAudits,
        tool_room_spm_count: toolRoomSpm,
        cnc_machine_count: cncMachine,
        workstation_count: workstation,
        material_handling_count: materialHandling,
      };
      
      setStats(statsData);

      const completenessPercent = total > 0 ? (assetsWithCompleteData / total) * 100 : 0;

      // Calculate KPI values
      setKpiData({
        assetMasterCompleteness: {
          value: Math.round(completenessPercent * 10) / 10,
          trend: 0,
          status: completenessPercent >= 90 ? 'good' : completenessPercent >= 70 ? 'warning' : 'error',
        },
        activeAssets: {
          value: active,
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
