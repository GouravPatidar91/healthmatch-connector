import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PrescriptionNotificationProps {
  notification: {
    id: string;
    broadcast_id: string;
    prescription_id: string;
    order_id: string;
    patient_latitude: number;
    patient_longitude: number;
    distance_km: number;
    timeout_at: string;
    prescription_url?: string;
  };
  vendorId: string;
  onClose: () => void;
}

export const PrescriptionNotificationModal: React.FC<PrescriptionNotificationProps> = ({
  notification,
  vendorId,
  onClose
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isResponding, setIsResponding] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Calculate initial time left
    const timeoutDate = new Date(notification.timeout_at);
    const now = new Date();
    const secondsLeft = Math.max(0, Math.floor((timeoutDate.getTime() - now.getTime()) / 1000));
    setTimeLeft(secondsLeft);

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [notification]);

  const handleTimeout = () => {
    toast({
      title: "Opportunity Expired",
      description: "The 3-minute window to accept this order has expired.",
      variant: "destructive",
    });
    onClose();
  };

  const handleAccept = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsResponding(true);
    try {
      const { data, error } = await supabase.functions.invoke('pharmacy-response', {
        body: {
          broadcast_id: notification.broadcast_id,
          vendor_id: vendorId,
          response_type: 'accept'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Order Accepted!",
          description: "The order has been assigned to your pharmacy.",
        });
        onClose();
        window.location.reload();
      } else {
        toast({
          title: "Already Accepted",
          description: data.message,
          variant: "destructive",
        });
        onClose();
      }
    } catch (error) {
      console.error('Accept error:', error);
      toast({
        title: "Error",
        description: "Failed to accept order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const handleReject = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (!rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejecting this order.",
        variant: "destructive",
      });
      return;
    }

    setIsResponding(true);
    try {
      const { error } = await supabase.functions.invoke('pharmacy-response', {
        body: {
          broadcast_id: notification.broadcast_id,
          vendor_id: vendorId,
          response_type: 'reject',
          rejection_reason: rejectionReason
        }
      });

      if (error) throw error;

      toast({
        title: "Order Rejected",
        description: "Your response has been recorded.",
      });
      onClose();
    } catch (error) {
      console.error('Reject error:', error);
      toast({
        title: "Error",
        description: "Failed to reject order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-2xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              🚨 NEW PRESCRIPTION ORDER
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Countdown Timer */}
        <div className={`text-center py-6 rounded-lg ${isUrgent ? 'bg-red-100 animate-pulse' : 'bg-blue-100'}`}>
          <p className="text-sm text-gray-600 mb-2">Time to respond</p>
          <div className={`text-7xl font-bold ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Customer Location */}
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <MapPin className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium">Customer Location</p>
            <p className="text-sm text-gray-600">
              {notification.distance_km.toFixed(1)} km away from your pharmacy
            </p>
          </div>
        </div>

        {/* Prescription Image */}
        {notification.prescription_url && (
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={notification.prescription_url}
              alt="Prescription"
              className="w-full h-[400px] object-contain bg-gray-50"
            />
          </div>
        )}

        {/* Action Buttons */}
        {!showRejectForm ? (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowRejectForm(true)}
              disabled={isResponding}
              className="text-lg py-6"
            >
              Reject Order
            </Button>
            <Button
              size="lg"
              onClick={handleAccept}
              disabled={isResponding}
              className="bg-green-600 hover:bg-green-700 text-lg py-6"
            >
              {isResponding ? 'Processing...' : 'Accept Order'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Medicine out of stock, Already closed, etc."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setShowRejectForm(false)}
                disabled={isResponding}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isResponding}
              >
                {isResponding ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
