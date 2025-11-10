import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { format } from 'date-fns';
import { MapPin, Phone, Loader2, User, Bike } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OrderCardProps {
  order: {
    id: string;
    order_number: string;
    order_status: string;
    total_amount: number;
    final_amount: number;
    created_at: string;
    delivery_partner_id?: string;
    delivery_partner?: {
      name: string;
      phone: string;
      vehicle_type?: string;
    };
    vendor: {
      pharmacy_name: string;
      phone: string;
    };
  };
  onTrackOrder: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onTrackOrder }) => {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">Order #{order.order_number}</h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(order.created_at), 'MMM dd, yyyy • hh:mm a')}
          </p>
        </div>
        <OrderStatusBadge 
          status={order.order_status} 
          hasDeliveryPartner={!!order.delivery_partner_id}
        />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{order.vendor.pharmacy_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{order.vendor.phone}</span>
        </div>
      </div>

      {/* Show delivery partner status for order_packed orders */}
      {order.order_status === 'ready_for_pickup' && (
        <div className="my-3 p-3 bg-muted/50 rounded-md">
          {!order.delivery_partner_id ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              <span className="text-orange-600 font-medium">
                Assigning delivery partner...
              </span>
            </div>
          ) : order.delivery_partner ? (
            <div className="space-y-2">
              <Badge variant="default" className="mb-2">
                ✓ Partner Assigned
              </Badge>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.delivery_partner.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bike className="h-4 w-4 text-muted-foreground" />
                <span>{order.delivery_partner.vehicle_type}</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="flex justify-between items-center pt-3 border-t">
        <div>
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-lg font-bold">₹{order.final_amount}</p>
        </div>
        <Button onClick={() => onTrackOrder(order.id)}>
          Track Order
        </Button>
      </div>
    </Card>
  );
};
