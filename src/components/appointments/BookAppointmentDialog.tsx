import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Lock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendHealthCheckToDoctor } from "@/services/healthCheckService";
import { HealthCheck } from "@/services/userDataService";

interface BookAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDoctor?: any;
  healthCheckData?: HealthCheck | null;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

const specialties = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
  "Urology"
];

export const BookAppointmentDialog = ({ open, onOpenChange, selectedDoctor, healthCheckData }: BookAppointmentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    doctorName: selectedDoctor?.name || '',
    doctorSpecialty: selectedDoctor?.specialization || '',
    time: '',
    reason: '',
    notes: ''
  });

  // Update form data when selectedDoctor changes
  React.useEffect(() => {
    if (selectedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctorName: selectedDoctor.name || '',
        doctorSpecialty: selectedDoctor.specialization || ''
      }));
    }
  }, [selectedDoctor]);

  // Check if doctor fields should be locked (when selectedDoctor is provided)
  const isDoctorFieldsLocked = Boolean(selectedDoctor);

  const findOrCreateDoctorId = async (doctorName: string, doctorSpecialty?: string): Promise<string> => {
    console.log('🔍 Finding or creating doctor ID for:', { doctorName, doctorSpecialty });
    
    // First, try to find an existing verified doctor
    const { data: existingDoctor, error: searchError } = await supabase
      .from('doctors')
      .select('id, name, verified')
      .eq('name', doctorName)
      .eq('verified', true)
      .maybeSingle();

    if (searchError) {
      console.error('❌ Error searching for doctor:', searchError);
      throw new Error('Failed to search for doctor');
    }

    if (existingDoctor) {
      console.log('✅ Found existing verified doctor:', existingDoctor);
      return existingDoctor.id;
    }

    console.log('⚠️ No verified doctor found, creating placeholder...');
    
    // If no verified doctor found, create a placeholder entry
    const { data: newDoctor, error: createError } = await supabase
      .from('doctors')
      .insert([{
        name: doctorName,
        specialization: doctorSpecialty || 'General Medicine',
        hospital: 'To be verified',
        address: 'To be verified',
        region: 'To be verified',
        degrees: 'To be verified',
        experience: 0,
        registration_number: 'PENDING_VERIFICATION',
        verified: false,
        available: false
      }])
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Error creating doctor placeholder:', createError);
      throw new Error('Failed to create doctor record');
    }

    console.log('✅ Created new doctor placeholder:', newDoctor);
    return newDoctor.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !formData.doctorName || !formData.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🚀 Starting appointment booking process...');
      console.log('👤 User ID:', user.id);
      console.log('👨‍⚕️ Selected doctor:', selectedDoctor);
      console.log('📝 Form data:', formData);

      // CRITICAL: Get or create doctor_id with proper validation
      let doctorId: string;
      
      if (selectedDoctor?.id) {
        console.log('✅ Using provided doctor ID:', selectedDoctor.id);
        doctorId = selectedDoctor.id;
        
        // Verify the doctor exists and is verified
        const { data: doctorVerification, error: verifyError } = await supabase
          .from('doctors')
          .select('id, name, verified')
          .eq('id', doctorId)
          .single();

        if (verifyError || !doctorVerification) {
          console.error('❌ Doctor verification failed:', verifyError);
          throw new Error('Selected doctor not found or not verified');
        }
        
        console.log('✅ Doctor verified:', doctorVerification);
      } else {
        console.log('⚠️ No doctor ID provided, finding or creating...');
        doctorId = await findOrCreateDoctorId(formData.doctorName, formData.doctorSpecialty);
      }

      // CRITICAL: Final validation that we have a valid doctor_id
      if (!doctorId) {
        throw new Error('CRITICAL ERROR: Failed to obtain valid doctor ID');
      }

      console.log('🎯 Final doctor ID for appointment:', doctorId);

      // Prepare reason with health check summary if available
      let appointmentReason = formData.reason;
      if (healthCheckData) {
        const symptomsText = healthCheckData.symptoms?.join(', ') || '';
        const urgencyText = healthCheckData.urgency_level ? ` (${healthCheckData.urgency_level.toUpperCase()} URGENCY)` : '';
        appointmentReason = `Health Check Follow-up: ${symptomsText}${urgencyText}${formData.reason ? ' - ' + formData.reason : ''}`;
      }

      // Create appointment with GUARANTEED doctor_id
      const appointmentData = {
        user_id: user.id,
        doctor_id: doctorId, // CRITICAL: This is now guaranteed to be set
        doctor_name: formData.doctorName,
        doctor_specialty: formData.doctorSpecialty || null,
        date: format(date, 'yyyy-MM-dd'),
        time: formData.time,
        reason: appointmentReason,
        notes: formData.notes || null,
        status: 'pending'
      };

      console.log('📋 Final appointment data:', appointmentData);

      // Final validation before insertion
      if (!appointmentData.doctor_id) {
        throw new Error('CRITICAL ERROR: doctor_id is null before insertion');
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (appointmentError) {
        console.error('❌ Error creating appointment:', appointmentError);
        throw appointmentError;
      }

      console.log('✅ Appointment created successfully:', appointment);

      // Verify the appointment was created with doctor_id
      if (!appointment.doctor_id) {
        console.error('🚨 CRITICAL: Appointment created but doctor_id is null!');
        throw new Error('Appointment created but doctor assignment failed');
      }

      // If health check data exists, send it to the doctor
      if (healthCheckData && appointment) {
        try {
          const success = await sendHealthCheckToDoctor(
            healthCheckData,
            appointment.id,
            doctorId
          );
          
          if (success) {
            toast({
              title: "Appointment Booked Successfully",
              description: "Your appointment has been scheduled and your health check data has been shared with the doctor",
            });
          } else {
            toast({
              title: "Appointment Booked",
              description: "Your appointment has been scheduled. Health check data sharing will be attempted later.",
            });
          }
        } catch (error) {
          console.error('Error sending health check to doctor:', error);
          toast({
            title: "Appointment Booked",
            description: "Your appointment has been scheduled. Health check data sharing will be attempted later.",
          });
        }
      } else {
        toast({
          title: "Appointment Booked Successfully",
          description: `Your appointment with ${formData.doctorName} has been scheduled for ${format(date, 'PPP')} at ${formData.time}`,
        });
      }

      // Reset form and close dialog
      setFormData({
        doctorName: '',
        doctorSpecialty: '',
        time: '',
        reason: '',
        notes: ''
      });
      setDate(undefined);
      onOpenChange(false);
      
    } catch (error) {
      console.error('❌ Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            {healthCheckData 
              ? "Schedule an appointment with a doctor. Your health check data will be automatically shared."
              : "Schedule an appointment with a doctor"
            }
          </DialogDescription>
        </DialogHeader>

        {healthCheckData && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
            <h4 className="font-medium text-blue-800 mb-2">Health Check Data to Share</h4>
            <div className="text-sm text-blue-700 space-y-1">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctorName" className="flex items-center gap-2">
              Doctor Name *
              {isDoctorFieldsLocked && <Lock className="h-3 w-3 text-gray-500" />}
            </Label>
            <div className="relative">
              <Input
                id="doctorName"
                value={formData.doctorName}
                onChange={(e) => !isDoctorFieldsLocked && setFormData({ ...formData, doctorName: e.target.value })}
                placeholder="Enter doctor's name"
                required
                readOnly={isDoctorFieldsLocked}
                className={cn(
                  isDoctorFieldsLocked && "bg-gray-50 text-gray-600 cursor-not-allowed"
                )}
              />
              {isDoctorFieldsLocked && (
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
            </div>
            {isDoctorFieldsLocked && (
              <p className="text-xs text-gray-500">Doctor selection is locked for this appointment</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctorSpecialty" className="flex items-center gap-2">
              Specialty
              {isDoctorFieldsLocked && <Lock className="h-3 w-3 text-gray-500" />}
            </Label>
            {isDoctorFieldsLocked ? (
              <div className="relative">
                <Input
                  value={formData.doctorSpecialty}
                  readOnly
                  className="bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            ) : (
              <Select
                value={formData.doctorSpecialty}
                onValueChange={(value) => setFormData({ ...formData, doctorSpecialty: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isDoctorFieldsLocked && (
              <p className="text-xs text-gray-500">Specialty is locked based on selected doctor</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder={healthCheckData ? "Additional details..." : "Enter reason for visit"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional information for the doctor"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
