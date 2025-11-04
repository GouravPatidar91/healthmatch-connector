import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { OrderActionButtons } from './OrderActionButtons';
import { CancelOrderDialog } from './CancelOrderDialog';
import { orderTrackingService, OrderWithTracking } from '@/services/orderTrackingService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrderTrackingDetailProps {
  open: boolean;
  orderId: string;
  onClose: () => void;
}

export const OrderTrackingDetail: React.FC<OrderTrackingDetailProps> = ({
  open,
  orderId,
  onClose
}) => {
  const [order, setOrder] = useState<OrderWithTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && orderId) {
      loadOrderDetails();
      const unsubscribe = orderTrackingService.subscribeToOrderUpdates(orderId, (updatedOrder) => {
        if (updatedOrder) {
          loadOrderDetails();
          toast({
            title: 'Order Updated',
            description: 'Your order status has been updated',
          });
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [open, orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await orderTrackingService.getOrderDetails(orderId);
      setOrder(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = () => {
    toast({
      title: 'Coming Soon',
      description: 'Reorder functionality will be available soon',
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{order.order_number}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-4">Order Timeline</h3>
              <OrderStatusTimeline
                statusHistory={order.status_history}
                currentStatus={order.order_status}
              />
            </div>

            <Separator />

            {/* Order Details */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Order Details</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.medicine_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.unit_price}
                      </p>
                    </div>
                    <p className="font-semibold">₹{item.total_price}</p>
                  </div>
                ))}

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>₹50</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>₹{order.final_amount}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm">
                    <span className="font-semibold">Payment Method:</span> {order.payment_method.toUpperCase()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Pharmacy Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Pharmacy Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.vendor.pharmacy_name}</p>
                    <p className="text-sm text-muted-foreground">{order.vendor.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{order.vendor.phone}</p>
                </div>
              </div>
            </Card>

            {/* Delivery Partner Info */}
            {order.delivery_partner && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Delivery Partner</h3>
                <div className="space-y-2">
                  <p className="font-medium">{order.delivery_partner.name}</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p>{order.delivery_partner.phone}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vehicle: {order.delivery_partner.vehicle_number}
                  </p>
                </div>
              </Card>
            )}

            {/* Delivery Address */}
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              <p className="text-sm">{order.delivery_address}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact: {order.customer_phone}
              </p>
            </Card>

            {/* Action Buttons */}
            <OrderActionButtons
              order={order}
              onCancelOrder={() => setShowCancelDialog(true)}
              onReorder={handleReorder}
            />
          </div>
        </DialogContent>
      </Dialog>

      <CancelOrderDialog
        open={showCancelDialog}
        orderId={orderId}
        onClose={() => setShowCancelDialog(false)}
        onSuccess={() => {
          loadOrderDetails();
          setShowCancelDialog(false);
        }}
      />
    </>
  );
};
