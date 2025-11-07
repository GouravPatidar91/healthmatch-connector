import { useState } from 'react';
import { medicineService, Medicine, VendorMedicine } from '@/services/medicineService';
import { useToast } from '@/hooks/use-toast';
import { useLocationPermission } from './useLocationPermission';

export type SearchStrategy = 'nearby' | 'city' | 'catalog';

export function useMedicines() {
  const [medicines, setMedicines] = useState<(Medicine | VendorMedicine)[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy>('catalog');
  const { toast } = useToast();
  const { 
    permissionState, 
    location: userLocation, 
    isLoading: locationLoading,
    requestPermission: requestLocationPermission 
  } = useLocationPermission();

  const searchMedicines = async (searchTerm: string, category?: string) => {
    setLoading(true);
    try {
      if (userLocation) {
        // Use fallback strategy
        const results = await medicineService.searchMedicinesWithFallback(
          searchTerm,
          category,
          userLocation
        );
        setMedicines(results.medicines);
        setSearchStrategy(results.searchStrategy);
      } else {
        // No location - show catalog only
        const results = await medicineService.searchMedicines(
          searchTerm,
          category
        );
        setMedicines(results);
        setSearchStrategy('catalog');
      }
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
    searchStrategy,
    permissionState,
    locationLoading,
    requestLocationPermission,
    searchMedicines,
    uploadPrescription
  };
}