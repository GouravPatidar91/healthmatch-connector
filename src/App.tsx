import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import HealthCheck from "./pages/HealthCheck";
import HealthCheckHistory from "./pages/HealthCheckHistory";
import HealthCheckResults from "./pages/HealthCheckResults";
import AppointmentsComingSoon from "./pages/AppointmentsComingSoon";
import MedicineComingSoon from "./pages/MedicineComingSoon";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Emergency from "./pages/Emergency";
import MedicalReports from "./pages/MedicalReports";
import MyMedicalRecords from "./pages/MyMedicalRecords";
import VendorDashboard from "./pages/VendorDashboard";
import VendorRegistration from "./pages/VendorRegistration";
import VendorOrderManagement from "./pages/VendorOrderManagement";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import InternshipTerms from "./pages/InternshipTerms";
import NotFound from "./pages/NotFound";
import DoctorRegistration from "./pages/DoctorRegistration";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMedicineCatalog from "./pages/AdminMedicineCatalog";
import OrderSuccess from "./pages/OrderSuccess";
import MyOrders from "./pages/MyOrders";
import DeliveryPartnerDashboard from "./pages/DeliveryPartnerDashboard";
import DeliveryPartnerRegistration from "./pages/DeliveryPartnerRegistration";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/Privacy Policy" element={<PrivacyPolicy />} />
            <Route path="/Terms of Service" element={<TermsOfService />} />
            <Route path="/internship-terms" element={<InternshipTerms />} />
            <Route path="/delivery-partner-registration" element={<DeliveryPartnerRegistration />} />

            {/* Protected routes with auth check */}
            <Route
              element={
                <RequireAuth>
                  <MainLayout />
                </RequireAuth>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/health-check" element={<HealthCheck />} />
              <Route path="/health-check-results" element={<HealthCheckResults />} />
              <Route path="/health-check-history" element={<HealthCheckHistory />} />
              <Route path="/appointments" element={<AppointmentsComingSoon />} />
              <Route path="/medicine" element={<MedicineComingSoon />} />
              <Route path="/vendor-registration" element={<VendorRegistration />} />
              <Route path="/medical-reports" element={<MedicalReports />} />
              <Route path="/my-medical-records" element={<MyMedicalRecords />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/doctor-registration" element={<DoctorRegistration />} />
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-dashboard/medicines" element={<AdminMedicineCatalog />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/delivery-partner-dashboard" element={<DeliveryPartnerDashboard />} />
            </Route>

            {/* Vendor Dashboard Routes - Standalone (no MainLayout) */}
            <Route
              path="/vendor-dashboard"
              element={
                <RequireAuth>
                  <VendorDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/vendor-dashboard/order/:orderId"
              element={
                <RequireAuth>
                  <VendorOrderManagement />
                </RequireAuth>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
