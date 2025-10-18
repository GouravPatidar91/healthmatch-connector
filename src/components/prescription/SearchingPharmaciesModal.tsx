import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchingPharmaciesModalProps {
  broadcastId: string;
  open: boolean;
  onAccepted: (vendorId: string) => void;
  onFailed: () => void;
}

export const SearchingPharmaciesModal: React.FC<SearchingPharmaciesModalProps> = ({
  broadcastId,
  open,
  onAccepted,
  onFailed
}) => {
  const [status, setStatus] = useState<'searching' | 'accepted' | 'failed'>('searching');
  const [acceptedPharmacy, setAcceptedPharmacy] = useState<string | null>(null);

  useEffect(() => {
    if (!broadcastId) return;

    // Subscribe to broadcast status changes
    const channel = supabase
      .channel(`broadcast-${broadcastId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prescription_broadcasts',
          filter: `id=eq.${broadcastId}`
        },
        (payload) => {
          const broadcast = payload.new as any;
          
          if (broadcast.status === 'accepted') {
            setStatus('accepted');
            setAcceptedPharmacy(broadcast.accepted_by_vendor_id);
            onAccepted(broadcast.accepted_by_vendor_id);
          } else if (broadcast.status === 'failed') {
            setStatus('failed');
            onFailed();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [broadcastId, onAccepted, onFailed]);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {status === 'searching' && 'Searching for Pharmacies...'}
            {status === 'accepted' && 'Pharmacy Found!'}
            {status === 'failed' && 'No Pharmacy Available'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8">
          {status === 'searching' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
              <p className="text-center text-muted-foreground">
                Notifying nearby pharmacies...
                <br />
                <span className="text-sm">This usually takes less than a minute</span>
              </p>
            </>
          )}

          {status === 'accepted' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
              <p className="text-center text-lg font-medium">
                Your order has been accepted!
              </p>
              <p className="text-sm text-muted-foreground">
                The pharmacy will prepare your medicines shortly
              </p>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="h-16 w-16 text-red-600 mb-4" />
              <p className="text-center text-lg font-medium">
                No pharmacy available right now
              </p>
              <p className="text-sm text-muted-foreground">
                Please try again in a few minutes
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
