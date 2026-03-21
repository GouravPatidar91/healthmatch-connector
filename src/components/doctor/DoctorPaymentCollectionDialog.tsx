import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doctorWalletService } from '@/services/doctorWalletService';
import { generatePaymentQR } from '@/services/razorpayService';
import { supabase } from '@/integrations/supabase/client';
import { Banknote, QrCode, Loader2, CheckCircle, Clock, RefreshCw } from 'lucide-react';
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

const QR_EXPIRY_SECONDS = 2 * 60;

const DoctorPaymentCollectionDialog = ({
  open, onOpenChange, appointmentId, doctorId, doctorName, patientName, amount, onPaymentCollected
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrContent, setQrContent] = useState<string | null>(null);
  const [qrCodeId, setQrCodeId] = useState<string | null>(null);
  const [cashCollected, setCashCollected] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QR_EXPIRY_SECONDS);
  const [qrExpired, setQrExpired] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrCreatedAtRef = useRef<number>(0);

  useEffect(() => {
    if ((qrImageUrl || qrContent) && !paymentCompleted && !qrExpired) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - qrCreatedAtRef.current) / 1000);
        const remaining = Math.max(0, QR_EXPIRY_SECONDS - elapsed);
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setQrExpired(true);
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qrImageUrl, qrContent, paymentCompleted, qrExpired]);

  useEffect(() => {
    if (qrCodeId && !paymentCompleted && !qrExpired) {
      pollingRef.current = setInterval(async () => {
        try {
          const { data, error } = await supabase.functions.invoke('check-qr-payment-status', {
            body: { qr_code_id: qrCodeId, appointment_id: appointmentId },
          });
          if (error) return;
          if (data?.paid) {
            setPaymentCompleted(true);
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
            toast({ title: 'Payment Received! ✅', description: `₹${amount} credited to your wallet` });
            setTimeout(() => { onPaymentCollected(); onOpenChange(false); }, 2000);
          }
        } catch {}
      }, 5000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [qrCodeId, paymentCompleted, qrExpired, appointmentId, amount, onPaymentCollected, onOpenChange, toast]);

  const handleCollectCash = async () => {
    setLoading(true);
    try {
      const success = await doctorWalletService.collectCashPayment(appointmentId, doctorId, amount, patientName);
      if (success) {
        await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
        setCashCollected(true);
        toast({ title: 'Cash Collected', description: `₹${amount} credited to your wallet` });
        setTimeout(() => { onPaymentCollected(); onOpenChange(false); setCashCollected(false); }, 1500);
      } else throw new Error('Failed');
    } catch {
      toast({ title: 'Error', description: 'Failed to process cash collection', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    setQrExpired(false);
    try {
      const result = await generatePaymentQR(amount, appointmentId, doctorName, patientName);
      setQrImageUrl(result.image_url);
      setQrContent(result.qr_content || null);
      setQrCodeId(result.qr_code_id || null);
      qrCreatedAtRef.current = Date.now();
      setSecondsLeft(QR_EXPIRY_SECONDS);
    } catch {
      toast({ title: 'Error', description: 'Failed to generate payment QR', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleClose = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setQrImageUrl(null); setQrContent(null); setQrCodeId(null);
    setCashCollected(false); setPaymentCompleted(false);
    setSecondsLeft(QR_EXPIRY_SECONDS); setQrExpired(false);
    onOpenChange(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Collect from {patientName} for this consultation
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {cashCollected || paymentCompleted ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium text-foreground">
                {paymentCompleted ? 'Payment Received!' : 'Cash Collected!'}
              </p>
              <p className="text-sm text-muted-foreground">₹{amount} credited to your wallet</p>
            </div>
          ) : qrExpired ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center gap-2 text-destructive">
                <Clock className="h-5 w-5" />
                <p className="text-sm font-medium">QR Code expired</p>
              </div>
              <div className="grid grid-cols-1 gap-3 w-full">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                  onClick={handleGenerateQR}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <><RefreshCw className="h-6 w-6 text-blue-600" /><span className="text-sm font-medium">Regenerate QR Code</span></>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                  onClick={handleCollectCash}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <><Banknote className="h-6 w-6 text-green-600" /><span className="text-sm font-medium">Collect Cash — ₹{amount}</span></>
                  )}
                </Button>
              </div>
            </div>
          ) : qrImageUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-[240px] h-[240px] bg-white rounded-xl border border-border shadow-sm flex items-center justify-center p-4">
                {qrContent ? (
                  <QRCodeSVG value={qrContent} size={200} level="M" includeMargin={false} />
                ) : (
                  <img src={qrImageUrl} alt="UPI QR" className="w-full h-full object-contain" />
                )}
              </div>

              <p className="text-2xl font-bold text-foreground">₹{amount}</p>

              <div className={`flex items-center gap-1.5 text-xs ${secondsLeft < 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Clock className="h-3.5 w-3.5" />
                <span>Expires in {formatTime(secondsLeft)}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Waiting for payment...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300" onClick={handleCollectCash} disabled={loading}>
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                  <><Banknote className="h-8 w-8 text-green-600" /><span className="text-sm font-medium">Collect Cash</span></>
                )}
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300" onClick={handleGenerateQR} disabled={loading}>
                {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                  <><QrCode className="h-8 w-8 text-blue-600" /><span className="text-sm font-medium">Generate UPI QR Code</span></>
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