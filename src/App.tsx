
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HealthCheck from "./pages/HealthCheck";
import HealthCheckHistory from "./pages/HealthCheckHistory";
import Appointments from "./pages/Appointments";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Emergency from "./pages/Emergency";
import NotFound from "./pages/NotFound";
import DoctorRegistration from "./pages/DoctorRegistration";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            
            {/* Protected routes with auth check */}
            <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/health-check" element={<HealthCheck />} />
              <Route path="/health-check-history" element={<HealthCheckHistory />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/doctor-registration" element={<DoctorRegistration />} />
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
