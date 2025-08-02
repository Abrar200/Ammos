import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus, FileText, Calendar, AlertTriangle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Qualification {
  id: string;
  name: string;
  required: boolean;
  expiryDays: number;
  reminderDays: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
}

export const ComplianceSettings: React.FC = () => {
  const { toast } = useToast();
  const [qualifications, setQualifications] = useState<Qualification[]>([
    { id: '1', name: 'RSA Certificate', required: true, expiryDays: 1095, reminderDays: 30 },
    { id: '2', name: 'First Aid Certificate', required: true, expiryDays: 1095, reminderDays: 60 },
    { id: '3', name: 'Food Safety Certificate', required: true, expiryDays: 1825, reminderDays: 90 },
    { id: '4', name: 'Responsible Person License', required: false, expiryDays: 365, reminderDays: 30 },
  ]);

  const [templates, setTemplates] = useState<DocumentTemplate[]>([
    { id: '1', name: 'Employment Contract Template', type: 'PDF', uploadDate: '2024-01-10' },
    { id: '2', name: 'Onboarding Checklist', type: 'PDF', uploadDate: '2024-01-08' },
    { id: '3', name: 'Staff Handbook', type: 'PDF', uploadDate: '2024-01-05' },
  ]);

  const [newQualification, setNewQualification] = useState({
    name: '',
    required: true,
    expiryDays: 365,
    reminderDays: 30,
  });

  const [isAddQualDialogOpen, setIsAddQualDialogOpen] = useState(false);

  const handleAddQualification = () => {
    const qualification: Qualification = {
      id: Date.now().toString(),
      ...newQualification,
    };
    setQualifications(prev => [...prev, qualification]);
    setNewQualification({ name: '', required: true, expiryDays: 365, reminderDays: 30 });
    setIsAddQualDialogOpen(false);
    toast({
      title: "Qualification Added",
      description: `${qualification.name} has been added to required qualifications.`,
    });
  };

  const toggleRequired = (id: string) => {
    setQualifications(prev => prev.map(qual => 
      qual.id === id ? { ...qual, required: !qual.required } : qual
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const template: DocumentTemplate = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : 'DOC',
        uploadDate: new Date().toISOString().split('T')[0],
      };
      setTemplates(prev => [...prev, template]);
      toast({
        title: "Template Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Required Qualifications
            </CardTitle>
            <Dialog open={isAddQualDialogOpen} onOpenChange={setIsAddQualDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-ammos-primary hover:bg-ammos-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Qualification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Qualification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="qualName">Qualification Name</Label>
                    <Input
                      id="qualName"
                      value={newQualification.name}
                      onChange={(e) => setNewQualification(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. RSA Certificate"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={newQualification.required}
                      onCheckedChange={(checked) => setNewQualification(prev => ({ ...prev, required: checked }))}
                    />
                    <Label htmlFor="required">Required for all staff</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDays">Valid for (days)</Label>
                      <Input
                        id="expiryDays"
                        type="number"
                        value={newQualification.expiryDays}
                        onChange={(e) => setNewQualification(prev => ({ ...prev, expiryDays: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminderDays">Remind before (days)</Label>
                      <Input
                        id="reminderDays"
                        type="number"
                        value={newQualification.reminderDays}
                        onChange={(e) => setNewQualification(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddQualification} className="w-full bg-ammos-primary hover:bg-ammos-primary/90">
                    Add Qualification
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Qualification</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Valid For</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualifications.map((qual) => (
                <TableRow key={qual.id}>
                  <TableCell className="font-medium">{qual.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={qual.required}
                      onCheckedChange={() => toggleRequired(qual.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {Math.floor(qual.expiryDays / 365)} years
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      {qual.reminderDays} days
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Templates
            </CardTitle>
            <div>
              <Label htmlFor="templateUpload" className="cursor-pointer">
                <div className="flex items-center gap-2 bg-ammos-primary text-white px-4 py-2 rounded-md hover:bg-ammos-primary/90">
                  <Upload className="w-4 h-4" />
                  Upload Template
                </div>
              </Label>
              <Input
                id="templateUpload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ammos-secondary rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-ammos-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-gray-500">Uploaded {template.uploadDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{template.type}</Badge>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};