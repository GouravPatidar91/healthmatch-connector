import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { orderTrackingService } from '@/services/orderTrackingService';
import { useToast } from '@/hooks/use-toast';

interface TipSelectorProps {
  orderId: string;
  currentTip: number;
  onTipUpdated: (tipAmount: number) => void;
}

export const TipSelector: React.FC<TipSelectorProps> = ({
  orderId,
  currentTip,
  onTipUpdated
}) => {
  const [selectedTip, setSelectedTip] = useState(currentTip);
  const [customTip, setCustomTip] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const tipOptions = [0, 10, 20, 30, 50];

  const handleTipSelect = async (amount: number) => {
    setSelectedTip(amount);
    setCustomTip('');
    await updateTip(amount);
  };

  const handleCustomTip = async () => {
    const amount = parseInt(customTip);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid tip amount',
        variant: 'destructive',
      });
      return;
    }
    setSelectedTip(amount);
    await updateTip(amount);
  };

  const updateTip = async (amount: number) => {
    setLoading(true);
    try {
      const result = await orderTrackingService.updateTip(orderId, amount);
      
      if (result.success) {
        onTipUpdated(amount);
        toast({
          title: 'Success',
          description: amount > 0 
            ? `Tip of ₹${amount} added for delivery partner` 
            : 'Tip removed',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update tip',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tip',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-red-500" />
          Add a Tip for Delivery Partner
        </CardTitle>
        <CardDescription>
          Show your appreciation for great service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tipOptions.map((amount) => (
            <Button
              key={amount}
              variant={selectedTip === amount ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTipSelect(amount)}
              disabled={loading}
            >
              {amount === 0 ? 'No Tip' : `₹${amount}`}
            </Button>
          ))}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customTip">Custom Amount</Label>
          <div className="flex gap-2">
            <Input
              id="customTip"
              type="number"
              placeholder="Enter amount"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              disabled={loading}
              min="0"
            />
            <Button
              onClick={handleCustomTip}
              disabled={loading || !customTip}
              size="sm"
            >
              Apply
            </Button>
          </div>
        </div>

        {selectedTip > 0 && (
          <p className="text-sm text-muted-foreground">
            💝 Tip of ₹{selectedTip} will be given to the delivery partner
          </p>
        )}
      </CardContent>
    </Card>
  );
};
