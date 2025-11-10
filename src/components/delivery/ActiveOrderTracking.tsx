import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Phone, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { deliveryPartnerLocationService } from '@/services/deliveryPartnerLocationService';
import { toast } from '@/hooks/use-toast';

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
  orderStatus: string;
  totalAmount: number;
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
      const dist = deliveryPartnerLocationService.calculateDistance(
        location.latitude,
        location.longitude,
        order.deliveryLatitude,
        order.deliveryLongitude
      );
      setDistance(dist);

      // Notify when close to destination
      if (dist < 0.5 && dist > 0.1) {
        toast({
          title: 'Almost There!',
          description: 'You are less than 500m from the delivery address',
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

  const handleMarkDelivered = () => {
    if (onOrderComplete) {
      onOrderComplete();
    }
  };

  const handleCallCustomer = () => {
    window.location.href = `tel:${order.customerPhone}`;
  };

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order #{order.orderNumber}</span>
            <Badge variant={order.orderStatus === 'out_for_delivery' ? 'default' : 'secondary'}>
              {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Address
            </h3>
            <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
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

          {/* Order Amount */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Order Amount</span>
              <span className="text-lg font-bold">₹{order.totalAmount.toFixed(2)}</span>
            </div>
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
              Open in Maps
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

            {order.orderStatus === 'out_for_delivery' && isTracking && (
              <Button
                variant="default"
                className="w-full"
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
