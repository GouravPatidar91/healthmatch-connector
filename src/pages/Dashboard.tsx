import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Calendar, Users, AlertTriangle, ArrowRight, Phone as PhoneIcon, TrendingUp, Heart, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats, useUserAppointments, useUserHealthChecks } from "@/services/userDataService";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { appointments, loading: appointmentsLoading } = useUserAppointments();
  const { healthChecks, loading: healthChecksLoading } = useUserHealthChecks();
  
  const userName = user?.user_metadata?.name || 
                   user?.email?.split('@')[0] || 
                   "User";
  
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

  const latestHealthCheck = !healthChecksLoading && healthChecks.length > 0
    ? healthChecks[0]
    : null;
  
  const determineHealthStatus = () => {
    if (!latestHealthCheck) return { status: "Unknown", color: "text-slate-600" };
    
    if (latestHealthCheck.analysis_results && latestHealthCheck.analysis_results.length > 0) {
      const highestMatch = latestHealthCheck.analysis_results.reduce(
        (highest, current) => current.matchScore > highest.matchScore ? current : highest,
        latestHealthCheck.analysis_results[0]
      );
      
      if (highestMatch.matchScore >= 75) {
        return { 
          status: "Attention Needed", 
          color: "text-red-600",
          condition: highestMatch.name
        };
      } else if (highestMatch.matchScore >= 50) {
        return { 
          status: "Monitor", 
          color: "text-yellow-600",
          condition: highestMatch.name
        };
      }
    }
    
    if (latestHealthCheck.severity) {
      switch (latestHealthCheck.severity.toLowerCase()) {
        case "severe":
          return { status: "Attention Needed", color: "text-red-600" };
        case "moderate":
          return { status: "Monitor", color: "text-yellow-600" };
        case "mild":
          return { status: "Good", color: "text-green-600" };
        default:
          return { status: "Good", color: "text-green-600" };
      }
    }
    
    return { status: "Good", color: "text-green-600" };
  };

  const countAlerts = () => {
    if (healthChecksLoading || !healthChecks.length) return 0;
    
    let alertCount = 0;
    
    if (latestHealthCheck) {
      if (latestHealthCheck.severity === 'severe') {
        alertCount += 1;
      }
      
      if (latestHealthCheck.analysis_results && latestHealthCheck.analysis_results.length > 0) {
        alertCount += latestHealthCheck.analysis_results
          .filter(result => result.matchScore >= 75)
          .length;
      }
    }
    
    return alertCount;
  };

  const healthStatus = determineHealthStatus();
  const alertCount = countAlerts();

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            Welcome back, {userName}
          </h1>
          <p className="text-slate-600 text-lg">Monitor your health journey with modern insights</p>
        </div>
        
        <Button 
          onClick={() => navigate('/emergency')}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all"
          size="lg"
        >
          <PhoneIcon className="h-5 w-5" />
          Emergency
        </Button>
      </div>

      {/* Health Alert */}
      {latestHealthCheck && healthStatus.status === "Attention Needed" && (
        <Alert className="border-red-200 bg-red-50 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-700 font-semibold">Health Alert</AlertTitle>
          <AlertDescription className="text-red-600">
            Your recent health check indicates attention is needed
            {healthStatus.condition && ` for potential "${healthStatus.condition}"`}.
            Please consider consulting a healthcare professional.
          </AlertDescription>
        </Alert>
      )}

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="modern-card group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Health Status</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthStatus.color} mb-1`}>{healthStatus.status}</div>
            <p className="text-xs text-slate-500">
              {latestHealthCheck 
                ? `Last check: ${new Date(latestHealthCheck.created_at || '').toLocaleDateString()}` 
                : "No recent checks"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="modern-card group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Appointments</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 mb-1">{statsLoading ? "..." : stats.upcomingAppointments}</div>
            <p className="text-xs text-slate-500">
              {upcomingAppointment ? `Next: ${upcomingAppointment.date}` : "None scheduled"}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="modern-card cursor-pointer group" 
          onClick={() => navigate('/health-check-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Health Checks</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 mb-1">{statsLoading ? "..." : stats.healthChecksCount}</div>
            <p className="text-xs text-slate-500">
              {stats.healthChecksCount > 0 ? "View history" : "Start tracking"}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className={`modern-card cursor-pointer group ${alertCount > 0 ? 'border-red-200 bg-red-50' : ''}`}
          onClick={() => navigate('/health-check-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Alerts</CardTitle>
            <div className={`p-2 rounded-lg transition-colors ${alertCount > 0 ? 'bg-red-100 group-hover:bg-red-200' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
              <AlertTriangle className={`h-5 w-5 ${alertCount > 0 ? 'text-red-600' : 'text-gray-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${alertCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{alertCount}</div>
            <p className="text-xs text-slate-500">
              {alertCount > 0 ? "Need attention" : "All clear"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>Essential health management tools</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white flex justify-between items-center rounded-lg" 
              onClick={() => navigate('/health-check')}
            >
              <span>Start Health Check</span>
              <Plus className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-between items-center border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
              onClick={() => navigate('/appointments')}
            >
              <span>Book Appointment</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-between items-center border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
              onClick={() => navigate('/health-check-history')}
            >
              <span>View History</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              Next Appointment
            </CardTitle>
            <CardDescription>Your upcoming medical consultation</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointment ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-slate-900">{recentAppointment.doctor_name}</h3>
                    <p className="text-sm text-slate-600">{recentAppointment.doctor_specialty}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-slate-900">{recentAppointment.date}</p>
                    <p className="text-sm text-slate-600">{recentAppointment.time}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg"
                  onClick={() => navigate('/appointments')}
                >
                  View Details
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 bg-slate-50 rounded-xl mb-4 inline-block">
                  <Calendar className="h-12 w-12 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-4">No upcoming appointments</p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
