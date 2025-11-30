import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Plus, Minus, Upload, Star, Badge, MapPin, Clock, Phone, FileText, Camera, AlertCircle, Info, Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMedicines } from '@/hooks/useMedicines';
import { useCart, CartItem } from '@/hooks/useCart';
import { VendorMedicine, type Medicine } from '@/services/medicineService';
import { medicineService } from '@/services/medicineService';
import PrescriptionProcessingModal from '@/components/prescription/PrescriptionProcessingModal';
import { CheckoutDialog } from '@/components/medicine/CheckoutDialog';
import { supabase } from '@/integrations/supabase/client';
import { MapboxLocationPicker } from '@/components/maps/MapboxLocationPicker';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateOrderCharges } from '@/services/chargeCalculatorService';

const categories = [
  { name: 'All Categories', icon: '🏥', value: 'all' },
  { name: 'Pain Relief', icon: '💊', value: 'Pain Relief' },
  { name: 'Cold & Cough', icon: '🤧', value: 'Cold & Cough' },
  { name: 'Fever', icon: '🌡️', value: 'Fever' },
  { name: 'Digestive Health', icon: '🥗', value: 'Digestive Health' },
  { name: 'Heart & BP', icon: '❤️', value: 'Cardiovascular' },
  { name: 'Diabetes', icon: '🩺', value: 'Diabetes' },
  { name: 'Vitamins', icon: '💪', value: 'Vitamins & Supplements' },
  { name: 'Skin Care', icon: '✨', value: 'Dermatology' },
  { name: 'Baby Care', icon: '👶', value: 'Pediatric' },
  { name: 'First Aid', icon: '🩹', value: 'First Aid' },
];

