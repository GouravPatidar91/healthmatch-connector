import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tag, X } from 'lucide-react';
import { couponService } from '@/services/couponService';
import { useToast } from '@/hooks/use-toast';

interface CouponInputProps {
  orderId: string;
  orderAmount: number;
  appliedCoupon?: string;
  onCouponApplied: (discountAmount: number) => void;
  onCouponRemoved: () => void;
}

export const CouponInput: React.FC<CouponInputProps> = ({
  orderId,
  orderAmount,
  appliedCoupon,
  onCouponApplied,
  onCouponRemoved
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a coupon code',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await couponService.applyCoupon(orderId, couponCode);
      
      if (result.success && result.discountAmount) {
        toast({
          title: 'Success',
          description: `Coupon applied! You saved ₹${result.discountAmount}`,
        });
        onCouponApplied(result.discountAmount);
        setCouponCode('');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to apply coupon',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply coupon',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setLoading(true);
    try {
      const result = await couponService.removeCoupon(orderId);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Coupon removed',
        });
        onCouponRemoved();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove coupon',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove coupon',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            Coupon "{appliedCoupon}" applied
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveCoupon}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="coupon">Have a coupon code?</Label>
      <div className="flex gap-2">
        <Input
          id="coupon"
          placeholder="Enter coupon code"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          disabled={loading}
        />
        <Button
          onClick={handleApplyCoupon}
          disabled={loading || !couponCode.trim()}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};
