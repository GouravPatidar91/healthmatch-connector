
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Phone, Calendar, Loader2, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDoctors } from "@/services/doctorService";
import { useAppointmentBooking } from "@/services/appointmentService";
import { sendHealthCheckToDoctor } from "@/services/healthCheckService";
import { HealthCheck } from "@/services/userDataService";

interface NearbyDoctorsCardProps {
  healthCheckData?: HealthCheck | null;
  onAppointmentBooked?: () => void;
}

export const NearbyDoctorsCard = ({ healthCheckData, onAppointmentBooked }: NearbyDoctorsCardProps) => {
  const { toast } = useToast();
  const { doctors, loading, error, findNearbyDoctors } = useDoctors();
  const { bookDirectAppointment } = useAppointmentBooking();
  const [bookingDoctor, setBookingDoctor] = useState<string | null>(null);
  const [locationAccess, setLocationAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const tryFindNearby = async () => {
      const success = await findNearbyDoctors();
      setLocationAccess(success);
      
      if (!success) {
        toast({
          title: "Location Access",
          description: "Unable to access location. Showing all available doctors.",
        });
      }
    };

    tryFindNearby();
  }, [findNearbyDoctors, toast]);

  const handleBookAppointment = async (doctor: any) => {
    setBookingDoctor(doctor.id);
    
    try {
      // Get today's date and suggest a time slot
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const preferredTime = "10:00";
      
      // Prepare reason with health check summary if available
      let reason = "General consultation";
      if (healthCheckData) {
        const symptomsText = healthCheckData.symptoms?.join(', ') || '';
        const urgencyText = healthCheckData.urgency_level ? ` (${healthCheckData.urgency_level.toUpperCase()} URGENCY)` : '';
        reason = `Health Check Follow-up: ${symptomsText}${urgencyText}`;
      }

      // Book the appointment
      const appointment = await bookDirectAppointment({
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        doctor_specialty: doctor.specialization,
        date: tomorrow.toISOString().split('T')[0],
        preferred_time: preferredTime,
        reason: reason,
        notes: healthCheckData?.notes || undefined
      });

      // If health check data exists, send it to the doctor
      if (healthCheckData && appointment) {
        try {
          await sendHealthCheckToDoctor(
            healthCheckData,
            appointment.id,
            doctor.id
          );
          
          toast({
            title: "Appointment Booked Successfully",
            description: `Your appointment with Dr. ${doctor.name} has been scheduled and your health check data has been shared.`,
          });
        } catch (error) {
          console.error('Error sending health check to doctor:', error);
          toast({
            title: "Appointment Booked",
            description: `Your appointment with Dr. ${doctor.name} has been scheduled. Health check data sharing will be attempted later.`,
          });
        }
      } else {
        toast({
          title: "Appointment Booked Successfully",
          description: `Your appointment request has been sent to Dr. ${doctor.name}.`,
        });
      }

      onAppointmentBooked?.();
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBookingDoctor(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Finding Nearby Doctors</CardTitle>
          <CardDescription>Locating available doctors in your area...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error || doctors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Doctors Available</CardTitle>
          <CardDescription>
            {error ? "Error loading doctors" : "No doctors found in your area"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Please try again later or contact support for assistance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {locationAccess ? "Nearby Doctors" : "Available Doctors"}
        </h3>
        {healthCheckData && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Health data will be shared
          </Badge>
        )}
      </div>

      {healthCheckData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">Health Check Summary:</p>
              <p className="text-blue-700">
                <span className="font-medium">Symptoms:</span> {healthCheckData.symptoms?.join(', ')}
              </p>
              {healthCheckData.urgency_level && (
                <p className="text-blue-700">
                  <span className="font-medium">Urgency:</span> {healthCheckData.urgency_level.toUpperCase()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {doctors.slice(0, 6).map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{doctor.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Stethoscope className="h-4 w-4" />
                    {doctor.specialization}
                  </CardDescription>
                </div>
                {doctor.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{doctor.rating}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{doctor.hospital}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{doctor.address}</span>
                </div>
                
                {doctor.experience && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{doctor.experience} years experience</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant={doctor.available ? "default" : "secondary"}>
                  {doctor.available ? "Available" : "Busy"}
                </Badge>
                
                <Button
                  onClick={() => handleBookAppointment(doctor)}
                  disabled={!doctor.available || bookingDoctor === doctor.id}
                  className="ml-2"
                >
                  {bookingDoctor === doctor.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Appointment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
