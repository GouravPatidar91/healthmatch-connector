
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, TrendingUp, AlertTriangle, ArrowRight, Phone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats, useUserAppointments, useUserHealthChecks } from "@/services/userDataService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useUserStats();
  const { appointments, loading: appointmentsLoading } = useUserAppointments();
  const { healthChecks, loading: healthChecksLoading } = useUserHealthChecks();
  
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
  
  const now = new Date();
  const upcomingAppointment = !appointmentsLoading && appointments.length > 0
    ? appointments.find(apt => {
        if (apt.status === 'cancelled') return false;
        const aptDateTime = new Date(`${apt.date}T${apt.time}`);
        return aptDateTime >= now;
      })
    : null;

  const latestHealthCheck = !healthChecksLoading && healthChecks.length > 0
    ? healthChecks[0]
    : null;
  
  const determineHealthStatus = () => {
    if (!latestHealthCheck) return { status: "Unknown", color: "text-gray-600" };
    
    if (latestHealthCheck.analysis_results && latestHealthCheck.analysis_results.length > 0) {
      const highestMatch = latestHealthCheck.analysis_results.reduce(
        (highest, current) => current.matchScore > highest.matchScore ? current : highest,
        latestHealthCheck.analysis_results[0]
      );
      
      if (highestMatch.matchScore >= 75) {
        return { status: "Attention Needed", color: "text-red-600" };
      } else if (highestMatch.matchScore >= 50) {
        return { status: "Monitor", color: "text-orange-600" };
      }
    }
    
    if (latestHealthCheck.severity) {
      switch (latestHealthCheck.severity.toLowerCase()) {
        case "severe":
          return { status: "Attention Needed", color: "text-red-600" };
        case "moderate":
          return { status: "Monitor", color: "text-orange-600" };
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
    <div className="space-y-6 p-4">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {getUserDisplayName()}
          </h1>
          <p className="text-gray-600">Here's an overview of your health journey</p>
        </div>
        
        <Button 
          onClick={() => navigate('/emergency')}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <Phone className="h-4 w-4 mr-2" />
          Emergency
        </Button>
      </div>

      {/* Alert Section */}
      {healthStatus.status === "Attention Needed" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="font-semibold text-red-700">Health Alert</h3>
          </div>
          <p className="text-red-600 mt-1">
            Your recent health check indicates attention is needed. Please consider consulting a healthcare professional.
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${healthStatus.color}`}>{healthStatus.status}</div>
            <p className="text-xs text-gray-500 mt-1">
              {latestHealthCheck 
                ? `Based on your recent check` 
                : "No recent health checks"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">
              {statsLoading ? "..." : stats.upcomingAppointments}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {upcomingAppointment ? `Next: ${upcomingAppointment.date}` : "No upcoming"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => navigate('/health-check-history')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Health Checks</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-gray-900">
              {statsLoading ? "..." : stats.healthChecksCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">View history</p>
          </CardContent>
        </Card>
        
        <Card className={`border cursor-pointer hover:bg-gray-50 ${alertCount > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`} onClick={() => navigate('/health-check-history')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${alertCount > 0 ? 'text-red-600' : 'text-gray-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${alertCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {alertCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {alertCount > 0 ? "Need attention" : "No urgent issues"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-between" 
              onClick={() => navigate('/health-check')}
            >
              <span>Start Health Check</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/appointments')}
            >
              <span>Book Appointment</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate('/health-check-history')}
            >
              <span>View Health History</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointment ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{upcomingAppointment.doctor_name}</h3>
                    <p className="text-sm text-gray-600">{upcomingAppointment.doctor_specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{upcomingAppointment.date}</p>
                    <p className="text-sm text-gray-600">{upcomingAppointment.time}</p>
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
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No upcoming appointments</p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
