import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

interface WeeklyTargetCardProps {
  weeklyTarget: number;
  currentWeekRevenue: number;
  currentWeekExpenses: number;
  isLive?: boolean;
}

export const WeeklyTargetCard = ({
  weeklyTarget,
  currentWeekRevenue,
  currentWeekExpenses,
  isLive
}: WeeklyTargetCardProps) => {
  const breakEvenPoint = 35000;
  const currentProfit = currentWeekRevenue - currentWeekExpenses;
  const targetProgress = (currentWeekRevenue / weeklyTarget) * 100;
  const breakEvenProgress = (currentWeekRevenue / breakEvenPoint) * 100;

  const getStatus = () => {
    if (currentWeekRevenue >= weeklyTarget) {
      return { text: 'Target Achieved!', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (currentWeekRevenue >= breakEvenPoint) {
      return { text: 'Profitable', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    } else if (currentProfit >= 0) {
      return { text: 'Break Even', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else {
      return { text: 'Below Break Even', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
  };

  const status = getStatus();

  return (
    <Card className="w-full bg-gradient-to-br from-blue-50 to-blue-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Weekly Financial Target</CardTitle>
              <p className="text-sm text-gray-600">Current week performance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${status.bgColor} ${status.color} border-0`}>
              {status.text}
            </Badge>
            {isLive && (
              <Badge variant="secondary" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                LIVE
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Profit Display */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <span className="text-4xl font-bold text-gray-900">
              ${currentProfit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-gray-600">Current Week Profit</p>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          {/* Break Even Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Break Even Progress</span>
              <div className="flex items-center gap-1">
                {breakEvenProgress >= 100 && <CheckCircle className="h-4 w-4 text-green-600" />}
                <span className="text-sm font-bold text-gray-900">
                  {Math.min(breakEvenProgress, 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-yellow-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(breakEvenProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Target Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Target Progress</span>
              <div className="flex items-center gap-1">
                {targetProgress >= 100 && <CheckCircle className="h-4 w-4 text-green-600" />}
                <span className="text-sm font-bold text-gray-900">
                  {Math.min(targetProgress, 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(targetProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-white border-0 shadow-sm">
            <div className="text-center">
              <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                ${currentWeekRevenue.toLocaleString('en-AU')}
              </p>
            </div>
          </Card>

          <Card className="p-4 bg-white border-0 shadow-sm">
            <div className="text-center">
              <DollarSign className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-lg font-bold text-gray-900">
                ${currentWeekExpenses.toLocaleString('en-AU')}
              </p>
            </div>
          </Card>

          <Card className="p-4 bg-white border-0 shadow-sm">
            <div className="text-center">
              <Target className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-sm text-gray-600">Target</p>
              <p className="text-lg font-bold text-gray-900">
                ${weeklyTarget.toLocaleString('en-AU')}
              </p>
            </div>
          </Card>
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {currentWeekRevenue >= weeklyTarget
              ? "🎉 Congratulations! You've exceeded your weekly target!"
              : currentWeekRevenue >= breakEvenPoint
                ? `$${(weeklyTarget - currentWeekRevenue).toLocaleString('en-AU')} more to reach target`
                : `$${(breakEvenPoint - currentWeekRevenue).toLocaleString('en-AU')} more to break even`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};