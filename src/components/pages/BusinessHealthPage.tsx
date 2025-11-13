import { useState, useEffect } from 'react';
import { BusinessHealthScore } from '@/components/BusinessHealthScore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { HealthMetric, HealthAlert, BusinessHealthData } from '@/types/business-health';
import { useNavigate } from 'react-router-dom';

export const BusinessHealthPage = () => {
  const [healthData, setHealthData] = useState<BusinessHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinessHealthData();
  }, []);

  const fetchBusinessHealthData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [
        { data: monthlyTakings },
        { data: weeklyTakings },
        { data: suppliers },
        { data: subscriptions },
        { data: payrollRecords },
        { data: staff },
        { data: expiringCerts }
      ] = await Promise.all([
        supabase
          .from('takings')
          .select('gross_takings, pos_amount, eft_amount, cash_amount')
          .gte('entry_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        
        supabase
          .from('takings')
          .select('gross_takings')
          .gte('entry_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        supabase
          .from('suppliers')
          .select('monthly_total'),
        
        supabase
          .from('subscriptions')
          .select('cost, billing_cycle')
          .eq('status', 'active'),
        
        supabase
          .from('payroll_records')
          .select('gross_pay')
          .gte('pay_period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        
        supabase
          .from('staff')
          .select('id, hourly_rate, employment_type')
          .eq('is_active', true),
        
        supabase
          .from('staff_certifications')
          .select('id')
          .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .gte('expiry_date', new Date().toISOString().split('T')[0])
      ]);

      // Calculate metrics
      const monthlyRevenue = monthlyTakings?.reduce((sum, taking) => sum + taking.gross_takings, 0) || 0;
      const weeklyRevenue = weeklyTakings?.reduce((sum, taking) => sum + taking.gross_takings, 0) || 0;
      const supplierCosts = suppliers?.reduce((sum, supplier) => sum + (supplier.monthly_total || 0), 0) || 0;
      
      // Calculate subscription costs (monthly equivalent)
      const subscriptionCosts = subscriptions?.reduce((sum, sub) => {
        const cost = parseFloat(sub.cost) || 0;
        switch (sub.billing_cycle?.toLowerCase()) {
          case 'monthly': return sum + cost;
          case 'weekly': return sum + (cost * 4.33);
          case 'yearly': return sum + (cost / 12);
          case 'quarterly': return sum + (cost / 3);
          default: return sum + cost;
        }
      }, 0) || 0;

      const payrollCosts = payrollRecords?.reduce((sum, record) => sum + (parseFloat(record.gross_pay) || 0), 0) || 0;
      const totalExpenses = supplierCosts + subscriptionCosts + payrollCosts;
      const profit = monthlyRevenue - totalExpenses;
      const profitMargin = monthlyRevenue > 0 ? (profit / monthlyRevenue) * 100 : 0;

      // Calculate labour to sales ratio
      const labourToSalesRatio = monthlyRevenue > 0 ? (payrollCosts / monthlyRevenue) * 100 : 0;

      // Calculate subscription efficiency (target: <5% of revenue)
      const subscriptionEfficiency = monthlyRevenue > 0 ? Math.max(0, 100 - ((subscriptionCosts / monthlyRevenue) * 100 * 20)) : 100;

      // Calculate compliance score based on expiring certifications
      const totalStaff = staff?.length || 1;
      const expiringCertCount = expiringCerts?.length || 0;
      const complianceScore = Math.max(0, 100 - (expiringCertCount / totalStaff) * 100);

      // Create health metrics
      const metrics: HealthMetric[] = [
        {
          name: 'Profit Margin',
          score: Math.min(100, Math.max(0, profitMargin * 1.5)), // Scale for scoring
          status: profitMargin >= 15 ? 'good' : profitMargin >= 10 ? 'warning' : 'critical',
          description: profitMargin >= 0 
            ? `${profitMargin.toFixed(1)}% profit margin (target: 15%)`
            : `Operating at a loss of ${Math.abs(profitMargin).toFixed(1)}%`,
          trend: profitMargin >= 15 ? 'up' : profitMargin >= 10 ? 'stable' : 'down',
          value: profitMargin,
          target: 15
        },
        {
          name: 'Labour to Sales Ratio',
          score: Math.max(0, 100 - (labourToSalesRatio * 2)), // Lower ratio = higher score
          status: labourToSalesRatio <= 28 ? 'good' : labourToSalesRatio <= 32 ? 'warning' : 'critical',
          description: `${labourToSalesRatio.toFixed(1)}% labour cost (target: ≤28%)`,
          trend: labourToSalesRatio <= 28 ? 'up' : labourToSalesRatio <= 32 ? 'stable' : 'down',
          value: labourToSalesRatio,
          target: 28
        },
        {
          name: 'Subscription Cost Efficiency',
          score: Math.min(100, subscriptionEfficiency),
          status: subscriptionEfficiency >= 80 ? 'good' : subscriptionEfficiency >= 60 ? 'warning' : 'critical',
          description: `Subscription costs at ${((subscriptionCosts / monthlyRevenue) * 100).toFixed(1)}% of revenue`,
          trend: 'stable',
          value: subscriptionEfficiency,
          target: 80
        },
        {
          name: 'Compliance Status',
          score: complianceScore,
          status: complianceScore >= 90 ? 'good' : complianceScore >= 70 ? 'warning' : 'critical',
          description: expiringCertCount > 0 
            ? `${expiringCertCount} certification${expiringCertCount !== 1 ? 's' : ''} expiring within 30 days`
            : 'All certifications current',
          trend: expiringCertCount === 0 ? 'up' : 'down'
        }
      ];

      // Calculate overall score
      const overallScore = Math.round(metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length);

      // Generate alerts based on metrics
      const alerts: HealthAlert[] = [];
      
      if (profitMargin < 10) {
        alerts.push({
          id: 'profit-warning',
          type: profitMargin < 0 ? 'critical' : 'warning',
          title: profitMargin < 0 ? 'Operating at a Loss' : 'Low Profit Margin',
          description: `Current profit margin is ${profitMargin.toFixed(1)}% (target: 15%)`,
          action: 'Review Expenses',
          actionPath: '/outgoings'
        });
      }

      if (labourToSalesRatio > 30) {
        alerts.push({
          id: 'labour-warning',
          type: labourToSalesRatio > 35 ? 'critical' : 'warning',
          title: 'High Labour Costs',
          description: `Labour to sales ratio at ${labourToSalesRatio.toFixed(1)}% (target: ≤28%)`,
          action: 'Optimize Roster',
          actionPath: '/roster'
        });
      }

      if (expiringCertCount > 0) {
        alerts.push({
          id: 'certification-warning',
          type: expiringCertCount > 3 ? 'critical' : 'warning',
          title: 'Staff Certifications Expiring',
          description: `${expiringCertCount} certification${expiringCertCount !== 1 ? 's' : ''} expiring within 30 days`,
          action: 'Review Certifications',
          actionPath: '/staff'
        });
      }

      if (subscriptionCosts / monthlyRevenue > 0.1) { // More than 10% of revenue
        alerts.push({
          id: 'subscription-warning',
          type: 'warning',
          title: 'High Subscription Costs',
          description: `Subscriptions account for ${((subscriptionCosts / monthlyRevenue) * 100).toFixed(1)}% of revenue`,
          action: 'Review Subscriptions',
          actionPath: '/subscriptions'
        });
      }

      // If no critical alerts, add positive message
      if (alerts.length === 0) {
        alerts.push({
          id: 'all-good',
          type: 'info',
          title: 'Business Health Excellent',
          description: 'All key metrics are within target ranges',
          action: 'View Details'
        });
      }

      const criticalIssues = alerts.filter(alert => alert.type === 'critical').length;

      setHealthData({
        overallScore,
        metrics,
        alerts,
        weeklyTrend: 0, // You could calculate this by comparing with last week
        criticalIssues
      });

    } catch (error) {
      console.error('Error fetching business health data:', error);
      toast({
        title: "Error",
        description: "Failed to load business health data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'info': return <CheckCircle className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  const handleAlertAction = (actionPath?: string) => {
    if (actionPath) {
      // Navigate to the specified path
      navigate(actionPath);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Health Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor key performance indicators and business health metrics</p>
          </div>
          <Button variant="outline" disabled>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Health Score</CardTitle>
              <CardDescription>Loading health metrics...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Health Alerts</CardTitle>
              <CardDescription>Loading alerts...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Unable to load health data</h2>
        <p className="text-gray-600 mt-2">Please try refreshing the page</p>
        <Button onClick={fetchBusinessHealthData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Health Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor key performance indicators and business health metrics</p>
        </div>
        <Button variant="outline" onClick={fetchBusinessHealthData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BusinessHealthScore 
          metrics={healthData.metrics} 
          overallScore={healthData.overallScore}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Health Alerts</CardTitle>
            <CardDescription>
              Issues requiring attention to maintain business health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthData.alerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.description}</p>
                      {alert.action && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => handleAlertAction(alert.actionPath)}
                        >
                          {alert.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Score Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{healthData.weeklyTrend} points</div>
            <p className="text-xs text-muted-foreground">Improvement from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Review</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground">Weekly health check</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Key business metrics driving your health score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {healthData.metrics.map((metric, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className={`text-2xl font-bold ${metric.status === 'good' ? 'text-green-600' : metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {metric.score}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">{metric.name}</div>
                <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};