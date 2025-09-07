import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, MapPin, Phone, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get vendor info from URL params (in real implementation, fetch from API)
  const orderNumber = searchParams.get('orderNumber') || 'MED20250107001';
  const vendorName = searchParams.get('vendorName') || 'HealthCare Pharmacy';
  const vendorPhone = searchParams.get('vendorPhone') || '+91 9876543210';
  const vendorAddress = searchParams.get('vendorAddress') || '123 Main Street, City';
  const estimatedDelivery = '30-45 minutes';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Your prescription has been accepted and your order is being prepared
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Order Details
              <Badge variant="default" className="bg-green-100 text-green-700">
                Confirmed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-mono font-semibold">{orderNumber}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Order Type</span>
              <span className="font-medium">Prescription Order</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estimated Delivery</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="font-medium">{estimatedDelivery}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Pharmacy Name</span>
              <span className="font-semibold text-right">{vendorName}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Contact</span>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{vendorPhone}</span>
                </div>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                  Call Vendor
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Address</span>
              <div className="text-right max-w-xs">
                <div className="flex items-start gap-2 justify-end mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-sm">{vendorAddress}</span>
                </div>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                  Get Directions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Prescription Review</p>
                  <p className="text-sm text-muted-foreground">
                    The vendor is reviewing your prescription and preparing your medicines
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Order Preparation</p>
                  <p className="text-sm text-muted-foreground">
                    Your medicines will be packed and ready for delivery
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Your order will be delivered to your address within {estimatedDelivery}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-orange-600">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span className="text-sm">Keep your phone accessible for delivery updates</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span className="text-sm">Have a valid ID ready for prescription verification</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span className="text-sm">Payment will be collected upon delivery</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/medicine')} 
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            
            <Button 
              onClick={() => navigate('/appointments')} 
              className="flex-1"
            >
              Track Order
            </Button>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              // In real implementation, generate and download receipt
              alert('Receipt download coming soon!');
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}