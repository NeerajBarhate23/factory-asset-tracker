import { Card } from '../ui/card';
import { ArrowUpIcon, ArrowDownIcon, InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  status: 'good' | 'neutral' | 'warning' | 'error';
  tooltip?: string;
  sparklineData?: number[];
}

export function KPICard({ title, value, unit, trend, status, tooltip }: KPICardProps) {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    neutral: 'text-blue-600 bg-blue-50 border-blue-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    error: 'text-red-600 bg-red-50 border-red-200',
  };

  const trendColors = {
    good: 'text-green-600',
    neutral: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <Card className={`p-6 border-2 ${statusColors[status]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-muted-foreground">{title}</h3>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 ${trendColors[status]}`}>
            {trend > 0 ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : trend < 0 ? (
              <ArrowDownIcon className="h-4 w-4" />
            ) : null}
            <span className="text-sm">{Math.abs(trend)}{unit === '%' ? 'pp' : ''}</span>
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <h2 className={trendColors[status]}>{value}</h2>
        {unit && <span className="text-muted-foreground">{unit}</span>}
      </div>
    </Card>
  );
}
