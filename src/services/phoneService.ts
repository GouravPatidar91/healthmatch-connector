
import { supabase } from "@/integrations/supabase/client";

interface CallDetails {
  phoneNumber: string;
  userId: string;
  patientName?: string;
}

/**
 * Initiates an emergency call to the user's phone using the Twilio-powered backend
 * @param phoneNumber The user's phone number to call
 */
export async function initiateEmergencyCall(callDetails: CallDetails) {
  try {
    const { phoneNumber, userId, patientName } = callDetails;
    
    // Check if phone number is valid
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      throw new Error("Invalid phone number");
    }
    
    // Call our Supabase Edge Function to initiate the call
    const { data, error } = await supabase.functions.invoke("emergency-call", {
      body: { 
        phoneNumber, 
        userId,
        patientName: patientName || "Patient" 
      }
    });
    
    if (error) {
      console.error("Error initiating call:", error);
      
      // Check if it's likely a credentials issue based on the error pattern
      if (error.message && error.message.includes("non-2xx status code")) {
        throw new Error("Failed to initiate call. The emergency call service is not properly configured. Please contact support.");
      }
      
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to initiate emergency call:", error);
    throw error;
  }
}

/**
 * Gets the status of an ongoing emergency call
 * @param callSid The Twilio call SID to check
 */
export async function getCallStatus(callSid: string) {
  try {
    const { data, error } = await supabase.functions.invoke("call-status", {
      body: { callSid }
    });
    
    if (error) {
      console.error("Error getting call status:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Failed to get call status:", error);
    throw error;
  }
}
