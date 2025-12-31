import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Phone, Navigation, CheckCircle, AlertCircle, Package, Store, Truck } from 'lucide-react';
import { deliveryPartnerLocationService } from '@/services/deliveryPartnerLocationService';
import { orderManagementService } from '@/services/orderManagementService';
import { toast } from '@/hooks/use-toast';
import { DeliveryRequestMap } from '@/components/delivery/DeliveryRequestMap';

interface OrderDetails {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyLatitude?: number;
  pharmacyLongitude?: number;
  orderStatus: string;
  deliveryFee: number;
  tipAmount?: number;
}

interface ActiveOrderTrackingProps {
  order: OrderDetails;
  deliveryPartnerId: string;
  onOrderComplete?: () => void;
}

export function ActiveOrderTracking({
  order,
  deliveryPartnerId,
  onOrderComplete,
}: ActiveOrderTrackingProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [currentOrderStatus, setCurrentOrderStatus] = useState(order.orderStatus);

  // Determine phase
  const isGoingToPickup = ['placed', 'confirmed', 'preparing', 'ready_for_pickup'].includes(currentOrderStatus);
  const isOutForDelivery = currentOrderStatus === 'out_for_delivery';

  useEffect(() => {
    setCurrentOrderStatus(order.orderStatus);
  }, [order.orderStatus]);

  useEffect(() => {
    if (isTracking) {
      startTracking();
    }

    return () => {
      if (isTracking) {
        deliveryPartnerLocationService.stopLocationTracking();
      }
    };
  }, [isTracking]);

  const startTracking = async () => {
    const result = await deliveryPartnerLocationService.startLocationTracking(deliveryPartnerId);
    
    if (!result.success) {
      setLocationError(result.error || 'Failed to start location tracking');
      setIsTracking(false);
      toast({
        title: 'Location Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setLocationError(null);
      updateDistance();
      
      // Update distance periodically
      const interval = setInterval(updateDistance, 10000);
      return () => clearInterval(interval);
    }
  };

  const updateDistance = async () => {
    const location = await deliveryPartnerLocationService.getCurrentLocation(deliveryPartnerId);
    if (location) {
      // Calculate distance to appropriate destination
      const destLat = isGoingToPickup && order.pharmacyLatitude ? order.pharmacyLatitude : order.deliveryLatitude;
      const destLng = isGoingToPickup && order.pharmacyLongitude ? order.pharmacyLongitude : order.deliveryLongitude;
      
      const dist = deliveryPartnerLocationService.calculateDistance(
        location.latitude,
        location.longitude,
        destLat,
        destLng
      );
      setDistance(dist);

      // Notify when close to destination
      if (dist < 0.5 && dist > 0.1) {
        const destName = isGoingToPickup ? 'pharmacy' : 'delivery address';
        toast({
          title: 'Almost There!',
          description: `You are less than 500m from the ${destName}`,
        });
      }
    }
  };

  const handleStartTracking = () => {
    setIsTracking(true);
    toast({
      title: 'Tracking Started',
      description: 'Your location is now being shared with the customer',
    });
  };

  const handleStopTracking = () => {
    deliveryPartnerLocationService.stopLocationTracking();
    setIsTracking(false);
    toast({
      title: 'Tracking Stopped',
      description: 'Location sharing has been disabled',
    });
  };

  // NEW: Order Picked handler
  const handleOrderPicked = async () => {
    try {
      const result = await orderManagementService.updateOrderStatusWithHistory(
        order.id,
        'out_for_delivery',
        'Order picked up from pharmacy',
        deliveryPartnerId,
        'delivery_partner'
      );

      if (result.success) {
        setCurrentOrderStatus('out_for_delivery');
        
        // Start tracking automatically after pickup
        if (!isTracking) {
          setIsTracking(true);
        }
        
        toast({
          title: 'Order Picked Up!',
          description: 'Now delivering to customer. Location tracking started.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmPickup = async () => {
    try {
      const result = await orderManagementService.updateOrderStatusWithHistory(
        order.id,
        'out_for_delivery',
        'Order picked up from pharmacy',
        deliveryPartnerId,
        'delivery_partner'
      );

      if (result.success) {
        setCurrentOrderStatus('out_for_delivery');
        
        // Start tracking automatically after pickup
        if (!isTracking) {
          setIsTracking(true);
        }
        
        toast({
          title: 'Order Picked Up',
          description: 'You have confirmed pickup. Location tracking started.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm pickup. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkDelivered = async () => {
    try {
      const result = await orderManagementService.updateOrderStatusWithHistory(
        order.id,
        'delivered',
        'Order delivered to customer',
        deliveryPartnerId,
        'delivery_partner'
      );

      if (result.success) {
        // Stop tracking automatically after delivery
        if (isTracking) {
          deliveryPartnerLocationService.stopLocationTracking();
          setIsTracking(false);
        }

        toast({
          title: 'Order Delivered',
          description: 'Order marked as delivered successfully.',
        });

        if (onOrderComplete) {
          onOrderComplete();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark order as delivered. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCallCustomer = () => {
    window.location.href = `tel:${order.customerPhone}`;
  };

  const handleOpenMaps = () => {
    // Navigate to appropriate destination based on order status
    const destLat = isGoingToPickup && order.pharmacyLatitude ? order.pharmacyLatitude : order.deliveryLatitude;
    const destLng = isGoingToPickup && order.pharmacyLongitude ? order.pharmacyLongitude : order.deliveryLongitude;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order #{order.orderNumber}</span>
            <Badge 
              variant={currentOrderStatus === 'out_for_delivery' ? 'default' : 'secondary'}
              className={isGoingToPickup ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              {currentOrderStatus.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map showing route */}
          {order.pharmacyLatitude && order.pharmacyLongitude && (
            <DeliveryRequestMap
              partnerId={deliveryPartnerId}
              vendorLocation={{ latitude: order.pharmacyLatitude, longitude: order.pharmacyLongitude }}
              vendorName={order.pharmacyName}
              vendorAddress={order.pharmacyAddress}
              deliveryLocation={{ latitude: order.deliveryLatitude, longitude: order.deliveryLongitude }}
              deliveryAddress={order.deliveryAddress}
              customerPhone={order.customerPhone}
              orderStatus={currentOrderStatus}
            />
          )}

          {/* Phase Indicator */}
          <div className={`p-3 rounded-lg border-2 ${isGoingToPickup ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-green-500 bg-green-50 dark:bg-green-950'}`}>
            <div className="flex items-center gap-3">
              {isGoingToPickup ? (
                <>
                  <Store className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-700 dark:text-blue-400">Go to Pharmacy for Pickup</p>
                    <p className="text-sm text-blue-600 dark:text-blue-500">{order.pharmacyName}</p>
                  </div>
                </>
              ) : (
                <>
                  <Truck className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">Delivering to Customer</p>
                    <p className="text-sm text-green-600 dark:text-green-500">{order.customerName}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {isGoingToPickup ? 'Pickup Location' : 'Delivery Address'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isGoingToPickup ? order.pharmacyAddress : order.deliveryAddress}
            </p>
            {distance !== null && (
              <p className="text-sm font-medium text-primary">
                Distance: {distance.toFixed(2)} km
              </p>
            )}
          </div>

          {/* Customer Contact */}
          <div className="space-y-2">
            <h3 className="font-semibold">Customer Contact</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{order.customerName}</p>
                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCallCustomer}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            </div>
          </div>

          {/* Pharmacy Info */}
          <div className="space-y-2">
            <h3 className="font-semibold">Pickup From</h3>
            <div>
              <p className="text-sm font-medium">{order.pharmacyName}</p>
              <p className="text-sm text-muted-foreground">{order.pharmacyAddress}</p>
            </div>
          </div>

          {/* Your Earnings */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-green-600">Your Earnings</span>
              <span className="text-lg font-bold text-green-600">
                ₹{(order.deliveryFee + (order.tipAmount || 0)).toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Delivery Fee: ₹{order.deliveryFee.toFixed(2)}
              {order.tipAmount && order.tipAmount > 0 && ` + Tip: ₹${order.tipAmount.toFixed(2)}`}
            </p>
          </div>

          {/* Location Error */}
          {locationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          {/* Tracking Status */}
          {isTracking && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Location tracking is active. Customer can see your real-time location.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleOpenMaps}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navigate to {isGoingToPickup ? 'Pharmacy' : 'Customer'}
            </Button>

            {!isTracking ? (
              <Button
                className="w-full"
                onClick={handleStartTracking}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Start Location Tracking
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleStopTracking}
              >
                Stop Tracking
              </Button>
            )}

            {/* Order Picked Button - shown when going to pickup */}
            {isGoingToPickup && (
              <Button
                onClick={handleOrderPicked}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                variant="default"
                size="lg"
              >
                <Package className="w-5 h-5 mr-2" />
                Order Picked - Start Delivery
              </Button>
            )}

            {/* Mark as Delivered Button - shown when out for delivery */}
            {isOutForDelivery && (
              <Button
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleMarkDelivered}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Delivered
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}