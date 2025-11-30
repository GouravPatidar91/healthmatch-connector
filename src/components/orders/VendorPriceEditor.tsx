import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DollarSign } from 'lucide-react';
import { orderManagementService, PriceUpdate } from '@/services/orderManagementService';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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

  const calculateMedicineTotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(prices[item.medicine_id] || '0');
      return sum + (price * item.quantity);
    }, 0);
  };

  const handleUpdatePrices = async () => {
    setLoading(true);
    try {
      const priceUpdate: PriceUpdate = {
        items: items.map(item => ({
          medicine_id: item.medicine_id,
          unit_price: parseFloat(prices[item.medicine_id] || '0')
        }))
      };

      const result = await orderManagementService.updateOrderPrices(orderId, priceUpdate);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Medicine prices updated and customer notified',
        });
        onPricesUpdated();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update prices',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update prices',
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
        {/* Medicine Items */}
        <div className="space-y-3">
          <Label>Medicine Prices</Label>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No medicine items found in this order
            </div>
          ) : (
            items.map((item) => (
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
            ))
          )}
        </div>

        <Separator />

        {/* Medicine Total */}
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Medicine Total</span>
          <span className="text-primary">₹{calculateMedicineTotal().toFixed(2)}</span>
        </div>

        <p className="text-xs text-muted-foreground">
          * Handling charges and delivery fees are automatically calculated based on distance
        </p>

        {canEditPrices && (
          <Button
            onClick={handleUpdatePrices}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Updating...' : 'Update Prices & Notify Customer'}
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
