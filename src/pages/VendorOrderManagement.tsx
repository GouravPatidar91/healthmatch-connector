import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Phone, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VendorPriceEditor } from '@/components/orders/VendorPriceEditor';
import { DeliveryPartnerSelector } from '@/components/orders/DeliveryPartnerSelector';
import { OrderStatusActions } from '@/components/orders/OrderStatusActions';
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline';
import { DeliveryRequestStatus } from '@/components/orders/DeliveryRequestStatus';

interface OrderData {
  id: string;
  order_number: string;
  order_status: string;
  total_amount: number;
  final_amount: number;
  handling_charges: number;
  delivery_fee: number;
  delivery_address: string;
  customer_phone: string;
  prescription_url?: string;
  prescription_required: boolean;
  created_at: string;
  delivery_partner_id?: string;
  delivery_partner?: {
    id: string;
    name: string;
    phone: string;
    vehicle_type: string;
    vehicle_number: string;
  };
  vendor: {
    pharmacy_name: string;
    latitude?: number;
    longitude?: number;
  };
  items: Array<{
    medicine_id: string;
    medicine_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  status_history: Array<{
    id: string;
    order_id: string;
    status: string;
    notes?: string;
    updated_by_role: string;
    created_at: string;
  }>;
}

export default function VendorOrderManagement() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendorInfo, setVendorInfo] = useState<any>(null);

  useEffect(() => {
    if (orderId && user) {
      loadOrderData();
    }
  }, [orderId, user]);

  // Real-time subscription
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`vendor-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'medicine_orders',
          filter: `id=eq.${orderId}`
        },
        () => {
          loadOrderData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoading(true);

      // Get vendor info first
      const { data: vendor, error: vendorError } = await supabase
        .from('medicine_vendors')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (vendorError) throw vendorError;
      setVendorInfo(vendor);

      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from('medicine_orders')
        .select(`
          *,
          vendor:medicine_vendors!medicine_orders_vendor_id_fkey(pharmacy_name, latitude, longitude),
          delivery_partner:delivery_partners(id, name, phone, vehicle_type, vehicle_number),
          items:medicine_order_items(
            medicine_id,
            quantity,
            unit_price,
            total_price,
            medicine:medicines(name, id)
          ),
          status_history:medicine_order_status_history(*)
        `)
        .eq('id', orderId)
        .eq('vendor_id', vendor.id)
        .single();

      if (orderError) throw orderError;

      const transformedOrder: OrderData = {
        ...orderData,
        delivery_partner: Array.isArray(orderData.delivery_partner) 
          ? orderData.delivery_partner[0] 
          : orderData.delivery_partner,
        items: orderData.items?.map((item: any) => ({
          medicine_id: item.medicine?.id || item.medicine_id,
          medicine_name: item.medicine?.name || 'Unknown',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })) || [],
        status_history: orderData.status_history?.map((s: any) => ({
          ...s,
          order_id: orderData.id
        })).sort((a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || []
      };

      setOrder(transformedOrder);
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      placed: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      preparing: 'bg-yellow-100 text-yellow-800',
      ready_for_pickup: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Order not found</p>
          <Button onClick={() => navigate('/vendor-dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendor-dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
            <p className="text-muted-foreground">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge className={getStatusColor(order.order_status)}>
            {order.order_status.toUpperCase().replace('_', ' ')}
          </Badge>
        </div>

        <Separator />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderStatusTimeline
                  statusHistory={order.status_history}
                  currentStatus={order.order_status}
                />
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.medicine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">₹{item.total_price}</p>
                    </div>
                  ))}
                </div>

                {order.prescription_url && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(order.prescription_url, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Prescription
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Delivery Address</p>
                    <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{order.customer_phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Price Editor */}
            <VendorPriceEditor
              orderId={order.id}
              orderStatus={order.order_status}
              items={order.items}
              currentHandlingCharges={order.handling_charges}
              currentDeliveryFee={order.delivery_fee}
              onPricesUpdated={loadOrderData}
            />

            {/* Status Actions */}
            <OrderStatusActions
              orderId={order.id}
              currentStatus={order.order_status}
              onStatusUpdated={loadOrderData}
            />

            {/* Delivery Request Status - Show when ready for pickup or partner assigned */}
            {(order.order_status === 'ready_for_pickup' || 
              order.order_status === 'out_for_delivery') && (
              <DeliveryRequestStatus
                orderId={order.id}
                vendorId={vendorInfo.id}
                deliveryPartner={order.delivery_partner}
              />
            )}

            {/* Manual Delivery Partner Selector - Only show if not ready for pickup */}
            {order.order_status !== 'ready_for_pickup' && 
             order.order_status !== 'out_for_delivery' && 
             order.order_status !== 'delivered' && (
              <DeliveryPartnerSelector
                orderId={order.id}
                orderStatus={order.order_status}
                vendorLocation={
                  vendorInfo?.latitude && vendorInfo?.longitude
                    ? { latitude: vendorInfo.latitude, longitude: vendorInfo.longitude }
                    : undefined
                }
                onPartnerAssigned={loadOrderData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
