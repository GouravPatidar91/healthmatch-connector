import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Lock, IndianRupee, CreditCard, Banknote } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendHealthCheckToDoctor } from "@/services/healthCheckService";
import { HealthCheck } from "@/services/userDataService";
import { loadRazorpayScript, createRazorpayOrder, verifyRazorpayPayment, openRazorpayCheckout } from "@/services/razorpayService";

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
  "General Medicine", "Cardiology", "Dermatology", "Neurology",
  "Orthopedics", "Pediatrics", "Psychiatry", "Radiology", "Surgery", "Urology"
];

export const BookAppointmentDialog = ({ open, onOpenChange, selectedDoctor, healthCheckData }: BookAppointmentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [paymentMode, setPaymentMode] = useState<'online' | 'pay_at_clinic'>('pay_at_clinic');
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [formData, setFormData] = useState({
    doctorName: selectedDoctor?.name || '',
    doctorSpecialty: selectedDoctor?.specialization || '',
    time: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    if (selectedDoctor) {
      setFormData(prev => ({
        ...prev,
        doctorName: selectedDoctor.name || '',
        doctorSpecialty: selectedDoctor.specialization || ''
      }));
      // Fetch consultation fee
      if (selectedDoctor.id) {
        supabase
          .from('doctors')
          .select('consultation_fee')
          .eq('id', selectedDoctor.id)
          .single()
          .then(({ data }) => {
            setConsultationFee(data?.consultation_fee || 0);
          });
      }
    }
  }, [selectedDoctor]);

  const isDoctorFieldsLocked = Boolean(selectedDoctor);

  const findOrCreateDoctorId = async (doctorName: string, doctorSpecialty?: string): Promise<string> => {
    const { data: existingDoctor, error: searchError } = await supabase
      .from('doctors')
      .select('id, name, verified')
      .eq('name', doctorName)
      .eq('verified', true)
      .maybeSingle();

    if (searchError) throw new Error('Failed to search for doctor');
    if (existingDoctor) return existingDoctor.id;

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

    if (createError) throw new Error('Failed to create doctor record');
    return newDoctor.id;
  };

  const processOnlinePayment = async (appointmentId: string, doctorId: string, userId: string, amount: number) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) throw new Error('Failed to load payment gateway');

    const orderData = await createRazorpayOrder(amount, appointmentId, doctorId, userId);

    return new Promise<void>((resolve, reject) => {
      openRazorpayCheckout(
        {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.order_id,
          name: 'Curezy',
          description: `Consultation with Dr. ${formData.doctorName}`,
        },
        async (response) => {
          try {
            await verifyRazorpayPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              appointmentId
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        reject
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !formData.doctorName || !formData.time) {
      toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let doctorId: string;
      if (selectedDoctor?.id) {
        doctorId = selectedDoctor.id;
        const { data: doctorVerification, error: verifyError } = await supabase
          .from('doctors')
          .select('id, name, verified')
          .eq('id', doctorId)
          .single();
        if (verifyError || !doctorVerification) throw new Error('Selected doctor not found or not verified');
      } else {
        doctorId = await findOrCreateDoctorId(formData.doctorName, formData.doctorSpecialty);
      }

      if (!doctorId) throw new Error('Failed to obtain valid doctor ID');

      let appointmentReason = formData.reason;
      if (healthCheckData) {
        const symptomsText = healthCheckData.symptoms?.join(', ') || '';
        const urgencyText = healthCheckData.urgency_level ? ` (${healthCheckData.urgency_level.toUpperCase()} URGENCY)` : '';
        appointmentReason = `Health Check Follow-up: ${symptomsText}${urgencyText}${formData.reason ? ' - ' + formData.reason : ''}`;
      }

      const appointmentData = {
        user_id: user.id,
        doctor_id: doctorId,
        doctor_name: formData.doctorName,
        doctor_specialty: formData.doctorSpecialty || null,
        date: format(date, 'yyyy-MM-dd'),
        time: formData.time,
        reason: appointmentReason,
        notes: formData.notes || null,
        status: 'pending',
        payment_mode: paymentMode,
        payment_status: paymentMode === 'online' && consultationFee > 0 ? 'pending' : 'pending',
        payment_amount: consultationFee,
      };

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (appointmentError) throw appointmentError;
      if (!appointment.doctor_id) throw new Error('Appointment created but doctor assignment failed');

      // Process online payment if selected
      if (paymentMode === 'online' && consultationFee > 0) {
        try {
          await processOnlinePayment(appointment.id, doctorId, user.id, consultationFee);
          toast({ title: "Payment Successful", description: "Your appointment has been booked and payment processed!" });
        } catch (paymentError: any) {
          // Payment failed/cancelled — delete the appointment
          await supabase.from('appointments').delete().eq('id', appointment.id);
          toast({
            title: "Payment Cancelled",
            description: "Payment was not completed. Appointment was not created.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      } else {
        // Send health check data if available
        if (healthCheckData && appointment) {
          try {
            await sendHealthCheckToDoctor(healthCheckData, appointment.id, doctorId);
          } catch (error) {
            console.error('Error sending health check:', error);
          }
        }

        toast({
          title: "Appointment Booked Successfully",
          description: consultationFee > 0
            ? `Appointment scheduled. ₹${consultationFee} to be paid at the clinic.`
            : `Your appointment with ${formData.doctorName} has been scheduled for ${format(date, 'PPP')} at ${formData.time}`,
        });
      }

      setFormData({ doctorName: '', doctorSpecialty: '', time: '', reason: '', notes: '' });
      setDate(undefined);
      setPaymentMode('pay_at_clinic');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to book appointment.",
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
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-md mb-4">
            <h4 className="font-medium text-primary mb-2">Health Check Data to Share</h4>
            <div className="text-sm text-primary/80 space-y-1">
              <p><span className="font-medium">Symptoms:</span> {healthCheckData.symptoms?.join(', ')}</p>
              {healthCheckData.urgency_level && (
                <p><span className="font-medium">Urgency:</span> {healthCheckData.urgency_level.toUpperCase()}</p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doctorName" className="flex items-center gap-2">
              Doctor Name *
              {isDoctorFieldsLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            <Input
              id="doctorName"
              value={formData.doctorName}
              onChange={(e) => !isDoctorFieldsLocked && setFormData({ ...formData, doctorName: e.target.value })}
              placeholder="Enter doctor's name"
              required
              readOnly={isDoctorFieldsLocked}
              className={cn(isDoctorFieldsLocked && "bg-muted text-muted-foreground cursor-not-allowed")}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Specialty
              {isDoctorFieldsLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            {isDoctorFieldsLocked ? (
              <Input value={formData.doctorSpecialty} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
            ) : (
              <Select value={formData.doctorSpecialty} onValueChange={(value) => setFormData({ ...formData, doctorSpecialty: value })}>
                <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Consultation Fee Display */}
          {consultationFee > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  Consultation Fee
                </span>
                <span className="text-lg font-bold text-foreground">₹{consultationFee}</span>
              </div>
              
              <Label className="text-sm text-muted-foreground mb-2 block">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={paymentMode === 'online' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMode('online')}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Pay Online
                </Button>
                <Button
                  type="button"
                  variant={paymentMode === 'pay_at_clinic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMode('pay_at_clinic')}
                  className="flex items-center gap-2"
                >
                  <Banknote className="h-4 w-4" />
                  Pay at Clinic
                </Button>
              </div>
            </div>
          )}

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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking...</>
              ) : (
                paymentMode === 'online' && consultationFee > 0 ? `Pay ₹${consultationFee} & Book` : 'Book Appointment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
