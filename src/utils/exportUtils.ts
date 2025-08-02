// Utility functions for exporting data

export interface ExportableOutgoing {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  supplier: string;
}

export const exportToCSV = (data: ExportableOutgoing[], filename: string = 'outgoings') => {
  // Create CSV headers
  const headers = ['Date', 'Description', 'Supplier', 'Category', 'Amount'];
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.date,
      `"${row.description}"`, // Wrap in quotes to handle commas
      `"${row.supplier}"`,
      row.category,
      row.amount.toFixed(2)
    ].join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const filterByDateRange = (
  data: ExportableOutgoing[], 
  fromDate?: string, 
  toDate?: string
): ExportableOutgoing[] => {
  return data.filter(item => {
    const itemDate = new Date(item.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && itemDate < from) return false;
    if (to && itemDate > to) return false;
    
    return true;
  });
};