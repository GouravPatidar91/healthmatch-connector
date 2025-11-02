import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, MapPin, Phone, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderData {
  id: string;
  order_number: string;
  order_status: string;
  payment_method: string;
  payment_status: string;
  final_amount: number;
  delivery_address: string;
  customer_phone: string;
  created_at: string;
  vendor: {
    pharmacy_name: string;
    phone: string;
    address: string;
  };
  items: Array<{
    medicine_name: string;
    brand: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        toast({
          title: "Invalid Order",
          description: "Order ID not found.",
          variant: "destructive",
        });
        navigate('/medicine');
        return;
      }

      try {
        // Fetch order details
        const { data: order, error: orderError } = await supabase
          .from('medicine_orders')
          .select(`
            id,
            order_number,
            order_status,
            payment_method,
            payment_status,
            final_amount,
            delivery_address,
            customer_phone,
            created_at,
            vendor_id
          `)
          .eq('id', orderId)
          .single();

        if (orderError) throw orderError;

        // Fetch vendor details separately
        const { data: vendor, error: vendorError } = await supabase
          .from('medicine_vendors')
          .select('pharmacy_name, phone, address')
          .eq('id', order.vendor_id)
          .single();

        if (vendorError) throw vendorError;

        // Fetch order items
        const { data: items, error: itemsError } = await supabase
          .from('medicine_order_items')
          .select(`
            quantity,
            unit_price,
            total_price,
            medicine:medicines(name, brand)
          `)
          .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        // Transform data
        const transformedData: OrderData = {
          id: order.id,
          order_number: order.order_number,
          order_status: order.order_status,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          final_amount: order.final_amount,
          delivery_address: order.delivery_address,
          customer_phone: order.customer_phone,
          created_at: order.created_at,
          vendor: vendor,
          items: items.map(item => ({
            medicine_name: item.medicine.name,
            brand: item.medicine.brand,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }))
        };

        setOrderData(transformedData);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast({
          title: "Error",
          description: "Failed to load order details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => navigate('/medicine')}>
            Return to Medicine Store
          </Button>
        </div>
      </div>
    );
  }

  const estimatedDelivery = '30-45 minutes';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Your order has been confirmed and the pharmacy has been notified
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Order Details
              <Badge variant="default" className="bg-green-100 text-green-700">
                {orderData.order_status === 'placed' ? 'Confirmed' : orderData.order_status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-mono font-semibold">{orderData.order_number}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-bold text-lg text-primary">₹{orderData.final_amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Method</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Cash on Delivery
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Status</span>
              <span className="font-medium text-orange-600">Pending (Pay on delivery)</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estimated Delivery</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{estimatedDelivery}</span>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Delivery Address:</p>
              <p className="text-sm text-muted-foreground">{orderData.delivery_address}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Contact Number:</p>
              <p className="text-sm text-muted-foreground">{orderData.customer_phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Items ({orderData.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.medicine_name}</p>
                    <p className="text-sm text-muted-foreground">{item.brand}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.unit_price.toFixed(2)}</p>
                    <p className="text-sm text-primary">₹{item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pharmacy Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Pharmacy Name</span>
              <span className="font-semibold text-right">{orderData.vendor.pharmacy_name}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Contact</span>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{orderData.vendor.phone}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => window.open(`tel:${orderData.vendor.phone}`)}
                >
                  Call Pharmacy
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Address</span>
              <div className="text-right max-w-xs">
                <div className="flex items-start gap-2 justify-end mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-sm">{orderData.vendor.address}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2 text-xs"
                  onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(orderData.vendor.address)}`)}
                >
                  Get Directions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Order Confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    The pharmacy will review and confirm your order
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Order Preparation</p>
                  <p className="text-sm text-muted-foreground">
                    Your medicines will be packed and ready for delivery
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Your order will be delivered within {estimatedDelivery}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium">Payment</p>
                  <p className="text-sm text-muted-foreground">
                    Pay ₹{orderData.final_amount.toFixed(2)} in cash upon delivery
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-orange-600">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span className="text-sm">Keep your phone accessible for delivery updates</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span className="text-sm">Have exact cash amount ready for smooth payment</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span className="text-sm">Check medicines before accepting delivery</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">✓</span>
              <span className="text-sm">Payment: ₹{orderData.final_amount.toFixed(2)} to be collected on delivery</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/medicine')} 
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="flex-1"
            >
              View My Orders
            </Button>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Receipt download will be available soon.",
              });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
