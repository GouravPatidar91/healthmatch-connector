import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { toast } from '@/hooks/use-toast';
import { Bike, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const registrationSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .trim()
    .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  vehicleType: z.enum(['bike', 'scooter', 'car'], {
    required_error: 'Please select a vehicle type',
  }),
  vehicleNumber: z.string()
    .trim()
    .min(4, 'Vehicle number must be at least 4 characters')
    .max(20, 'Vehicle number must be less than 20 characters')
    .regex(/^[A-Z0-9\s-]+$/i, 'Vehicle number can only contain letters, numbers, spaces, and hyphens'),
  licenseNumber: z.string()
    .trim()
    .min(5, 'License number must be at least 5 characters')
    .max(20, 'License number must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  deliveryRadius: z.string()
    .regex(/^[0-9]+$/, 'Delivery radius must be a number')
    .refine((val) => {
      const num = parseInt(val);
      return num >= 5 && num <= 50;
    }, 'Delivery radius must be between 5 and 50 km'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function DeliveryPartnerRegistration() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const {
    permissionState,
    location,
    isLoading: locationLoading,
    error: locationError,
    requestPermission,
  } = useLocationPermission();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      deliveryRadius: '10',
    },
  });

  // Check if user is already a delivery partner
  useEffect(() => {
    const checkExistingPartner = async () => {
      if (user) {
        const { data } = await supabase
          .from('delivery_partners')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          // Already registered, redirect to dashboard
          navigate('/delivery-partner-dashboard');
        }
      }
    };
    
    checkExistingPartner();
  }, [user, navigate]);

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Validate email and password for non-logged-in users
      if (!user && (!data.email || !data.password)) {
        setErrorMessage('Email and password are required for registration');
        return;
      }

      // Check if location permission is granted
      if (permissionState !== 'granted' || !location) {
        setErrorMessage('Location permission is required to register as a delivery partner');
        return;
      }

      let userId: string;

      // Step 1: Handle authentication
      if (user) {
        // User is already logged in, use their ID
        userId = user.id;
      } else {
        // Create new auth user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/delivery-partner-dashboard`,
            data: {
              name: data.name,
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setErrorMessage('This email is already registered. Please login instead.');
          } else {
            setErrorMessage(signUpError.message);
          }
          return;
        }

        if (!authData.user) {
          setErrorMessage('Failed to create account. Please try again.');
          return;
        }

        userId = authData.user.id;
      }

      // Step 2: Insert into delivery_partners table
      const { error: insertError } = await supabase
        .from('delivery_partners')
        .insert({
          user_id: userId,
          name: data.name,
          phone: data.phone,
          vehicle_type: data.vehicleType,
          vehicle_number: data.vehicleNumber.toUpperCase(),
          license_number: data.licenseNumber || null,
          current_latitude: location.lat,
          current_longitude: location.lng,
          max_delivery_radius_km: parseInt(data.deliveryRadius),
          is_verified: false,
          is_available: false,
        });

      if (insertError) {
        console.error('Error creating delivery partner profile:', insertError);
        setErrorMessage('Failed to create delivery partner profile. Please contact support.');
        return;
      }

      toast({
        title: 'Registration Successful!',
        description: user 
          ? 'You are now registered as a delivery partner!'
          : 'Your account has been created. Please check your email to verify your account.',
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/delivery-partner-dashboard');
      }, 1000);
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Bike className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Delivery Partner Registration</CardTitle>
          <CardDescription className="text-center">
            Join our delivery network and start earning today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Location Permission */}
            <div className="space-y-2">
              <Alert variant={permissionState === 'granted' ? 'default' : 'destructive'}>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  {permissionState === 'prompt' && (
                    <div className="flex items-center justify-between">
                      <span>Location permission is required for delivery</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={requestPermission}
                        disabled={locationLoading}
                      >
                        {locationLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Enable Location'
                        )}
                      </Button>
                    </div>
                  )}
                  {permissionState === 'granted' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Location enabled</span>
                    </div>
                  )}
                  {permissionState === 'denied' && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Please enable location in your browser settings</span>
                    </div>
                  )}
                  {locationError && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{locationError}</span>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  {...register('name')}
                  disabled={isSubmitting}
                  defaultValue={user?.user_metadata?.name || ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {!user && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...register('email')}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      {...register('password')}
                      disabled={isSubmitting}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must contain at least 8 characters, including uppercase, lowercase, and numbers
                    </p>
                  </div>
                </>
              )}

              {user && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Logged in as {user.email}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  {...register('phone')}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Vehicle Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select
                  onValueChange={(value) => setValue('vehicleType', value as any)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                  </SelectContent>
                </Select>
                {errors.vehicleType && (
                  <p className="text-sm text-destructive">{errors.vehicleType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g., MH12AB1234"
                  {...register('vehicleNumber')}
                  disabled={isSubmitting}
                />
                {errors.vehicleNumber && (
                  <p className="text-sm text-destructive">{errors.vehicleNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Driving License Number (Optional)</Label>
                <Input
                  id="licenseNumber"
                  placeholder="Enter your license number"
                  {...register('licenseNumber')}
                  disabled={isSubmitting}
                />
                {errors.licenseNumber && (
                  <p className="text-sm text-destructive">{errors.licenseNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryRadius">Maximum Delivery Radius (km) *</Label>
                <Input
                  id="deliveryRadius"
                  type="number"
                  min="5"
                  max="50"
                  placeholder="10"
                  {...register('deliveryRadius')}
                  disabled={isSubmitting}
                />
                {errors.deliveryRadius && (
                  <p className="text-sm text-destructive">{errors.deliveryRadius.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Set how far you're willing to travel for deliveries (5-50 km)
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || permissionState !== 'granted' || !location}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Register as Delivery Partner'
                )}
              </Button>
            </div>

            {!user && (
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0"
                  onClick={() => navigate('/login')}
                >
                  Login here
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
