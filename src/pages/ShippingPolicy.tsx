import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, MapPin, Clock, IndianRupee, Package } from "lucide-react";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Truck className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900">Shipping & Delivery Policy</h1>
          </div>
          <p className="text-lg text-slate-600">Everything you need to know about our delivery services</p>
          <p className="text-sm text-slate-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-red-500" />
              Service Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">
              Curezy currently provides medicine delivery services within select cities in India. Delivery availability depends on the pharmacy partner's location and delivery radius.
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>Delivery is available within a radius of up to 10 km from the partner pharmacy</li>
              <li>Service availability may vary based on your pincode and location</li>
              <li>We are continuously expanding to new areas — check the app for live availability</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-600" />
              Estimated Delivery Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="min-w-[120px] font-medium text-slate-900">Standard Delivery</div>
                <div className="text-slate-700">30 minutes – 2 hours from order confirmation, depending on pharmacy preparation time and delivery distance</div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="min-w-[120px] font-medium text-slate-900">Prescription Orders</div>
                <div className="text-slate-700">May take additional time (up to 4 hours) for prescription verification by the pharmacy</div>
              </div>
              <p className="text-slate-500 text-sm">
                Delivery times are estimates and may vary based on order volume, weather conditions, and traffic. You will receive real-time tracking updates in the app.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <IndianRupee className="h-6 w-6 text-green-600" />
              Delivery Charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-slate-700 space-y-3">
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[160px]">Base Delivery Fee:</span>
                <span>₹30 – ₹100 depending on distance from the pharmacy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[160px]">Handling Charges:</span>
                <span>₹5 – ₹15 platform handling fee per order</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[160px]">Free Delivery:</span>
                <span>Promotional free delivery may be available on select orders — check the app for current offers</span>
              </li>
            </ul>
            <p className="text-slate-500 text-sm mt-4">All charges are clearly displayed at checkout before payment.</p>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-600" />
              Order Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">Once your order is dispatched, you can track it in real-time:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>Live GPS tracking of your delivery partner on the map</li>
              <li>Status updates at each stage: confirmed → preparing → dispatched → delivered</li>
              <li>Estimated time of arrival (ETA) displayed in the app</li>
              <li>In-app notifications for all status changes</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Delivery Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">If you face any delivery issues, please contact us:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>Email: <a href="mailto:admin@curezy.in" className="text-blue-600 hover:underline">admin@curezy.in</a></li>
              <li>Phone: <a href="tel:+919165043258" className="text-blue-600 hover:underline">+91 9165043258</a></li>
              <li>Report an issue directly from the "My Orders" section in the app</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShippingPolicy;
