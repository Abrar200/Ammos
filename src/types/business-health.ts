// src/types/business-health.ts
export interface HealthMetric {
    name: string;
    score: number;
    status: 'good' | 'warning' | 'critical';
    description: string;
    trend: 'up' | 'down' | 'stable';
    value?: number;
    target?: number;
  }
  
  export interface HealthAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    action?: string;
    actionPath?: string;
  }
  
  export interface BusinessHealthData {
    overallScore: number;
    metrics: HealthMetric[];
    alerts: HealthAlert[];
    weeklyTrend: number;
    criticalIssues: number;
  }