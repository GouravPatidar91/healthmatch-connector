import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Ban, Clock, CreditCard, AlertTriangle } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <RefreshCw className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-slate-900">Refund & Cancellation Policy</h1>
          </div>
          <p className="text-lg text-slate-600">Clear and transparent policies for order cancellations and refunds</p>
          <p className="text-sm text-slate-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Ban className="h-6 w-6 text-red-500" />
              Order Cancellation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Before Order Confirmation</h3>
              <p className="text-slate-700">Orders can be cancelled free of charge before the pharmacy confirms and starts processing your order. A full refund will be issued immediately.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">After Order Confirmation</h3>
              <p className="text-slate-700">Once the pharmacy has confirmed and started preparing your order, cancellation may not be possible. If the order has not yet been dispatched, a cancellation request can be raised and will be reviewed on a case-by-case basis.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">After Dispatch</h3>
              <p className="text-slate-700">Orders that have already been dispatched for delivery cannot be cancelled. You may refuse delivery and request a return/refund subject to our return conditions below.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-green-600" />
              Refund Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Eligible for Refund</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Wrong medicines delivered (different from what was ordered)</li>
                <li>Damaged or expired medicines received</li>
                <li>Order not delivered within the promised timeframe</li>
                <li>Pharmacy cancels the order after payment</li>
                <li>Duplicate charges or overcharges</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Not Eligible for Refund</h3>
              <ul className="list-disc list-inside text-slate-700 space-y-1">
                <li>Change of mind after order delivery</li>
                <li>Medicines that have been opened or used</li>
                <li>Orders where the customer provided an incorrect delivery address</li>
                <li>Delivery delays due to force majeure (natural disasters, government restrictions)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-purple-600" />
              Refund Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-slate-700 space-y-3">
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[160px]">Refund Request:</span>
                <span>Must be raised within 48 hours of delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[160px]">Review Period:</span>
                <span>1–3 business days for verification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[160px]">Refund Processing:</span>
                <span>5–7 business days after approval</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium min-w-[160px]">Refund Method:</span>
                <span>Refunded to the original payment method (UPI, card, net banking)</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="modern-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Prescription Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">
              For orders that require a valid prescription:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>If the prescription is rejected by the pharmacy, a full refund will be issued automatically</li>
              <li>Orders placed with an invalid or expired prescription will be cancelled and refunded</li>
              <li>Prescription medicines cannot be returned once delivered due to regulatory requirements</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>How to Request a Refund</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 mb-3">To request a refund, you can:</p>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              <li>Go to "My Orders" in the app and select the order you want to refund</li>
              <li>Email us at <a href="mailto:admin@curezy.in" className="text-blue-600 hover:underline">admin@curezy.in</a> with your order number</li>
              <li>Call our support at <a href="tel:+919165043258" className="text-blue-600 hover:underline">+91 9165043258</a></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefundPolicy;
