import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { format } from 'date-fns';
import { MapPin, Phone } from 'lucide-react';

interface OrderCardProps {
  order: {
    id: string;
    order_number: string;
    order_status: string;
    total_amount: number;
    final_amount: number;
    handling_charges?: number;
    delivery_fee?: number;
    discount_amount?: number;
    created_at: string;
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
        <OrderStatusBadge status={order.order_status} />
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

      <div className="space-y-1 pt-3 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Medicines</span>
          <span>₹{order.total_amount.toFixed(2)}</span>
        </div>
        {order.handling_charges && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Handling Charges</span>
            <span>₹{order.handling_charges.toFixed(2)}</span>
          </div>
        )}
        {order.delivery_fee && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Delivery Fee</span>
            <span>₹{order.delivery_fee.toFixed(2)}</span>
          </div>
        )}
        {order.discount_amount && order.discount_amount > 0 && (
          <div className="flex justify-between text-xs text-green-600">
            <span>Discount</span>
            <span>-₹{order.discount_amount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-lg font-bold">₹{order.final_amount.toFixed(2)}</p>
          </div>
          <Button onClick={() => onTrackOrder(order.id)}>
            Track Order
          </Button>
        </div>
      </div>
    </Card>
  );
};
