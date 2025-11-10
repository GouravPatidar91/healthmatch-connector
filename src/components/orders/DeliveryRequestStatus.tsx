import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, User, Phone, Bike } from 'lucide-react';
import { deliveryRequestService } from '@/services/deliveryRequestService';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryRequestStatusProps {
  orderId: string;
  vendorId: string;
  deliveryPartner?: {
    id: string;
    name: string;
    phone: string;
    vehicle_type: string;
    vehicle_number: string;
  };
}

export const DeliveryRequestStatus: React.FC<DeliveryRequestStatusProps> = ({
  orderId,
  vendorId,
  deliveryPartner
}) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadRequests();

    // Subscribe to request updates
    const channel = supabase
      .channel(`delivery-requests-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_requests',
          filter: `order_id=eq.${orderId}`
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await deliveryRequestService.getRequestsForOrder(orderId);
      setRequests(data);
      
      // Check if any are still pending
      const hasPending = data.some((r: any) => 
        r.status === 'pending' && new Date(r.expires_at) > new Date()
      );
      setSearching(hasPending);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // If partner already assigned, show partner details
  if (deliveryPartner) {
    return (
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Delivery Partner Assigned
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{deliveryPartner.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{deliveryPartner.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bike className="h-4 w-4 text-muted-foreground" />
            <span>
              {deliveryPartner.vehicle_type} - {deliveryPartner.vehicle_number}
            </span>
          </div>
          <Badge variant="default" className="w-full justify-center">
            Out for Delivery
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Show searching status
  if (searching || requests.length === 0) {
    return (
      <Card className="border-orange-500 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
            Order Packed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <Badge variant="default" className="bg-green-600">
            ✓ Order is packed and ready
          </Badge>
        </CardContent>
        <CardHeader className="pt-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            Assigning Delivery Partner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Notifying nearby delivery partners about this order...
          </p>
          
          {requests.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Partners Notified:</p>
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-2 bg-background rounded-md"
                >
                  <span className="text-sm">
                    {req.delivery_partners?.name || 'Partner'}
                  </span>
                  <Badge
                    variant={
                      req.status === 'pending'
                        ? 'outline'
                        : req.status === 'accepted'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {req.status === 'pending' && new Date(req.expires_at) > new Date() && (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {req.status === 'accepted' && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    {req.status === 'rejected' && (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // All requests expired or rejected
  if (requests.every((r: any) => r.status !== 'accepted')) {
    return (
      <Card className="border-red-500 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            No Partners Available
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No delivery partners accepted the request. You may need to assign manually or try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => loadRequests()}
          >
            Refresh Status
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};
