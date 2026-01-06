import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile, Profile as ProfileType } from "@/services/userDataService";
import { getWorldCities, getCurrentPosition, getNearbyCities } from "@/utils/geolocation";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, Loader2, Camera, User } from "lucide-react";
import { MapboxLocationPicker } from "@/components/maps/MapboxLocationPicker";
import { supabase } from "@/integrations/supabase/client";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Simple location selector without map dependency

const Profile = () => {
  const { toast } = useToast();
  const { profile, loading, error, updateProfile } = useUserProfile();
  const isMobile = useIsMobile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<ProfileType>>({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    address: "",
    city: "",
    medical_history: "",
    allergies: "",
    medications: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_phone: "",
    avatar_url: "",
    blood_group: "",
    age: undefined,
    weight: undefined
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: ""
  });
  
  // Get the comprehensive list of world cities including Indian cities
  const worldCities = getWorldCities();
  
  useEffect(() => {
    if (profile) {
      console.log("Setting form data from profile:", profile);
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.region || "",
        medical_history: profile.medical_history || "",
        allergies: profile.allergies || "",
        medications: profile.medications || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_relationship: profile.emergency_contact_relationship || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        avatar_url: profile.avatar_url || "",
        blood_group: profile.blood_group || "",
        age: profile.age || undefined,
        weight: profile.weight || undefined
      });
    } else {
      console.log("No profile data available");
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      toast({
        title: "Photo uploaded",
        description: "Your profile photo has been updated"
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      // Try multiple geocoding services for better accuracy
      const geocodingServices = [
        // Primary: Nominatim (OpenStreetMap) - Free and detailed
        {
          url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          parser: (data: any) => {
            if (data.display_name) {
              const address = data.address || {};
              const detailedAddress = [
                address.house_number,
                address.road || address.street,
                address.neighbourhood || address.suburb || address.village,
                address.city_district || address.town || address.municipality,
              ].filter(Boolean).join(', ');
              
              const city = address.city || address.town || address.village || address.municipality || '';
              
              return {
                formattedAddress: detailedAddress || data.display_name,
                city: city,
                fullAddress: data.display_name
              };
            }
            return null;
          }
        },
        // Fallback: BigDataCloud - Free tier available
        {
          url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          parser: (data: any) => {
            if (data.locality) {
              const detailedAddress = [
                data.locality,
                data.principalSubdivision,
                data.city
              ].filter(Boolean).join(', ');
              
              return {
                formattedAddress: detailedAddress,
                city: data.city || data.locality || '',
                fullAddress: `${detailedAddress}, ${data.principalSubdivision}, ${data.countryName}`
              };
            }
            return null;
          }
        }
      ];

      for (const service of geocodingServices) {
        try {
          console.log(`Attempting geocoding with: ${service.url}`);
          const response = await fetch(service.url);
          
          if (!response.ok) {
            console.log(`Service failed with status: ${response.status}`);
            continue;
          }
          
          const data = await response.json();
          console.log('Geocoding response:', data);
          
          const result = service.parser(data);
          if (result && result.formattedAddress && result.city) {
            console.log('Successfully parsed address:', result);
            return result;
          }
        } catch (serviceError) {
          console.log('Service error:', serviceError);
          continue;
        }
      }
      
      throw new Error('All geocoding services failed');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  };


  const handleGetLocation = async () => {
    try {
      setIsGettingLocation(true);
      console.log('Getting current location...');
      
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      console.log('Location obtained:', { latitude, longitude });
      
      // Use enhanced reverse geocoding
      try {
        const addressData = await reverseGeocode(latitude, longitude);
        
        if (addressData) {
          setFormData(prev => ({
            ...prev,
            address: addressData.formattedAddress,
            city: addressData.city
          }));
          
          console.log('Address set from enhanced geocoding:', addressData);
          
          toast({
            title: "Location Updated Successfully",
            description: `Address: ${addressData.formattedAddress}, City: ${addressData.city}`,
          });
        } else {
          throw new Error('No address data returned');
        }
      } catch (geocodeError) {
        console.log('Enhanced geocoding failed, using fallback method');
        
        // Fallback: Use nearby cities and coordinate-based address
        const nearbyCities = getNearbyCities(latitude, longitude);
        const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        setFormData(prev => ({
          ...prev,
          address: fallbackAddress,
          city: nearbyCities.length > 0 ? nearbyCities[0] : ''
        }));
        
        toast({
          title: "Location Updated (Limited Info)",
          description: `Used coordinates as address. ${nearbyCities.length > 0 ? `Nearest city: ${nearbyCities[0]}` : 'Please manually select your city.'}`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error getting location:', error);
      let errorMessage = "Failed to get your location. ";
      
      if (error instanceof Error) {
        if (error.message.includes('denied')) {
          errorMessage += "Please enable location access in your browser settings.";
        } else if (error.message.includes('unavailable')) {
          errorMessage += "Location services are not available.";
        } else if (error.message.includes('timeout')) {
          errorMessage += "Location request timed out. Please try again.";
        } else {
          errorMessage += error.message;
        }
      }
      
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      console.log("Saving profile with data:", formData);
      
      // Map city back to region when saving to maintain compatibility with existing data structure
      const dataToSave = {
        ...formData,
        region: formData.city
      };
      
      await updateProfile(dataToSave);
      
      // Handle password change if provided
      if (passwordForm.password && passwordForm.password === passwordForm.confirmPassword) {
        // Password update logic would go here
        // Not implementing actual password change as it requires additional Supabase auth
        toast({
          title: "Password Change Not Implemented",
          description: "Password change functionality is not implemented in this demo"
        });
      } else if (passwordForm.password) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Loading your profile...</div>;
  }
  
  return (
    <div className="container mx-auto px-3 py-4 md:px-6 md:py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">My Profile</h1>
      
      <Tabs defaultValue="personal">
        <TabsList className={`${isMobile ? 'grid grid-cols-1 h-auto space-y-1 bg-white/60 p-1' : 'grid grid-cols-3'} mb-4 md:mb-6`}>
          <TabsTrigger 
            value="personal"
            className={`text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
          >
            Personal Information
          </TabsTrigger>
          <TabsTrigger 
            value="medical"
            className={`text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
          >
            Medical History
          </TabsTrigger>
          <TabsTrigger 
            value="emergency"
            className={`text-xs md:text-sm ${isMobile ? 'w-full py-3' : ''}`}
          >
            Emergency Contacts
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="personal">
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Personal Information</CardTitle>
              <CardDescription className="text-sm md:text-base">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-2 border-primary/20 hover:border-primary/50 transition-colors"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <input 
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground mt-2">Click to upload photo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm md:text-base">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm md:text-base">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-sm md:text-base">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm md:text-base">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={value => setFormData(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Health Information Section */}
                <Separator className="md:col-span-2 my-2" />
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Health Information</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blood_group" className="text-sm md:text-base">Blood Group</Label>
                  <Select 
                    value={formData.blood_group || ""} 
                    onValueChange={value => setFormData(prev => ({ ...prev, blood_group: value }))}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUPS.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm md:text-base">Age (years)</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="Enter your age"
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm md:text-base">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    min="1"
                    max="500"
                    step="0.1"
                    value={formData.weight || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="Enter your weight"
                    className="text-sm md:text-base"
                  />
                  <p className="text-xs text-muted-foreground">Used in AI Health Check for accurate analysis</p>
                </div>

                <Separator className="md:col-span-2 my-2" />

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm md:text-base">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-sm md:text-base">Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="text-sm md:text-base flex-1"
                      placeholder="Enter your address or use map selector"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGetLocation}
                      disabled={isGettingLocation}
                      className="shrink-0"
                      title="Use current GPS location"
                    >
                      {isGettingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsLocationPickerOpen(true)}
                      className="shrink-0"
                      title="Select location on map"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Map
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Use GPS for current location or select precise location on map
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="city" className="text-sm md:text-base">City</Label>
                  <Select 
                    value={formData.city} 
                    onValueChange={value => setFormData(prev => ({ ...prev, city: value }))}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select your city (auto-filled with GPS location)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {worldCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    City will be automatically selected when you use GPS location
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm md:text-base">Change Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                    value={passwordForm.password}
                    onChange={handlePasswordChange}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm md:text-base">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto text-sm md:text-base">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="medical">
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Medical History</CardTitle>
              <CardDescription className="text-sm md:text-base">Your health information helps doctors provide better care</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medical_history" className="text-sm md:text-base">Medical History</Label>
                <Textarea
                  id="medical_history"
                  name="medical_history"
                  placeholder="List any past surgeries, hospitalizations, or chronic conditions..."
                  value={formData.medical_history}
                  onChange={handleChange}
                  rows={4}
                  className="text-sm md:text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allergies" className="text-sm md:text-base">Allergies</Label>
                <Textarea
                  id="allergies"
                  name="allergies"
                  placeholder="List any allergies to medications, foods, or other substances..."
                  value={formData.allergies}
                  onChange={handleChange}
                  rows={3}
                  className="text-sm md:text-base"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medications" className="text-sm md:text-base">Current Medications</Label>
                <Textarea
                  id="medications"
                  name="medications"
                  placeholder="List any medications you're currently taking..."
                  value={formData.medications}
                  onChange={handleChange}
                  rows={3}
                  className="text-sm md:text-base"
                />
              </div>
              
              <div className="bg-medical-blue/10 p-4 rounded-md">
                <p className="text-xs md:text-sm text-medical-neutral-dark">
                  Your medical information is protected and will only be shared with healthcare providers
                  you choose to consult with. You can update this information at any time.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto text-sm md:text-base">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="emergency">
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Emergency Contacts</CardTitle>
              <CardDescription className="text-sm md:text-base">People to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name" className="text-sm md:text-base">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_relationship" className="text-sm md:text-base">Relationship</Label>
                  <Input
                    id="emergency_contact_relationship"
                    name="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={handleChange}
                    className="text-sm md:text-base"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="emergency_contact_phone" className="text-sm md:text-base">Phone Number</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    className="text-sm md:text-base"
                  />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full text-sm md:text-base" disabled>
                  + Add Another Emergency Contact
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full md:w-auto text-sm md:text-base">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Location Picker Dialog */}
      <MapboxLocationPicker
        open={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        initialLocation={formData.address ? undefined : undefined}
        onLocationSelect={async (location) => {
          setFormData(prev => ({
            ...prev,
            address: location.address,
          }));
          
          // Also save to database immediately
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({
                delivery_latitude: location.latitude,
                delivery_longitude: location.longitude,
                delivery_address: location.address
              })
              .eq('id', user.id);
          }
          
          setIsLocationPickerOpen(false);
          toast({
            title: "Location Updated",
            description: "Your delivery location has been set successfully.",
          });
        }}
      />
    </div>
  );
};

export default Profile;
