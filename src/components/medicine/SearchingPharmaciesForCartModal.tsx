import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, Store, Zap, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SearchingPharmaciesForCartModalProps {
  broadcastId: string | null;
  open: boolean;
  onAccepted: (vendorId: string, orderId: string) => void;
  onFailed: () => void;
  onClose: () => void;
}

type BroadcastPhase = 'controlled_parallel' | 'sequential';

export const SearchingPharmaciesForCartModal: React.FC<SearchingPharmaciesForCartModalProps> = ({
  broadcastId,
  open,
  onAccepted,
  onFailed,
  onClose
}) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'searching' | 'accepted' | 'failed'>('searching');
  const [acceptedPharmacy, setAcceptedPharmacy] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes total
  const [currentPhase, setCurrentPhase] = useState<BroadcastPhase>('controlled_parallel');
  const [vendorsChecked, setVendorsChecked] = useState(0);
  const isHandledRef = useRef(false);

  // Stable callback to handle acceptance
  const handleAccepted = useCallback((vendorId: string, newOrderId: string) => {
    if (isHandledRef.current) {
      console.log('[CartModal] Already handled, skipping duplicate acceptance');
      return;
    }
    
    console.log('[CartModal] Order accepted! vendorId:', vendorId, 'orderId:', newOrderId);
    isHandledRef.current = true;
    setStatus('accepted');
    setAcceptedPharmacy(vendorId);
    setOrderId(newOrderId);
    onAccepted(vendorId, newOrderId);
    
    setTimeout(() => {
      console.log('[CartModal] Redirecting to order tracking:', `/my-orders?track=${newOrderId}`);
      navigate(`/my-orders?track=${newOrderId}`);
      onClose();
    }, 800);
  }, [navigate, onAccepted, onClose]);

  // Stable callback to check broadcast status (for polling and fallback)
  const checkBroadcastStatus = useCallback(async () => {
    if (!broadcastId || isHandledRef.current) return;
    
    console.log('[CartModal] Polling broadcast status for:', broadcastId);
    
    const { data, error } = await supabase
      .from('cart_order_broadcasts')
      .select('status, accepted_by_vendor_id, order_id, current_phase, current_vendor_index, notified_vendor_ids')
      .eq('id', broadcastId)
      .single();

    if (error) {
      console.error('[CartModal] Error polling broadcast status:', error);
      return;
    }

    console.log('[CartModal] Poll result:', data);

    // Update phase info for UI
    if (data?.current_phase) {
      setCurrentPhase(data.current_phase as BroadcastPhase);
    }
    if (data?.notified_vendor_ids) {
      setVendorsChecked(data.notified_vendor_ids.length);
    }

    if (data?.status === 'accepted' && data.order_id) {
      handleAccepted(data.accepted_by_vendor_id, data.order_id);
    } else if (data?.status === 'accepted' && !data.order_id) {
      console.warn('[CartModal] Status is accepted but order_id is missing, will retry...');
    } else if (data?.status === 'failed') {
      console.log('[CartModal] Broadcast failed');
      setStatus('failed');
      onFailed();
    }
  }, [broadcastId, handleAccepted, onFailed]);

  useEffect(() => {
    if (!broadcastId || !open) return;

    // Reset state when modal opens with new broadcastId
    isHandledRef.current = false;
    setStatus('searching');
    setTimeLeft(180);
    setCurrentPhase('controlled_parallel');
    setVendorsChecked(0);

    console.log('[CartModal] Setting up real-time subscription for broadcast:', broadcastId);

    // Set up realtime subscription
    const channel = supabase
      .channel(`cart-broadcast-${broadcastId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cart_order_broadcasts',
          filter: `id=eq.${broadcastId}`
        },
        (payload) => {
          console.log('[CartModal] Real-time update received:', JSON.stringify(payload));
          const newData = payload.new as any;

          // Update phase info
          if (newData.current_phase) {
            setCurrentPhase(newData.current_phase as BroadcastPhase);
          }
          if (newData.notified_vendor_ids) {
            setVendorsChecked(newData.notified_vendor_ids.length);
          }

          if (newData.status === 'accepted') {
            if (newData.order_id) {
              handleAccepted(newData.accepted_by_vendor_id, newData.order_id);
            } else {
              console.warn('[CartModal] Accepted via real-time but no order_id, forcing poll...');
              setTimeout(checkBroadcastStatus, 500);
            }
          } else if (newData.status === 'failed') {
            console.log('[CartModal] Broadcast failed via real-time');
            setStatus('failed');
            onFailed();
          }
        }
      )
      .subscribe((subscribeStatus) => {
        console.log('[CartModal] Subscription status:', subscribeStatus);
      });

    // Immediate check after 1 second
    const immediateCheck = setTimeout(checkBroadcastStatus, 1000);

    // Fallback polling every 3 seconds
    const pollInterval = setInterval(checkBroadcastStatus, 3000);

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isHandledRef.current) {
            console.log('[CartModal] Timeout reached, marking as failed');
            setStatus('failed');
            onFailed();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log('[CartModal] Cleaning up subscriptions');
      supabase.removeChannel(channel);
      clearInterval(timer);
      clearInterval(pollInterval);
      clearTimeout(immediateCheck);
    };
  }, [broadcastId, open, checkBroadcastStatus, handleAccepted, onFailed]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && status !== 'searching' && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {status === 'searching' && 'Finding Nearby Pharmacies'}
            {status === 'accepted' && 'Order Accepted!'}
            {status === 'failed' && 'No Pharmacy Available'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {status === 'searching' && (
            <>
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Store className="h-12 w-12 text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
              
              {/* Phase indicator */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted">
                {currentPhase === 'controlled_parallel' ? (
                  <>
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Priority Search</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Extended Search</span>
                  </>
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-medium">
                  {currentPhase === 'controlled_parallel' 
                    ? 'Contacting top pharmacies...' 
                    : 'Searching more pharmacies...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentPhase === 'controlled_parallel'
                    ? 'Top-rated nearby pharmacies are being notified'
                    : `Checked ${vendorsChecked} pharmacies so far`}
                </p>
              </div>

              <div className="bg-muted rounded-lg px-6 py-3">
                <p className="text-sm text-muted-foreground">Time remaining</p>
                <p className="text-2xl font-bold text-center">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Waiting for pharmacy response...</span>
              </div>
            </>
          )}

          {status === 'accepted' && (
            <>
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-green-600">Order Accepted!</p>
                <p className="text-sm text-muted-foreground">
                  A pharmacy has accepted your order
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting to order tracking...
                </p>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-red-600">No Pharmacy Available</p>
                <p className="text-sm text-muted-foreground">
                  Unfortunately, no pharmacy could accept your order at this time.
                  Please try again later.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
