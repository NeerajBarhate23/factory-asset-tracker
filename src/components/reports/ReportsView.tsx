import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Download, Calendar, TrendingUp, Package, ClipboardCheck } from 'lucide-react';

export function ReportsView() {
  const reports = [
    {
      id: '1',
      name: 'Asset Master Report',
      description: 'Complete listing of all assets with specifications',
      icon: Package,
      lastGenerated: '2025-10-07',
      frequency: 'Weekly',
    },
    {
      id: '2',
      name: 'Movement History Report',
      description: 'Historical log of all asset movements and transfers',
      icon: TrendingUp,
      lastGenerated: '2025-10-06',
      frequency: 'Daily',
    },
    {
      id: '3',
      name: 'Audit Summary Report',
      description: 'Summary of all audits with discrepancies and findings',
      icon: ClipboardCheck,
      lastGenerated: '2025-10-05',
      frequency: 'Monthly',
    },
    {
      id: '4',
      name: 'Location Accuracy Report',
      description: 'Asset location accuracy metrics by department',
      icon: Calendar,
      lastGenerated: '2025-10-01',
      frequency: 'Monthly',
    },
    {
      id: '5',
      name: 'Unauthorized Movement Report',
      description: 'List of all unauthorized or undocumented movements',
      icon: FileText,
      lastGenerated: '2025-10-07',
      frequency: 'Weekly',
    },
    {
      id: '6',
      name: 'Asset Utilization Report',
      description: 'Analysis of asset usage and idle time',
      icon: TrendingUp,
      lastGenerated: '2025-10-03',
      frequency: 'Monthly',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Reports</h1>
        <p className="text-muted-foreground mt-1">
          Generate and download asset tracking reports
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <report.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="mb-1">{report.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {report.description}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Last: {report.lastGenerated}
                    </span>
                  </div>
                  <Badge variant="outline">{report.frequency}</Badge>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="min-h-[44px]">
                    <FileText className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" className="min-h-[44px]">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Custom Report Generator */}
      <Card className="p-6">
        <h3 className="mb-4">Custom Report Generator</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure and generate custom reports with specific filters and date ranges
        </p>
        <Button className="min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Report
        </Button>
      </Card>
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
