
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Clock, User } from "lucide-react";
import { format } from 'date-fns';
import { useAppointmentBooking } from '@/services/appointmentService';
import { Doctor } from '@/services/doctorService';

interface BookAppointmentDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookAppointmentDialog: React.FC<BookAppointmentDialogProps> = ({
  doctor,
  open,
  onOpenChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const { bookDirectAppointment } = useAppointmentBooking();

  const handleBookAppointment = async () => {
    if (!doctor || !selectedDate || !preferredTime) return;

    setIsBooking(true);
    try {
      await bookDirectAppointment({
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        doctor_specialty: doctor.specialization,
        date: format(selectedDate, 'yyyy-MM-dd'),
        preferred_time: preferredTime,
        reason: reason || 'General consultation',
        notes: notes
      });
      
      onOpenChange(false);
      setSelectedDate(new Date());
      setPreferredTime('');
      setReason('');
      setNotes('');
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsBooking(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  if (!doctor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-effect p-0 overflow-hidden">
        <div className="p-6 border-b border-sage-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sage-700 text-xl">
              <CalendarDays className="h-6 w-6" />
              Book Appointment with Dr. {doctor.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-slate-custom">
              <User className="h-4 w-4" />
              {doctor.specialization} • {doctor.hospital}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="grid gap-6 py-4 lg:grid-cols-2">
            {/* Left Column - Calendar */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-custom font-medium text-lg">Select Date</Label>
                <div className="flex justify-center p-4 border border-sage-200 rounded-xl bg-sage-50">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    className="rounded-xl bg-white shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-4">
              {/* Preferred Time */}
              <div className="space-y-2">
                <Label htmlFor="preferred-time" className="text-slate-custom font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Preferred Time
                </Label>
                <select
                  id="preferred-time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-4 py-3 border border-sage-200 rounded-xl focus:ring-2 focus:ring-sage-500 focus:border-transparent bg-white text-slate-custom"
                >
                  <option value="">Select preferred time</option>
                  {generateTimeSlots().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-slate-custom font-medium">
                  Reason for visit
                </Label>
                <Input
                  id="reason"
                  placeholder="e.g., Regular checkup, Follow-up, Consultation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="border-sage-200 focus:ring-sage-500 py-3 px-4"
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-custom font-medium">
                  Additional Notes (optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information you'd like the doctor to know..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border-sage-200 focus:ring-sage-500 min-h-[120px] resize-none"
                  rows={4}
                />
              </div>

              {/* Selected Date Display */}
              {selectedDate && (
                <div className="p-4 bg-sage-50 border border-sage-200 rounded-xl">
                  <p className="text-sm font-medium text-sage-700">Selected Date & Time:</p>
                  <p className="text-slate-custom">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    {preferredTime && ` at ${preferredTime}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-6 border-t border-sage-200">
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-sage-200 text-slate-custom hover:bg-sage-50 px-6 py-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment} 
              disabled={isBooking || !selectedDate || !preferredTime}
              className="btn-primary px-6 py-2"
            >
              {isBooking ? 'Booking...' : 'Book Appointment'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookAppointmentDialog;
