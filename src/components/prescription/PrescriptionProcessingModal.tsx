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
      title: "Order Accepted!",
      description: "A pharmacy has accepted your prescription order.",
    });
    onSuccess(vendorId);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleFailed = () => {
    toast({
      title: "No Response",
      description: "No pharmacies responded. Please try again later.",
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
