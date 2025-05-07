
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, User, Calendar, BarChart, Settings, LogOut, Menu, X, PhoneCall, UserPlus, LayoutDashboard, Shield, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPendingDoctorApplication, setHasPendingDoctorApplication] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Check user roles
  useEffect(() => {
    if (user) {
      // Check user roles
      const checkUserRoles = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_doctor, is_admin')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error("Error fetching user roles:", error);
            setIsDoctor(false);
            setIsAdmin(false);
            return;
          }
          
          setIsDoctor(!!data?.is_doctor);
          setIsAdmin(!!data?.is_admin);
          
          // Check if user has a pending doctor application
          const { data: doctorData, error: doctorError } = await supabase
            .from('doctors')
            .select('verified')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!doctorError && doctorData && doctorData.verified === false) {
            setHasPendingDoctorApplication(true);
          } else {
            setHasPendingDoctorApplication(false);
          }
        } catch (error) {
          console.error("Error checking user roles:", error);
          setIsDoctor(false);
          setIsAdmin(false);
        }
      };
      
      checkUserRoles();
    }
  }, [user]);
  
  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: BarChart },
    { name: "Health Check", path: "/health-check", icon: Heart },
    // Removing Health History from navigation
    { name: "Appointments", path: "/appointments", icon: Calendar },
    { name: "Emergency", path: "/emergency", icon: PhoneCall },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
  ];
  
  // Add role-specific navigation items
  if (isDoctor) {
    navigationItems.push({ name: "Doctor Dashboard", path: "/doctor-dashboard", icon: LayoutDashboard });
  } else if (hasPendingDoctorApplication) {
    // Show a disabled version or an indicator that application is pending
    navigationItems.push({ name: "Doctor Application Pending", path: "/dashboard", icon: UserPlus });
  } else {
    navigationItems.push({ name: "Doctor Registration", path: "/doctor-registration", icon: UserPlus });
  }
  
  // Add admin dashboard for admins
  if (isAdmin) {
    navigationItems.push({ name: "Admin Dashboard", path: "/admin-dashboard", icon: Shield });
  }
  
  const handleLogout = async () => {
    await signOut();
    // The navigation will happen automatically due to the auth state change
  };
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Heart className="text-medical-blue h-6 w-6" />
          <span className="font-bold text-xl text-medical-blue">HealthMatch</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center space-x-2">
            {user && (
              <div className="mr-4 text-sm text-medical-neutral-dark">
                Hi, {user.user_metadata.name || user.email}
              </div>
            )}
            <Button 
              variant="ghost" 
              className="text-medical-neutral-dark"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {isMobileMenuOpen ? <X /> : <Menu />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="py-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-8">
                  <Heart className="text-medical-blue h-6 w-6" />
                  <span className="font-bold text-xl text-medical-blue">HealthMatch</span>
                </div>
                
                {user && (
                  <div className="px-4 py-2 mb-2 text-sm text-medical-neutral-dark border-b">
                    Signed in as: {user.user_metadata.name || user.email}
                  </div>
                )}
                
                <nav className="flex flex-col gap-2">
                  {navigationItems.map((item) => (
                    <Link 
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                        isActive(item.path) 
                          ? "bg-medical-blue text-white" 
                          : item.name === "Doctor Application Pending" 
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:bg-gray-100"
                      }`}
                      onClick={e => {
                        if (item.name === "Doctor Application Pending") {
                          e.preventDefault();
                          // Optional: Show toast notification about pending status
                        }
                      }}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
                
                <Button 
                  variant="ghost" 
                  className="mt-auto text-medical-neutral-dark"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      {/* Main Content with Sidebar (on larger screens) */}
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden md:block w-64 bg-medical-neutral-lightest border-r border-gray-200 p-4">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                  isActive(item.path) 
                    ? "bg-medical-blue text-white" 
                    : item.name === "Doctor Application Pending" 
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-gray-100"
                }`}
                onClick={e => {
                  if (item.name === "Doctor Application Pending") {
                    e.preventDefault();
                    // Optional: Show toast notification about pending status
                  }
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto bg-medical-neutral-lightest">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
