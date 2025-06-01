
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User, FileText } from "lucide-react";
import { format, parseISO, isBefore } from 'date-fns';
import { useAppointmentBooking } from '@/services/appointmentService';

interface PatientAppointment {
  id: string;
  doctor_name: string;
  date: string;
  time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at?: string;
}

const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { getPatientAppointments } = useAppointmentBooking();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getPatientAppointments();
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const today = new Date();
  const upcomingAppointments = appointments.filter(apt => 
    !isBefore(parseISO(`${apt.date}T${apt.time}`), today) && apt.status !== 'completed' && apt.status !== 'cancelled'
  );
  const pastAppointments = appointments.filter(apt => 
    isBefore(parseISO(`${apt.date}T${apt.time}`), today) || apt.status === 'completed' || apt.status === 'cancelled'
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  const AppointmentTable = ({ appointments }: { appointments: PatientAppointment[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Doctor</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {appointment.doctor_name}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(appointment.date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {appointment.time}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {appointment.reason || 'General consultation'}
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            {upcomingAppointments.length > 0 ? (
              <AppointmentTable appointments={upcomingAppointments} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming appointments</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            {pastAppointments.length > 0 ? (
              <AppointmentTable appointments={pastAppointments} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No past appointments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PatientAppointments;
