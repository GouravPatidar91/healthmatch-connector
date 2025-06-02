
import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { format } from 'date-fns';
import { useAvailableSlots } from '@/services/appointmentService';

interface AppointmentCalendarProps {
  doctorId?: string;
  onSlotSelect?: (slot: any) => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ 
  doctorId, 
  onSlotSelect 
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { slots, loading } = useAvailableSlots(doctorId);

  // Filter slots for selected date
  const slotsForSelectedDate = slots.filter(slot => 
    selectedDate && slot.date === format(selectedDate, 'yyyy-MM-dd')
  );

  // Get dates that have available slots
  const datesWithSlots = slots.map(slot => new Date(slot.date));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasSlots: datesWithSlots
            }}
            modifiersStyles={{
              hasSlots: { 
                backgroundColor: '#dbeafe', 
                color: '#1e40af',
                fontWeight: 'bold'
              }
            }}
            disabled={(date) => date < new Date()}
          />
          <div className="mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 rounded"></div>
              <span>Dates with available slots</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Times
            {selectedDate && (
              <span className="text-sm font-normal text-gray-500">
                for {format(selectedDate, 'MMMM d, yyyy')}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Loading slots...</p>
          ) : slotsForSelectedDate.length > 0 ? (
            <div className="grid gap-2">
              {slotsForSelectedDate.map((slot) => (
                <Button
                  key={slot.id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => onSlotSelect?.(slot)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {slot.start_time} - {slot.end_time}
                  <Badge variant="secondary" className="ml-auto">
                    {slot.duration} min
                  </Badge>
                </Button>
              ))}
            </div>
          ) : selectedDate ? (
            <p className="text-gray-500 text-center py-4">
              No available slots for this date
            </p>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Please select a date to view available slots
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendar;
