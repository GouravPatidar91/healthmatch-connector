
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import RequireAuth from "./components/auth/RequireAuth";
import MainLayout from "./components/layout/MainLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HealthCheck from "./pages/HealthCheck";
import HealthCheckResults from "./pages/HealthCheckResults";
import HealthCheckHistory from "./pages/HealthCheckHistory";
import Appointments from "./pages/Appointments";
import Emergency from "./pages/Emergency";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import MedicalReports from "./pages/MedicalReports";
import DoctorRegistration from "./pages/DoctorRegistration";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <MainLayout />
                  </RequireAuth>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="health-check" element={<HealthCheck />} />
                <Route path="health-check/results" element={<HealthCheckResults />} />
                <Route path="health-check-history" element={<HealthCheckHistory />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="emergency" element={<Emergency />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="medical-reports" element={<MedicalReports />} />
                <Route path="doctor-registration" element={<DoctorRegistration />} />
                <Route path="doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="admin-dashboard" element={<AdminDashboard />} />
              </Route>
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
