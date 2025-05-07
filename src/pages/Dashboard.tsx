
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Calendar, Users, AlertTriangle, ArrowRight, Phone as PhoneIcon, Info } from "lucide-react";
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

  // Get the most recent health check
  const latestHealthCheck = !healthChecksLoading && healthChecks.length > 0
    ? healthChecks[0]  // Assuming they are sorted by created_at desc (newest first)
    : null;
  
  // Determine health status based on the most recent health check
  const determineHealthStatus = () => {
    if (!latestHealthCheck) return { status: "Unknown", color: "text-medical-neutral-dark" };
    
    // If there's analysis results, use the highest match score to determine status
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
          color: "text-amber-600",
          condition: highestMatch.name
        };
      }
    }
    
    // Use severity if available
    if (latestHealthCheck.severity) {
      switch (latestHealthCheck.severity.toLowerCase()) {
        case "severe":
          return { status: "Attention Needed", color: "text-red-600" };
        case "moderate":
          return { status: "Monitor", color: "text-amber-600" };
        case "mild":
          return { status: "Good", color: "text-medical-green" };
        default:
          return { status: "Good", color: "text-medical-green" };
      }
    }
    
    // Default if no severity or results
    return { status: "Good", color: "text-medical-green" };
  };

  // Count alerts based on health checks
  const countAlerts = () => {
    if (healthChecksLoading || !healthChecks.length) return 0;
    
    let alertCount = 0;
    
    // Check the most recent health check
    if (latestHealthCheck) {
      // Count severe or high match symptoms as alerts
      if (latestHealthCheck.severity === 'severe') {
        alertCount += 1;
      }
      
      // Count high match results as alerts
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

      {latestHealthCheck && healthStatus.status === "Attention Needed" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-600">Health Alert</AlertTitle>
          <AlertDescription>
            Your recent health check indicates attention is needed
            {healthStatus.condition && ` for potential "${healthStatus.condition}"`}.
            Please consider consulting a healthcare professional.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-medical-neutral-dark">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthStatus.color}`}>{healthStatus.status}</div>
            <p className="text-xs text-medical-neutral-dark mt-1">
              {latestHealthCheck 
                ? `Based on your check from ${new Date(latestHealthCheck.created_at || '').toLocaleDateString()}` 
                : "No recent health checks found"}
            </p>
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
        
        <Card 
          className="card-hover cursor-pointer" 
          onClick={() => navigate('/health-check-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-medical-neutral-dark">Health Checks</CardTitle>
            <Users className="h-4 w-4 text-medical-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats.healthChecksCount}</div>
            <p className="text-xs text-medical-neutral-dark mt-1">
              {stats.healthChecksCount > 0 ? "View your health check history" : "Start tracking your health"}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className={`card-hover cursor-pointer ${alertCount > 0 ? 'border-red-200' : ''}`}
          onClick={() => navigate('/health-check-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-medical-neutral-dark">Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${alertCount > 0 ? 'text-red-600' : 'text-medical-blue'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${alertCount > 0 ? 'text-red-600' : ''}`}>{alertCount}</div>
            <p className="text-xs text-medical-neutral-dark mt-1">
              {alertCount > 0 
                ? "Health conditions needing attention" 
                : "No urgent issues"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Display specific alerts if any */}
      {alertCount > 0 && latestHealthCheck && latestHealthCheck.analysis_results && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Health Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestHealthCheck.analysis_results
              .filter(result => result.matchScore >= 75)
              .map((result, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-red-600 mt-1" />
                  <div>
                    <p className="font-medium">{result.name} ({result.matchScore}% match)</p>
                    <p className="text-sm text-gray-700">{result.seekMedicalAttention || "Please consult a healthcare professional."}</p>
                  </div>
                </div>
              ))}
            <Button 
              variant="outline" 
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => navigate('/health-check-history')}
            >
              View Health Check Details
            </Button>
          </CardContent>
        </Card>
      )}

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
              onClick={() => navigate('/health-check-history')}
            >
              <span>View Health History</span>
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
