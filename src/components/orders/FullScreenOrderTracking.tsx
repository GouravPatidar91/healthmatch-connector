import { X } from 'lucide-react';
import { OrderWithTracking } from '@/services/orderTrackingService';
import { ETADisplay } from './ETADisplay';
import { DeliveryPartnerCard } from './DeliveryPartnerCard';
import { OrderDetailsDrawer } from './OrderDetailsDrawer';
import { LiveOrderTrackingMap } from './LiveOrderTrackingMap';

interface FullScreenOrderTrackingProps {
  order: OrderWithTracking;
  onClose: () => void;
  onCancelOrder: () => void;
  onRateOrder: () => void;
  onReorder: () => void;
}

export function FullScreenOrderTracking({ 
  order, 
  onClose,
  onCancelOrder,
  onRateOrder,
  onReorder
}: FullScreenOrderTrackingProps) {
  const canCancel = ['placed', 'confirmed', 'preparing'].includes(order.order_status);
  const isDelivered = order.order_status === 'delivered';
  const hasDeliveryPartner = order.delivery_partner?.id;

  // Calculate ETA based on estimated delivery time
  const calculateETA = () => {
    if (order.estimated_delivery_time) {
      const eta = new Date(order.estimated_delivery_time);
      const now = new Date();
      const diffMs = eta.getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins > 0) {
        return `${diffMins} mins`;
      }
    }
    return 'Calculating...';
  };

  const getDeliveryStatus = () => {
    switch (order.order_status) {
      case 'placed':
        return 'Order Placed';
      case 'confirmed':
        return 'Order Confirmed';
      case 'preparing':
        return 'Preparing Your Order';
      case 'ready_for_pickup':
        return 'Ready for Pickup';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      default:
        return 'Processing';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 left-4 z-[1000] w-10 h-10 rounded-full bg-background/95 backdrop-blur-sm shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Close tracking"
      >
        <X className="w-5 h-5 text-foreground" />
      </button>

      {/* Full-Screen Map Container - 65% height */}
      <div className="absolute inset-x-0 top-0 h-[65vh] bg-muted">
        {hasDeliveryPartner && 
         order.delivery_latitude && 
         order.delivery_longitude && 
         order.vendor?.latitude && 
         order.vendor?.longitude ? (
          <LiveOrderTrackingMap
            deliveryPartnerId={order.delivery_partner.id}
            deliveryPartnerName={order.delivery_partner.name}
            vehicleType={order.delivery_partner.vehicle_type || 'motorcycle'}
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
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">
                {order.order_status === 'delivered' ? '✓ Order Delivered' : '📦 Order Processing'}
              </div>
              <p className="text-sm text-muted-foreground">
                {hasDeliveryPartner ? 'Waiting for tracking data...' : 'Delivery partner not assigned yet'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ETA Display Overlay */}
      {!isDelivered && hasDeliveryPartner && (
        <ETADisplay 
          eta={calculateETA()} 
          status={getDeliveryStatus()} 
        />
      )}

      {/* Delivery Partner Card (floating above drawer) */}
      {hasDeliveryPartner && order.delivery_partner && !isDelivered && order.delivery_partner.vehicle_type && (
        <DeliveryPartnerCard
          partner={{
            id: order.delivery_partner.id,
            name: order.delivery_partner.name,
            phone: order.delivery_partner.phone,
            vehicle_type: order.delivery_partner.vehicle_type,
            vehicle_number: order.delivery_partner.vehicle_number
          }}
          orderId={order.id}
        />
      )}

      {/* Bottom Drawer with Order Details - 35% initial */}
      <OrderDetailsDrawer
        order={order}
        onCancelOrder={canCancel ? onCancelOrder : undefined}
        onRateOrder={isDelivered ? onRateOrder : undefined}
        onReorder={onReorder}
      />
    </div>
  );
}
