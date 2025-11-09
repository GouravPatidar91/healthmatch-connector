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
  const [handlingCharges, setHandlingCharges] = useState(currentHandlingCharges.toString());
  const [deliveryFee, setDeliveryFee] = useState(currentDeliveryFee.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initialPrices: { [key: string]: string } = {};
    items.forEach(item => {
      initialPrices[item.medicine_id] = item.unit_price.toString();
    });
    setPrices(initialPrices);
  }, [items]);

  const canEditPrices = orderStatus === 'confirmed';

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => {
      const price = parseFloat(prices[item.medicine_id] || '0');
      return sum + (price * item.quantity);
    }, 0);
    const handling = parseFloat(handlingCharges || '0');
    const delivery = parseFloat(deliveryFee || '0');
    return itemsTotal + handling + delivery;
  };

  const handleUpdatePrices = async () => {
    setLoading(true);
    try {
      const priceUpdate: PriceUpdate = {
        items: items.map(item => ({
          medicine_id: item.medicine_id,
          unit_price: parseFloat(prices[item.medicine_id] || '0') * item.quantity
        })),
        handling_charges: parseFloat(handlingCharges || '0'),
        delivery_fee: parseFloat(deliveryFee || '0')
      };

      const result = await orderManagementService.updateOrderPrices(orderId, priceUpdate);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Prices updated successfully',
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
          {items.map((item) => (
            <div key={item.medicine_id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.medicine_name}</span>
                <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">₹</span>
                <Input
                  type="number"
                  value={prices[item.medicine_id] || ''}
                  onChange={(e) => setPrices({ ...prices, [item.medicine_id]: e.target.value })}
                  disabled={!canEditPrices || loading}
                  min="0"
                  step="0.01"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[80px]">
                  Total: ₹{(parseFloat(prices[item.medicine_id] || '0') * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Additional Charges */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="handlingCharges">Handling Charges</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm">₹</span>
              <Input
                id="handlingCharges"
                type="number"
                value={handlingCharges}
                onChange={(e) => setHandlingCharges(e.target.value)}
                disabled={!canEditPrices || loading}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryFee">Delivery Fee</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm">₹</span>
              <Input
                id="deliveryFee"
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                disabled={!canEditPrices || loading}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center font-bold text-lg">
          <span>Total Amount</span>
          <span className="text-primary">₹{calculateTotal().toFixed(2)}</span>
        </div>

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
