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
import { Calendar, Clock, MapPin, User, FileText, Route } from "lucide-react";
import { format, parseISO, isBefore } from 'date-fns';
import { useAppointmentBooking } from '@/services/appointmentService';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DirectionsMap } from '@/components/maps/DirectionsMap';

interface PatientAppointment {
  id: string;
  user_id: string;
  doctor_name: string;
  doctor_specialty?: string;
  date: string;
  time: string;
  reason?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  doctors?: {
    clinic_latitude?: number;
    clinic_longitude?: number;
    clinic_address?: string;
    hospital?: string;
  };
}

const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDirections, setShowDirections] = useState<any>(null);
  const { getPatientAppointments } = useAppointmentBooking();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Enhanced authentication validation
        console.log('🔍 PatientAppointments: Starting authentication check...', {
          hasUser: !!user,
          hasSession: !!session,
          userId: user?.id,
          userEmail: user?.email
        });

        if (!user || !session) {
          console.error('❌ PatientAppointments: User not authenticated', {
            user: !!user,
            session: !!session
          });
          toast({
            title: "Authentication Required",
            description: "Please log in to view your appointments.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!user.id) {
          console.error('❌ PatientAppointments: User ID is missing', { user });
          toast({
            title: "Authentication Error",
            description: "User identification is missing. Please try logging in again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log('✅ PatientAppointments: User authenticated, fetching appointments for user:', user.id);
        
        const data = await getPatientAppointments();
        
        console.log('📋 PatientAppointments: Raw appointments data received:', {
          totalCount: data.length,
          appointments: data.map(apt => ({
            id: apt.id,
            user_id: apt.user_id,
            doctor_name: apt.doctor_name,
            date: apt.date,
            time: apt.time,
            status: apt.status
          }))
        });

        // Client-side filtering as backup security measure
        const userAppointments = data.filter(appointment => {
          const belongsToUser = appointment.user_id === user.id;
          if (!belongsToUser) {
            console.warn('⚠️ PatientAppointments: Found appointment not belonging to current user', {
              appointmentId: appointment.id,
              appointmentUserId: appointment.user_id,
              currentUserId: user.id,
              doctorName: appointment.doctor_name
            });
          }
          return belongsToUser;
        });

        console.log('✅ PatientAppointments: Filtered appointments for current user:', {
          originalCount: data.length,
          filteredCount: userAppointments.length,
          userId: user.id
        });

        if (userAppointments.length !== data.length) {
          console.error('🚨 PatientAppointments: SECURITY ISSUE - Some appointments were filtered out!', {
            originalCount: data.length,
            filteredCount: userAppointments.length,
            difference: data.length - userAppointments.length
          });
          
          toast({
            title: "Data Security Notice",
            description: "Some data was filtered for security. If you're missing appointments, please contact support.",
            variant: "destructive",
          });
        }

        setAppointments(userAppointments);
      } catch (error) {
        console.error('❌ PatientAppointments: Error fetching appointments:', error);
        toast({
          title: "Error Loading Appointments",
          description: "Failed to load your appointments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have a user
    if (user) {
      fetchAppointments();
    } else {
      console.log('⏳ PatientAppointments: Waiting for user authentication...');
      setLoading(false);
    }
  }, [user, session]);

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

  const handleShowDirections = (appointment: PatientAppointment) => {
    const doctor = appointment.doctors;
    if (doctor?.clinic_latitude && doctor?.clinic_longitude) {
      setShowDirections({
        latitude: doctor.clinic_latitude,
        longitude: doctor.clinic_longitude,
        name: doctor.hospital || appointment.doctor_name,
        address: doctor.clinic_address || 'Clinic Location'
      });
    } else {
      toast({
        title: "Location Not Available",
        description: "This doctor hasn't set their clinic location on the map yet.",
        variant: "destructive"
      });
    }
  };

  // Authentication guard
  if (!user || !session) {
    return (
      <Card className="modern-card">
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-4">Please log in to view your appointments</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

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

  const AppointmentMobileCard = ({ appointment }: { appointment: PatientAppointment }) => (
    <div className="bg-white/80 backdrop-blur-sm border border-blue-100/50 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <User className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-900">{appointment.doctor_name}</span>
        </div>
        <Badge className={getStatusColor(appointment.status)}>
          {appointment.status}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-blue-500" />
          {format(parseISO(appointment.date), 'MMM d, yyyy')}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4 text-blue-500" />
          {appointment.time}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="h-4 w-4 text-blue-500" />
          {appointment.reason || 'General consultation'}
        </div>
      </div>
      
      {appointment.status === 'confirmed' && appointment.doctors?.clinic_latitude && appointment.doctors?.clinic_longitude && (
        <Button 
          onClick={() => handleShowDirections(appointment)}
          variant="outline"
          size="sm"
          className="w-full mt-2"
        >
          <Route className="mr-2 h-3 w-3" />
          Get Directions
        </Button>
      )}
    </div>
  );

  const AppointmentTable = ({ appointments }: { appointments: PatientAppointment[] }) => (
    <div className="hidden md:block">
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
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                  {appointment.status === 'confirmed' && appointment.doctors?.clinic_latitude && appointment.doctors?.clinic_longitude && (
                    <Button 
                      onClick={() => handleShowDirections(appointment)}
                      variant="outline"
                      size="sm"
                    >
                      <Route className="mr-1 h-3 w-3" />
                      Directions
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const AppointmentMobileList = ({ appointments }: { appointments: PatientAppointment[] }) => (
    <div className="md:hidden space-y-3">
      {appointments.map((appointment) => (
        <AppointmentMobileCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="text-gray-900">My Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming" className="text-sm">
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="text-sm">
              Past ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="mt-6">
            {upcomingAppointments.length > 0 ? (
              <>
                <AppointmentTable appointments={upcomingAppointments} />
                <AppointmentMobileList appointments={upcomingAppointments} />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No upcoming appointments</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            {pastAppointments.length > 0 ? (
              <>
                <AppointmentTable appointments={pastAppointments} />
                <AppointmentMobileList appointments={pastAppointments} />
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No past appointments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Directions Map Dialog */}
      {showDirections && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Directions to Clinic</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDirections(null)}
              >
                Close
              </Button>
            </div>
            <div className="p-4">
              <DirectionsMap
                clinicLocation={showDirections}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PatientAppointments;
