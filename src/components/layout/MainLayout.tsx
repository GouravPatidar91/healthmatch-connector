import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, User, Calendar, BarChart, Settings, LogOut, Menu, X, PhoneCall, UserPlus, LayoutDashboard, Shield, FileText } from "lucide-react";
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
  
  // Get user's display name
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };
  
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
    { name: "Medical Reports", path: "/medical-reports", icon: FileText },
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
  };
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Heart className="text-white h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-gray-900">HealthMatch</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <div className="text-sm text-gray-700 px-4 py-2 bg-gray-100 rounded-lg">
                Welcome, {getUserDisplayName()}
              </div>
              <Button 
                className="bg-gray-900 hover:bg-gray-800 text-white"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-sm">
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive(item.path) 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            <Button 
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </nav>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r p-6">
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive(item.path) 
                    ? "bg-blue-50 text-blue-600 font-medium" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
