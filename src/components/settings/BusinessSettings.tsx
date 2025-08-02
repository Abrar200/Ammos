import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Building2, Clock, DollarSign, Mail, Phone, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const BusinessSettings: React.FC = () => {
  const { toast } = useToast();
  const [businessData, setBusinessData] = useState({
    name: 'Ammos Greek Bistro',
    abn: '12 345 678 901',
    acn: '123 456 789',
    address: '123 Restaurant Street, Sydney NSW 2000',
    contactEmail: 'info@ammos.com.au',
    contactPhone: '+61 2 9876 5432',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    gstRate: '10',
    logo: null as File | null,
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Business settings have been updated successfully.",
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBusinessData(prev => ({ ...prev, logo: file }));
      toast({
        title: "Logo Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessData.name}
                onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="abn">ABN</Label>
              <Input
                id="abn"
                value={businessData.abn}
                onChange={(e) => setBusinessData(prev => ({ ...prev, abn: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="acn">ACN</Label>
              <Input
                id="acn"
                value={businessData.acn}
                onChange={(e) => setBusinessData(prev => ({ ...prev, acn: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="contactEmail"
                  type="email"
                  className="pl-10"
                  value={businessData.contactEmail}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, contactEmail: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="contactPhone"
                  type="tel"
                  className="pl-10"
                  value={businessData.contactPhone}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Business Address</Label>
            <Textarea
              id="address"
              value={businessData.address}
              onChange={(e) => setBusinessData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Regional & Financial Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Timezone</Label>
              <Select value={businessData.timezone} onValueChange={(value) => setBusinessData(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                  <SelectItem value="Australia/Melbourne">Australia/Melbourne</SelectItem>
                  <SelectItem value="Australia/Brisbane">Australia/Brisbane</SelectItem>
                  <SelectItem value="Australia/Perth">Australia/Perth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Currency</Label>
              <Select value={businessData.currency} onValueChange={(value) => setBusinessData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gstRate">Default GST/Tax Rate (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="gstRate"
                  type="number"
                  className="pl-10"
                  value={businessData.gstRate}
                  onChange={(e) => setBusinessData(prev => ({ ...prev, gstRate: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-ammos-secondary rounded-lg flex items-center justify-center">
              <Building2 className="w-8 h-8 text-ammos-primary" />
            </div>
            <div>
              <Label htmlFor="logo" className="cursor-pointer">
                <div className="flex items-center gap-2 bg-ammos-primary text-white px-4 py-2 rounded-md hover:bg-ammos-primary/90">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </div>
              </Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="bg-ammos-primary hover:bg-ammos-primary/90">
        Save Business Settings
      </Button>
    </div>
  );
};