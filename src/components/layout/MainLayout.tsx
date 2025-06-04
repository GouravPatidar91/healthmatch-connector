
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, User, Calendar, BarChart, Settings, LogOut, Menu, X, PhoneCall, UserPlus, LayoutDashboard, Shield, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    // The navigation will happen automatically due to the auth state change
  };
  
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      {/* Top Navigation Bar */}
      <header className="glass-effect shadow-2xl p-6 flex justify-between items-center border-b border-white/20 relative z-50">
        <Link to="/dashboard" className="flex items-center space-x-4 group">
          <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300 shadow-xl group-hover:shadow-2xl transform group-hover:scale-110">
            <Heart className="text-white h-8 w-8" />
          </div>
          <span className="font-black text-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            HealthMatch
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {/* Desktop: Show name and logout button */}
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <div className="text-sm md:text-lg text-slate-700 font-semibold px-4 md:px-6 py-2 md:py-3 bg-white/60 rounded-2xl backdrop-blur-sm border border-white/40 shadow-lg">
                Welcome, {getUserDisplayName()}
              </div>
              <Button 
                className="bg-black hover:bg-gray-800 text-white rounded-2xl px-4 md:px-6 py-2 md:py-3 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 md:h-5 md:w-5 md:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
          
          {/* Mobile: Only show menu trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white/20 p-3">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-white/95 backdrop-blur-xl border-r border-white/30 p-0">
              <ScrollArea className="h-full">
                <div className="py-8 px-6 flex flex-col h-full min-h-screen">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl">
                      <Heart className="text-white h-8 w-8" />
                    </div>
                    <span className="font-black text-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                      HealthMatch
                    </span>
                  </div>
                  
                  {/* Mobile: Show user info at top of sidebar */}
                  {user && (
                    <div className="px-6 py-4 mb-6 text-sm text-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-l-4 border-blue-500 shadow-lg">
                      <div className="font-semibold">Signed in as:</div>
                      <div className="font-medium">{getUserDisplayName()}</div>
                    </div>
                  )}
                  
                  {/* Navigation menu */}
                  <nav className="flex flex-col gap-3 flex-1">
                    {navigationItems.map((item) => (
                      <Link 
                        key={item.path}
                        to={item.path}
                        className={`urban-nav-link ${
                          isActive(item.path) 
                            ? "active" 
                            : item.name === "Doctor Application Pending" 
                              ? "opacity-60 cursor-not-allowed text-slate-400"
                              : "text-slate-700 hover:text-blue-700"
                        }`}
                        onClick={e => {
                          if (item.name === "Doctor Application Pending") {
                            e.preventDefault();
                          }
                        }}
                      >
                        <item.icon className="h-6 w-6" />
                        <span className="font-semibold">{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                  
                  {/* Mobile: Logout button at bottom of sidebar */}
                  <Button 
                    className="mt-auto bg-black hover:bg-gray-800 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      
      {/* Main Content with Sidebar (on larger screens) */}
      <div className="flex flex-1">
        {/* Sidebar for desktop */}
        <aside className="hidden md:block w-80 glass-effect border-r border-white/30 p-8">
          <nav className="space-y-3">
            {navigationItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={`urban-nav-link ${
                  isActive(item.path) 
                    ? "active transform scale-105" 
                    : item.name === "Doctor Application Pending" 
                      ? "opacity-60 cursor-not-allowed text-slate-400"
                      : "text-slate-700 hover:text-blue-700"
                }`}
                onClick={e => {
                  if (item.name === "Doctor Application Pending") {
                    e.preventDefault();
                  }
                }}
              >
                <item.icon className="h-6 w-6" />
                <span className="font-semibold text-lg">{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
