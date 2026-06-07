import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Megaphone, Sparkles } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AdminNotificationCenter from "@/components/admin/AdminNotificationCenter";
import MarketingCampaigns from "@/components/admin/MarketingCampaigns";

const MarketingDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isMarketing, loading } = useUserRole();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!loading && !isAdmin && !isMarketing) {
      toast({
        title: "Access Denied",
        description: "You don't have access to the Marketing Dashboard.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, isAdmin, isMarketing, loading, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isMarketing)) return null;

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Marketing Dashboard
            </h1>
            <p className="text-slate-500">Send notifications and launch campaigns to your users</p>
          </div>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6">
            <MarketingCampaigns />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <AdminNotificationCenter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketingDashboard;
