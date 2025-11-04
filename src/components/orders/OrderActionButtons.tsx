import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, HelpCircle, RotateCcw } from 'lucide-react';

interface OrderActionButtonsProps {
  order: {
    id: string;
    order_status: string;
    created_at: string;
    vendor: {
      phone: string;
    };
    delivery_partner?: {
      phone: string;
    };
  };
  onCancelOrder: () => void;
  onReorder: () => void;
}

export const OrderActionButtons: React.FC<OrderActionButtonsProps> = ({
  order,
  onCancelOrder,
  onReorder
}) => {
  const canCancel = () => {
    if (!['placed', 'confirmed'].includes(order.order_status)) return false;
    
    const orderTime = new Date(order.created_at).getTime();
    const now = Date.now();
    const timeDiff = (now - orderTime) / 1000 / 60;
    
    return timeDiff <= 5;
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {canCancel() && (
        <Button variant="destructive" onClick={onCancelOrder}>
          Cancel Order
        </Button>
      )}

      <Button variant="outline" onClick={() => handleCall(order.vendor.phone)}>
        <Phone className="h-4 w-4 mr-2" />
        Call Pharmacy
      </Button>

      {order.delivery_partner && (
        <Button variant="outline" onClick={() => handleCall(order.delivery_partner!.phone)}>
          <Phone className="h-4 w-4 mr-2" />
          Call Delivery Partner
        </Button>
      )}

      {order.order_status === 'delivered' && (
        <Button variant="outline" onClick={onReorder}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reorder
        </Button>
      )}

      <Button variant="outline">
        <HelpCircle className="h-4 w-4 mr-2" />
        Need Help?
      </Button>
    </div>
  );
};
