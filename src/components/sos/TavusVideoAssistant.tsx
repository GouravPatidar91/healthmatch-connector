
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { VideoIcon, PhoneOffIcon, Loader2Icon, UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useEmergencyService } from "@/hooks/useEmergencyService";

interface TavusVideoAssistantProps {
  onComplete?: (callData: any) => void;
}

interface PersonaDetails {
  persona_id: string;
  persona_name: string;
  system_prompt: string;
  replica_id: string;
  created_at: string;
}

const TavusVideoAssistant: React.FC<TavusVideoAssistantProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { submitEmergencyCall, loading } = useEmergencyService();
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [personaDetails, setPersonaDetails] = useState<PersonaDetails | null>(null);
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
  const [containerReady, setContainerReady] = useState(false);

  // Tavus configuration
  const TAVUS_API_KEY = "1f2bbfa81a08407ea011a4d717a52bf9";
  const TAVUS_REPLICA_ID = "r6ae5b6efc9d";
  const TAVUS_PERSONA_ID = "p92039232c9e";

  // Fetch persona details on component mount
  useEffect(() => {
    const fetchPersonaDetails = async () => {
      try {
        console.log('Fetching persona details...');
        
        const response = await fetch(`https://tavusapi.com/v2/personas/${TAVUS_PERSONA_ID}`, {
          method: 'GET',
          headers: {
            'x-api-key': TAVUS_API_KEY,
          },
        });

        if (!response.ok) {
          console.warn('Failed to fetch persona details:', response.status);
          return;
        }

        const personaData = await response.json();
        console.log('Persona details fetched:', personaData);
        setPersonaDetails(personaData);
        
      } catch (error) {
        console.warn('Error fetching persona details:', error);
        // Don't show error to user, just proceed without persona details
      }
    };

    fetchPersonaDetails();
  }, []);

  // Check if container is ready
  useEffect(() => {
    if (videoContainerRef.current && isVideoActive) {
      setContainerReady(true);
    }
  }, [isVideoActive]);

  // Initialize Tavus conversation
  const initializeTavusConversation = async () => {
    try {
      setIsLoading(true);
      
      console.log('Creating Tavus conversation with persona...');
      
      // Create a conversation with Tavus using persona
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TAVUS_API_KEY,
        },
        body: JSON.stringify({
          replica_id: TAVUS_REPLICA_ID,
          persona_id: TAVUS_PERSONA_ID,
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
      console.log('Conversation created with persona:', conversationData);
      setConversationId(conversationData.conversation_id);
      
      // Set video active first to render the container
      setIsVideoActive(true);
      
      // Wait for the container to be rendered, then start the video call
      setTimeout(() => {
        startVideoCallWithIframe(conversationData.conversation_url);
      }, 200);
      
    } catch (error) {
      console.error('Error initializing Tavus conversation:', error);
      toast({
        title: "Video Assistant Error",
        description: "Failed to initialize video assistant. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Start the video call using iframe
  const startVideoCallWithIframe = async (conversationUrl: string) => {
    try {
      console.log('Starting video call with iframe...');
      
      // Wait for container to be available with retries
      let retries = 0;
      const maxRetries = 15;
      
      while (!videoContainerRef.current && retries < maxRetries) {
        console.log(`Waiting for video container... retry ${retries + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
      
      if (!videoContainerRef.current) {
        throw new Error('Video container not available after retries');
      }

      console.log('Video container found, creating iframe for persona video call...');

      // Create iframe for the video call with persona
      const iframe = document.createElement('iframe');
      iframe.src = conversationUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.allow = 'camera; microphone; fullscreen; autoplay';
      iframe.allowFullscreen = true;

      // Clear container and add iframe
      videoContainerRef.current.innerHTML = '';
      videoContainerRef.current.appendChild(iframe);

      setIsLoading(false);

      toast({
        title: "AI Medical Assistant Connected",
        description: personaDetails 
          ? `Connected with ${personaDetails.persona_name || 'AI Medical Assistant'}`
          : "You are now connected with our AI medical assistant.",
      });

      // Set up iframe load event
      iframe.onload = () => {
        console.log('Persona video call iframe loaded successfully');
      };

      iframe.onerror = () => {
        console.error('Error loading persona video call iframe');
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
      setIsVideoActive(false);
      setIsLoading(false);
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
    setContainerReady(false);
    
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
          {personaDetails 
            ? `Connect with ${personaDetails.persona_name || 'our AI medical assistant'} for immediate consultation`
            : "Connect with our AI video assistant for immediate medical consultation"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {personaDetails && !isVideoActive && (
          <Alert className="bg-blue-50 border-blue-200">
            <UserIcon className="h-4 w-4 text-blue-500" />
            <AlertTitle>AI Medical Specialist Ready</AlertTitle>
            <AlertDescription>
              Our specialized AI medical assistant is ready to help assess your emergency situation and provide guidance.
            </AlertDescription>
          </Alert>
        )}

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
                  Connecting to Medical Assistant...
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
              <AlertTitle>Video Call Active with AI Medical Assistant</AlertTitle>
              <AlertDescription>
                {personaDetails 
                  ? `You are connected with ${personaDetails.persona_name || 'our AI medical assistant'}. Please describe your emergency situation clearly.`
                  : "You are connected with our specialized AI medical assistant. Please describe your emergency situation clearly."
                }
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
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <Loader2Icon className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Connecting to AI Medical Assistant...</p>
                  </div>
                </div>
              )}
              
              {/* Video overlay with call info */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {personaDetails?.persona_name 
                  ? `Emergency Call - ${personaDetails.persona_name}`
                  : "Emergency Medical Consultation - AI Assistant"
                }
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
            <p>Video calls are powered by Tavus AI technology with specialized medical persona</p>
            {personaDetails && (
              <p className="mt-1 text-xs">AI Assistant: {personaDetails.persona_name || 'Medical Specialist'}</p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default TavusVideoAssistant;
