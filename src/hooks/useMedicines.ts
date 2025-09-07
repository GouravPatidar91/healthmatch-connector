import { useState, useEffect } from 'react';
import { medicineService, Medicine, VendorMedicine } from '@/services/medicineService';
import { useToast } from '@/hooks/use-toast';

export function useMedicines() {
  const [medicines, setMedicines] = useState<(Medicine | VendorMedicine)[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Continue without location - will show all medicines without vendor info
        }
      );
    }
  }, []);

  const searchMedicines = async (searchTerm: string, category?: string) => {
    setLoading(true);
    try {
      const results = await medicineService.searchMedicines(
        searchTerm, 
        category, 
        userLocation?.lat, 
        userLocation?.lng
      );
      setMedicines(results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search medicines. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadPrescription = async (file: File, orderId?: string) => {
    try {
      const result = await medicineService.uploadPrescription(file, orderId);
      if (result.success) {
        toast({
          title: "Success",
          description: "Prescription uploaded successfully.",
        });
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload prescription. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    medicines,
    loading,
    userLocation,
    searchMedicines,
    uploadPrescription
  };
}