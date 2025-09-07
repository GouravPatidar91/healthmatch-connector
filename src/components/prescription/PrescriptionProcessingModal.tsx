import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Search, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { medicineService } from '@/services/medicineService';
import { supabase } from '@/integrations/supabase/client';

interface PrescriptionProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescriptionId: string | null;
  userLocation: { lat: number; lng: number } | null;
  onSuccess: (vendorInfo: any) => void;
}

export default function PrescriptionProcessingModal({
  isOpen,
  onClose,
  prescriptionId,
  userLocation,
  onSuccess
}: PrescriptionProcessingModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [vendorsCount, setVendorsCount] = useState(0);
  const [acceptedVendor, setAcceptedVendor] = useState(null);
  const [processing, setProcessing] = useState(false);

  const steps = [
    { label: 'Analyzing prescription', icon: Search },
    { label: 'Finding nearby vendors', icon: Clock },
    { label: 'Forwarding to vendors', icon: CheckCircle },
    { label: 'Waiting for responses', icon: Clock }
  ];

  useEffect(() => {
    if (!isOpen || !prescriptionId || !userLocation) return;

    const startProcessing = async () => {
      setProcessing(true);
      setCurrentStep(0);

      // Step 1: Analyzing prescription (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(1);

      // Step 2: Finding nearby vendors (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(2);

      // Step 3: Forward to vendors
      const result = await medicineService.forwardPrescriptionToVendors(
        prescriptionId, 
        userLocation.lat, 
        userLocation.lng
      );

      if (!result.success) {
        toast({
          title: "No Vendors Found",
          description: result.error || "No nearby vendors available at the moment.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      setVendorsCount(result.vendorsCount);
      setCurrentStep(3);
      setTimeLeft(45);

      // Start countdown timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            toast({
              title: "No Response",
              description: "No vendors responded within the time limit. Please try again.",
              variant: "destructive",
            });
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Listen for vendor responses
      const channel = supabase
        .channel('prescription-responses')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'vendor_prescription_responses',
            filter: `prescription_id=eq.${prescriptionId}`
          },
          (payload) => {
            if (payload.new.response_status === 'accepted') {
              clearInterval(timer);
              setAcceptedVendor(payload.new);
              
              // Get vendor details and success
              medicineService.getPrescriptionResponses(prescriptionId).then(result => {
                if (result.success) {
                  const acceptedResponse = result.responses.find(
                    (r: any) => r.response_status === 'accepted'
                  );
                  if (acceptedResponse) {
                    onSuccess(acceptedResponse);
                  }
                }
              });
            }
          }
        )
        .subscribe();

      return () => {
        clearInterval(timer);
        supabase.removeChannel(channel);
      };
    };

    startProcessing();
  }, [isOpen, prescriptionId, userLocation]);

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Processing Prescription
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrent ? 'bg-primary/10' : isCompleted ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-primary text-white animate-pulse' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`font-medium ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                  {isCurrent && currentStep === 3 && (
                    <div className="ml-auto text-sm text-muted-foreground">
                      {vendorsCount} vendors notified
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Countdown Timer */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Timer</span>
                <span className="text-lg font-bold text-primary">{timeLeft}s</span>
              </div>
              <Progress value={(45 - timeLeft) / 45 * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Waiting for vendors to accept your prescription...
              </p>
            </div>
          )}

          {/* Success State */}
          {acceptedVendor && (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-700">Prescription Accepted!</h3>
                <p className="text-sm text-muted-foreground">
                  A vendor has accepted your prescription
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={acceptedVendor !== null}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}