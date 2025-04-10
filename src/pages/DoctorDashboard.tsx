
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppointmentCalendar from '@/components/doctor/AppointmentCalendar';
import AppointmentSlots from '@/components/doctor/AppointmentSlots';
import { useToast } from '@/hooks/use-toast';
import { redirect } from 'react-router-dom';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("calendar");

  // Redirect if not logged in
  if (!user) {
    return redirect('/');
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
