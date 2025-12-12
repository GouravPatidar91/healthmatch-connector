import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SearchingPharmaciesForCartModalProps {
  broadcastId: string | null;
  open: boolean;
  onAccepted: (vendorId: string, orderId: string) => void;
  onFailed: () => void;
  onClose: () => void;
}

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
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  useEffect(() => {
    if (!broadcastId || !open) return;

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
          console.log('Cart broadcast update:', payload);
          const newData = payload.new as any;
          
          if (newData.status === 'accepted') {
            setStatus('accepted');
            setAcceptedPharmacy(newData.accepted_by_vendor_id);
            setOrderId(newData.order_id);
            onAccepted(newData.accepted_by_vendor_id, newData.order_id);
            
            // Redirect to order tracking after 2 seconds
            setTimeout(() => {
              navigate(`/my-orders?track=${newData.order_id}`);
            }, 2000);
          } else if (newData.status === 'failed') {
            setStatus('failed');
            onFailed();
          }
        }
      )
      .subscribe();

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (status === 'searching') {
            setStatus('failed');
            onFailed();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [broadcastId, open, navigate, onAccepted, onFailed, status]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
              
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Searching for pharmacies...</p>
                <p className="text-sm text-muted-foreground">
                  We're notifying nearby pharmacies about your order
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
