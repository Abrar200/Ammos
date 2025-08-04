import { useState, useEffect } from 'react';
import { lightspeedOSeriesService } from '@/services/lightspeedOSeries';

interface ORevenueData {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    yearRevenue: number;
    todayTransactions: number;
    averageOrderValue: number;
    topSellingItems: Array<{
        name: string;
        quantity: number;
        revenue: number;
    }>;
    hourlyBreakdown: Array<{
        hour: number;
        revenue: number;
        transactions: number;
    }>;
}

export const useOSeriesRevenueData = (refreshInterval = 120000) => { // 2 minutes for O-Series
    const [data, setData] = useState<ORevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');

    const testConnection = async () => {
        try {
            setConnectionStatus('testing');
            const result = await lightspeedOSeriesService.testConnection();
            setConnectionStatus(result.success ? 'connected' : 'disconnected');
            return result;
        } catch (err) {
            setConnectionStatus('disconnected');
            return { success: false, message: 'Connection test failed' };
        }
    };

    const fetchRevenueData = async () => {
        try {
            setError(null);
            const revenueData = await lightspeedOSeriesService.getRevenueData();
            setData(revenueData);
            setLastUpdated(new Date());
            setConnectionStatus('connected');
        } catch (err: any) {
            setError(err.message || 'Failed to fetch revenue data');
            setConnectionStatus('disconnected');
            console.error('Revenue data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial connection test
        testConnection().then(() => {
            // Initial data fetch
            fetchRevenueData();
        });

        // Set up interval for periodic updates
        const interval = setInterval(fetchRevenueData, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval]);

    return {
        data,
        loading,
        error,
        lastUpdated,
        connectionStatus,
        refetch: fetchRevenueData,
        testConnection
    };
};