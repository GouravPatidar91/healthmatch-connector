import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Plus, X } from 'lucide-react';
import { orderManagementService } from '@/services/orderManagementService';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface NewMedicineItem {
  name: string;
  quantity: number;
  unit_price: number;
}

interface VendorPriceEditorProps {
  orderId: string;
  orderStatus: string;
  items: OrderItem[];
  currentHandlingCharges: number;
  currentDeliveryFee: number;
  onPricesUpdated: () => void;
}

export const VendorPriceEditor: React.FC<VendorPriceEditorProps> = ({
  orderId,
  orderStatus,
  items,
  currentHandlingCharges,
  currentDeliveryFee,
  onPricesUpdated
}) => {
  const [prices, setPrices] = useState<{ [key: string]: string }>({});
  const [newMedicines, setNewMedicines] = useState<NewMedicineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('VendorPriceEditor - Items:', items);
    const initialPrices: { [key: string]: string } = {};
    items.forEach(item => {
      initialPrices[item.medicine_id] = item.unit_price.toString();
    });
    setPrices(initialPrices);
  }, [items]);


  const canEditPrices = orderStatus === 'confirmed';

  const addNewMedicine = () => {
    setNewMedicines([...newMedicines, { name: '', quantity: 1, unit_price: 0 }]);
  };

  const removeNewMedicine = (index: number) => {
    setNewMedicines(newMedicines.filter((_, i) => i !== index));
  };

  const updateNewMedicine = (index: number, field: keyof NewMedicineItem, value: string | number) => {
    const updated = [...newMedicines];
    updated[index] = { ...updated[index], [field]: value };
    setNewMedicines(updated);
  };

  const calculateMedicineTotal = () => {
    const existingTotal = items.reduce((sum, item) => {
      const price = parseFloat(prices[item.medicine_id] || '0');
      return sum + (price * item.quantity);
    }, 0);

    const newTotal = newMedicines.reduce((sum, item) => {
      return sum + (item.unit_price * item.quantity);
    }, 0);

    return existingTotal + newTotal;
  };

  const calculateGrandTotal = () => {
    return calculateMedicineTotal() + currentHandlingCharges + currentDeliveryFee;
  };

  const handleUpdatePrices = async () => {
    // Validate new medicines
    for (const med of newMedicines) {
      if (!med.name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all medicine names',
          variant: 'destructive',
        });
        return;
      }
      if (med.quantity <= 0 || med.unit_price <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Quantity and price must be greater than 0',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const result = await orderManagementService.updateOrderPricesWithItems(
        orderId,
        {
          existingItems: items.map(item => ({
            medicine_id: item.medicine_id,
            unit_price: parseFloat(prices[item.medicine_id] || '0')
          })),
          newItems: newMedicines
        }
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Order updated and customer notified',
        });
        setNewMedicines([]);
        onPricesUpdated();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update order',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Order Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Medicine Items */}
        {items.length > 0 && (
          <div className="space-y-3">
            <Label>Existing Medicines</Label>
            {items.map((item) => (
              <div key={item.medicine_id} className="space-y-2 p-3 bg-secondary/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.medicine_name}</span>
                  <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">₹</span>
                  <Input
                    type="number"
                    value={prices[item.medicine_id] || ''}
                    onChange={(e) => setPrices({ ...prices, [item.medicine_id]: e.target.value })}
                    disabled={!canEditPrices || loading}
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-primary min-w-[100px] text-right">
                    = ₹{(parseFloat(prices[item.medicine_id] || '0') * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Medicine Items */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label>Add Medicine Items</Label>
            {canEditPrices && (
              <Button
                variant="outline"
                size="sm"
                onClick={addNewMedicine}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Medicine
              </Button>
            )}
          </div>
          
          {newMedicines.length === 0 && items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4 bg-secondary/20 rounded-lg">
              No medicines added yet. Click "Add Medicine" to start.
            </div>
          )}

          {newMedicines.map((med, index) => (
            <div key={index} className="space-y-2 p-3 bg-accent/30 rounded-lg border border-accent">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Medicine {index + 1}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNewMedicine(index)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <Input
                placeholder="Medicine name"
                value={med.name}
                onChange={(e) => updateNewMedicine(index, 'name', e.target.value)}
                disabled={!canEditPrices || loading}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={med.quantity}
                    onChange={(e) => updateNewMedicine(index, 'quantity', parseInt(e.target.value) || 0)}
                    disabled={!canEditPrices || loading}
                    min="1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unit Price (₹)</Label>
                  <Input
                    type="number"
                    value={med.unit_price}
                    onChange={(e) => updateNewMedicine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    disabled={!canEditPrices || loading}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="text-sm font-medium text-right text-primary">
                Total: ₹{(med.quantity * med.unit_price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Charges Summary */}
        <div className="space-y-3">
          <div>
            <Label>Medicine Total</Label>
            <div className="text-2xl font-bold text-primary">
              ₹{calculateMedicineTotal().toFixed(2)}
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Handling Charges</span>
            <span className="font-medium">₹{currentHandlingCharges.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Fee</span>
            <span className="font-medium">₹{currentDeliveryFee.toFixed(2)}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            * Charges are calculated based on distance
          </p>
        </div>

        <Separator />

        {/* Grand Total */}
        <div className="flex justify-between items-center font-bold text-xl">
          <span>Grand Total</span>
          <span className="text-primary">₹{calculateGrandTotal().toFixed(2)}</span>
        </div>

        {canEditPrices && (
          <Button
            onClick={handleUpdatePrices}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Updating...' : 'Update Order & Notify Customer'}
          </Button>
        )}

        {!canEditPrices && (
          <p className="text-sm text-muted-foreground text-center">
            Prices can only be updated when order status is "Confirmed"
          </p>
        )}
      </CardContent>
    </Card>
  );
};
