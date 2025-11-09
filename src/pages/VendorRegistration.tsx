import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Clock, Phone, Mail, FileText, Upload } from 'lucide-react';
import { PharmacyLocationPicker } from '@/components/maps/PharmacyLocationPicker';

export default function VendorRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pharmacy_name: '',
    license_number: '',
    owner_name: '',
    phone: '',
    email: user?.email || '',
    address: '',
    city: '',
    region: '',
    latitude: null as number | null,
    longitude: null as number | null,
    delivery_radius_km: 5,
    operating_hours: {
      mon: '9:00-21:00',
      tue: '9:00-21:00',
      wed: '9:00-21:00',
      thu: '9:00-21:00',
      fri: '9:00-21:00',
      sat: '9:00-21:00',
      sun: '10:00-18:00'
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate location is selected
    if (!formData.latitude || !formData.longitude) {
      toast({
        title: "Location Required",
        description: "Please select your pharmacy location on the map.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('medicine_vendors')
        .insert({
          user_id: user.id,
          ...formData
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor registration submitted successfully. We'll review your application and get back to you.",
      });

      navigate('/vendor-dashboard');
    } catch (error) {
      console.error('Error registering vendor:', error);
      toast({
        title: "Error",
        description: "Failed to submit registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vendor Registration</h1>
          <p className="text-muted-foreground">
            Join our platform as a verified medicine vendor and reach more customers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Pharmacy Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Pharmacy Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pharmacy_name">Pharmacy Name *</Label>
                  <Input
                    id="pharmacy_name"
                    name="pharmacy_name"
                    value={formData.pharmacy_name}
                    onChange={handleInputChange}
                    placeholder="e.g., MedPlus Pharmacy"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="license_number">License Number *</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    placeholder="e.g., DL-12345678"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="owner_name">Owner Name *</Label>
                <Input
                  id="owner_name"
                  name="owner_name"
                  value={formData.owner_name}
                  onChange={handleInputChange}
                  placeholder="Full name of pharmacy owner"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="pharmacy@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Map Location Picker */}
              <div>
                <Label className="mb-4 block">
                  Select Pharmacy Location on Map *
                </Label>
                <PharmacyLocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLat={formData.latitude || undefined}
                  initialLng={formData.longitude || undefined}
                />
              </div>

              <div>
                <Label htmlFor="address">Complete Address *</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street address, landmark, area"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Mumbai"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="region">State/Region *</Label>
                  <Input
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    placeholder="e.g., Maharashtra"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_radius_km">Delivery Radius (km)</Label>
                  <Input
                    id="delivery_radius_km"
                    name="delivery_radius_km"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.delivery_radius_km}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.operating_hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <span className="font-medium capitalize">{day === 'mon' ? 'Monday' : 
                                                            day === 'tue' ? 'Tuesday' : 
                                                            day === 'wed' ? 'Wednesday' : 
                                                            day === 'thu' ? 'Thursday' : 
                                                            day === 'fri' ? 'Friday' : 
                                                            day === 'sat' ? 'Saturday' : 'Sunday'}</span>
                    <Input
                      className="w-32"
                      value={hours}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        operating_hours: {
                          ...prev.operating_hours,
                          [day]: e.target.value
                        }
                      }))}
                      placeholder="9:00-21:00"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* License Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                License Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Upload License Document</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a clear photo or scan of your pharmacy license
                </p>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  className="max-w-xs mx-auto"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: JPG, PNG, PDF (Max 10MB)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 text-blue-900">Important Information</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• All information provided will be verified by our team</li>
                <li>• Approval process typically takes 2-3 business days</li>
                <li>• You'll receive an email confirmation once approved</li>
                <li>• Ensure all documents are valid and clearly readable</li>
                <li>• You can manage your inventory and orders after approval</li>
              </ul>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={loading}
              size="lg"
              className="min-w-40"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}