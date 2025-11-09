import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle, Info, TrendingUp, Package, TruckIcon, ClipboardCheck, User } from 'lucide-react';
import { ActivityItem } from '../../lib/types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (entityType: string) => {
    switch (entityType) {
      case 'asset':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'movement':
        return <TruckIcon className="h-4 w-4 text-purple-600" />;
      case 'audit':
        return <ClipboardCheck className="h-4 w-4 text-green-600" />;
      case 'user':
        return <User className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getActionBadge = (action: string) => {
    if (action.toLowerCase().includes('created')) return 'success';
    if (action.toLowerCase().includes('updated')) return 'secondary';
    if (action.toLowerCase().includes('deleted')) return 'destructive';
    if (action.toLowerCase().includes('approved')) return 'success';
    if (action.toLowerCase().includes('rejected')) return 'destructive';
    return 'outline';
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4">Recent Activity</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className="mt-1">{getIcon(activity.entity_type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm mb-1 leading-relaxed">{activity.action}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatTime(activity.created_at)}</span>
                    <Badge
                      variant={getActionBadge(activity.action) as any}
                      className="text-xs"
                    >
                      {activity.entity_type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
