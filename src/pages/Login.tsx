
import React from "react";
import AuthForm from "@/components/auth/AuthForm";
import { Heart } from "lucide-react";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-medical-blue-light to-medical-blue">
      <div className="mb-8 flex flex-col items-center">
        <div className="bg-white p-3 rounded-full mb-4">
          <Heart className="text-medical-blue h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold text-white text-center">HealthMatch</h1>
        <p className="text-white/80 mt-2 text-center">Your personal healthcare assistant</p>
      </div>
      
      <AuthForm />
      
      <p className="mt-8 text-white/70 text-sm text-center">
        HealthMatch helps you track symptoms, identify possible conditions, and connect with healthcare professionals.
      </p>
    </div>
  );
};

export default Login;
