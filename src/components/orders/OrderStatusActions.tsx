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
        
        // If marking as ready for pickup, broadcast to delivery partners
        if (newStatus === 'ready_for_pickup') {
          await handleBroadcastToPartners();
        }
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

  const handleBroadcastToPartners = async () => {
    try {
      // Import the service dynamically to avoid circular dependencies
      const { deliveryRequestService } = await import('@/services/deliveryRequestService');
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Get order and vendor details
      const { data: order, error: orderError } = await supabase
        .from('medicine_orders')
        .select(`
          id,
          vendor_id,
          medicine_vendors (
            id,
            latitude,
            longitude,
            pharmacy_name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order details:', orderError);
        return;
      }

      const vendor = order.medicine_vendors as any;
      if (!vendor?.latitude || !vendor?.longitude) {
        toast({
          title: 'Location Required',
          description: 'Vendor location is required to find delivery partners',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Order Packed!',
        description: 'Searching for delivery partners...',
      });

      const result = await deliveryRequestService.broadcastToNearbyPartners(
        order.id,
        vendor.id,
        { latitude: vendor.latitude, longitude: vendor.longitude }
      );

      if (result.success) {
        toast({
          title: 'Partners Notified',
          description: `Notified ${result.requestIds?.length || 0} delivery partners`,
        });
      } else {
        toast({
          title: 'No Partners Available',
          description: result.error || 'No delivery partners found nearby',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error broadcasting to partners:', error);
      toast({
        title: 'Error',
        description: 'Failed to notify delivery partners',
        variant: 'destructive',
      });
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
            onClick={() => handleStatusUpdate('ready_for_pickup', 'Order packed and ready')}
            disabled={loading}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Order Packed
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
