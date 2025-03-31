
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Calendar, Users, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  
  const recentAppointment = {
    doctor: "Dr. Sarah Johnson",
    specialty: "General Practitioner",
    date: "October 15, 2023",
    time: "10:00 AM",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-medical-neutral-darkest">Welcome, John</h1>
        <p className="text-medical-neutral-dark">Here's an overview of your health journey</p>
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
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-medical-neutral-dark mt-1">Next: {recentAppointment.date}</p>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-medical-neutral-dark">Doctors Consulted</CardTitle>
            <Users className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-medical-neutral-dark mt-1">Across 2 specialties</p>
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointment</CardTitle>
            <CardDescription>Your upcoming medical appointment</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointment ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{recentAppointment.doctor}</h3>
                    <p className="text-sm text-medical-neutral-dark">{recentAppointment.specialty}</p>
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
