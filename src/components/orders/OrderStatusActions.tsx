import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TruckIcon, CheckCircle } from 'lucide-react';
import { orderManagementService } from '@/services/orderManagementService';
import { useToast } from '@/hooks/use-toast';

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

export const OrderStatusActions: React.FC<OrderStatusActionsProps> = ({
  orderId,
  currentStatus,
  onStatusUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: string, notes?: string) => {
    setLoading(true);
    try {
      const result = await orderManagementService.updateOrderStatus(orderId, newStatus, notes);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Order status updated to ${newStatus}`,
        });
        onStatusUpdated();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAvailableActions = () => {
    switch (currentStatus) {
      case 'confirmed':
        return (
          <Button
            onClick={() => handleStatusUpdate('preparing', 'Started packing the order')}
            disabled={loading}
            className="w-full"
          >
            <Package className="h-4 w-4 mr-2" />
            Start Packing
          </Button>
        );
      
      case 'preparing':
        return (
          <Button
            onClick={() => handleStatusUpdate('ready_for_pickup', 'Order is ready for pickup')}
            disabled={loading}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Ready for Pickup
          </Button>
        );
      
      case 'out_for_delivery':
        return (
          <Button
            onClick={() => handleStatusUpdate('delivered', 'Order delivered successfully')}
            disabled={loading}
            className="w-full"
            variant="default"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Delivered
          </Button>
        );
      
      default:
        return null;
    }
  };

  const action = getAvailableActions();

  if (!action) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Order Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {action}
      </CardContent>
    </Card>
  );
};
