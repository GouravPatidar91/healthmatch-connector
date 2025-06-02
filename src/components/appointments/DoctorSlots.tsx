
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { useAvailableSlots, useAppointmentBooking } from '@/services/appointmentService';
import { Doctor } from '@/services/doctorService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DoctorSlotsProps {
  doctor: Doctor;
}

const DoctorSlots: React.FC<DoctorSlotsProps> = ({ doctor }) => {
  const { slots, loading } = useAvailableSlots(doctor.id);
  const { bookAppointment } = useAppointmentBooking();
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const handleSlotSelect = (slot: any) => {
    setSelectedSlot(slot);
    setShowBookingDialog(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);
    try {
      await bookAppointment({
        doctor_id: doctor.id,
        slot_id: selectedSlot.id,
        date: selectedSlot.date,
        time: selectedSlot.start_time,
        reason: reason || 'General consultation'
      });
      
      setShowBookingDialog(false);
      setSelectedSlot(null);
      setReason('');
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 p-4 border rounded-lg">
        <p className="text-sm text-gray-500">Loading available slots...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="mt-4 p-4 border rounded-lg">
        <p className="text-sm text-gray-500">No available slots at the moment</p>
      </div>
    );
  }

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="mt-4">
      <h4 className="font-medium mb-3 flex items-center">
        <Calendar className="h-4 w-4 mr-2" />
        Available Slots
      </h4>
      
      <div className="space-y-3">
        {Object.entries(slotsByDate).slice(0, 3).map(([date, dateSlots]) => (
          <div key={date} className="border rounded-lg p-3">
            <p className="text-sm font-medium mb-2">
              {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(dateSlots as any[]).slice(0, 4).map((slot) => (
                <Button
                  key={slot.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSlotSelect(slot)}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {slot.start_time}
                </Button>
              ))}
              {(dateSlots as any[]).length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{(dateSlots as any[]).length - 4} more
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Book an appointment with {doctor.name} on{' '}
              {selectedSlot && format(parseISO(selectedSlot.date), 'MMMM d, yyyy')} at{' '}
              {selectedSlot?.start_time}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for visit (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Describe your symptoms or reason for the appointment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookAppointment} disabled={isBooking}>
              {isBooking ? 'Booking...' : 'Book Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorSlots;
