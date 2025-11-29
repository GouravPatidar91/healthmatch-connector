import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Clock, Phone } from 'lucide-react';
import { deliveryRequestService } from '@/services/deliveryRequestService';
import { useToast } from '@/hooks/use-toast';
import { DeliveryRequestMap } from './DeliveryRequestMap';

interface DeliveryRequestNotificationProps {
  request: any;
  partnerId: string;
  onClose: () => void;
}

export const DeliveryRequestNotification: React.FC<DeliveryRequestNotificationProps> = ({
  request,
  partnerId,
  onClose,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const expiresAt = new Date(request.expires_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(diff);

      if (diff === 0) {
        onClose();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [request.expires_at, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setLoading(true);
    const result = await deliveryRequestService.acceptRequest(request.id, partnerId);

    if (result.success) {
      toast({
        title: 'Request Accepted',
        description: 'You have been assigned to this delivery',
      });
      onClose();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to accept request',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleDecline = async () => {
    setLoading(true);
    const result = await deliveryRequestService.rejectRequest(
      request.id,
      partnerId,
      'Not available'
    );

    if (result.success) {
      toast({
        title: 'Request Declined',
        description: 'The request has been declined',
      });
      onClose();
    }
    setLoading(false);
  };

  const vendor = request.medicine_orders?.medicine_vendors;
  const order = request.medicine_orders;

  return (
    <Card className="border-primary shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            New Delivery Request
          </CardTitle>
          <Badge variant="destructive" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(timeRemaining)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Map View */}
        {vendor?.latitude && vendor?.longitude && order?.delivery_latitude && order?.delivery_longitude && (
          <DeliveryRequestMap
            partnerId={partnerId}
            vendorLocation={{
              latitude: vendor.latitude,
              longitude: vendor.longitude,
            }}
            vendorName={vendor.pharmacy_name}
            vendorAddress={vendor.address}
            deliveryLocation={{
              latitude: order.delivery_latitude,
              longitude: order.delivery_longitude,
            }}
            deliveryAddress={order.delivery_address}
          />
        )}

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
            <div className="flex-1">
              <p className="text-sm font-medium">Pickup Location</p>
              <p className="text-sm text-muted-foreground">
                {vendor?.pharmacy_name}
              </p>
              <p className="text-xs text-muted-foreground">{vendor?.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
            <div className="flex-1">
              <p className="text-sm font-medium">Delivery Location</p>
              <p className="text-sm text-muted-foreground">
                {order?.delivery_address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Order: {order?.order_number}</p>
              <p className="text-sm text-muted-foreground">
                Amount: ₹{order?.total_amount}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleAccept}
            disabled={loading || timeRemaining < 10}
            className="flex-1"
          >
            {timeRemaining < 10 ? 'Expired' : 'Accept Delivery'}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
