import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Activity, Stethoscope, Pill, Truck, ShieldCheck, Users, Target } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">About Curezy</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Making quality healthcare accessible, affordable, and convenient for everyone across India.
          </p>
        </div>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              Curezy is a healthcare technology platform that connects patients with doctors, pharmacies, and emergency services — all from a single app. Our mission is to bridge the gap between patients and healthcare providers by leveraging technology to make healthcare more accessible, transparent, and efficient.
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              What We Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <Activity className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">AI Health Check</h3>
                  <p className="text-slate-600 text-sm">Intelligent symptom analysis powered by AI to help you understand your health better before visiting a doctor.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Stethoscope className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Doctor Appointments</h3>
                  <p className="text-slate-600 text-sm">Find and book appointments with verified doctors near you. View availability, specializations, and clinic locations.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Pill className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Medicine Delivery</h3>
                  <p className="text-slate-600 text-sm">Order medicines from nearby pharmacies with doorstep delivery. Upload prescriptions and get them verified instantly.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Truck className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Fast Delivery</h3>
                  <p className="text-slate-600 text-sm">Real-time order tracking with dedicated delivery partners. Get your medicines delivered within 30 minutes to 2 hours.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-green-600" />
              Why Choose Curezy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Verified doctors and licensed pharmacies only</li>
              <li>AI-powered health assessments for quick preliminary analysis</li>
              <li>End-to-end encrypted health data — your privacy is our priority</li>
              <li>Real-time delivery tracking with live GPS</li>
              <li>24/7 emergency assistance through the app</li>
              <li>Transparent pricing with no hidden charges</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Our Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed mb-4">
              We envision a future where quality healthcare is just a tap away for every Indian citizen. From rural areas to metropolitan cities, Curezy aims to be the trusted healthcare companion that empowers people to take charge of their health.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Founded with the belief that technology can transform healthcare delivery, we're building a comprehensive ecosystem that connects patients, doctors, pharmacies, and delivery partners — creating a seamless healthcare experience for all.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs;
