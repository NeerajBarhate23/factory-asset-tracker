import { Card } from '../ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// TODO: Implement backend API for chart data
// import { chartDataMetrics, chartDataMovements } from '../../lib/mock-data';

// Temporary empty data until backend integration is complete
const chartDataMetrics: any[] = [];
const chartDataMovements: any[] = [];

export function TrendCharts() {
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
