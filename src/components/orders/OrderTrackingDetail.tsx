import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { OrderActionButtons } from './OrderActionButtons';
import { CancelOrderDialog } from './CancelOrderDialog';
import { CouponInput } from './CouponInput';
import { TipSelector } from './TipSelector';
import { OrderRatingDialog } from './OrderRatingDialog';
import { FullScreenOrderTracking } from './FullScreenOrderTracking';
import { orderTrackingService, OrderWithTracking } from '@/services/orderTrackingService';
import { ratingService } from '@/services/ratingService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Phone, CreditCard, Download, Maximize2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LiveOrderTrackingMap } from './LiveOrderTrackingMap';
import { OrderMiniMap } from './OrderMiniMap';

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
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showFullScreenTracking, setShowFullScreenTracking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && orderId) {
      loadOrderDetails();
      
      // Subscribe to order updates from orderTrackingService
      const unsubscribe = orderTrackingService.subscribeToOrderUpdates(orderId, (updatedOrder) => {
        const previousStatus = order?.order_status;
        setOrder(updatedOrder);
        
        // Show notification when order is picked up
        if (updatedOrder.order_status === 'out_for_delivery' && previousStatus !== 'out_for_delivery') {
          toast({
            title: "Order Picked Up",
            description: "Your order has been picked up and is on the way!",
          });
        }

        // Show notification when order is delivered
        if (updatedOrder.order_status === 'delivered' && previousStatus !== 'delivered') {
          toast({
            title: "Order Delivered",
            description: "Your order has been delivered!",
          });
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [open, orderId]);

  // Auto-prompt rating dialog for delivered orders
  useEffect(() => {
    const checkAndPromptRating = async () => {
      if (order?.order_status === 'delivered' && order?.id) {
        const existingRating = await ratingService.getOrderRating(order.id);
        if (!existingRating) {
          setTimeout(() => setShowRatingDialog(true), 1500);
        }
      }
    };
    
    checkAndPromptRating();
  }, [order?.order_status, order?.id]);

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
            {/* Mini Map - Show when order is confirmed and has location */}
            {(order.order_status === 'confirmed' || 
              order.order_status === 'preparing' || 
              (order.order_status === 'ready_for_pickup' && !order.delivery_partner?.id)) && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Order Location
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullScreenTracking(true)}
                    className="gap-2"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Full Screen
                  </Button>
                </div>
                {order.delivery_latitude && 
                 order.delivery_longitude && 
                 order.vendor?.latitude && 
                 order.vendor?.longitude ? (
                  <OrderMiniMap
                    pharmacyLocation={{
                      lat: order.vendor.latitude,
                      lng: order.vendor.longitude
                    }}
                    pharmacyName={order.vendor.pharmacy_name}
                    customerLocation={{
                      lat: order.delivery_latitude,
                      lng: order.delivery_longitude
                    }}
                    customerAddress={order.delivery_address}
                  />
                 ) : (
                   <Card className="p-6 text-center border-2 border-dashed border-orange-500/50 bg-orange-50/50">
                     <div className="flex flex-col items-center gap-3">
                       <MapPin className="h-8 w-8 text-orange-600" />
                       <div>
                         <p className="font-medium text-orange-900 mb-1">
                           Location Not Available
                         </p>
                         <p className="text-sm text-orange-700 mb-3">
                           {!order.delivery_latitude || !order.delivery_longitude 
                             ? "Delivery coordinates were not captured for this order."
                             : "Pharmacy location is not available."}
                         </p>
                         <p className="text-xs text-muted-foreground">
                           Pharmacy: {order.vendor?.pharmacy_name || 'Unknown'}
                           <br />
                           {order.vendor?.address || 'Address not available'}
                         </p>
                       </div>
                     </div>
                   </Card>
                 )}
              </div>
            )}

            {/* Waiting for Delivery Partner - No partner assigned yet */}
            {order.order_status === 'ready_for_pickup' && !order.delivery_partner?.id && (
              <Card className="p-6 text-center border-2 border-dashed">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-pulse text-4xl">⏳</div>
                  <p className="font-medium text-lg">Waiting for Delivery Partner</p>
                  <p className="text-sm text-muted-foreground">
                    Your order is ready and we're finding a delivery partner nearby
                  </p>
                </div>
              </Card>
            )}

            {/* Delivery Partner assigned, waiting for pickup */}
            {order.order_status === 'ready_for_pickup' && order.delivery_partner?.id && (
              <Card className="p-6 text-center border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-blue-950">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-bounce text-4xl">🛵</div>
                  <p className="font-medium text-lg text-blue-700 dark:text-blue-300">
                    Waiting for Delivery Partner to Pick Up Order
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {order.delivery_partner.name} is heading to the pharmacy
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{order.delivery_partner.phone}</span>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Live Tracking Map - Show when delivery partner is assigned and order is active */}
            {order.delivery_partner?.id &&
             ['out_for_delivery', 'ready_for_pickup'].includes(order.order_status) &&
             order.delivery_latitude && 
             order.delivery_longitude && 
             order.vendor?.latitude && 
             order.vendor?.longitude && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Live Tracking</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullScreenTracking(true)}
                    className="gap-2"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Full Screen
                  </Button>
                </div>
                <LiveOrderTrackingMap
                  deliveryPartnerId={order.delivery_partner.id}
                  deliveryPartnerName={order.delivery_partner.name || 'Delivery Partner'}
                  vehicleType={order.delivery_partner.vehicle_type || 'Vehicle'}
                  pharmacyLocation={{
                    lat: order.vendor.latitude,
                    lng: order.vendor.longitude
                  }}
                  pharmacyName={order.vendor.pharmacy_name}
                  customerLocation={{
                    lat: order.delivery_latitude,
                    lng: order.delivery_longitude
                  }}
                  customerAddress={order.delivery_address}
                  orderStatus={order.order_status}
                />
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-4">Order Timeline</h3>
              <OrderStatusTimeline
                statusHistory={order.status_history}
                currentStatus={order.order_status}
              />
            </div>

            <Separator />

            {/* Payment Details - Enhanced with Coupon and Tip */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payment Method</span>
                  <Badge variant="secondary" className="text-sm">
                    {order.payment_method.toUpperCase().replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Payment Status</span>
                  <Badge 
                    variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {order.payment_status.toUpperCase()}
                  </Badge>
                </div>
                
                <Separator />
                
                {/* Cost Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Medicine Amount</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Handling Charges</span>
                    <span>₹{order.handling_charges || 30}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>₹{order.delivery_fee || 50}</span>
                  </div>
                  {order.coupon_discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon Discount ({order.coupon_code})</span>
                      <span>-₹{order.coupon_discount}</span>
                    </div>
                  )}
                  {order.tip_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tip for Delivery Partner</span>
                      <span>+₹{order.tip_amount}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span className="text-primary">₹{order.final_amount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coupon Input - Only before delivered */}
            {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
              <CouponInput
                orderId={order.id}
                orderAmount={order.total_amount}
                appliedCoupon={order.coupon_code}
                onCouponApplied={() => loadOrderDetails()}
                onCouponRemoved={() => loadOrderDetails()}
              />
            )}

            {/* Tip Selector - Only when out for delivery or before */}
            {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
              <TipSelector
                orderId={order.id}
                currentTip={order.tip_amount || 0}
                onTipUpdated={() => loadOrderDetails()}
              />
            )}

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
                    <span>Items Total</span>
                    <span>₹{order.items.reduce((sum, item) => sum + item.total_price, 0)}</span>
                  </div>
                </div>

                {/* Prescription Download */}
                {order.prescription_url && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(order.prescription_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Prescription
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Pharmacy Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Pharmacy Information</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{order.vendor.pharmacy_name}</p>
                      <p className="text-sm text-muted-foreground">{order.vendor.address}</p>
                    </div>
                  </div>
                  {order.vendor.average_rating && order.vendor.average_rating > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {order.vendor.average_rating.toFixed(1)} ({order.vendor.total_ratings || 0})
                    </Badge>
                  )}
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
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{order.delivery_partner.name}</p>
                    {order.delivery_partner.rating && order.delivery_partner.rating > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {order.delivery_partner.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
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

            {/* Rate Order Button */}
            {order.order_status === 'delivered' && (
              <Button
                variant="default"
                className="w-full"
                onClick={() => setShowRatingDialog(true)}
              >
                Rate Your Order
              </Button>
            )}
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

      <OrderRatingDialog
        open={showRatingDialog}
        orderId={orderId}
        orderStatus={order.order_status}
        onClose={() => setShowRatingDialog(false)}
        onRatingSubmitted={() => {
          setShowRatingDialog(false);
          toast({
            title: 'Success',
            description: 'Thank you for rating your order!',
          });
        }}
      />

      {showFullScreenTracking && order && (
        <FullScreenOrderTracking
          order={order}
          onClose={() => setShowFullScreenTracking(false)}
          onCancelOrder={() => {
            setShowFullScreenTracking(false);
            setShowCancelDialog(true);
          }}
          onRateOrder={() => {
            setShowFullScreenTracking(false);
            setShowRatingDialog(true);
          }}
          onReorder={handleReorder}
        />
      )}
    </>
  );
};
