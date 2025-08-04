import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategorizedOrderBuilder } from './CategorizedOrderBuilder';
import { PriceComparisonTable } from './PriceComparisonTable';
import { OrderSummary } from './OrderSummary';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { type OrderCategory } from '@/constants/orderCategories';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: OrderCategory;
  selectedSupplier?: {
    id: string;
    name: string;
    price: number;
  };
  alternatives: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  notes?: string;
}

export const OrderCreationWorkflow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderName, setOrderName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const steps = [
    { id: 1, title: 'Build Order by Category', component: 'list' },
    { id: 2, title: 'Compare Prices', component: 'compare' },
    { id: 3, title: 'Review & Send', component: 'summary' }
  ];

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="space-y-6">
      {/* Order Name and Delivery Date */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order Name</label>
                <input
                  type="text"
                  value={orderName}
                  onChange={(e) => setOrderName(e.target.value)}
                  placeholder="Weekly Order - Week 1"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {step.id}
            </div>
            <span className={`ml-2 text-sm ${
              currentStep >= step.id ? 'text-blue-600 font-medium' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>
      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <CategorizedOrderBuilder
              orderItems={orderItems}
              setOrderItems={setOrderItems}
            />
          )}
          
          {currentStep === 2 && (
            <PriceComparisonTable
              orderItems={orderItems}
              setOrderItems={setOrderItems}
            />
          )}
          
          {currentStep === 3 && (
            <OrderSummary
              orderItems={orderItems}
              orderName={orderName}
              deliveryDate={deliveryDate}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={currentStep === 3}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};