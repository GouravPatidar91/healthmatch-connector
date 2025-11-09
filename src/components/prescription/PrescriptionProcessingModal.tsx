import React from 'react';
import { SearchingPharmaciesModal } from './SearchingPharmaciesModal';
import { useToast } from '@/hooks/use-toast';

interface PrescriptionProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  broadcastId: string | null;
  onSuccess: (vendorId: string) => void;
}

export default function PrescriptionProcessingModal({
  isOpen,
  onClose,
  broadcastId,
  onSuccess
}: PrescriptionProcessingModalProps) {
  const { toast } = useToast();

  const handleAccepted = (vendorId: string) => {
    toast({
      title: "Prescription Accepted!",
      description: "A pharmacy has reviewed and accepted your prescription.",
    });
    onSuccess(vendorId);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleFailed = () => {
    toast({
      title: "No Response",
      description: "No pharmacies responded. Please try again later or call the nearest pharmacy directly.",
      variant: "destructive",
    });
    onClose();
  };

  if (!broadcastId) return null;

  return (
    <SearchingPharmaciesModal
      broadcastId={broadcastId}
      open={isOpen}
      onAccepted={handleAccepted}
      onFailed={handleFailed}
    />
  );
}
