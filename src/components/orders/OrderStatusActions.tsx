import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, CheckCircle } from 'lucide-react';
import { orderManagementService } from '@/services/orderManagementService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SearchingDeliveryPartnersModal } from '@/components/delivery/SearchingDeliveryPartnersModal';

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
  const [showDeliverySearch, setShowDeliverySearch] = useState(false);
  const [deliveryBroadcastId, setDeliveryBroadcastId] = useState<string | null>(null);
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
        
        // If marking as ready for pickup, trigger hybrid broadcast to delivery partners
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
        toast({
          title: 'Error',
          description: 'Failed to fetch order details',
          variant: 'destructive',
        });
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

      console.log('Calling delivery-hybrid-broadcast with:', {
        orderId: order.id,
        vendorId: vendor.id,
        vendorLocation: { latitude: vendor.latitude, longitude: vendor.longitude },
        radiusKm: 10
      });

      // Call the hybrid broadcast edge function
      const { data, error } = await supabase.functions.invoke('delivery-hybrid-broadcast', {
        body: {
          orderId: order.id,
          vendorId: vendor.id,
          vendorLocation: { latitude: vendor.latitude, longitude: vendor.longitude },
          radiusKm: 10
        }
      });

      console.log('Broadcast response:', data, error);

      if (error) {
        console.error('Error calling hybrid broadcast:', error);
        toast({
          title: 'Error',
          description: 'Failed to notify delivery partners',
          variant: 'destructive',
        });
        return;
      }

      if (data?.success && data?.broadcastId) {
        setDeliveryBroadcastId(data.broadcastId);
        setShowDeliverySearch(true);
        toast({
          title: 'Priority Search Started',
          description: `Top ${data.partnersNotified} nearby delivery partners notified`,
        });
      } else if (data?.error) {
        toast({
          title: 'No Partners Available',
          description: data.error,
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

  const handleRestartBroadcast = async () => {
    try {
      // Clear old failed broadcast records
      await supabase
        .from('delivery_broadcasts')
        .delete()
        .eq('order_id', orderId)
        .eq('status', 'failed');

      // Clear old expired/rejected delivery requests
      await supabase
        .from('delivery_requests')
        .delete()
        .eq('order_id', orderId)
        .in('status', ['expired', 'rejected']);

      // Start fresh broadcast
      await handleBroadcastToPartners();
    } catch (error) {
      console.error('Error restarting broadcast:', error);
      toast({
        title: 'Error',
        description: 'Failed to restart delivery partner search',
        variant: 'destructive',
      });
    }
  };

  const handleDeliveryPartnerAccepted = (partnerId: string) => {
    toast({
      title: 'Delivery Partner Assigned',
      description: 'A delivery partner has accepted the order',
    });
    setShowDeliverySearch(false);
    onStatusUpdated();
  };

  const handleDeliverySearchFailed = () => {
    toast({
      title: 'No Partners Found',
      description: 'No delivery partners available. You can restart the search.',
      variant: 'destructive',
    });
  };

  const getAvailableActions = () => {
    switch (currentStatus) {
      case 'placed':
        return (
          <Button
            onClick={() => handleStatusUpdate('confirmed', 'Order confirmed by pharmacy')}
            disabled={loading}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Order
          </Button>
        );
      
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
      
      default:
        return null;
    }
  };

  const action = getAvailableActions();

  if (!action) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {action}
        </CardContent>
      </Card>

      <SearchingDeliveryPartnersModal
        broadcastId={deliveryBroadcastId}
        orderId={orderId}
        open={showDeliverySearch}
        onAccepted={handleDeliveryPartnerAccepted}
        onFailed={handleDeliverySearchFailed}
        onClose={() => setShowDeliverySearch(false)}
        onRestart={handleRestartBroadcast}
      />
    </>
  );
};