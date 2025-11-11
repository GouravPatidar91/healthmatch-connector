import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActiveOrderTracking } from '@/components/delivery/ActiveOrderTracking';
import { DeliveryRequestNotificationEnhanced } from '@/components/delivery/DeliveryRequestNotificationEnhanced';
import { deliveryRequestService } from '@/services/deliveryRequestService';
import { Bike, Package, CheckCircle, Clock, AlertCircle, Bell, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DeliveryPartner {
  id: string;
  name: string;
  is_available: boolean;
  total_deliveries: number;
  rating: number;
}

interface Order {
  id: string;
  order_number: string;
  order_status: string;
  final_amount: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  customer_phone: string;
  created_at: string;
  vendor: {
    pharmacy_name: string;
    address: string;
  };
}

export default function DeliveryPartnerDashboard() {
  const navigate = useNavigate();
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadPartnerData();
    loadOrders();
  }, []);

  // Real-time subscription for delivery requests
  useEffect(() => {
    if (!partner) return;

    // Subscribe to realtime updates
    const channel = deliveryRequestService.subscribeToRequestUpdates(
      partner.id,
      async (newRequest) => {
        // Fetch the complete request data with relations
        const requests = await deliveryRequestService.getPendingRequests(partner.id);
        setPendingRequests(requests);
        setUnreadCount(requests.length);
        
        // Reload orders when request is accepted
        if (newRequest.status === 'accepted') {
          loadOrders();
        }
        
        // Show toast notification
        toast({
          title: 'New delivery request received!',
          description: 'A new order is available for delivery',
        });
      }
    );

    // Initial load of pending requests
    deliveryRequestService.getPendingRequests(partner.id).then((requests) => {
      setPendingRequests(requests);
      setUnreadCount(requests.length);
    });

    // Cleanup subscription
    return () => {
      channel.unsubscribe();
    };
  }, [partner]);

  // Real-time order status updates
  useEffect(() => {
    if (!partner) return;

    const channel = supabase
      .channel(`partner-orders-${partner.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'medicine_orders',
          filter: `delivery_partner_id=eq.${partner.id}`
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partner]);

  const loadPartnerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('delivery_partners')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading partner:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your profile',
          variant: 'destructive',
        });
        return;
      }

      setPartner(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get partner ID
      const { data: partnerData } = await supabase
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) return;

      // Load active orders
      const { data: active, error: activeError } = await supabase
        .from('medicine_orders')
        .select(`
          *,
          vendor:medicine_vendors!vendor_id(pharmacy_name, address)
        `)
        .eq('delivery_partner_id', partnerData.id)
        .in('order_status', ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (activeError) {
        console.error('Error loading active orders:', activeError);
      } else {
        setActiveOrders(active || []);
      }

      // Load completed orders
      const { data: completed, error: completedError } = await supabase
        .from('medicine_orders')
        .select(`
          *,
          vendor:medicine_vendors!vendor_id(pharmacy_name, address)
        `)
        .eq('delivery_partner_id', partnerData.id)
        .eq('order_status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(20);

      if (completedError) {
        console.error('Error loading completed orders:', completedError);
      } else {
        setCompletedOrders(completed || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async (available: boolean) => {
    if (!partner) return;

    try {
      const { error } = await supabase
        .from('delivery_partners')
        .update({ is_available: available })
        .eq('id', partner.id);

      if (error) throw error;

      setPartner({ ...partner, is_available: available });
      
      toast({
        title: available ? 'You are now available' : 'You are now offline',
        description: available
          ? 'You can receive new delivery assignments'
          : 'You will not receive new assignments',
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        variant: 'destructive',
      });
    }
  };

  const handleOrderComplete = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('medicine_orders')
        .update({ order_status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Order Delivered',
        description: 'Order marked as delivered successfully',
      });

      loadOrders();
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark order as delivered',
        variant: 'destructive',
      });
    }
  };

  if (loading || !partner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Notification Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={() => setShowNotifications(false)}>
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-lg overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Delivery Requests</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                    <p className="text-muted-foreground">
                      New delivery requests will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <DeliveryRequestNotificationEnhanced
                      key={request.id}
                      request={request}
                      partnerId={partner.id}
                      onClose={() => {
                        loadOrders();
                        deliveryRequestService.getPendingRequests(partner.id).then((requests) => {
                          setPendingRequests(requests);
                          setUnreadCount(requests.length);
                        });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification for new requests */}
      {incomingRequest && !showNotifications && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-right">
          <Card className="border-primary shadow-lg bg-background">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary animate-pulse" />
                  <p className="font-semibold">New Delivery Request!</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIncomingRequest(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                You have a new delivery request waiting
              </p>
              <Button 
                className="w-full" 
                onClick={() => {
                  setShowNotifications(true);
                  setIncomingRequest(null);
                }}
              >
                View Request
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Partner Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {partner.name}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button 
            variant="ghost" 
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground animate-pulse">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Badge variant={partner.is_available ? 'default' : 'secondary'} className="text-lg px-4 py-2">
            {partner.is_available ? 'Available' : 'Offline'}
          </Badge>
        </div>
      </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partner.total_deliveries}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partner.rating.toFixed(1)} ⭐</div>
            </CardContent>
          </Card>
        </div>

        {/* Availability Toggle */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="availability" className="text-base">
                  Availability Status
                </Label>
                <p className="text-sm text-muted-foreground">
                  Toggle to receive new delivery assignments
                </p>
              </div>
              <Switch
                id="availability"
                checked={partner.is_available}
                onCheckedChange={handleAvailabilityToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              <Clock className="w-4 h-4 mr-2" />
              Active Orders ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
                  <p className="text-muted-foreground">
                    {partner.is_available
                      ? 'New orders will appear here when assigned'
                      : 'Turn on availability to receive orders'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <ActiveOrderTracking
                  key={order.id}
                  order={{
                    id: order.id,
                    orderNumber: order.order_number,
                    customerName: 'Customer',
                    customerPhone: order.customer_phone,
                    deliveryAddress: order.delivery_address,
                    deliveryLatitude: order.delivery_latitude,
                    deliveryLongitude: order.delivery_longitude,
                    pharmacyName: order.vendor.pharmacy_name,
                    pharmacyAddress: order.vendor.address,
                    orderStatus: order.order_status,
                    totalAmount: order.final_amount,
                  }}
                  deliveryPartnerId={partner.id}
                  onOrderComplete={() => handleOrderComplete(order.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Orders Yet</h3>
                  <p className="text-muted-foreground">
                    Your delivery history will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">Order #{order.order_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary">Delivered</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Pharmacy:</span> {order.vendor.pharmacy_name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Amount:</span> ₹{order.final_amount.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
