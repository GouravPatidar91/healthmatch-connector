
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions",
        });
      }
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center mobile-safe-container bg-gradient-to-b from-medical-blue-light to-medical-blue">
        <Card className="mobile-card">
          <CardHeader className="text-center px-4 sm:px-6">
            <div className="mx-auto mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Check your email</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              We've sent a password reset link to <span className="break-all">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <p className="mobile-responsive-text text-muted-foreground text-center">
              Click the link in your email to reset your password. If you don't see the email, check your spam folder.
            </p>
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="w-full text-sm sm:text-base"
              >
                Try different email
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/login')}
                className="flex items-center justify-center w-full text-sm sm:text-base"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center mobile-safe-container bg-gradient-to-b from-medical-blue-light to-medical-blue">
      <Card className="mobile-card">
        <form onSubmit={handleSubmit}>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Reset your password</CardTitle>
            <CardDescription className="mobile-responsive-text">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-sm sm:text-base"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full text-sm sm:text-base"
              disabled={loading}
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? "Sending..." : "Send reset link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full flex items-center justify-center text-sm sm:text-base"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
