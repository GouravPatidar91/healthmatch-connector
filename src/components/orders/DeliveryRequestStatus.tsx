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

  // Show searching status with hidden partner names
  if (searching || requests.length === 0) {
    return (
      <Card className="border-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            Searching for Delivery Partners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Notifying nearby delivery partners about this order...
          </p>
          
          {requests.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{requests.length} partners notified</p>
              {requests.map((req, index) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-background/50 backdrop-blur-sm rounded-md border"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <span className="text-sm font-medium blur-sm">Partner {index + 1}</span>
                  </div>
                  <Badge
                    variant={
                      req.status === 'pending'
                        ? 'outline'
                        : req.status === 'accepted'
                        ? 'default'
                        : 'secondary'
                    }
                    className="animate-pulse"
                  >
                    {req.status === 'pending' && new Date(req.expires_at) > new Date() && (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    Waiting...
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Partner details will appear once someone accepts...</span>
          </div>
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
