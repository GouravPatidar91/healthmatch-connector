
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentCalendar from '@/components/doctor/AppointmentCalendar';
import AppointmentSlots from '@/components/doctor/AppointmentSlots';
import DoctorNotifications from '@/components/doctor/DoctorNotifications';
import DoctorWallet from '@/components/doctor/DoctorWallet';
import DoctorFeeSettings from '@/components/doctor/DoctorFeeSettings';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isDoctor, loading: rolesLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState("calendar");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    const checkAccess = async () => {
      if (!rolesLoading) {
        if (!isDoctor) {
          const { data, error } = await supabase
            .from('doctors')
            .select('verified')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!error && data && data.verified === false) {
            setIsPending(true);
            toast({
              title: "Application Pending",
              description: "Your doctor application is still pending approval from an admin.",
              variant: "default"
            });
          } else {
            toast({
              title: "Access Denied",
              description: "You don't have permission to access the doctor dashboard.",
              variant: "destructive"
            });
          }
          
          navigate('/dashboard');
        }
      }
    };
    
    checkAccess();
  }, [user, isDoctor, rolesLoading, navigate, toast]);
  
  if (rolesLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !isDoctor) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-3 py-4 md:px-6 md:py-6">
      <div className="flex flex-col space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Doctor Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">Manage your appointments, schedule, wallet and settings</p>
        </div>

        <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`${isMobile ? 'grid grid-cols-2 h-auto gap-1 bg-muted/60 p-1' : 'grid grid-cols-5'} w-full max-w-3xl`}>
            <TabsTrigger value="calendar" className="text-xs md:text-sm">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="slots" className="text-xs md:text-sm">
              Slots
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs md:text-sm">
              Health Checks
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-xs md:text-sm">
              Wallet
            </TabsTrigger>
            <TabsTrigger value="fee-settings" className="text-xs md:text-sm">
              Fee Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Appointment Calendar</CardTitle>
                <CardDescription>View and manage your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentCalendar />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="slots">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Appointment Slots</CardTitle>
                <CardDescription>Create and manage your available appointment slots</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentSlots />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Patient Health Check Notifications</CardTitle>
                <CardDescription>Review health check data shared by your patients</CardDescription>
              </CardHeader>
              <CardContent>
                <DoctorNotifications />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Wallet & Earnings</CardTitle>
                <CardDescription>Track your consultation earnings and manage withdrawals</CardDescription>
              </CardHeader>
              <CardContent>
                <DoctorWallet />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fee-settings">
            <DoctorFeeSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;
