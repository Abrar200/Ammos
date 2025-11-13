import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Users, DollarSign, CreditCard, FileText } from 'lucide-react';
import { HealthMetric } from '@/types/business-health';

interface BusinessHealthScoreProps {
  metrics: HealthMetric[];
  overallScore: number;
  loading?: boolean;
}

export const BusinessHealthScore = ({ metrics, overallScore, loading = false }: BusinessHealthScoreProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getMetricIcon = (metricName: string) => {
    switch (metricName) {
      case 'Profit Margin':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'Labour to Sales Ratio':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'Subscription Cost Efficiency':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'Compliance Status':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Health Score</CardTitle>
          <CardDescription>
            Overall business performance indicator based on key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded mx-auto w-32 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Health Score</CardTitle>
        <CardDescription>
          Overall business performance indicator based on key metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </div>
          <div className="text-lg text-gray-600 mt-2">
            Overall Health Score
          </div>
          <div className="mt-4">
            {overallScore >= 80 && (
              <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                <CheckCircle className="h-5 w-5 mr-2" />
                Excellent Health
              </Badge>
            )}
            {overallScore >= 60 && overallScore < 80 && (
              <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Needs Attention
              </Badge>
            )}
            {overallScore < 60 && (
              <Badge className="bg-red-100 text-red-800 text-lg px-4 py-2">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Critical Issues
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getMetricIcon(metric.name)}
                  <h4 className="font-medium">{metric.name}</h4>
                  <Badge className={getStatusColor(metric.status)}>
                    {getStatusIcon(metric.status)}
                    <span className="ml-1 capitalize">{metric.status}</span>
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {metric.value !== undefined && metric.target !== undefined && (
                    <span className="text-sm text-gray-500">
                      {metric.value.toFixed(1)}% / {metric.target.toFixed(1)}%
                    </span>
                  )}
                  <span className={`font-bold ${getScoreColor(metric.score)}`}>
                    {metric.score}
                  </span>
                  {getTrendIcon(metric.trend)}
                </div>
              </div>
              <Progress value={metric.score} className="mb-2" />
              <p className="text-sm text-gray-600">{metric.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};