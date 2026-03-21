import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doctorWalletService } from '@/services/doctorWalletService';
import { generatePaymentQR } from '@/services/razorpayService';
import { supabase } from '@/integrations/supabase/client';
import { Banknote, QrCode, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientName: string;
  amount: number;
  onPaymentCollected: () => void;
}

const DoctorPaymentCollectionDialog = ({
  open, onOpenChange, appointmentId, doctorId, doctorName, patientName, amount, onPaymentCollected
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [cashCollected, setCashCollected] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll payment status when QR is shown
  useEffect(() => {
    if (qrUrl && !paymentCompleted) {
      pollingRef.current = setInterval(async () => {
        try {
          const { data } = await supabase
            .from('appointments')
            .select('payment_status')
            .eq('id', appointmentId)
            .single();

          if (data?.payment_status === 'paid') {
            setPaymentCompleted(true);
            if (pollingRef.current) clearInterval(pollingRef.current);
            toast({ title: 'Payment Received! ✅', description: `₹${amount} has been credited to your wallet` });
            setTimeout(() => {
              onPaymentCollected();
              onOpenChange(false);
            }, 2000);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 5000);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [qrUrl, paymentCompleted, appointmentId, amount, onPaymentCollected, onOpenChange, toast]);

  const handleCollectCash = async () => {
    setLoading(true);
    try {
      const success = await doctorWalletService.collectCashPayment(appointmentId, doctorId, amount);
      if (success) {
        setCashCollected(true);
        toast({ title: 'Cash Collected', description: `₹${amount} has been credited to your wallet` });
        setTimeout(() => {
          onPaymentCollected();
          onOpenChange(false);
          setCashCollected(false);
        }, 1500);
      } else {
        throw new Error('Failed to collect cash');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process cash collection', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const result = await generatePaymentQR(amount, appointmentId, doctorName, patientName);
      setQrUrl(result.payment_link_url);
      toast({ title: 'QR Generated', description: 'Ask the patient to scan and pay' });
    } catch (error) {
      console.error('QR generation error:', error);
      toast({ title: 'Error', description: 'Failed to generate payment QR', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setQrUrl(null);
    setCashCollected(false);
    setPaymentCompleted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogDescription>
            Collect ₹{amount} from {patientName} for this consultation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {cashCollected || paymentCompleted ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium text-foreground">
                {paymentCompleted ? 'Payment Received!' : 'Cash Collected!'}
              </p>
              <p className="text-sm text-muted-foreground">₹{amount} credited to your wallet</p>
            </div>
          ) : qrUrl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
                <QRCodeSVG value={qrUrl} size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Ask the patient to scan this QR code to pay ₹{amount}
              </p>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open payment link
              </a>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Waiting for payment...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                onClick={handleCollectCash}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <Banknote className="h-8 w-8 text-green-600" />
                    <span className="text-sm font-medium">Collect Cash</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={handleGenerateQR}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <QrCode className="h-8 w-8 text-blue-600" />
                    <span className="text-sm font-medium">Generate QR Code</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorPaymentCollectionDialog;
