import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, X } from 'lucide-react';

interface License {
  id: string;
  licence_name: string;
  licence_type: string;
  licence_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: 'Active' | 'Expired' | 'Pending' | 'Suspended';
  cost?: number;
  renewal_frequency?: string;
  document_url?: string;
  notes?: string;
}

interface EditLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: License | null;
  onSuccess: () => void;
}

export default function EditLicenseDialog({ open, onOpenChange, license, onSuccess }: EditLicenseDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    licence_name: '',
    licence_type: '',
    licence_number: '',
    issuing_authority: '',
    issue_date: '',
    expiry_date: '',
    status: 'Active',
    cost: '',
    renewal_frequency: '',
    notes: ''
  });

  useEffect(() => {
    if (license) {
      setFormData({
        licence_name: license.licence_name,
        licence_type: license.licence_type,
        licence_number: license.licence_number,
        issuing_authority: license.issuing_authority,
        issue_date: license.issue_date,
        expiry_date: license.expiry_date,
        status: license.status,
        cost: license.cost?.toString() || '',
        renewal_frequency: license.renewal_frequency || '',
        notes: license.notes || ''
      });
      setSelectedFile(null);
    }
  }, [license]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or image file (JPG, PNG)",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadDocument = async (licenceId: string): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${licenceId}-${Date.now()}.${fileExt}`;
      const filePath = `licences/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    setLoading(true);

    try {
      const licenseData = {
        licence_name: formData.licence_name,
        licence_type: formData.licence_type,
        licence_number: formData.licence_number,
        issuing_authority: formData.issuing_authority,
        issue_date: formData.issue_date,
        expiry_date: formData.expiry_date,
        status: formData.status,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        renewal_frequency: formData.renewal_frequency || null,
        notes: formData.notes || null,
        updated_at: new Date().toISOString()
      };

      // If a new file was selected, upload it
      let documentUrl = license.document_url;
      if (selectedFile) {
        documentUrl = await uploadDocument(license.id);
      }

      // Update the license record
      const { error: updateError } = await supabase
        .from('licences')
        .update({
          ...licenseData,
          ...(documentUrl && { document_url: documentUrl })
        })
        .eq('id', license.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "License updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating license:', error);
      toast({
        title: "Error",
        description: "Failed to update license",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit License</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licence_name">License Name *</Label>
              <Input
                id="licence_name"
                value={formData.licence_name}
                onChange={(e) => setFormData({...formData, licence_name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="licence_type">License Type *</Label>
              <Select 
                value={formData.licence_type} 
                onValueChange={(value) => setFormData({...formData, licence_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Liquor Licence">Liquor Licence</SelectItem>
                  <SelectItem value="Food Business Licence">Food Business Licence</SelectItem>
                  <SelectItem value="Outdoor Dining Permit">Outdoor Dining Permit</SelectItem>
                  <SelectItem value="Health & Safety Certificate">Health & Safety Certificate</SelectItem>
                  <SelectItem value="Music Licence">Music Licence</SelectItem>
                  <SelectItem value="Gaming Machine Licence">Gaming Machine Licence</SelectItem>
                  <SelectItem value="Council Permit">Council Permit</SelectItem>
                  <SelectItem value="Food Safety Certificate">Food Safety Certificate</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licence_number">License Number *</Label>
              <Input
                id="licence_number"
                value={formData.licence_number}
                onChange={(e) => setFormData({...formData, licence_number: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="issuing_authority">Issuing Authority *</Label>
              <Input
                id="issuing_authority"
                value={formData.issuing_authority}
                onChange={(e) => setFormData({...formData, issuing_authority: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="issue_date">Issue Date *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="expiry_date">Expiry Date *</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="renewal_frequency">Renewal Frequency</Label>
              <Select 
                value={formData.renewal_frequency} 
                onValueChange={(value) => setFormData({...formData, renewal_frequency: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annually">Annually</SelectItem>
                  <SelectItem value="Biannually">Biannually</SelectItem>
                  <SelectItem value="Every 3 Years">Every 3 Years</SelectItem>
                  <SelectItem value="Every 5 Years">Every 5 Years</SelectItem>
                  <SelectItem value="One-time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <Label htmlFor="document">Upload New Document (PDF, JPG, PNG - Max 5MB)</Label>
            <p className="text-sm text-gray-500 mb-2">
              Current document: {license.document_url ? 'Uploaded' : 'No document'}
            </p>
            <div className="mt-2">
              {!selectedFile ? (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="document"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <Input
                      id="document"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <File className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes, restrictions, or renewal instructions..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading || uploading ? 'Updating...' : 'Update License'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}