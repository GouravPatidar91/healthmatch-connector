
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Phone, Calendar, Loader2, Stethoscope, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDoctors } from "@/services/doctorService";
import { useAppointmentBooking } from "@/services/appointmentService";
import { sendHealthCheckToDoctor } from "@/services/healthCheckService";
import { HealthCheck } from "@/services/userDataService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NearbyDoctorsCardProps {
  healthCheckData?: HealthCheck | null;
  onAppointmentBooked?: () => void;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

export const NearbyDoctorsCard = ({ healthCheckData, onAppointmentBooked }: NearbyDoctorsCardProps) => {
  const { toast } = useToast();
  const { doctors, loading, error, findNearbyDoctors } = useDoctors();
  const { bookDirectAppointment } = useAppointmentBooking();
  const [bookingDoctor, setBookingDoctor] = useState<string | null>(null);
  const [locationAccess, setLocationAccess] = useState<boolean | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    const tryFindNearby = async () => {
      console.log('Attempting to find nearby doctors...');
      const success = await findNearbyDoctors();
      console.log('Find nearby doctors result:', success);
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

  const handleSelectDoctor = (doctor: any) => {
    console.log('Selected doctor for booking:', doctor);
    setSelectedDoctor(doctor);
    setShowBookingDialog(true);
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    setSelectedTime("10:00");
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your appointment.",
        variant: "destructive"
      });
      return;
    }

    console.log('Booking appointment with:', {
      doctor: selectedDoctor,
      date: selectedDate,
      time: selectedTime,
      healthCheckData
    });

    setBookingDoctor(selectedDoctor.id);
    
    try {
      // Prepare reason with health check summary if available
      let reason = "General consultation";
      if (healthCheckData) {
        const symptomsText = healthCheckData.symptoms?.join(', ') || '';
        const urgencyText = healthCheckData.urgency_level ? ` (${healthCheckData.urgency_level.toUpperCase()} URGENCY)` : '';
        reason = `Health Check Follow-up: ${symptomsText}${urgencyText}`;
      }

      console.log('Appointment reason:', reason);

      // Book the appointment
      const appointment = await bookDirectAppointment({
        doctor_id: selectedDoctor.id,
        doctor_name: selectedDoctor.name,
        doctor_specialty: selectedDoctor.specialization,
        date: format(selectedDate, 'yyyy-MM-dd'),
        preferred_time: selectedTime,
        reason: reason,
        notes: notes || healthCheckData?.notes || undefined
      });

      console.log('Appointment booked:', appointment);

      // If health check data exists, send it to the doctor
      if (healthCheckData && appointment) {
        try {
          await sendHealthCheckToDoctor(
            healthCheckData,
            appointment.id,
            selectedDoctor.id
          );
          
          toast({
            title: "Appointment Booked Successfully",
            description: `Your appointment with Dr. ${selectedDoctor.name} has been scheduled for ${format(selectedDate, 'PPP')} at ${selectedTime} and your health check data has been shared.`,
          });
        } catch (error) {
          console.error('Error sending health check to doctor:', error);
          toast({
            title: "Appointment Booked",
            description: `Your appointment with Dr. ${selectedDoctor.name} has been scheduled for ${format(selectedDate, 'PPP')} at ${selectedTime}. Health check data sharing will be attempted later.`,
          });
        }
      } else {
        toast({
          title: "Appointment Booked Successfully",
          description: `Your appointment request has been sent to Dr. ${selectedDoctor.name} for ${format(selectedDate, 'PPP')} at ${selectedTime}.`,
        });
      }

      setShowBookingDialog(false);
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedTime("");
      setNotes("");
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

  console.log('Current state:', { loading, error, doctorsCount: doctors?.length, locationAccess });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Finding nearby doctors...</p>
            <p className="text-sm text-gray-500">This may take a moment</p>
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
            <CardTitle className="text-red-800">Error Loading Doctors</CardTitle>
            <CardDescription className="text-red-600">
              There was an error loading the doctors list: {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => findNearbyDoctors()} 
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
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
            <CardTitle>No Doctors Available</CardTitle>
            <CardDescription>
              {locationAccess === false 
                ? "We couldn't access your location to find nearby doctors." 
                : "No doctors found in your area at the moment."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Please try again later or visit our main appointments page to browse all available doctors.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => findNearbyDoctors()} 
                variant="outline"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.open('/appointments', '_blank')}
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
          <h3 className="text-lg font-semibold">
            {locationAccess ? "Nearby Doctors" : "Available Doctors"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Found {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} available for booking
          </p>
        </div>
        {healthCheckData && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Health data will be shared
          </Badge>
        )}
      </div>

      {healthCheckData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-2">Health Check Summary:</p>
              <div className="space-y-1 text-blue-700">
                <p><span className="font-medium">Symptoms:</span> {healthCheckData.symptoms?.join(', ')}</p>
                {healthCheckData.urgency_level && (
                  <p><span className="font-medium">Urgency:</span> {healthCheckData.urgency_level.toUpperCase()}</p>
                )}
                {healthCheckData.overall_assessment && (
                  <p><span className="font-medium">Assessment:</span> {healthCheckData.overall_assessment}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-all duration-200 border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{doctor.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Stethoscope className="h-4 w-4 text-blue-500 flex-shrink-0" />
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
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 truncate">{doctor.hospital}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-600 text-xs truncate">{doctor.address}</span>
                </div>
                
                {doctor.experience && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600">{doctor.experience} years experience</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  Available
                </Badge>
                
                <Button
                  onClick={() => handleSelectDoctor(doctor)}
                  disabled={bookingDoctor === doctor.id}
                  size="sm"
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
                      Book Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Appointment with Dr. {selectedDoctor?.name}</DialogTitle>
            <DialogDescription>
              Select your preferred date and time for the appointment.
              {healthCheckData && " Your health check data will be automatically shared."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Select Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Select Time *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Additional Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any specific concerns or additional information..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Health Check Summary */}
            {healthCheckData && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Health Check Data to Share</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><span className="font-medium">Symptoms:</span> {healthCheckData.symptoms?.join(', ')}</p>
                  {healthCheckData.urgency_level && (
                    <p><span className="font-medium">Urgency:</span> {healthCheckData.urgency_level.toUpperCase()}</p>
                  )}
                  {healthCheckData.overall_assessment && (
                    <p><span className="font-medium">Assessment:</span> {healthCheckData.overall_assessment}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookAppointment}
                disabled={!selectedDate || !selectedTime || bookingDoctor === selectedDoctor?.id}
                className="flex-1 h-12"
              >
                {bookingDoctor === selectedDoctor?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
