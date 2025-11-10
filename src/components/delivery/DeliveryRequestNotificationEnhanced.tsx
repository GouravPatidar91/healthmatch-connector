import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeliveryRequestMap } from './DeliveryRequestMap';
import { deliveryRequestService } from '@/services/deliveryRequestService';
import { Package, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DeliveryRequestNotificationEnhancedProps {
  request: any;
  partnerId: string;
  onClose: () => void;
}

export function DeliveryRequestNotificationEnhanced({
  request,
  partnerId,
  onClose
}: DeliveryRequestNotificationEnhancedProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const expiresAt = new Date(request.expires_at).getTime();
      const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(diff);

      // Only close if truly expired (with 1 second buffer)
      if (diff <= 1) {
        setTimeout(() => onClose(), 1000);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [request.expires_at, onClose]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const result = await deliveryRequestService.acceptRequest(request.id, partnerId);
      if (result.success) {
        toast({
          title: "Request Accepted",
          description: "You've accepted this delivery request.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to accept request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      const result = await deliveryRequestService.rejectRequest(request.id, partnerId, "Not available");
      if (result.success) {
        toast({
          title: "Request Declined",
          description: "You've declined this delivery request.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to decline request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decline request",
        variant: "destructive",
      });
    } finally {
      setDeclining(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPriority = timeLeft < 60;

  return (
    <Card className={`border-2 ${isPriority ? 'border-destructive animate-pulse' : 'border-primary'}`}>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">New Delivery Request</p>
              <p className="text-sm text-muted-foreground">
                Order #{request.order?.order_number || 'N/A'}
              </p>
            </div>
          </div>
          {isPriority && (
            <Badge variant="destructive" className="animate-pulse">
              URGENT
            </Badge>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
          <Clock className={`h-5 w-5 ${isPriority ? 'text-destructive' : 'text-primary'}`} />
          <span className={`text-2xl font-bold ${isPriority ? 'text-destructive' : 'text-primary'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Map */}
        {request.order && request.vendor && (
          <DeliveryRequestMap
            partnerId={partnerId}
            vendorLocation={{
              latitude: request.vendor.latitude || 0,
              longitude: request.vendor.longitude || 0
            }}
            vendorName={request.vendor.pharmacy_name || 'Pharmacy'}
            vendorAddress={request.vendor.address || 'Address not available'}
            deliveryLocation={{
              latitude: request.order.delivery_latitude || 0,
              longitude: request.order.delivery_longitude || 0
            }}
            deliveryAddress={request.order.delivery_address || 'Address not available'}
          />
        )}

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Pickup</p>
              <p className="text-sm text-muted-foreground">
                {request.vendor?.pharmacy_name || 'Pharmacy'}
              </p>
              <p className="text-xs text-muted-foreground">
                {request.vendor?.address || 'Address not available'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Delivery</p>
              <p className="text-sm text-muted-foreground">
                {request.order?.delivery_address || 'Address not available'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-medium">Order Amount</span>
            <span className="text-lg font-bold text-primary">
              ₹{request.order?.final_amount?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={accepting || declining}
            className="flex-1"
            size="lg"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {accepting ? 'Accepting...' : 'Accept'}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={accepting || declining}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {declining ? 'Declining...' : 'Decline'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
