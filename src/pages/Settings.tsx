
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { Separator } from "@/components/ui/separator";
import { Bell, Lock, Layout, MonitorSmartphone, Moon } from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      app: true,
      appointmentReminders: true,
      healthTips: true,
    },
    privacy: {
      shareDataWithDoctors: true,
      allowAnonymizedResearch: false,
    },
    appearance: {
      darkMode: false,
      highContrast: false,
      largeText: false,
    }
  });
  
  const handleToggle = (category: keyof typeof settings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting as keyof typeof prev[category]]
      }
    }));
  };
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated."
    });
  };
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Bell className="h-6 w-6 text-medical-blue" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-medium">Notification Channels</h3>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications-email" className="flex-1">Email Notifications</Label>
                  <Switch
                    id="notifications-email"
                    checked={settings.notifications.email}
                    onCheckedChange={() => handleToggle("notifications", "email")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications-sms" className="flex-1">SMS Notifications</Label>
                  <Switch
                    id="notifications-sms"
                    checked={settings.notifications.sms}
                    onCheckedChange={() => handleToggle("notifications", "sms")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications-app" className="flex-1">In-App Notifications</Label>
                  <Switch
                    id="notifications-app"
                    checked={settings.notifications.app}
                    onCheckedChange={() => handleToggle("notifications", "app")}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Notification Types</h3>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications-appointments" className="flex-1">Appointment Reminders</Label>
                  <Switch
                    id="notifications-appointments"
                    checked={settings.notifications.appointmentReminders}
                    onCheckedChange={() => handleToggle("notifications", "appointmentReminders")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications-tips" className="flex-1">Health Tips & Information</Label>
                  <Switch
                    id="notifications-tips"
                    checked={settings.notifications.healthTips}
                    onCheckedChange={() => handleToggle("notifications", "healthTips")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Lock className="h-6 w-6 text-medical-blue" />
            <div>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Manage how your data is used</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="privacy-doctors" className="flex-1">Share Data with Doctors</Label>
                  <p className="text-sm text-medical-neutral-dark mt-1">
                    Allow your health data to be shared with doctors you book appointments with
                  </p>
                </div>
                <Switch
                  id="privacy-doctors"
                  checked={settings.privacy.shareDataWithDoctors}
                  onCheckedChange={() => handleToggle("privacy", "shareDataWithDoctors")}
                />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="privacy-research" className="flex-1">Anonymized Research</Label>
                  <p className="text-sm text-medical-neutral-dark mt-1">
                    Allow your anonymized data to be used for healthcare research
                  </p>
                </div>
                <Switch
                  id="privacy-research"
                  checked={settings.privacy.allowAnonymizedResearch}
                  onCheckedChange={() => handleToggle("privacy", "allowAnonymizedResearch")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Layout className="h-6 w-6 text-medical-blue" />
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <Label htmlFor="appearance-dark">Dark Mode</Label>
                </div>
                <Switch
                  id="appearance-dark"
                  checked={settings.appearance.darkMode}
                  onCheckedChange={() => handleToggle("appearance", "darkMode")}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="h-4 w-4" />
                  <Label htmlFor="appearance-contrast">High Contrast</Label>
                </div>
                <Switch
                  id="appearance-contrast"
                  checked={settings.appearance.highContrast}
                  onCheckedChange={() => handleToggle("appearance", "highContrast")}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="appearance-text">Larger Text</Label>
                <Switch
                  id="appearance-text"
                  checked={settings.appearance.largeText}
                  onCheckedChange={() => handleToggle("appearance", "largeText")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex gap-4">
        <Button onClick={handleSaveSettings}>Save Settings</Button>
        <Button variant="outline">Reset to Defaults</Button>
      </div>
    </div>
  );
};

export default Settings;
