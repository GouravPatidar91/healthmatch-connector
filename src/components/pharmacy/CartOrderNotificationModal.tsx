import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, AlertCircle, X, ShoppingCart, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartOrderNotificationProps {
  notification: {
    id: string;
    broadcast_id: string;
    items: Array<{
      medicine_name?: string;
      name?: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    patient_latitude: number;
    patient_longitude: number;
    distance_km: number;
    timeout_at: string;
    phase_timeout_at?: string; // 15-second phase timeout
    phase?: string; // 'controlled_parallel' or 'sequential'
    total_amount: number;
    final_amount: number;
    delivery_address: string;
    customer_phone: string;
  };
  vendorId: string;
  onClose: () => void;
}

export const CartOrderNotificationModal: React.FC<CartOrderNotificationProps> = ({
  notification,
  vendorId,
  onClose
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isResponding, setIsResponding] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Use phase_timeout_at for 15-second countdown, fallback to timeout_at
    const timeoutString = notification.phase_timeout_at || notification.timeout_at;
    const timeoutDate = new Date(timeoutString);
    const now = new Date();
    const secondsLeft = Math.max(0, Math.floor((timeoutDate.getTime() - now.getTime()) / 1000));
    setTimeLeft(secondsLeft);

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Play notification sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKR5/g8r5sIQUxh9Hz04IzBh5uwO/jmVUUCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRC=');
    audio.play().catch(() => {});

    return () => {
      clearInterval(interval);
    };
  }, [notification]);

  const handleTimeout = () => {
    const isPhase1 = notification.phase === 'controlled_parallel';
    toast({
      title: "Opportunity Expired",
      description: isPhase1 
        ? "The 15-second priority window has expired." 
        : "Time to accept this order has expired.",
      variant: "destructive",
    });
    onClose();
  };

  const handleAccept = async () => {
    setIsResponding(true);
    try {
      console.log('Accepting cart order with broadcast_id:', notification.broadcast_id);
      
      // Mark notification as read immediately
      await supabase
        .from('vendor_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notification.id);
      
      const { data, error } = await supabase.functions.invoke('cart-order-response', {
        body: {
          broadcast_id: notification.broadcast_id,
          vendor_id: vendorId,
          response_type: 'accept'
        }
      });

      console.log('Accept response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to communicate with server');
      }

      if (data?.success) {
        toast({
          title: "Order Accepted! 🎉",
          description: `Order #${data.order_number} created successfully. Redirecting to order management...`,
        });
        onClose();
        
        // Navigate to the specific order management page with order ID
        setTimeout(() => {
          window.location.href = `/vendor-dashboard/order/${data.order_id}`;
        }, 500);
      } else if (data?.success === false) {
        toast({
          title: "Cannot Accept Order",
          description: data.message || "This order may have already been accepted by another pharmacy.",
          variant: "destructive",
        });
        onClose();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Accept error:', error);
      toast({
        title: "Error Accepting Order",
        description: error.message || "Failed to accept order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejecting this order.",
        variant: "destructive",
      });
      return;
    }

    setIsResponding(true);
    try {
      // Mark notification as read immediately
      await supabase
        .from('vendor_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notification.id);

      const { data, error } = await supabase.functions.invoke('cart-order-response', {
        body: {
          broadcast_id: notification.broadcast_id,
          vendor_id: vendorId,
          response_type: 'reject',
          rejection_reason: rejectionReason
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to communicate with server');
      }

      toast({
        title: "Order Rejected",
        description: "Your response has been recorded.",
      });
      onClose();
    } catch (error: any) {
      console.error('Reject error:', error);
      toast({
        title: "Error Rejecting Order",
        description: error.message || "Failed to reject order.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60;

  const items = notification.items || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-2xl">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              🛒 NEW CART ORDER
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Countdown Timer */}
        <div className={`text-center py-4 rounded-lg ${isUrgent ? 'bg-red-100 animate-pulse' : 'bg-blue-100'}`}>
          <p className="text-sm text-gray-600 mb-1">Time to respond</p>
          <div className={`text-5xl font-bold ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Customer Location */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Customer Location</p>
            <p className="text-sm text-muted-foreground">
              {notification.distance_km?.toFixed(1)} km away • {notification.delivery_address}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <Label className="text-lg font-semibold">Order Items ({items.length})</Label>
          </div>
          <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3">
                <div className="flex-1">
                  <p className="font-medium">{item.medicine_name || item.name || 'Unknown Medicine'}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{item.unit_price?.toFixed(2)}</p>
                  <p className="text-sm text-primary">₹{item.total_price?.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Order Summary */}
        <div className="bg-primary/5 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Order Value</span>
            <span className="text-primary">₹{notification.final_amount?.toFixed(2) || notification.total_amount?.toFixed(2)}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Payment: Cash on Delivery
          </p>
        </div>

        {/* Action Buttons */}
        {!showRejectForm ? (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowRejectForm(true)}
              disabled={isResponding}
            >
              Reject Order
            </Button>
            <Button
              size="lg"
              onClick={handleAccept}
              disabled={isResponding}
              className="bg-green-600 hover:bg-green-700"
            >
              {isResponding ? 'Processing...' : 'Accept Order'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Items out of stock, Already closed, etc."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                disabled={isResponding}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isResponding}
              >
                {isResponding ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