export default function Medicine() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { 
    medicines, 
    loading, 
    searchMedicines, 
    userLocation, 
    searchStrategy,
    permissionState,
    requestLocationPermission,
    setSearchLocation
  } = useMedicines();
  const { 
    cartItems, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    getTotalItems, 
    getTotalPrice, 
    getSubtotal, 
    getTotalDiscount 
  } = useCart();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [currentBroadcastId, setCurrentBroadcastId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Checkout state
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryLatitude, setDeliveryLatitude] = useState<number | null>(null);
  const [deliveryLongitude, setDeliveryLongitude] = useState<number | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [handlingCharges, setHandlingCharges] = useState(30);
  const [deliveryFee, setDeliveryFee] = useState(50);

  // Use custom location if set, otherwise use detected location
  const activeLocation = customLocation || userLocation;

  useEffect(() => {
    searchMedicines('', selectedCategory === 'all' ? undefined : selectedCategory);
    
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address, phone, delivery_latitude, delivery_longitude, delivery_address')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setDeliveryAddress(profile.address || profile.delivery_address || '');
          setCustomerPhone(profile.phone || '');
          
          if (profile.delivery_latitude && profile.delivery_longitude) {
            const savedLocation = {
              lat: profile.delivery_latitude,
              lng: profile.delivery_longitude
            };
            setCustomLocation(savedLocation);
            setSearchLocation(savedLocation);
            setDeliveryLatitude(profile.delivery_latitude);
            setDeliveryLongitude(profile.delivery_longitude);
            if (profile.delivery_address) {
              setDeliveryAddress(profile.delivery_address);
            }
            
            searchMedicines('', selectedCategory === 'all' ? undefined : selectedCategory, savedLocation);
          }
        }
      }
    };
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchMedicines(searchTerm, selectedCategory === 'all' ? undefined : selectedCategory);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload an image or PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitPrescription = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a prescription file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please enable location access to find nearby pharmacies.",
        variant: "destructive",
      });
      return;
    }

    const locationToUse = activeLocation || userLocation;
    setIsUploading(true);

    try {
      const uploadResult = await medicineService.uploadPrescription(
        selectedFile,
        undefined,
        { latitude: locationToUse.lat, longitude: locationToUse.lng }
      );
      
      if (!uploadResult.success) {
        toast({
          title: "Broadcast Failed",
          description: uploadResult.error || "Could not find nearby pharmacies",
          variant: "destructive",
        });
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        return;
      }

      if (uploadResult.broadcast_id) {
        toast({
          title: "Prescription Uploaded",
          description: "Searching for nearby pharmacies...",
        });
        
        setCurrentBroadcastId(uploadResult.broadcast_id);
        setIsProcessingModalOpen(true);
        setIsUploadModalOpen(false);
        setSelectedFile(null);
      } else {
        toast({
          title: "Upload Complete",
          description: "Prescription saved but no nearby pharmacies found",
          variant: "destructive",
        });
        setIsUploadModalOpen(false);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Prescription upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload prescription",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    setIsCheckoutDialogOpen(true);
  };

  const handleLocationSelect = async (location: { latitude: number; longitude: number; address: string }) => {
    setDeliveryLatitude(location.latitude);
    setDeliveryLongitude(location.longitude);
    setDeliveryAddress(location.address);
    setCustomLocation({ lat: location.latitude, lng: location.longitude });
    setSearchLocation({ lat: location.latitude, lng: location.longitude });

    // Save to user profile
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
    
    // Re-search medicines with new location
    searchMedicines('', selectedCategory === 'all' ? undefined : selectedCategory, 
      { lat: location.latitude, lng: location.longitude });
  };

  const handleConfirmOrder = async () => {
    if (!cartItems.length) return;

    try {
      setIsProcessingOrder(true);

      if (!deliveryLatitude || !deliveryLongitude) {
        toast({
          title: "Location Required",
          description: "Please select delivery location using the map pin button",
          variant: "destructive",
        });
        setIsLocationPickerOpen(true);
        return;
      }

      if (!deliveryAddress || deliveryAddress.trim().length < 10) {
        toast({
          title: "Invalid Address",
          description: "Please enter a valid delivery address",
          variant: "destructive",
        });
        return;
      }

      if (!/^[6-9]\d{9}$/.test(customerPhone)) {
        toast({
          title: "Invalid Phone",
          description: "Please enter a valid 10-digit phone number",
          variant: "destructive",
        });
        return;
      }

      const vendors = new Set(cartItems.map(item => item.vendor_id));
      if (vendors.size > 1) {
        toast({
          title: "Multiple Vendors",
          description: "You can only order from one pharmacy at a time.",
          variant: "destructive",
        });
        return;
      }

      const vendorId = cartItems[0].vendor_id;
      
      // Get vendor location
      const { data: vendor, error: vendorError } = await supabase
        .from('medicine_vendors')
        .select('latitude, longitude')
        .eq('id', vendorId)
        .single();

      if (vendorError || !vendor?.latitude || !vendor?.longitude) {
        toast({
          title: "Vendor Location Error",
          description: "Unable to calculate delivery charges. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Calculate distance-based charges
      const charges = calculateOrderCharges(
        vendor.latitude,
        vendor.longitude,
        deliveryLatitude,
        deliveryLongitude
      );

      const subtotal = getSubtotal();
      const totalDiscount = getTotalDiscount();
      const finalAmount = subtotal - totalDiscount + charges.handlingCharges + charges.deliveryFee;
      const prescriptionRequired = cartItems.some(item => item.prescription_required);

      const orderData = {
        vendor_id: vendorId,
        total_amount: subtotal,
        delivery_fee: charges.deliveryFee,
        handling_charges: charges.handlingCharges,
        discount_amount: totalDiscount,
        final_amount: finalAmount,
        payment_method: 'cod',
        delivery_address: deliveryAddress,
        customer_phone: customerPhone,
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
        prescription_required: prescriptionRequired,
        items: cartItems.map(item => ({
          medicine_id: item.id,
          vendor_medicine_id: item.vendor_medicine_id,
          quantity: item.quantity,
          unit_price: item.selling_price,
          discount_amount: (item.selling_price * item.discount_percentage / 100) * item.quantity,
          total_price: item.selling_price * (1 - item.discount_percentage / 100) * item.quantity
        }))
      };

      const result = await medicineService.createOrder(orderData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      cartItems.forEach(item => removeFromCart(item.vendor_medicine_id));

      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Order total: ₹${finalAmount.toFixed(2)} (Distance: ${charges.distance}km)`,
      });

      setIsCheckoutDialogOpen(false);
      navigate(`/order-success?orderId=${result.orderId}`);

    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOrder(false);
    }
  };

  // Medicine Card Component
  const MedicineCard = ({ medicine }: { medicine: Medicine | VendorMedicine }) => {
    const isVendorMedicine = 'vendor_medicine_id' in medicine;
    const cartItem = cartItems.find(item => 
      isVendorMedicine 
        ? item.vendor_medicine_id === (medicine as VendorMedicine).vendor_medicine_id
        : item.id === (medicine as Medicine).id
    );
    
    const price = isVendorMedicine ? (medicine as VendorMedicine).selling_price : (medicine as any).price || medicine.mrp;
    const discountedPrice = isVendorMedicine 
      ? price * (1 - (medicine as VendorMedicine).discount_percentage / 100)
      : price;
    const savings = medicine.mrp - discountedPrice;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Card className="h-full flex flex-col overflow-hidden border-border/50 transition-all group">
          <CardContent className="p-5 flex-1">
            <div className="h-32 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              {medicine.image_url ? (
                <img src={medicine.image_url} alt={medicine.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <motion.span 
                  className="text-5xl"
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring" }}
                >
                  💊
                </motion.span>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-foreground line-clamp-2">{medicine.name}</h3>
                  <p className="text-xs text-muted-foreground">{medicine.brand}</p>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-primary">₹{discountedPrice.toFixed(2)}</span>
                  {savings > 0 && (
                    <span className="text-xs text-muted-foreground line-through">₹{medicine.mrp.toFixed(2)}</span>
                  )}
                </div>
              </div>
              
              {savings > 0 && (
                <p className="text-xs text-green-600 mb-2">Save ₹{savings.toFixed(2)}</p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-lg mb-3">
                <span className="font-medium">{medicine.pack_size}</span>
                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                <span>{medicine.dosage}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              {isVendorMedicine && (medicine as VendorMedicine).distance_km && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {(medicine as VendorMedicine).distance_km.toFixed(1)} km
                  </span>
                </div>
              )}
              <UIBadge 
                variant={isVendorMedicine 
                  ? ((medicine as VendorMedicine).stock_quantity > 0 ? "default" : "destructive")
                  : "secondary"
                } 
                className="text-xs"
              >
                {isVendorMedicine 
                  ? ((medicine as VendorMedicine).stock_quantity > 0 ? "In Stock" : "Out of Stock")
                  : "Catalog"
                }
              </UIBadge>
            </div>

            {cartItem ? (
              <div className="flex items-center justify-center gap-3 border-2 border-primary rounded-xl p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateQuantity(
                    isVendorMedicine ? (medicine as VendorMedicine).vendor_medicine_id : (medicine as Medicine).id, 
                    -1
                  )}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold text-lg px-2">{cartItem.quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateQuantity(
                    isVendorMedicine ? (medicine as VendorMedicine).vendor_medicine_id : (medicine as Medicine).id, 
                    1
                  )}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {!isVendorMedicine ? (
                  <Button
                    variant="outline"
                    className="w-full border-2"
                    disabled
                  >
                    Not Available Nearby
                  </Button>
                ) : (
                  <Button
                    onClick={() => addToCart(medicine as VendorMedicine)}
                    className="w-full rounded-xl font-semibold border-2 border-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all group-hover:scale-105"
                    disabled={(medicine as VendorMedicine).stock_quantity === 0}
                  >
                    Add to Cart
                    <Plus className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Quick Medicine</h1>
              <p className="text-muted-foreground mt-1">Order medicines and healthcare products</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Cart Button */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCheckout}
                className="relative hover:scale-105 transition-transform bg-card"
              >
                <ShoppingCart className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                    {getTotalItems()}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.button
            onClick={() => setIsUploadModalOpen(true)}
            whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.98 }}
            className="bg-card hover:bg-card/80 p-6 rounded-2xl border border-border/50 text-left transition-all group"
          >
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="text-purple-600" size={24} />
            </div>
            <h3 className="font-bold text-foreground">Upload Prescription</h3>
            <p className="text-xs text-muted-foreground mt-1">For Rx medicines</p>
          </motion.button>
          
          <div className="bg-card p-6 rounded-2xl border border-border/50 text-left">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
              <Clock className="text-green-600" size={24} />
            </div>
            <h3 className="font-bold text-foreground">Fast Delivery</h3>
            <p className="text-xs text-muted-foreground mt-1">Within 30 mins</p>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border/50 text-left">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <Phone className="text-blue-600" size={24} />
            </div>
            <h3 className="font-bold text-foreground">24/7 Support</h3>
            <p className="text-xs text-muted-foreground mt-1">Always available</p>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border/50 text-left">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
              <Badge className="text-orange-600" size={24} />
            </div>
            <h3 className="font-bold text-foreground">Verified Meds</h3>
            <p className="text-xs text-muted-foreground mt-1">100% authentic</p>
          </div>
        </div>

        {/* Location Status */}
        <div className="mb-8 space-y-4">
          {permissionState === 'prompt' && (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Enable Location</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Allow location access to find medicines from nearby pharmacies</span>
                <Button 
                  onClick={requestLocationPermission}
                  size="sm"
                  className="ml-4"
                >
                  Enable Location
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {permissionState === 'denied' && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Location Access Denied</AlertTitle>
              <AlertDescription>
                Please enable location permissions in your browser settings to find nearby pharmacies.
              </AlertDescription>
            </Alert>
          )}
          
          {activeLocation && (
            <div className="flex items-center justify-between bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {customLocation ? 'Selected Location' : 'Current Location'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Searching within 10 km radius
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsLocationPickerOpen(true)}
                className="hover:scale-105 transition-transform"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Change
              </Button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search medicines, brands, or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-6 rounded-2xl border-2 focus:border-primary shadow-sm text-base"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="w-1.5 h-7 bg-primary rounded-full"></div>
            Browse by Category
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                size="lg"
                onClick={() => setSelectedCategory(category.value)}
                className={`flex-shrink-0 rounded-xl transition-all ${
                  selectedCategory === category.value 
                    ? 'shadow-lg scale-105' 
                    : 'hover:scale-105'
                }`}
              >
                <span className="mr-2 text-lg">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Medicines Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-1.5 h-7 bg-primary rounded-full"></div>
              {selectedCategory === 'all' ? 'Popular Medicines' : selectedCategory}
            </h2>
            <p className="text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              {medicines.length} items
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : medicines.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg mb-2">No medicines found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {medicines.map((medicine, index) => (
                <MedicineCard key={medicine.id} medicine={medicine} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Prescription Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Upload Prescription</h3>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Our pharmacists will review and pack your medicines
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  isDragOver 
                    ? 'border-primary bg-primary/10 scale-[1.02]' 
                    : 'border-border/50 hover:bg-muted/30'
                }`}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground mb-1">
                      Choose a file or drag & drop
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG or PDF (max. 10MB)
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse Files
                  </Button>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border-2 border-primary/20 bg-primary/5 rounded-2xl p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-primary mb-4" />
                <p className="font-semibold text-foreground mb-1">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove File
                </Button>
              </div>
            )}

            <Alert className="bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-3 w-3 text-primary" />
                </div>
                <AlertDescription className="text-sm">
                  Your data is encrypted and shared only with verified pharmacists. 
                  We'll notify you once approved.
                </AlertDescription>
              </div>
            </Alert>

            <Button 
              onClick={handleSubmitPrescription} 
              disabled={!selectedFile || isUploading}
              className="w-full h-12 rounded-xl font-semibold shadow-lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading & Broadcasting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Prescription
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Processing Modal */}
      {currentBroadcastId && (
        <PrescriptionProcessingModal
          isOpen={isProcessingModalOpen}
          onClose={() => {
            setIsProcessingModalOpen(false);
            setCurrentBroadcastId(null);
          }}
          broadcastId={currentBroadcastId}
          onSuccess={(vendorId) => {
            setIsProcessingModalOpen(false);
            setCurrentBroadcastId(null);
            toast({
              title: "Success!",
              description: "Your prescription order has been accepted by a pharmacy.",
            });
          }}
        />
      )}

      {/* Location Picker */}
      <MapboxLocationPicker
        open={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        initialLocation={activeLocation ? {
          latitude: activeLocation.lat,
          longitude: activeLocation.lng
        } : undefined}
        onLocationSelect={(location) => {
          const customLoc = { lat: location.latitude, lng: location.longitude };
          setCustomLocation(customLoc);
          setSearchLocation(customLoc);
          setDeliveryLatitude(location.latitude);
          setDeliveryLongitude(location.longitude);
          setDeliveryAddress(location.address || deliveryAddress);
          
          searchMedicines(searchTerm, selectedCategory === 'all' ? undefined : selectedCategory, customLoc);
          
          toast({
            title: "Location Updated",
            description: "Searching for medicines in your area...",
          });
        }}
      />

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={isCheckoutDialogOpen}
        onOpenChange={setIsCheckoutDialogOpen}
        cartItems={cartItems}
        subtotal={getSubtotal()}
        totalDiscount={getTotalDiscount()}
        handlingCharges={handlingCharges}
        deliveryFee={deliveryFee}
        total={getSubtotal() - getTotalDiscount() + handlingCharges + deliveryFee}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        customerPhone={customerPhone}
        setCustomerPhone={setCustomerPhone}
        onConfirmOrder={handleConfirmOrder}
        isProcessing={isProcessingOrder}
        deliveryLatitude={deliveryLatitude}
        deliveryLongitude={deliveryLongitude}
        onOpenLocationPicker={() => setIsLocationPickerOpen(true)}
      />
    </div>
  );
}
