import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, User, Phone, Bike, RefreshCw } from 'lucide-react';
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
  const [broadcastRound, setBroadcastRound] = useState(1);
  const [nextRetryTime, setNextRetryTime] = useState<Date | null>(null);

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

      // Calculate broadcast round by grouping requests by creation time
      if (data.length > 0) {
        const rounds: any[][] = [];
        let currentRound: any[] = [];
        const sortedRequests = [...data].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        for (let i = 0; i < sortedRequests.length; i++) {
          const req = sortedRequests[i];
          if (currentRound.length === 0) {
            currentRound.push(req);
          } else {
            const timeDiff = Math.abs(
              new Date(currentRound[0].created_at).getTime() - new Date(req.created_at).getTime()
            ) / 1000;
            
            if (timeDiff < 10) {
              currentRound.push(req);
            } else {
              rounds.push(currentRound);
              currentRound = [req];
            }
          }
        }
        if (currentRound.length > 0) {
          rounds.push(currentRound);
        }

        setBroadcastRound(rounds.length);

        // Calculate next retry time (3 minutes after last request)
        const lastRequest = sortedRequests[0];
        if (lastRequest && !hasPending) {
          const lastRequestTime = new Date(lastRequest.created_at);
          const nextRetry = new Date(lastRequestTime.getTime() + 3 * 60 * 1000);
          if (nextRetry > new Date() && rounds.length < 3) {
            setNextRetryTime(nextRetry);
          } else {
            setNextRetryTime(null);
          }
        }
      }
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
            Searching for delivery partners nearby...
          </p>

          {broadcastRound > 1 && (
            <Badge variant="outline" className="flex items-center gap-1 w-fit">
              <RefreshCw className="h-3 w-3" />
              Attempt {broadcastRound} of 3 (Expanded radius: {10 * broadcastRound}km)
            </Badge>
          )}

          {nextRetryTime && broadcastRound < 3 && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              <Clock className="h-3 w-3 inline mr-1" />
              Next automatic retry: {new Date(nextRetryTime).toLocaleTimeString()}
            </div>
          )}
          
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
    const maxAttemptsReached = broadcastRound >= 3;
    
    return (
      <Card className={maxAttemptsReached ? "border-red-500 bg-red-50/50" : "border-yellow-500 bg-yellow-50/50"}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {maxAttemptsReached ? (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Maximum Retry Attempts Reached
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-yellow-600" />
                Waiting for Partners
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {maxAttemptsReached ? (
            <>
              <p className="text-sm text-muted-foreground">
                Attempted {broadcastRound} times with expanded search radius (up to {10 * broadcastRound}km). No partners accepted the delivery request.
              </p>
              <p className="text-sm font-medium">
                Please assign a delivery partner manually or contact support.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Attempt {broadcastRound} of 3. System will automatically retry with expanded radius.
              </p>
              {nextRetryTime && (
                <div className="text-sm p-2 bg-background rounded border">
                  <RefreshCw className="h-4 w-4 inline mr-2 text-muted-foreground" />
                  Next retry: {new Date(nextRetryTime).toLocaleTimeString()}
                </div>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => loadRequests()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};
