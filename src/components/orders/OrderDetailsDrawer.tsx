import { useState } from 'react';
import { ChevronDown, ChevronUp, Package, CreditCard, MapPin, AlertCircle } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderWithTracking } from '@/services/orderTrackingService';
import { DeliveryProgressBar } from './DeliveryProgressBar';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { cn } from '@/lib/utils';

interface OrderDetailsDrawerProps {
  order: OrderWithTracking;
  onCancelOrder?: () => void;
  onRateOrder?: () => void;
  onReorder: () => void;
}

export function OrderDetailsDrawer({ 
  order, 
  onCancelOrder, 
  onRateOrder,
  onReorder 
}: OrderDetailsDrawerProps) {
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [itemsOpen, setItemsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  return (
    <Drawer open={true} modal={false}>
      <DrawerContent className="fixed bottom-0 left-0 right-0 h-[35vh] max-h-[85vh] border-t-2 rounded-t-3xl focus:outline-none">
        <DrawerHeader className="pb-2">
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-3" />
          
          {/* Mini Progress Bar */}
          <DeliveryProgressBar currentStatus={order.order_status} variant="mini" />
          
          <DrawerTitle className="text-left text-lg font-bold mt-2">
            Order #{order.order_number}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto max-h-[calc(85vh-100px)]">
          {/* Delivery Status Section */}
          <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 rounded-lg px-3 transition-colors">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-semibold">Delivery Status</span>
              </div>
              {timelineOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-accordion-down">
              <div className="px-3 py-2">
                <DeliveryProgressBar currentStatus={order.order_status} variant="full" />
                <div className="mt-4">
                  <OrderStatusTimeline
                    statusHistory={order.status_history}
                    currentStatus={order.order_status}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          {/* Order Items Section */}
          <Collapsible open={itemsOpen} onOpenChange={setItemsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 rounded-lg px-3 transition-colors">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span className="font-semibold">Order Items</span>
                <span className="text-sm text-muted-foreground">({order.items.length})</span>
              </div>
              {itemsOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-accordion-down">
              <div className="px-3 py-2 space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start py-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.medicine_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.unit_price}
                      </div>
                    </div>
                    <div className="font-semibold text-sm">₹{item.total_price}</div>
                  </div>
                ))}
                {order.prescription_url && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Prescription verified</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-2" />

          {/* Payment Details Section */}
          <Collapsible open={paymentOpen} onOpenChange={setPaymentOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 rounded-lg px-3 transition-colors">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-semibold">Payment Summary</span>
              </div>
              {paymentOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-accordion-down">
              <div className="px-3 py-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item Total</span>
                  <span>₹{order.total_amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>₹{order.delivery_fee || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Handling Charges</span>
                  <span>₹{order.handling_charges || 0}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>- ₹{order.discount_amount}</span>
                  </div>
                )}
                {order.coupon_discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon ({order.coupon_code})</span>
                    <span>- ₹{order.coupon_discount}</span>
                  </div>
                )}
                {order.tip_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tip</span>
                    <span>₹{order.tip_amount}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Paid</span>
                  <span>₹{order.final_amount}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Payment Method: {order.payment_method === 'online' ? 'Online' : 'Cash on Delivery'}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="mt-6 space-y-2">
            {onRateOrder && (
              <Button onClick={onRateOrder} className="w-full" size="lg">
                Rate Order
              </Button>
            )}
            <div className="flex gap-2">
              <Button onClick={onReorder} variant="outline" className="flex-1">
                Reorder
              </Button>
              {onCancelOrder && (
                <Button onClick={onCancelOrder} variant="destructive" className="flex-1">
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
