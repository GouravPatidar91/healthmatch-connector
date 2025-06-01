

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { VideoIcon, PhoneOffIcon, Loader2Icon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useEmergencyService } from "@/hooks/useEmergencyService";

interface TavusVideoAssistantProps {
  onComplete?: (callData: any) => void;
}

const TavusVideoAssistant: React.FC<TavusVideoAssistantProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { submitEmergencyCall, loading } = useEmergencyService();
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [callData, setCallData] = useState<{
    patient_name: string;
    symptoms: string[];
    severity: string | null;
    address: string;
  }>({
    patient_name: user?.user_metadata?.name || "",
    symptoms: [],
    severity: null,
    address: ""
  });
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<any>(null);

  // Tavus configuration
  const TAVUS_API_KEY = "1f2bbfa81a08407ea011a4d717a52bf9";
  const TAVUS_REPLICA_ID = "r6ae5b6efc9d";

  // Initialize Tavus conversation
  const initializeTavusConversation = async () => {
    try {
      setIsLoading(true);
      
      // Create a conversation with Tavus
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TAVUS_API_KEY,
        },
        body: JSON.stringify({
          replica_id: TAVUS_REPLICA_ID,
          conversation_name: `Emergency Call - ${user?.user_metadata?.name || 'Patient'}`,
          properties: {
            max_call_duration: 300,
            participant_left_timeout: 30,
            participant_absent_timeout: 30,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Tavus API Error:', errorData);
        throw new Error(`Failed to create conversation: ${response.status} ${response.statusText}`);
      }

      const conversationData = await response.json();
      console.log('Conversation created:', conversationData);
      setConversationId(conversationData.conversation_id);
      
      // Start the video call directly with iframe instead of SDK
      await startVideoCallWithIframe(conversationData.conversation_url);
      
    } catch (error) {
      console.error('Error initializing Tavus conversation:', error);
      toast({
        title: "Video Assistant Error",
        description: "Failed to initialize video assistant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Start the video call using iframe instead of SDK
  const startVideoCallWithIframe = async (conversationUrl: string) => {
    try {
      if (!videoContainerRef.current) {
        throw new Error('Video container not available');
      }

      // Create iframe for the video call
      const iframe = document.createElement('iframe');
      iframe.src = conversationUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.allow = 'camera; microphone; fullscreen';
      iframe.allowFullscreen = true;

      // Clear container and add iframe
      videoContainerRef.current.innerHTML = '';
      videoContainerRef.current.appendChild(iframe);

      setIsVideoActive(true);
      toast({
        title: "Video Assistant Connected",
        description: "You are now connected with our AI medical assistant.",
      });

      // Set up iframe load event
      iframe.onload = () => {
        console.log('Video call iframe loaded successfully');
      };

      iframe.onerror = () => {
        console.error('Error loading video call iframe');
        toast({
          title: "Video Call Error",
          description: "There was an issue loading the video call.",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('Error starting video call:', error);
      toast({
        title: "Video Call Failed",
        description: "Failed to start video call. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle call completion
  const handleCallComplete = async () => {
    try {
      // In a real implementation, you would extract the conversation data
      // from the Tavus conversation transcript or use webhooks
      const emergencyData = {
        patient_name: callData.patient_name || user?.user_metadata?.name || "Patient",
        symptoms: ["Video consultation completed"], // This would be extracted from transcript
        severity: "medium" as const, // This would be determined by AI analysis
        address: "To be determined" // This would be collected during the conversation
      };

      // Submit the emergency call
      await submitEmergencyCall(emergencyData);
      
      if (onComplete) {
        onComplete(emergencyData);
      }

      toast({
        title: "Emergency Call Completed",
        description: "Your information has been recorded and help is being coordinated.",
      });

    } catch (error) {
      console.error('Error completing emergency call:', error);
      toast({
        title: "Error",
        description: "Failed to process emergency call data.",
        variant: "destructive"
      });
    }
  };

  // Start emergency video call
  const startEmergencyCall = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to use the video assistant.",
        variant: "destructive"
      });
      return;
    }

    await initializeTavusConversation();
  };

  // End the emergency call
  const endEmergencyCall = () => {
    if (videoContainerRef.current) {
      videoContainerRef.current.innerHTML = '';
    }
    
    setIsVideoActive(false);
    setConversationId(null);
    conversationRef.current = null;
    
    toast({
      title: "Video Call Ended",
      description: "Your emergency video call has been ended."
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>AI Video Medical Assistant</CardTitle>
        <CardDescription>
          Connect with our AI video assistant for immediate medical consultation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isVideoActive ? (
          <div className="flex flex-col items-center justify-center py-8">
            <VideoIcon size={64} className="text-primary mb-4" />
            <p className="text-center text-gray-600 mb-8 max-w-md">
              Start a video call with our AI medical assistant. The assistant will ask about your symptoms, 
              assess the severity, and help coordinate appropriate medical care.
            </p>
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full"
              onClick={startEmergencyCall}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> 
                  Connecting...
                </>
              ) : (
                <>
                  <VideoIcon className="mr-2" /> 
                  Start Video Emergency Call
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <VideoIcon className="h-4 w-4 text-green-500" />
              <AlertTitle>Video Call Active</AlertTitle>
              <AlertDescription>
                You are connected with our AI medical assistant. Please describe your symptoms clearly.
              </AlertDescription>
            </Alert>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ aspectRatio: '16/9', minHeight: '400px' }}
            >
              <div 
                ref={videoContainerRef}
                className="w-full h-full"
                style={{ minHeight: '400px' }}
              />
              
              {/* Video overlay with call info */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                Emergency Medical Consultation
              </div>
              
              {conversationId && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                  Session: {conversationId.slice(-8)}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {isVideoActive && (
          <Button 
            variant="destructive"
            className="w-full"
            onClick={endEmergencyCall}
          >
            <PhoneOffIcon className="mr-2" /> End Video Call
          </Button>
        )}
        
        {!isVideoActive && !isLoading && (
          <div className="w-full text-center text-sm text-gray-500">
            <p>Video calls are powered by Tavus AI technology</p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default TavusVideoAssistant;

