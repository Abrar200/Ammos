import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
  onSuccess: () => void;
}

const certificationTypes = [
  'RSA Certificate',
  'Approved Responsible Person',
  'Food Safety Certification',
  'First Aid Certificate',
  'RSG',
  'White Card',
  'WWCC',
  'Employment Contract',
  'CV',
  'Visa Documents',
  'Other'
];

export function CertificationUpload({ isOpen, onClose, staffId, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    certification_type: '',
    certification_name: '',
    issue_date: '',
    expiry_date: '',
    notes: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 10MB',
          variant: 'destructive'
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${staffId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('staff-documents')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('staff-documents')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.certification_type || !formData.certification_name) {
      toast({
        title: 'Error',
        description: 'Please fill in required fields',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      let documentUrl = null;
      
      if (file) {
        documentUrl = await uploadFile(file);
        if (!documentUrl) {
          throw new Error('Failed to upload file');
        }
      }

      const { error } = await supabase
        .from('staff_certifications')
        .insert({
          staff_id: staffId,
          ...formData,
          document_url: documentUrl
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Certification added successfully'
      });

      // Reset form
      setFormData({
        certification_type: '',
        certification_name: '',
        issue_date: '',
        expiry_date: '',
        notes: ''
      });
      setFile(null);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to add certification',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Certification</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Certification Type *</Label>
            <Select
              value={formData.certification_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, certification_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select certification type" />
              </SelectTrigger>
              <SelectContent>
                {certificationTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Certification Name *</Label>
            <Input
              value={formData.certification_name}
              onChange={(e) => setFormData(prev => ({ ...prev, certification_name: e.target.value }))}
              placeholder="e.g. RSA Certificate - NSW"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Upload Document</Label>
            <div className="mt-1">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
              >
                <div className="text-center">
                  {file ? (
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload document</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG, DOC (max 10MB)</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="flex-1">
              {uploading ? 'Adding...' : 'Add Certification'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}