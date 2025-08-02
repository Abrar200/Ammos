import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: LucideIcon;
  isLive?: boolean;
}

export const StatsCard = ({ title, value, change, changeType, icon: Icon, isLive }: StatsCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {isLive && (
                <Badge variant="secondary" className="text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  LIVE
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className={`text-xs ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
              {change}
            </p>
          </div>
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );
};