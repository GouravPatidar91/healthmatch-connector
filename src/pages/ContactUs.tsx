import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, ArrowLeft, MessageSquare } from "lucide-react";

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900">Contact Us</h1>
          </div>
          <p className="text-lg text-slate-600">We're here to help you with any questions or concerns</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-blue-600" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-slate-700">For general inquiries and support:</p>
              <a href="mailto:admin@curezy.in" className="text-blue-600 font-semibold hover:underline">admin@curezy.in</a>
              <p className="text-slate-500 text-sm mt-2">We typically respond within 24 hours</p>
            </CardContent>
          </Card>

          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-green-600" />
                Phone Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-slate-700">Call us for urgent assistance:</p>
              <a href="tel:+919165043258" className="text-blue-600 font-semibold hover:underline">+91 9165043258</a>
              <p className="text-slate-500 text-sm mt-2">Available Monday to Saturday, 9 AM – 7 PM IST</p>
            </CardContent>
          </Card>
        </div>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-red-500" />
              Registered Office
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              Curezy LLP<br />
              27-A Kushwah Shri Nagar, Indore Kumar Khadi<br />
              Banganga Police Station, Indore, Indore - 452015<br />
              Madhya Pradesh, India
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-600" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-slate-700 space-y-2">
              <li className="flex justify-between max-w-sm"><span>Monday – Saturday</span><span className="font-medium">9:00 AM – 7:00 PM IST</span></li>
              <li className="flex justify-between max-w-sm"><span>Sunday</span><span className="font-medium">Closed</span></li>
              <li className="flex justify-between max-w-sm"><span>Emergency Support</span><span className="font-medium">24/7 via App</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Grievance Officer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-2">
              In accordance with the Information Technology Act, 2000 and rules made thereunder, the Grievance Officer for the purpose of this policy is:
            </p>
            <p className="text-slate-700 font-medium">Email: admin@curezy.in</p>
            <p className="text-slate-500 text-sm mt-2">Complaints will be acknowledged within 48 hours and resolved within 30 days.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactUs;
