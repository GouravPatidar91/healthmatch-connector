import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { format, addDays, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useDoctorAppointments, useDoctorSlots } from "@/services/doctorService";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CheckCircle, Clock, Edit, X } from "lucide-react";

const AppointmentCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { toast } = useToast();
  
  const { appointments, loading: appointmentsLoading, error: appointmentsError, markAppointmentAsCompleted, cancelAppointment } = useDoctorAppointments();
  const { slots, loading: slotsLoading } = useDoctorSlots();

  // Get appointments for the selected date
  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Get appointment slots for the selected date
  const getSlotsForDate = (date: Date) => {
    if (!slots) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return slots.filter(slot => slot.date === dateStr);
  };
  
  const appointmentsForSelectedDate = getAppointmentsForDate(selectedDate);
  const slotsForSelectedDate = getSlotsForDate(selectedDate);
  
  const handleStatusChange = async (appointmentId: string, status: string) => {
    try {
      if (status === 'completed') {
        await markAppointmentAsCompleted(appointmentId);
        toast({
          title: "Appointment completed",
          description: "The appointment has been marked as completed.",
        });
      } else if (status === 'cancelled') {
        await cancelAppointment(appointmentId);
        toast({
          title: "Appointment cancelled",
          description: "The appointment has been cancelled.",
        });
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const loading = appointmentsLoading || slotsLoading;
  const error = appointmentsError;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <Select value={view} onValueChange={(value) => setView(value as 'daily' | 'weekly' | 'monthly')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily View</SelectItem>
            <SelectItem value="weekly">Weekly View</SelectItem>
            <SelectItem value="monthly">Monthly View</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading calendar data...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading calendar data. Please try again.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {view === 'daily' && (
            <>
              <div className="p-4 border-b">
                <h3 className="font-medium">Available Slots</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {slotsForSelectedDate.length > 0 ? (
                    slotsForSelectedDate.map((slot) => (
                      <Badge 
                        key={slot.id} 
                        variant={slot.status === 'available' ? 'default' : 
                                slot.status === 'booked' ? 'outline' : 
                                'destructive'}
                        className="px-3 py-1"
                      >
                        {slot.start_time} - {slot.end_time} ({slot.status})
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No slots available for this day</p>
                  )}
                </div>
              </div>
            
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointmentsForSelectedDate.length > 0 ? (
                    appointmentsForSelectedDate.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">
                          {appointment.time}
                        </TableCell>
                        <TableCell>
                          {appointment.patientName || 'Patient Name'}
                        </TableCell>
                        <TableCell>{appointment.reason || 'Consultation'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            appointment.status === 'completed' ? 'outline' : 
                            appointment.status === 'cancelled' ? 'destructive' : 
                            'default'
                          }>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              onClick={() => handleStatusChange(appointment.id, 'completed')}
                              title="Mark as completed"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                              title="Cancel appointment"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No appointments for this day
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
          
          {view === 'weekly' && (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = addDays(selectedDate, i - selectedDate.getDay());
                const dayAppointments = getAppointmentsForDate(date);
                const daySlots = getSlotsForDate(date);
                
                return (
                  <Card key={i} className={`border ${format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'border-blue-500' : ''}`}>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-medium">
                        {format(date, 'EEE, MMM d')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      {daySlots.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium mb-1">Slots:</p>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {daySlots.map(slot => (
                              <div key={slot.id} className="p-1 text-xs border rounded flex items-center bg-blue-50">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{slot.start_time}</span>
                                <Badge variant="outline" className="ml-auto text-[10px]">
                                  {slot.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {dayAppointments.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium mb-1">Appointments:</p>
                          <div className="space-y-1 max-h-20 overflow-y-auto">
                            {dayAppointments.map(appointment => (
                              <div key={appointment.id} className="p-1 text-xs border rounded flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{appointment.time}</span>
                                <Badge variant="outline" className="ml-auto text-[10px]">
                                  {appointment.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500">No appointments</div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {view === 'monthly' && (
            <div className="text-center py-8">
              Monthly view coming soon
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
