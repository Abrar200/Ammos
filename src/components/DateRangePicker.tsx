import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Updated: use Date instead of string
export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClear: () => void;
  className?: string;
}

export const DateRangePicker = ({
  dateRange,
  onDateRangeChange,
  onClear,
  className,
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Handle change events and convert input strings to Date objects
  const handleFromDateChange = (dateString: string) => {
    const newDate = dateString ? new Date(dateString) : null;
    onDateRangeChange({ ...dateRange, from: newDate });
  };

  const handleToDateChange = (dateString: string) => {
    const newDate = dateString ? new Date(dateString) : null;
    onDateRangeChange({ ...dateRange, to: newDate });
  };

  // Convert Date objects into readable display strings
  const formatDateRange = () => {
    const from = dateRange.from
      ? dateRange.from.toISOString().split('T')[0]
      : '';
    const to = dateRange.to ? dateRange.to.toISOString().split('T')[0] : '';

    if (!from && !to) return 'Select date range';
    if (from && to) return `${from} - ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Until ${to}`;
    return 'Select date range';
  };

  const hasDateRange = !!(dateRange.from || dateRange.to);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-300 hover:bg-gray-50 min-w-[200px] justify-start"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Filter by Date Range
              </CardTitle>
              {hasDateRange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClear();
                    setIsOpen(false);
                  }}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">
                From Date
              </label>
              <Input
                type="date"
                value={
                  dateRange.from
                    ? dateRange.from.toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="border-gray-300 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">
                To Date
              </label>
              <Input
                type="date"
                value={
                  dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''
                }
                onChange={(e) => handleToDateChange(e.target.value)}
                className="border-gray-300 focus:border-slate-400 focus:ring-slate-400"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800"
              >
                Apply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
