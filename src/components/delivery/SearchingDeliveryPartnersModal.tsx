import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Bike, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchingDeliveryPartnersModalProps {
  broadcastId: string | null;
  orderId: string;
  open: boolean;
  onAccepted: (partnerId: string) => void;
  onFailed: () => void;
  onClose: () => void;
  onRestart?: () => void;
}

export const SearchingDeliveryPartnersModal: React.FC<SearchingDeliveryPartnersModalProps> = ({
  broadcastId,
  orderId,
  open,
  onAccepted,
  onFailed,
  onClose,
  onRestart,
}) => {
  const [status, setStatus] = useState<'searching' | 'accepted' | 'failed'>('searching');
  const [currentPhase, setCurrentPhase] = useState<string>('controlled_parallel');
  const [partnersNotified, setPartnersNotified] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState<number>(0);
  const [acceptedPartner, setAcceptedPartner] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const isHandledRef = useRef(false);

  const TOTAL_TIMEOUT = 180; // 3 minutes

  const handleAccepted = useCallback((partnerId: string) => {
    if (isHandledRef.current) return;
    isHandledRef.current = true;
    setStatus('accepted');
    setAcceptedPartner(partnerId);
    onAccepted(partnerId);
  }, [onAccepted]);

  const checkBroadcastStatus = useCallback(async () => {
    if (!broadcastId || isHandledRef.current) return;

    try {
      const { data: broadcast, error } = await supabase
        .from('delivery_broadcasts')
        .select('*')
        .eq('id', broadcastId)
        .single();

      if (error || !broadcast) return;

      setCurrentPhase(broadcast.current_phase || 'controlled_parallel');
      setPartnersNotified(broadcast.notified_partner_ids?.length || 0);

      // Calculate time left based on phase_timeout_at
      if (broadcast.phase_timeout_at) {
        const timeout = new Date(broadcast.phase_timeout_at).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((timeout - now) / 1000));
        setTimeLeft(remaining);
      }

      if (broadcast.status === 'accepted' && broadcast.accepted_by_partner_id) {
        handleAccepted(broadcast.accepted_by_partner_id);
      } else if (broadcast.status === 'failed') {
        if (!isHandledRef.current) {
          isHandledRef.current = true;
          setStatus('failed');
          onFailed();
        }
      }
    } catch (err) {
      console.error('Error checking broadcast status:', err);
    }
  }, [broadcastId, handleAccepted, onFailed]);

  useEffect(() => {
    if (!broadcastId || !open) return;

    isHandledRef.current = false;
    setStatus('searching');
    setTimeLeft(15);
    setTotalTimeElapsed(0);

    // Set up real-time subscription
    const channel = supabase
      .channel(`delivery-broadcast-${broadcastId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_broadcasts',
          filter: `id=eq.${broadcastId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          setCurrentPhase(newData.current_phase || 'controlled_parallel');
          setPartnersNotified(newData.notified_partner_ids?.length || 0);

          if (newData.status === 'accepted' && newData.accepted_by_partner_id) {
            handleAccepted(newData.accepted_by_partner_id);
          } else if (newData.status === 'failed') {
            if (!isHandledRef.current) {
              isHandledRef.current = true;
              setStatus('failed');
              onFailed();
            }
          }
        }
      )
      .subscribe();

    // Initial check
    checkBroadcastStatus();

    // Polling fallback
    const pollInterval = setInterval(checkBroadcastStatus, 2000);

    // Escalation trigger
    const escalationInterval = setInterval(async () => {
      if (isHandledRef.current) return;
      try {
        await supabase.functions.invoke('delivery-broadcast-escalation', { body: {} });
      } catch (err) {
        console.warn('Escalation trigger error:', err);
      }
    }, 5000);

    // Countdown timer for phase
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Total elapsed time counter
    const elapsedInterval = setInterval(() => {
      setTotalTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      clearInterval(escalationInterval);
      clearInterval(countdownInterval);
      clearInterval(elapsedInterval);
    };
  }, [broadcastId, open, handleAccepted, onFailed, checkBroadcastStatus]);

  const getPhaseLabel = () => {
    if (currentPhase === 'controlled_parallel') {
      return 'Priority Search (Top 3 Partners)';
    }
    return 'Extended Search';
  };

  const handleRestartClick = async () => {
    if (!onRestart) return;
    setIsRestarting(true);
    try {
      await onRestart();
    } finally {
      setIsRestarting(false);
    }
  };

  const formatTimeRemaining = () => {
    const remaining = Math.max(0, TOTAL_TIMEOUT - totalTimeElapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'searching' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {status === 'accepted' && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === 'failed' && <XCircle className="h-5 w-5 text-destructive" />}
            {status === 'searching' && 'Finding Delivery Partner...'}
            {status === 'accepted' && 'Delivery Partner Found!'}
            {status === 'failed' && 'No Partners Available'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === 'searching' && (
            <>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center">
                    <Bike className="h-10 w-10 text-primary animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="destructive" className="text-xs">
                      {timeLeft}s
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <Badge variant="secondary" className="mb-2">
                  {getPhaseLabel()}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Notifying {partnersNotified} delivery partner{partnersNotified !== 1 ? 's' : ''}...
                </p>
                <p className="text-xs text-muted-foreground">
                  First to accept gets the delivery
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Total time remaining: {formatTimeRemaining()}
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {[...Array(Math.min(partnersNotified, 5))].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <Bike className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </>
          )}

          {status === 'accepted' && (
            <div className="text-center space-y-2">
              <p className="text-sm">
                A delivery partner has been assigned to your order.
              </p>
              <p className="text-xs text-muted-foreground">
                The partner is on their way to pick up the order.
              </p>
              <Button onClick={onClose} className="mt-4">
                Close
              </Button>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                No delivery partners accepted within 3 minutes.
              </p>
              <p className="text-xs text-muted-foreground">
                All nearby partners were notified but none were available.
              </p>
              
              {onRestart && (
                <Button 
                  onClick={handleRestartClick} 
                  className="w-full"
                  disabled={isRestarting}
                >
                  {isRestarting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Restart Search from Phase 1
                </Button>
              )}
              
              <Button variant="outline" onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};