import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Calendar, Loader2, Stethoscope, Navigation, MapPinIcon, User, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDoctors } from "@/services/doctorService";
import { BookAppointmentDialog } from "./BookAppointmentDialog";
import DoctorSlots from "./DoctorSlots";

export const NearbyDoctorsView = () => {
  const { toast } = useToast();
  const { doctors, loading, error, findNearbyDoctors } = useDoctors();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  useEffect(() => {
    if (!hasInitialized) {
      const tryFindNearby = async () => {
        console.log('NearbyDoctorsView: Attempting to find nearby doctors...');
        const success = await findNearbyDoctors();
        console.log('NearbyDoctorsView: Find nearby doctors result:', success);
        setHasInitialized(true);
      };

      tryFindNearby();
    }
  }, [findNearbyDoctors, hasInitialized]);

  const handleManualLocationSearch = async () => {
    console.log('NearbyDoctorsView: Manual location search triggered');
    const success = await findNearbyDoctors();
    if (success) {
      toast({
        title: "Location Search Complete",
        description: "Found doctors using the most accurate location method available.",
      });
    }
  };

  const handleBookAppointment = (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowBookingDialog(true);
  };

  const handleCloseBookingDialog = (open: boolean) => {
    setShowBookingDialog(open);
    if (!open) {
      setTimeout(() => {
        setSelectedDoctor(null);
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Finding nearby doctors...</p>
            <p className="text-sm text-gray-500">Checking your location for the best matches</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Finding Doctors</CardTitle>
            <CardDescription className="text-red-600">
              There was an error finding nearby doctors: {error instanceof Error ? error.message : String(error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <Button 
                onClick={handleManualLocationSearch} 
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.hash = '#browse'}
                variant="default"
              >
                Browse All Doctors
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-blue-600" />
              No Doctors Available Nearby
            </CardTitle>
            <CardDescription>
              We couldn't find any doctors in your immediate area. You can search again or browse all available doctors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Try expanding your search or check out all our verified doctors.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={handleManualLocationSearch} 
                variant="outline"
              >
                <Navigation className="mr-2 h-4 w-4" />
                Search Again
              </Button>
              <Button 
                onClick={() => {
                  // Navigate to browse tab
                  const tabsTrigger = document.querySelector('[value="browse"]') as HTMLElement;
                  if (tabsTrigger) {
                    tabsTrigger.click();
                  }
                }}
                variant="default"
              >
                Browse All Doctors
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Nearby Doctors
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Found {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} near your location
          </p>
        </div>
        <Button 
          onClick={handleManualLocationSearch}
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          <Navigation className="mr-1 h-3 w-3" />
          Refresh Location
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="modern-card hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-base md:text-lg">
                    <User className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{doctor.name}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1 text-xs md:text-sm">
                    <Stethoscope className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{doctor.specialization}</span>
                  </CardDescription>
                </div>
                {doctor.rating && (
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{doctor.rating}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 md:space-y-4 pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{doctor.hospital}</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{doctor.address}</span>
                </div>
                {doctor.experience && (
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-500 flex-shrink-0" />
                    <span>{doctor.experience} years experience</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Available
                </Badge>
                
                <Button
                  onClick={() => handleBookAppointment(doctor)}
                  size="sm"
                  className="btn-modern text-xs md:text-sm"
                >
                  <CalendarDays className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Book Now
                </Button>
              </div>

              <DoctorSlots doctor={doctor} />
            </CardContent>
          </Card>
        ))}
      </div>

      <BookAppointmentDialog 
        open={showBookingDialog}
        onOpenChange={handleCloseBookingDialog}
        selectedDoctor={selectedDoctor}
      />
    </div>
  );
};