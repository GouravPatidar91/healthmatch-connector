
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, User, Calendar, BarChart, Settings, LogOut, Menu, X, PhoneCall, UserPlus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: BarChart },
    { name: "Health Check", path: "/health-check", icon: Heart },
    { name: "Appointments", path: "/appointments", icon: Calendar },
    { name: "Emergency", path: "/emergency", icon: PhoneCall },
    { name: "Profile", path: "/profile", icon: User },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Doctor Registration", path: "/doctor-registration", icon: UserPlus },
  ];
  
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
                          : "hover:bg-gray-100"
                      }`}
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
                    : "hover:bg-gray-100"
                }`}
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
