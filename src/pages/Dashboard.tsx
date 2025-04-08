
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Calendar, Users, AlertTriangle, ArrowRight, Phone as PhoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats, useUserAppointments } from "@/services/userDataService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { appointments, loading: appointmentsLoading } = useUserAppointments();
  
  // Get user's name from metadata if available, or use email as fallback
  const userName = user?.user_metadata?.name || 
                   user?.email?.split('@')[0] || 
                   "User";
  
  // Find the most recent upcoming appointment using current date and time
  const now = new Date();
  
  const upcomingAppointment = !appointmentsLoading && appointments.length > 0
    ? appointments.find(apt => {
        if (apt.status === 'cancelled') return false;
        const aptDateTime = new Date(`${apt.date}T${apt.time}`);
        return aptDateTime >= now;
      })
    : null;

  const recentAppointment = upcomingAppointment || {
    doctor_name: "Dr. Sarah Johnson",
    doctor_specialty: "General Practitioner",
    date: "2023-10-15",
    time: "10:00:00",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-medical-neutral-darkest">Welcome, {userName}</h1>
          <p className="text-medical-neutral-dark">Here's an overview of your health journey</p>
        </div>
        
        <Button 
          onClick={() => navigate('/emergency')}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          size="lg"
        >
          <PhoneIcon className="h-4 w-4" />
          Emergency Services
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-medical-neutral-dark">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-green">Good</div>
            <p className="text-xs text-medical-neutral-dark mt-1">Based on your recent check</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-medical-neutral-dark">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats.upcomingAppointments}</div>
            <p className="text-xs text-medical-neutral-dark mt-1">
              {upcomingAppointment ? `Next: ${upcomingAppointment.date}` : "No upcoming appointments"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-medical-neutral-dark">Health Checks</CardTitle>
            <Users className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats.healthChecksCount}</div>
            <p className="text-xs text-medical-neutral-dark mt-1">
              {stats.healthChecksCount > 0 ? "Track your health history" : "Start tracking your health"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-medical-neutral-dark">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-medical-neutral-dark mt-1">No urgent issues</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              className="flex justify-between items-center" 
              onClick={() => navigate('/health-check')}
            >
              <span>Start Health Check</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-between items-center"
              onClick={() => navigate('/appointments')}
            >
              <span>Book an Appointment</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-between items-center"
              onClick={() => navigate('/profile')}
            >
              <span>Update Medical History</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              className="flex justify-between items-center bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
              onClick={() => navigate('/emergency')}
            >
              <span>Emergency Services</span>
              <PhoneIcon className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointment</CardTitle>
            <CardDescription>Your upcoming medical appointment</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointment ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{recentAppointment.doctor_name}</h3>
                    <p className="text-sm text-medical-neutral-dark">{recentAppointment.doctor_specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{recentAppointment.date}</p>
                    <p className="text-sm text-medical-neutral-dark">{recentAppointment.time}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/appointments')}
                >
                  View Details
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-medical-neutral-dark">No upcoming appointments</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/appointments')}
                >
                  Book Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
