import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, MapPin, Phone, ShoppingBag, AlertCircle } from 'lucide-react';
import { CartItem } from '@/hooks/useCart';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  subtotal: number;
  totalDiscount: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  onConfirmOrder: () => void;
  isProcessing: boolean;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  cartItems,
  subtotal,
  totalDiscount,
  deliveryFee,
  total,
  deliveryAddress,
  setDeliveryAddress,
  customerPhone,
  setCustomerPhone,
  onConfirmOrder,
  isProcessing
}: CheckoutDialogProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const validateAddress = (address: string) => {
    if (!address || address.trim().length < 10) {
      setAddressError('Address must be at least 10 characters');
      return false;
    }
    if (address.length > 500) {
      setAddressError('Address must be less than 500 characters');
      return false;
    }
    setAddressError('');
    return true;
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleConfirm = () => {
    const isAddressValid = validateAddress(deliveryAddress);
    const isPhoneValid = validatePhone(customerPhone);

    if (isAddressValid && isPhoneValid && agreedToTerms) {
      onConfirmOrder();
    } else if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
    }
  };

  const vendorName = cartItems[0]?.pharmacy_name || 'Pharmacy';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Review Your Order</DialogTitle>
          <DialogDescription>
            Please review your order details and confirm delivery information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Order Items</h3>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {cartItems.map((item) => {
                const price = item.selling_price * (1 - item.discount_percentage / 100);
                return (
                  <div key={item.vendor_medicine_id} className="flex justify-between items-start p-2 bg-secondary/30 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.brand} • {item.pack_size}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{price.toFixed(2)} × {item.quantity}</p>
                      <p className="text-sm text-primary">₹{(price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Pharmacy</p>
                <p className="text-blue-700">{vendorName}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Delivery Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address *</Label>
              <Input
                id="address"
                placeholder="Enter your complete delivery address"
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value);
                  if (addressError) validateAddress(e.target.value);
                }}
                onBlur={(e) => validateAddress(e.target.value)}
                className={addressError ? 'border-red-500' : ''}
              />
              {addressError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {addressError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Contact Number *</Label>
              <Input
                id="phone"
                placeholder="10-digit mobile number"
                value={customerPhone}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  if (cleaned.length <= 10) {
                    setCustomerPhone(cleaned);
                    if (phoneError) validatePhone(cleaned);
                  }
                }}
                onBlur={(e) => validatePhone(e.target.value)}
                className={phoneError ? 'border-red-500' : ''}
                maxLength={10}
              />
              {phoneError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {phoneError}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Payment Method
            </h3>
            <div className="p-4 border-2 border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-900">Cash on Delivery (COD)</p>
                    <p className="text-sm text-orange-700">Pay with cash when your order is delivered</p>
                  </div>
                </div>
                <Badge className="bg-orange-600">Selected</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Price Details</h3>
            <div className="space-y-2 p-4 bg-secondary/30 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                To be paid at the time of delivery
              </p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
              I agree to the terms and conditions, and I understand that payment will be collected in cash upon delivery
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || !agreedToTerms}
              className="flex-1"
            >
              {isProcessing ? 'Placing Order...' : 'Confirm Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
