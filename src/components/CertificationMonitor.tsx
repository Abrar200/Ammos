// components/CertificationMonitor.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { emailService } from '@/lib/emailService';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Mail, Calendar, FileText, Users, Send } from 'lucide-react';

interface ExpiringCertification {
    id: string;
    staff_id: string;
    certification_type: string;
    certification_name: string;
    expiry_date: string;
    staff: {
        full_name: string;
        email: string;
        position: string;
    };
    days_until_expiry: number;
    status: 'expired' | 'critical' | 'warning' | 'valid';
}

interface CertificationStats {
    total: number;
    expired: number;
    expiringSoon: number;
    critical: number;
}

export const CertificationMonitor = () => {
    const [certifications, setCertifications] = useState<ExpiringCertification[]>([]);
    const [stats, setStats] = useState<CertificationStats>({ total: 0, expired: 0, expiringSoon: 0, critical: 0 });
    const [loading, setLoading] = useState(true);
    const [sendingAlerts, setSendingAlerts] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchExpiringCertifications();
    }, []);

    const fetchExpiringCertifications = async () => {
        try {
            setLoading(true);

            // Get certifications expiring within 60 days
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

            const { data, error } = await supabase
                .from('staff_certifications')
                .select(`
          *,
          staff:staff_id (
            full_name,
            email,
            position
          )
        `)
                .not('expiry_date', 'is', null)
                .lte('expiry_date', sixtyDaysFromNow.toISOString().split('T')[0])
                .order('expiry_date');

            if (error) throw error;

            const today = new Date();
            const processedCertifications = (data || []).map(cert => {
                const expiryDate = new Date(cert.expiry_date);
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                let status: 'expired' | 'critical' | 'warning' | 'valid' = 'valid';
                if (daysUntilExpiry < 0) status = 'expired';
                else if (daysUntilExpiry <= 7) status = 'critical';
                else if (daysUntilExpiry <= 30) status = 'warning';

                return {
                    ...cert,
                    days_until_expiry: daysUntilExpiry,
                    status
                };
            });

            setCertifications(processedCertifications);

            // Calculate stats
            const newStats = {
                total: processedCertifications.length,
                expired: processedCertifications.filter(c => c.status === 'expired').length,
                expiringSoon: processedCertifications.filter(c => c.status === 'warning').length,
                critical: processedCertifications.filter(c => c.status === 'critical').length
            };
            setStats(newStats);

        } catch (error) {
            console.error('Error fetching certifications:', error);
            toast({
                title: 'Error',
                description: 'Failed to load certification data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const sendExpiryAlerts = async () => {
        setSendingAlerts(true);
        try {
            // Group certifications by staff member
            const certsByStaff = certifications.reduce((acc, cert) => {
                if (cert.status === 'expired' || cert.status === 'critical' || cert.status === 'warning') {
                    if (!acc[cert.staff_id]) {
                        acc[cert.staff_id] = {
                            staff: cert.staff,
                            certifications: []
                        };
                    }
                    acc[cert.staff_id].certifications.push(cert);
                }
                return acc;
            }, {} as Record<string, any>);

            const emailPromises = Object.values(certsByStaff).map(async (staffData: any) => {
                try {
                    await emailService.sendExpiringCertificationAlert(staffData.staff, staffData.certifications);
                    return { success: true, staff: staffData.staff.full_name };
                } catch (error) {
                    console.error(`Failed to send alert to ${staffData.staff.full_name}:`, error);
                    return { success: false, staff: staffData.staff.full_name };
                }
            });

            const results = await Promise.all(emailPromises);
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);

            if (successful.length > 0) {
                toast({
                    title: 'Alerts Sent',
                    description: `Successfully sent certification alerts to ${successful.length} staff members`
                });
            }

            if (failed.length > 0) {
                toast({
                    title: 'Some Alerts Failed',
                    description: `Failed to send alerts to ${failed.length} staff members`,
                    variant: 'destructive'
                });
            }

        } catch (error) {
            console.error('Error sending alerts:', error);
            toast({
                title: 'Error',
                description: 'Failed to send certification alerts',
                variant: 'destructive'
            });
        } finally {
            setSendingAlerts(false);
        }
    };

    const getStatusBadge = (status: string, daysUntilExpiry: number) => {
        switch (status) {
            case 'expired':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Expired
                    </Badge>
                );
            case 'critical':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {daysUntilExpiry} days
                    </Badge>
                );
            case 'warning':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysUntilExpiry} days
                    </Badge>
                );
            default:
                return (
                    <Badge variant="default" className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysUntilExpiry} days
                    </Badge>
                );
        }
    };

    if (loading) {
        return <div className="p-6">Loading certification data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Alert Summary */}
            {(stats.expired > 0 || stats.critical > 0) && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="flex items-center justify-between">
                            <span>
                                {stats.expired > 0 && `${stats.expired} expired`}
                                {stats.expired > 0 && stats.critical > 0 && ', '}
                                {stats.critical > 0 && `${stats.critical} critical certifications need immediate attention`}
                            </span>
                            <Button
                                size="sm"
                                onClick={sendExpiryAlerts}
                                disabled={sendingAlerts}
                                className="ml-4"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                {sendingAlerts ? 'Sending...' : 'Send Alerts'}
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm text-gray-600">Total Tracked</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div>
                                <p className="text-sm text-gray-600">Expired</p>
                                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-600">Critical (≤7 days)</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.critical}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-yellow-600" />
                            <div>
                                <p className="text-sm text-gray-600">Expiring Soon</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Certifications List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Certification Alerts
                        </CardTitle>
                        <Button
                            onClick={fetchExpiringCertifications}
                            variant="outline"
                            size="sm"
                        >
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {certifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>No certifications requiring attention</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {certifications.map((cert) => (
                                <div
                                    key={cert.id}
                                    className={`p-4 border rounded-lg ${cert.status === 'expired' ? 'border-red-200 bg-red-50' :
                                            cert.status === 'critical' ? 'border-orange-200 bg-orange-50' :
                                                cert.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                                                    'border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="font-medium text-lg">{cert.staff.full_name}</div>
                                                <Badge variant="outline">{cert.staff.position}</Badge>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="font-medium">{cert.certification_name}</div>
                                                <div className="text-sm text-gray-600">{cert.certification_type}</div>
                                                <div className="text-sm">
                                                    <span className="font-medium">Expires:</span> {new Date(cert.expiry_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {getStatusBadge(cert.status, cert.days_until_expiry)}
                                            <div className="mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => emailService.sendExpiringCertificationAlert(cert.staff, [cert])}
                                                >
                                                    <Send className="w-4 h-4 mr-1" />
                                                    Send Alert
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};