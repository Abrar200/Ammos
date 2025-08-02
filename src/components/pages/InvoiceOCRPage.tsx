import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, AlertTriangle, CheckCircle, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface InvoiceData {
  id: string;
  fileName: string;
  supplier: string;
  invoiceDate: string;
  totalAmount: number;
  category: string;
  items: { name: string; price: number }[];
  status: 'processing' | 'processed' | 'approved' | 'rejected';
  confidence: number;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
}

export const InvoiceOCRPage = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { toast } = useToast();

  const categories = [
    'Food & Beverage',
    'Beverages',
    'Equipment & Maintenance',
    'Utilities',
    'Marketing',
    'Staff Expenses',
    'Rent & Facilities',
    'Other'
  ];

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInvoices = data?.map(expense => ({
        id: expense.id,
        fileName: expense.file_name || 'Unknown',
        supplier: expense.supplier_name,
        invoiceDate: expense.invoice_date,
        totalAmount: parseFloat(expense.total_amount),
        category: expense.category,
        items: expense.ocr_data?.items || [],
        status: expense.status,
        confidence: expense.ocr_confidence || 0,
        invoiceNumber: expense.invoice_number || '',
        subtotal: parseFloat(expense.subtotal || '0'),
        taxAmount: parseFloat(expense.tax_amount || '0')
      })) || [];

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    toast({
      title: "Processing Invoice",
      description: `Scanning ${file.name} with OCR...`,
    });

    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Call OCR function
      const { data: ocrResult, error } = await supabase.functions.invoke('process-invoice-ocr', {
        body: { fileData, fileName: file.name }
      });

      if (error) throw error;

      // Save to database
      const { error: dbError } = await supabase
        .from('expenses')
        .insert({
          invoice_number: ocrResult.invoiceNumber,
          supplier_name: ocrResult.supplier,
          invoice_date: ocrResult.invoiceDate,
          subtotal: parseFloat(ocrResult.subtotal),
          tax_amount: parseFloat(ocrResult.taxAmount),
          total_amount: parseFloat(ocrResult.totalAmount),
          category: ocrResult.category,
          file_name: ocrResult.fileName,
          ocr_confidence: ocrResult.confidence,
          ocr_data: { items: ocrResult.items },
          status: 'processed'
        });

      if (dbError) throw dbError;

      toast({
        title: "Invoice Processed",
        description: `Successfully extracted data from ${file.name}`,
      });

      // Reload invoices
      loadInvoices();

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const approveInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'approved' })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Invoice Approved",
        description: "Invoice has been approved and added to expenses",
      });

      loadInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve invoice",
        variant: "destructive"
      });
    }
  };

  const updateCategory = async (invoiceId: string, newCategory: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ category: newCategory })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Category Updated",
        description: "Invoice category has been updated",
      });

      loadInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'processing': return <Eye className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Invoice OCR</h1>
        <p className="text-gray-600 mt-2">Upload invoices for automatic data extraction and categorization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Invoice</CardTitle>
          <CardDescription>
            Upload PDF or image files for automatic OCR processing and expense categorization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
                <p className="mt-4 text-sm font-medium text-gray-900">Processing invoice...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Drop files here or click to upload
                    </span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  PDF, JPG, PNG up to 10MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processed Invoices</CardTitle>
          <CardDescription>
            Invoices processed with OCR data extraction and automatic categorization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No invoices processed yet. Upload an invoice to get started.</p>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{invoice.fileName}</p>
                        <p className="text-sm text-gray-500">{invoice.supplier} • {invoice.invoiceNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusIcon(invoice.status)}
                        <span className="ml-1 capitalize">{invoice.status}</span>
                      </Badge>
                      <span className="text-sm text-gray-500">{invoice.confidence}% confidence</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Date: {invoice.invoiceDate}</p>
                      <p className="text-gray-500">Subtotal: ${invoice.subtotal.toFixed(2)}</p>
                      <p className="text-gray-500">Tax: ${invoice.taxAmount.toFixed(2)}</p>
                      <p className="font-medium">Total: ${invoice.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-2">Category:</p>
                      <Select
                        value={invoice.category}
                        onValueChange={(value) => updateCategory(invoice.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-gray-500">Items: {invoice.items.length}</p>
                      <div className="flex space-x-2 mt-2">
                        {invoice.status === 'processed' && (
                          <Button 
                            size="sm" 
                            onClick={() => approveInvoice(invoice.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        )}
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  </div>

                  {invoice.items.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Extracted Items:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {invoice.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{item.name}</span>
                            <span className="font-medium">${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};