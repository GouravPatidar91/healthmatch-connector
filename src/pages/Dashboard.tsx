import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Calendar, Users, AlertTriangle, ArrowRight, Phone as PhoneIcon, Info, TrendingUp, Heart, Zap } from "lucide-react";
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
  
  // Get user's display name with better fallback logic
  const getUserDisplayName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };
  
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
    if (!latestHealthCheck) return { status: "Unknown", color: "text-slate-custom" };
    
    // If there's analysis results, use the highest match score to determine status
    if (latestHealthCheck.analysis_results && latestHealthCheck.analysis_results.length > 0) {
      const highestMatch = latestHealthCheck.analysis_results.reduce(
        (highest, current) => current.matchScore > highest.matchScore ? current : highest,
        latestHealthCheck.analysis_results[0]
      );
      
      if (highestMatch.matchScore >= 75) {
        return { 
          status: "Attention Needed", 
          color: "text-coral-600",
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
          return { status: "Attention Needed", color: "text-coral-600" };
        case "moderate":
          return { status: "Monitor", color: "text-amber-600" };
        case "mild":
          return { status: "Good", color: "text-sage-600" };
        default:
          return { status: "Good", color: "text-sage-600" };
      }
    }
    
    // Default if no severity or results
    return { status: "Good", color: "text-sage-600" };
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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sage-700 to-sage-500 bg-clip-text text-transparent">
            Welcome back, {getUserDisplayName()}
          </h1>
          <p className="text-slate-custom text-lg">Here's an overview of your health journey</p>
        </div>
        
        <Button 
          onClick={() => navigate('/emergency')}
          className="bg-coral-500 hover:bg-coral-600 text-white flex items-center gap-2 px-6 py-3 rounded-xl shadow-medium hover:shadow-large transition-all duration-200 transform hover:scale-105"
          size="lg"
        >
          <PhoneIcon className="h-5 w-5" />
          Emergency Services
        </Button>
      </div>

      {/* Alert Section */}
      {latestHealthCheck && healthStatus.status === "Attention Needed" && (
        <Alert className="border-coral-200 bg-coral-50 rounded-2xl shadow-soft animate-slide-up">
          <AlertTriangle className="h-5 w-5 text-coral-600" />
          <AlertTitle className="text-coral-700 font-semibold">Health Alert</AlertTitle>
          <AlertDescription className="text-coral-600">
            Your recent health check indicates attention is needed
            {healthStatus.condition && ` for potential "${healthStatus.condition}"`}.
            Please consider consulting a healthcare professional.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-modern group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-custom">Health Status</CardTitle>
            <div className="p-2 bg-sage-100 rounded-xl group-hover:bg-sage-200 transition-colors">
              <Activity className="h-5 w-5 text-sage-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthStatus.color} mb-1`}>{healthStatus.status}</div>
            <p className="text-xs text-slate-400">
              {latestHealthCheck 
                ? `Based on your check from ${new Date(latestHealthCheck.created_at || '').toLocaleDateString()}` 
                : "No recent health checks found"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-modern group">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-custom">Upcoming Appointments</CardTitle>
            <div className="p-2 bg-sage-100 rounded-xl group-hover:bg-sage-200 transition-colors">
              <Calendar className="h-5 w-5 text-sage-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-custom mb-1">{statsLoading ? "..." : stats.upcomingAppointments}</div>
            <p className="text-xs text-slate-400">
              {upcomingAppointment ? `Next: ${upcomingAppointment.date}` : "No upcoming appointments"}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className="card-modern cursor-pointer group" 
          onClick={() => navigate('/health-check-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-custom">Health Checks</CardTitle>
            <div className="p-2 bg-sage-100 rounded-xl group-hover:bg-sage-200 transition-colors">
              <TrendingUp className="h-5 w-5 text-sage-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-custom mb-1">{statsLoading ? "..." : stats.healthChecksCount}</div>
            <p className="text-xs text-slate-400">
              {stats.healthChecksCount > 0 ? "View your health check history" : "Start tracking your health"}
            </p>
          </CardContent>
        </Card>
        
        <Card 
          className={`card-modern cursor-pointer group ${alertCount > 0 ? 'border-coral-200 bg-coral-50' : ''}`}
          onClick={() => navigate('/health-check-history')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-custom">Alerts</CardTitle>
            <div className={`p-2 rounded-xl transition-colors ${alertCount > 0 ? 'bg-coral-100 group-hover:bg-coral-200' : 'bg-sage-100 group-hover:bg-sage-200'}`}>
              <AlertTriangle className={`h-5 w-5 ${alertCount > 0 ? 'text-coral-600' : 'text-sage-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold mb-1 ${alertCount > 0 ? 'text-coral-600' : 'text-slate-custom'}`}>{alertCount}</div>
            <p className="text-xs text-slate-400">
              {alertCount > 0 
                ? "Health conditions needing attention" 
                : "No urgent issues"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Details */}
      {alertCount > 0 && latestHealthCheck && latestHealthCheck.analysis_results && (
        <Card className="border-coral-200 bg-gradient-to-r from-coral-50 to-red-50 rounded-2xl shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-coral-500 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <span className="text-coral-700">Health Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestHealthCheck.analysis_results
              .filter(result => result.matchScore >= 75)
              .map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-coral-100">
                  <Info className="h-5 w-5 text-coral-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-custom">{result.name} ({result.matchScore}% match)</p>
                    <p className="text-sm text-slate-600 mt-1">{result.seekMedicalAttention || "Please consult a healthcare professional."}</p>
                  </div>
                </div>
              ))}
            <Button 
              variant="outline" 
              className="mt-4 border-coral-300 text-coral-700 hover:bg-coral-100 rounded-xl"
              onClick={() => navigate('/health-check-history')}
            >
              View Health Check Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-sage-500 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              className="btn-primary flex justify-between items-center" 
              onClick={() => navigate('/health-check')}
            >
              <span>Start Health Check</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-between items-center border-sage-200 text-sage-700 hover:bg-sage-50 rounded-xl"
              onClick={() => navigate('/appointments')}
            >
              <span>Book an Appointment</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="flex justify-between items-center border-sage-200 text-sage-700 hover:bg-sage-50 rounded-xl"
              onClick={() => navigate('/health-check-history')}
            >
              <span>View Health History</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              className="btn-secondary flex justify-between items-center"
              onClick={() => navigate('/emergency')}
            >
              <span>Emergency Services</span>
              <PhoneIcon className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-sage-70 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              Recent Appointment
            </CardTitle>
            <CardDescription>Your upcoming medical appointment</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointment ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-slate-custom">{recentAppointment.doctor_name}</h3>
                    <p className="text-sm text-slate-500">{recentAppointment.doctor_specialty}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold text-slate-custom">{recentAppointment.date}</p>
                    <p className="text-sm text-slate-500">{recentAppointment.time}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-sage-200 text-sage-700 hover:bg-sage-50 rounded-xl"
                  onClick={() => navigate('/appointments')}
                >
                  View Details
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 bg-sage-50 rounded-2xl mb-4 inline-block">
                  <Calendar className="h-12 w-12 text-sage-400" />
                </div>
                <p className="text-slate-500 mb-4">No upcoming appointments</p>
                <Button 
                  className="btn-primary"
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
