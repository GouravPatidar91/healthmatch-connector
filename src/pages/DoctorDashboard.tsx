
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentCalendar from '@/components/doctor/AppointmentCalendar';
import AppointmentSlots from '@/components/doctor/AppointmentSlots';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { checkDoctorAccess } from '@/services/doctorService';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("calendar");
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user has doctor access
  useEffect(() => {
    const checkAccess = async () => {
      if (user) {
        try {
          const hasDocAccess = await checkDoctorAccess(user.id);
          setHasAccess(hasDocAccess);
          
          if (!hasDocAccess) {
            toast({
              title: "Access Denied",
              description: "You don't have permission to access the doctor dashboard.",
              variant: "destructive"
            });
            navigate('/dashboard');
          }
        } catch (error) {
          console.error("Error checking doctor access:", error);
          navigate('/dashboard');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        navigate('/');
      }
    };
    
    checkAccess();
  }, [user, navigate, toast]);
  
  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !hasAccess) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Doctor Dashboard</h1>
          <p className="text-slate-500">Manage your appointments and schedule</p>
        </div>

        <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="slots">Appointment Slots</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Calendar</CardTitle>
                <CardDescription>View and manage your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentCalendar />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="slots">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Slots</CardTitle>
                <CardDescription>Create and manage your available appointment slots</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentSlots />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;
