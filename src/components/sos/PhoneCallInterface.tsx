
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PhoneIcon, PhoneOffIcon, Loader2Icon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { initiateEmergencyCall, getCallStatus } from "@/services/phoneService";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface PhoneCallFormData {
  phoneNumber: string;
  patientName: string;
}

const PhoneCallInterface: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallLoading, setIsCallLoading] = useState(false);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  
  const form = useForm<PhoneCallFormData>({
    defaultValues: {
      phoneNumber: "",
      patientName: user?.user_metadata?.name || ""
    }
  });

  // Start an emergency call
  const startEmergencyCall = async (data: PhoneCallFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to make emergency calls",
        variant: "destructive"
      });
      return;
    }

    setIsCallLoading(true);
    
    try {
      const result = await initiateEmergencyCall({
        phoneNumber: data.phoneNumber,
        userId: user.id,
        patientName: data.patientName
      });
      
      setCallSid(result.callSid);
      setCallStatus(result.status);
      setIsCallActive(true);
      
      toast({
        title: "Emergency Call Initiated",
        description: `We're calling ${data.phoneNumber} now. Please answer your phone.`,
      });
      
      // Start polling for call status
      if (result.callSid) {
        pollCallStatus(result.callSid);
      }
      
    } catch (error) {
      console.error("Error starting emergency call:", error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Failed to initiate emergency call",
        variant: "destructive"
      });
    } finally {
      setIsCallLoading(false);
    }
  };
  
  // Poll for call status updates
  const pollCallStatus = async (sid: string) => {
    try {
      const statusResult = await getCallStatus(sid);
      setCallStatus(statusResult.status);
      
      // Continue polling if the call is not completed
      if (statusResult.status !== 'completed' && statusResult.status !== 'failed') {
        setTimeout(() => pollCallStatus(sid), 5000); // Poll every 5 seconds
      } else {
        // Call is completed
        setIsCallActive(false);
        toast({
          title: "Call Ended",
          description: `Your emergency call has ended with status: ${statusResult.status}`,
        });
      }
      
    } catch (error) {
      console.error("Error polling call status:", error);
    }
  };
  
  // End the emergency call
  const endEmergencyCall = () => {
    setIsCallActive(false);
    setCallSid(null);
    setCallStatus(null);
    
    toast({
      title: "Call Request Cancelled",
      description: "Your emergency call request has been cancelled."
    });
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Emergency Phone Assistance</CardTitle>
        <CardDescription>
          {isCallActive 
            ? "Our AI assistant will call you and collect emergency details" 
            : "Enter your phone number to receive an emergency call from our AI assistant"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isCallActive ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(startEmergencyCall)} className="space-y-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                rules={{ 
                  required: "Phone number is required",
                  pattern: {
                    value: /^\+?[0-9]{10,15}$/,
                    message: "Please enter a valid phone number"
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormDescription>Enter your phone number to receive the emergency call</FormDescription>
                    <FormControl>
                      <Input placeholder="555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="patientName"
                rules={{ 
                  required: "Patient name is required"
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormDescription>Who needs medical assistance?</FormDescription>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                disabled={isCallLoading}
                className="bg-red-600 hover:bg-red-700 w-full mt-4 text-white font-bold py-4 rounded-full"
              >
                {isCallLoading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Initiating Call
                  </>
                ) : (
                  <>
                    <PhoneIcon className="mr-2" /> Start Emergency Call
                  </>
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <PhoneIcon className="h-4 w-4 text-blue-500" />
              <AlertTitle>Call in Progress</AlertTitle>
              <AlertDescription>
                {callStatus === 'queued' && "Your call is queued and will begin shortly..."}
                {callStatus === 'initiated' && "Call is being connected to your phone..."}
                {callStatus === 'ringing' && "Your phone is ringing. Please answer the call."}
                {callStatus === 'in-progress' && "Call is active. Please respond to the AI assistant's questions."}
                {!callStatus && "Connecting to emergency services..."}
              </AlertDescription>
            </Alert>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-32 w-32 rounded-full bg-red-500 opacity-20 animate-ping"></div>
                </div>
                <div className="relative h-32 w-32 rounded-full bg-red-600 flex items-center justify-center">
                  <PhoneIcon size={48} className="text-white" />
                </div>
              </div>
            </motion.div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Call Status: {callStatus || "Connecting..."}</p>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isCallActive && (
          <Button 
            variant="destructive"
            className="w-full"
            onClick={endEmergencyCall}
          >
            <PhoneOffIcon className="mr-2" /> Cancel Call Request
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PhoneCallInterface;
