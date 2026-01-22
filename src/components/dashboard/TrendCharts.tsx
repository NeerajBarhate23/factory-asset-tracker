import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

export function TrendCharts() {
  const [chartDataMetrics, setChartDataMetrics] = useState<any[]>([]);
  const [chartDataMovements, setChartDataMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        // Get data for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Fetch assets data
        const { data: assets } = await supabase
          .from('assets')
          .select('created_at, status')
          .gte('created_at', sixMonthsAgo.toISOString());

        // Fetch movements data
        const { data: movements } = await supabase
          .from('movements')
          .select('request_date, status')
          .gte('request_date', sixMonthsAgo.toISOString());

        // Process assets metrics by month
        const metricsMap = new Map<string, { total: number; active: number }>();
        assets?.forEach(asset => {
          const month = new Date(asset.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          const existing = metricsMap.get(month) || { total: 0, active: 0 };
          existing.total++;
          if (asset.status === 'ACTIVE') existing.active++;
          metricsMap.set(month, existing);
        });

        // Calculate completeness (active assets / total)
        const metricsData = Array.from(metricsMap.entries()).map(([month, data]) => ({
          month,
          completeness: data.total > 0 ? Math.round((data.active / data.total) * 100) : 0,
          timeToLocate: Math.floor(Math.random() * 3) + 2 // Mock data for now
        }));

        // Process movements by month
        const movementsMap = new Map<string, { authorized: number; unauthorized: number }>();
        movements?.forEach(movement => {
          const month = new Date(movement.request_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          const existing = movementsMap.get(month) || { authorized: 0, unauthorized: 0 };
          // All movements are authorized for now (can be enhanced later)
          existing.authorized++;
          movementsMap.set(month, existing);
        });

        const movementsData = Array.from(movementsMap.entries()).map(([month, data]) => ({
          month,
          ...data
        }));

        setChartDataMetrics(metricsData);
        setChartDataMovements(movementsData);
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </Card>
        <Card className="p-6 flex items-center justify-center h-[350px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </Card>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="mb-4">Asset Metrics Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartDataMetrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis yAxisId="left" stroke="#666" domain={[85, 100]} />
            <YAxis yAxisId="right" stroke="#666" orientation="right" domain={[0, 5]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="completeness"
              name="Master Completeness %"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="timeToLocate"
              name="Avg Time to Locate (min)"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4">Movement Trends (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartDataMovements}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="authorized" name="Authorized" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unauthorized" name="Unauthorized" fill="#eab308" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
