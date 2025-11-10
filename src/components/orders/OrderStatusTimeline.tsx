import React from 'react';
import { format } from 'date-fns';
import { Package, CheckCircle, Clock, Truck, Home, XCircle } from 'lucide-react';
import { OrderStatus } from '@/services/orderTrackingService';

interface OrderStatusTimelineProps {
  statusHistory: OrderStatus[];
  currentStatus: string;
}

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  statusHistory,
  currentStatus
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'placed':
        return <Package className="h-5 w-5" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'preparing':
      case 'ready_for_pickup':
        return <Clock className="h-5 w-5" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <Home className="h-5 w-5" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'placed':
        return 'Order Placed';
      case 'confirmed':
        return 'Order Confirmed';
      case 'preparing':
        return 'Preparing Medicines';
      case 'ready_for_pickup':
        return 'Ready for Pickup';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      case 'rejected':
        return 'Order Rejected';
      default:
        return status;
    }
  };

  const isCompleted = (status: string) => {
    const statusOrder = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const itemIndex = statusOrder.indexOf(status);
    return itemIndex <= currentIndex;
  };

  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'rejected';

  return (
    <div className="space-y-4">
      {statusHistory.map((item, index) => {
        const completed = isCompleted(item.status) || isCancelled;
        const isLast = index === statusHistory.length - 1;

        return (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`rounded-full p-2 ${
                  completed
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {getStatusIcon(item.status)}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 h-12 ${
                    completed ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>

            <div className="flex-1 pb-8">
              <h4 className="font-semibold">{getStatusLabel(item.status)}</h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(item.created_at), 'MMM dd, yyyy • hh:mm a')}
              </p>
              {item.notes && (
                <p className="text-sm mt-2 p-2 bg-muted rounded">
                  {item.notes}
                </p>
              )}
              {item.updated_by_role && (
                <p className="text-xs text-muted-foreground mt-1">
                  Updated by: {item.updated_by_role}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
