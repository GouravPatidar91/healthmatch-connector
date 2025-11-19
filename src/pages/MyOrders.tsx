import React, { useEffect, useState } from 'react';
import { orderTrackingService, OrderWithTracking } from '@/services/orderTrackingService';
import { OrderCard } from '@/components/orders/OrderCard';
import { OrderTrackingDetail } from '@/components/orders/OrderTrackingDetail';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const MyOrders: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState<OrderWithTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Subscribe to real-time order updates for all user orders
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicine_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order update received:', payload);
          
          // Show notification for status changes
          if (payload.eventType === 'UPDATE' && payload.new.order_status !== payload.old.order_status) {
            const statusMap: Record<string, string> = {
              'confirmed': 'Order confirmed by pharmacy',
              'preparing': 'Your order is being prepared',
              'ready_for_pickup': 'Order is ready for pickup',
              'out_for_delivery': 'Delivery partner is on the way!',
              'delivered': 'Order has been delivered'
            };
            
            const message = statusMap[payload.new.order_status as string];
            if (message) {
              toast({
                title: 'Order Status Updated',
                description: message,
              });
              
              // Auto-open tracking when order goes out for delivery
              if (payload.new.order_status === 'out_for_delivery') {
                setSelectedOrderId(payload.new.id);
                setTrackingDialogOpen(true);
              }
            }
          }
          
          // Reload orders to reflect changes
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Subscribe to real-time order updates for specific active orders
  useEffect(() => {
    if (!orders.length) return;

    const channels = orders
      .filter(order => ['ready_for_pickup', 'out_for_delivery'].includes(order.order_status))
      .map(order => 
        supabase
          .channel(`order-${order.id}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'medicine_orders',
            filter: `id=eq.${order.id}`
          }, (payload: any) => {
            const newStatus = payload.new.order_status;
            const oldStatus = payload.old.order_status;

            // Auto-open tracking when delivery partner is assigned
            if (newStatus === 'out_for_delivery' && oldStatus === 'ready_for_pickup') {
              setSelectedOrderId(order.id);
              setTrackingDialogOpen(true);
              
              toast({
                title: 'Delivery Partner Assigned!',
                description: 'Your order is now out for delivery. Track it live!',
              });
            }

            // Reload orders to reflect new status
            loadOrders();
          })
          .subscribe()
      );
    
    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [orders]);

  // Check for ?track= parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const trackOrderId = params.get('track');
    if (trackOrderId && orders.length > 0) {
      setSelectedOrderId(trackOrderId);
    }
  }, [location.search, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderTrackingService.getUserOrders(user!.id);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (status?: string) => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.vendor.pharmacy_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (status === 'active') {
      return filtered.filter((order) =>
        ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(
          order.order_status
        )
      );
    }

    if (status === 'delivered') {
      return filtered.filter((order) => order.order_status === 'delivered');
    }

    if (status === 'cancelled') {
      return filtered.filter((order) =>
        ['cancelled', 'rejected'].includes(order.order_status)
      );
    }

    return filtered;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or pharmacy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({filterOrders().length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({filterOrders('active').length})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Delivered ({filterOrders('delivered').length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({filterOrders('cancelled').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {filterOrders().length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No orders found
              </p>
            ) : (
              filterOrders().map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrackOrder={setSelectedOrderId}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4 mt-6">
            {filterOrders('active').length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No active orders
              </p>
            ) : (
              filterOrders('active').map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrackOrder={setSelectedOrderId}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4 mt-6">
            {filterOrders('delivered').length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No delivered orders
              </p>
            ) : (
              filterOrders('delivered').map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrackOrder={setSelectedOrderId}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4 mt-6">
            {filterOrders('cancelled').length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No cancelled orders
              </p>
            ) : (
              filterOrders('cancelled').map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTrackOrder={setSelectedOrderId}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {selectedOrderId && (
        <OrderTrackingDetail
          open={trackingDialogOpen || !!selectedOrderId}
          orderId={selectedOrderId}
          onClose={() => {
            setSelectedOrderId(null);
            setTrackingDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MyOrders;
