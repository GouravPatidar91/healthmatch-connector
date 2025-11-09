import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
      console.log('Accepting order with broadcast_id:', notification.broadcast_id);
      
      const { data, error } = await supabase.functions.invoke('pharmacy-response', {
        body: {
          broadcast_id: notification.broadcast_id,
          vendor_id: vendorId,
          response_type: 'accept'
        }
      });

      console.log('Accept response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to communicate with server');
      }

      if (data?.success) {
        toast({
          title: "Order Accepted!",
          description: "Redirecting to order management...",
        });
        onClose();
        
        // Redirect to vendor order management page
        if (data.order_id) {
          setTimeout(() => {
            navigate(`/vendor-dashboard/order/${data.order_id}`);
          }, 1000);
        } else {
          window.location.reload();
        }
      } else if (data?.success === false) {
        toast({
          title: "Cannot Accept Order",
          description: data.message || "This order may have already been accepted by another pharmacy.",
          variant: "destructive",
        });
        onClose();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Accept error:', error);
      toast({
        title: "Error Accepting Order",
        description: error.message || "Failed to accept order. Please check your connection and try again.",
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
      console.log('Rejecting order with broadcast_id:', notification.broadcast_id);
      
      const { data, error } = await supabase.functions.invoke('pharmacy-response', {
        body: {
          broadcast_id: notification.broadcast_id,
          vendor_id: vendorId,
          response_type: 'reject',
          rejection_reason: rejectionReason
        }
      });

      console.log('Reject response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to communicate with server');
      }

      toast({
        title: "Order Rejected",
        description: "Your response has been recorded.",
      });
      onClose();
    } catch (error: any) {
      console.error('Reject error:', error);
      toast({
        title: "Error Rejecting Order",
        description: error.message || "Failed to reject order. Please check your connection and try again.",
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

        {/* Prescription File Viewer */}
        {notification.prescription_url && (() => {
          const fileExtension = notification.prescription_url.split('.').pop()?.toLowerCase() || '';
          const isPDF = fileExtension === 'pdf';
          const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension);
          
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Prescription Document</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(notification.prescription_url, '_blank')}
                >
                  Download
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                {isImage && (
                  <img 
                    src={notification.prescription_url}
                    alt="Prescription"
                    className="w-full h-[400px] object-contain"
                  />
                )}
                {isPDF && (
                  <embed
                    src={notification.prescription_url}
                    type="application/pdf"
                    className="w-full h-[500px]"
                  />
                )}
                {!isImage && !isPDF && (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-muted-foreground">
                      Unsupported file format. Please download to view.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
