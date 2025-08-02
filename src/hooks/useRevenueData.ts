import { useState, useEffect } from 'react';

interface RevenueData {
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
}

export const useRevenueData = (refreshInterval = 30000) => { // 30 seconds default
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchRevenueData = async () => {
        try {
            setError(null);

            // For now, return mock data since Lightspeed integration isn't set up yet
            // In production, this would call lightspeedService.getRevenueData()
            const mockRevenueData: RevenueData = {
                todayRevenue: 2845.50,
                weekRevenue: 18320.75,
                monthRevenue: 85420.25,
                yearRevenue: 1250000.00,
                todayTransactions: 45,
                averageOrderValue: 63.23,
                topSellingItems: [
                    { name: 'Souvlaki Platter', quantity: 125, revenue: 3562.50 },
                    { name: 'Lamb Gyros', quantity: 98, revenue: 3136.00 },
                    { name: 'Moussaka', quantity: 87, revenue: 2305.50 },
                    { name: 'Greek Salad', quantity: 156, revenue: 2886.00 },
                    { name: 'Grilled Octopus', quantity: 65, revenue: 2275.00 }
                ]
            };

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            setData(mockRevenueData);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to fetch revenue data');
            console.error('Revenue data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchRevenueData();

        // Set up interval for periodic updates
        const interval = setInterval(fetchRevenueData, refreshInterval);

        return () => clearInterval(interval);
    }, [refreshInterval]);

    return {
        data,
        loading,
        error,
        lastUpdated,
        refetch: fetchRevenueData
    };
};