import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export interface RazorpayOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
}

export const createRazorpayOrder = async (
  amount: number,
  appointmentId: string,
  doctorId: string,
  userId: string
): Promise<RazorpayOrderResponse> => {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { amount, appointment_id: appointmentId, doctor_id: doctorId, user_id: userId },
  });

  if (error) throw new Error(error.message || 'Failed to create order');
  return data;
};

export const verifyRazorpayPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  appointmentId: string
): Promise<boolean> => {
  const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
    body: {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      appointment_id: appointmentId,
    },
  });

  if (error) throw new Error(error.message || 'Payment verification failed');
  return data?.verified || false;
};

export interface QRCodeResponse {
  qr_code_id: string;
  image_url: string;
  qr_content?: string;
  amount: number;
}

export const generatePaymentQR = async (
  amount: number,
  appointmentId: string,
  doctorName: string,
  patientName: string
): Promise<QRCodeResponse> => {
  const { data, error } = await supabase.functions.invoke('generate-payment-qr', {
    body: { amount, appointment_id: appointmentId, doctor_name: doctorName, patient_name: patientName },
  });

  if (error) throw new Error(error.message || 'Failed to generate QR');
  return data;
};

export const openRazorpayCheckout = (
  options: {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description: string;
    prefill?: { name?: string; email?: string; contact?: string };
  },
  onSuccess: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void,
  onFailure: (error: any) => void
) => {
  const rzp = new window.Razorpay({
    ...options,
    handler: onSuccess,
    modal: {
      ondismiss: () => onFailure({ description: 'Payment cancelled by user' }),
    },
    theme: { color: '#10b981' },
  });
  rzp.open();
};
