import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, User, Phone, Bike, RefreshCw } from 'lucide-react';
import { deliveryRequestService } from '@/services/deliveryRequestService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliveryRequestStatusProps {
  orderId: string;
  vendorId: string;
  orderStatus?: string;
  vendorLocation?: { latitude: number; longitude: number } | null;
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
  orderStatus,
  vendorLocation,
  deliveryPartner
}) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
    loadActiveBroadcast();

    // Subscribe to request updates
    const requestChannel = supabase
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

    // Subscribe to broadcast updates
    const broadcastChannel = supabase
      .channel(`delivery-broadcast-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_broadcasts',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          console.log('Broadcast update:', payload);
          loadActiveBroadcast();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [orderId]);

  // Countdown timer for active broadcast
  useEffect(() => {
    if (!activeBroadcast || activeBroadcast.status !== 'searching') return;

    const interval = setInterval(() => {
      const phaseTimeout = new Date(activeBroadcast.phase_timeout_at).getTime();
      const remaining = Math.max(0, Math.ceil((phaseTimeout - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        // Trigger escalation
        triggerEscalation();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBroadcast]);

  const loadActiveBroadcast = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_broadcasts')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'searching')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setActiveBroadcast(data);
        setSearching(true);
      } else {
        setActiveBroadcast(null);
      }
    } catch (error) {
      console.error('Error loading broadcast:', error);
    }
  };

  const triggerEscalation = async () => {
    if (!activeBroadcast) return;
    
    try {
      await supabase.functions.invoke('delivery-broadcast-escalation', {
        body: { broadcastId: activeBroadcast.id }
      });
      loadActiveBroadcast();
    } catch (error) {
      console.error('Error triggering escalation:', error);
    }
  };

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

  const handleBroadcastToPartners = async () => {
    if (!vendorLocation?.latitude || !vendorLocation?.longitude) {
      toast({
        title: 'Location Required',
        description: 'Vendor location is required to find delivery partners',
        variant: 'destructive',
      });
      return;
    }

    setBroadcasting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delivery-hybrid-broadcast', {
        body: {
          orderId,
          vendorId,
          vendorLocation: { latitude: vendorLocation.latitude, longitude: vendorLocation.longitude },
          radiusKm: 10
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: 'Priority Search Started',
          description: `Top ${data.partnersNotified} nearby delivery partners notified`,
        });
        setSearching(true);
        loadActiveBroadcast();
      } else {
        toast({
          title: 'No Partners Available',
          description: data?.error || 'No delivery partners found nearby',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error broadcasting:', error);
      toast({
        title: 'Error',
        description: 'Failed to notify delivery partners',
        variant: 'destructive',
      });
    } finally {
      setBroadcasting(false);
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

  // Show searching status with active broadcast info
  if (searching || activeBroadcast) {
    const phase = activeBroadcast?.current_phase || 'controlled_parallel';
    const phaseLabel = phase === 'controlled_parallel' ? 'Priority Search' : 'Extended Search';
    const notifiedCount = activeBroadcast?.notified_partner_ids?.length || requests.length;

    return (
      <Card className="border-orange-500 bg-orange-50/50 dark:bg-orange-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            Searching for Delivery Partners
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              {phaseLabel}
            </Badge>
            <div className="flex items-center gap-1 text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>{timeLeft}s</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {notifiedCount} partner{notifiedCount !== 1 ? 's' : ''} notified • Waiting for acceptance...
          </p>
          
          {requests.length > 0 && (
            <div className="space-y-2">
              {requests.filter(r => r.status === 'pending').slice(0, 3).map((req, index) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-background/50 backdrop-blur-sm rounded-md border"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <span className="text-sm font-medium blur-sm">Partner {index + 1}</span>
                  </div>
                  <Badge variant="outline" className="animate-pulse">
                    <Clock className="h-3 w-3 mr-1" />
                    Waiting...
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show "Find Delivery Partner" button for ready_for_pickup orders without partner
  if (orderStatus === 'ready_for_pickup' && !deliveryPartner && !searching && requests.length === 0) {
    return (
      <Card className="border-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bike className="h-5 w-5 text-blue-600" />
            Find Delivery Partner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Order is ready for pickup. Start searching for nearby delivery partners.
          </p>
          <Button
            onClick={handleBroadcastToPartners}
            disabled={broadcasting}
            className="w-full"
          >
            {broadcasting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Bike className="h-4 w-4 mr-2" />
                Find Delivery Partner
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // All requests expired or rejected - show retry option
  if (requests.length > 0 && requests.every((r: any) => r.status !== 'accepted' && r.status !== 'pending')) {
    return (
      <Card className="border-red-500 bg-red-50/50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            No Partners Available
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No delivery partners accepted the request. Try searching again.
          </p>
          <Button
            onClick={handleBroadcastToPartners}
            disabled={broadcasting}
            variant="outline"
            className="w-full"
          >
            {broadcasting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};
