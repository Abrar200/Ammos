import { supabase } from '@/lib/supabase';

interface LightspeedConfig {
    apiKey: string;
    accountId: string;
    shopId: string;
    baseUrl: string;
}

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

class LightspeedService {
    private config: LightspeedConfig | null = null;

    async getConfig(): Promise<LightspeedConfig | null> {
        try {
            // Get Lightspeed configuration from integrations table
            const { data, error } = await supabase
                .from('integrations')
                .select('*')
                .eq('service_name', 'Lightspeed POS')
                .eq('status', 'connected')
                .single();

            if (error || !data) {
                console.log('Lightspeed POS not configured');
                return null;
            }

            this.config = {
                apiKey: data.api_key,
                accountId: data.account_id,
                shopId: data.shop_id,
                baseUrl: data.endpoint_url || 'https://api.lightspeedapp.com/API'
            };

            return this.config;
        } catch (error) {
            console.error('Error getting Lightspeed config:', error);
            return null;
        }
    }

    async getRevenueData(): Promise<RevenueData> {
        try {
            // For now, return mock data
            // TODO: Implement actual Lightspeed API calls when credentials are configured

            const config = await this.getConfig();
            if (!config) {
                throw new Error('Lightspeed POS not configured');
            }

            // Mock implementation - replace with actual API calls
            return this.getMockRevenueData();
        } catch (error) {
            console.error('Error getting revenue data:', error);
            // Return mock data if API fails
            return this.getMockRevenueData();
        }
    }

    private getMockRevenueData(): RevenueData {
        // Add some randomness to simulate live data
        const baseRevenue = 2500;
        const randomVariation = Math.random() * 500;
        const todayRevenue = baseRevenue + randomVariation;

        return {
            todayRevenue: Math.round(todayRevenue * 100) / 100,
            weekRevenue: Math.round((todayRevenue * 6.5) * 100) / 100,
            monthRevenue: Math.round((todayRevenue * 28) * 100) / 100,
            yearRevenue: Math.round((todayRevenue * 350) * 100) / 100,
            todayTransactions: Math.floor(todayRevenue / 63) + Math.floor(Math.random() * 10),
            averageOrderValue: Math.round((todayRevenue / 45) * 100) / 100,
            topSellingItems: [
                { name: 'Souvlaki Platter', quantity: 125, revenue: 3562.50 },
                { name: 'Lamb Gyros', quantity: 98, revenue: 3136.00 },
                { name: 'Moussaka', quantity: 87, revenue: 2305.50 },
                { name: 'Greek Salad', quantity: 156, revenue: 2886.00 },
                { name: 'Grilled Octopus', quantity: 65, revenue: 2275.00 }
            ]
        };
    }
}

export const lightspeedService = new LightspeedService();