import { KPICard } from './KPICard';
import { ActivityFeed } from './ActivityFeed';
import { TrendCharts } from './TrendCharts';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useActivities } from '../../hooks/useActivities';
// TODO: Implement backend API for mock data
// import { kpiData as mockKpiData, mockActivities } from '../../lib/mock-data';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';

export function DashboardView() {
  const { kpiData, loading, error, refresh } = useDashboardData();
  const { activities, loading: activitiesLoading, error: activitiesError } = useActivities();

  // Temporary fallback data until backend integration is complete
  const mockKpiData = {
    assetMasterCompleteness: { value: 0, trend: 0, status: 'neutral' as const },
    activeAssets: { value: 0, trend: 0, status: 'neutral' as const },
    avgTimeToLocate: { value: 0, trend: 0, status: 'neutral' as const },
    unauthorizedMovements: { value: 0, trend: 0, status: 'neutral' as const }
  };
  const mockActivities: any[] = [];

  // Use mock data as fallback if there's an error or data is not loaded
  const displayKpiData = error || !kpiData ? mockKpiData : kpiData;
  const displayActivities = activitiesError || !activities ? mockActivities : activities;

  if (loading && !kpiData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Factory asset tracking overview and key metrics
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-destructive">
              Unable to load live data. Showing cached information.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {error}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Asset Master Completeness"
          value={displayKpiData.assetMasterCompleteness.value}
          unit="%"
          trend={displayKpiData.assetMasterCompleteness.trend}
          status={displayKpiData.assetMasterCompleteness.status}
          tooltip="Percentage of assets with complete master data including specs and ownership"
        />
        <KPICard
          title="Active Assets"
          value={displayKpiData.activeAssets.value}
          trend={displayKpiData.activeAssets.trend}
          status={displayKpiData.activeAssets.status}
          tooltip="Total number of active assets in the system"
        />
        <KPICard
          title="Avg Time to Locate"
          value={displayKpiData.avgTimeToLocate.value}
          unit="min"
          trend={displayKpiData.avgTimeToLocate.trend}
          status={displayKpiData.avgTimeToLocate.status}
          tooltip="Average time required to physically locate an asset using the tracking system"
        />
        <KPICard
          title="Unauthorized Movements"
          value={displayKpiData.unauthorizedMovements.value}
          trend={displayKpiData.unauthorizedMovements.trend}
          status={displayKpiData.unauthorizedMovements.status}
          tooltip="Number of assets moved without proper approval or scan documentation in the last 30 days"
        />
      </div>

      {/* Charts */}
      <TrendCharts />

      {/* Activity Feed */}
      <ActivityFeed activities={displayActivities} />
    </div>
  );
}
