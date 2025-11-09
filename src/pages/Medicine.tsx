import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Plus, Minus, Upload, Star, Badge, MapPin, Clock, Phone, FileText, Camera, AlertCircle, Info, Building } from 'lucide-react';
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
  const { 
    medicines, 
    loading, 
    searchMedicines, 
    userLocation, 
    searchStrategy,
    permissionState,
    requestLocationPermission 
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

  useEffect(() => {
    // Initial load
    searchMedicines('', selectedCategory === 'all' ? undefined : selectedCategory);
    
    // Fetch user profile for delivery info
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('address, phone')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setDeliveryAddress(profile.address || '');
          setCustomerPhone(profile.phone || '');
        }
      }
    };
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Search when term or category changes
    const delayedSearch = setTimeout(() => {
      searchMedicines(searchTerm, selectedCategory === 'all' ? undefined : selectedCategory);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
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

    setIsUploading(true);

    try {
      // Upload prescription and immediately broadcast to nearby pharmacies
      const uploadResult = await medicineService.uploadPrescription(
        selectedFile,
        undefined,
        { latitude: userLocation.lat, longitude: userLocation.lng }
      );
      
      if (!uploadResult.success) {
        throw new Error('Upload failed');
      }

      toast({
        title: "Prescription Uploaded",
        description: "Searching for nearby pharmacies...",
      });

      // Show processing modal if broadcast was initiated
      if (uploadResult.broadcast_id) {
        setCurrentBroadcastId(uploadResult.broadcast_id);
        setIsProcessingModalOpen(true);
      }

      setIsUploadModalOpen(false);
      setSelectedFile(null);

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

  const handleProcessingSuccess = (vendorId: string) => {
    setIsProcessingModalOpen(false);
    setCurrentBroadcastId(null);
    
    toast({
      title: "Success!",
      description: "Your prescription order has been accepted by a pharmacy.",
    });
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

  const handleConfirmOrder = async () => {
    try {
      setIsProcessingOrder(true);

      // Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not Logged In",
          description: "Please login to place order",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Validate inputs
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

      // Check for multiple vendors
      const vendors = new Set(cartItems.map(item => item.vendor_id));
      if (vendors.size > 1) {
        toast({
          title: "Multiple Vendors",
          description: "You can only order from one pharmacy at a time. Please remove items from other pharmacies.",
          variant: "destructive",
        });
        return;
      }

      const vendorId = cartItems[0].vendor_id;
      const subtotal = getSubtotal();
      const totalDiscount = getTotalDiscount();
      const deliveryFee = subtotal > 500 ? 0 : 50;
      const finalAmount = getTotalPrice() + deliveryFee;

      // Check if any item requires prescription
      const prescriptionRequired = cartItems.some(item => item.prescription_required);

      // Prepare order data
      const orderData = {
        vendor_id: vendorId,
        total_amount: subtotal,
        delivery_fee: deliveryFee,
        discount_amount: totalDiscount,
        final_amount: finalAmount,
        payment_method: 'cod',
        delivery_address: deliveryAddress,
        customer_phone: customerPhone,
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

      // Create order
      const result = await medicineService.createOrder(orderData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Clear cart
      cartItems.forEach(item => removeFromCart(item.vendor_medicine_id));

      toast({
        title: "Order Placed Successfully! 🎉",
        description: "Your order has been placed and the pharmacy has been notified.",
      });

      setIsCheckoutDialogOpen(false);
      
      // Navigate to order success page
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
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4 flex-1">
          <div className="aspect-square w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
            {medicine.image_url ? (
              <img src={medicine.image_url} alt={medicine.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-4xl">💊</span>
            )}
          </div>
          
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-2">{medicine.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{medicine.brand}</p>
            {medicine.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{medicine.description}</p>
            )}
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg font-bold text-primary">₹{discountedPrice.toFixed(2)}</span>
              {savings > 0 && (
                <span className="text-sm text-muted-foreground line-through">₹{medicine.mrp.toFixed(2)}</span>
              )}
            </div>
            {savings > 0 && (
              <p className="text-xs text-green-600">Save ₹{savings.toFixed(2)}</p>
            )}
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
            {!isVendorMedicine && (
              <div className="text-xs text-muted-foreground">
                Enable location to see nearby vendors
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
                : "Catalog Item"
              }
            </UIBadge>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pack Size:</span>
              <span className="font-medium">{medicine.pack_size}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dosage:</span>
              <span className="font-medium">{medicine.dosage}</span>
            </div>
            {isVendorMedicine && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pharmacy:</span>
                <span className="font-medium text-xs">{(medicine as VendorMedicine).pharmacy_name}</span>
              </div>
            )}
          </div>

          {medicine.prescription_required && (
            <UIBadge variant="outline" className="w-full justify-center mb-3 text-xs">
              📋 Prescription Required
            </UIBadge>
          )}
        </CardContent>
        
        <div className="p-4 pt-0">
          {cartItem ? (
            <div className="flex items-center justify-between bg-primary/5 rounded-lg p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(
                  isVendorMedicine ? (medicine as VendorMedicine).vendor_medicine_id : (medicine as Medicine).id, 
                  -1
                )}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium px-4">{cartItem.quantity}</span>
              <Button
                variant="outline"
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
                  className="w-full"
                  disabled
                >
                  Not Available Nearby
                </Button>
              ) : (
                <Button
                  onClick={() => addToCart(medicine as VendorMedicine)}
                  className="w-full"
                  disabled={(medicine as VendorMedicine).stock_quantity === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              )}
            </>
          )}
        </div>
      </Card>
    );
  };

  // Cart Summary Component
  const CartSummary = () => {
    if (cartItems.length === 0) return null;

    const subtotal = getSubtotal();
    const totalDiscount = getTotalDiscount();
    const deliveryFee = subtotal > 500 ? 0 : 50;

    return (
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({getTotalItems()})
            </span>
            <span className="text-lg font-bold text-primary">₹{getTotalPrice().toFixed(2)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {cartItems.map((item) => {
              const isVendorMedicine = 'vendor_medicine_id' in item;
              const price = isVendorMedicine 
                ? (item as any).selling_price * (1 - (item as any).discount_percentage / 100) 
                : (item as any).mrp;
              const itemId = isVendorMedicine ? (item as any).vendor_medicine_id : (item as any).id;
              
              return (
                <div key={itemId} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.brand}</p>
                    {isVendorMedicine && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {(item as any).pharmacy_name}
                      </p>
                    )}
                    <p className="text-sm font-bold text-primary">₹{price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(itemId, -1)}
                      className="h-6 w-6 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(itemId, 1)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({getTotalItems()} items):</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Delivery Fee:</span>
              <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-primary">₹{(getTotalPrice() + deliveryFee).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              {subtotal < 500 && `Add ₹${(500 - subtotal).toFixed(2)} more for free delivery`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quick Medicine</h1>
          <p className="text-muted-foreground">
            Order medicines and healthcare products from nearby verified pharmacies
          </p>
        </div>

        {/* Location Permission Banner */}
        {!userLocation && (
          <Card className="mb-6 border-2 border-primary/20">
            <CardContent className="p-6">
              {permissionState === 'prompt' && (
                <div className="flex items-start gap-4">
                  <MapPin className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      Enable Location for Best Experience
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      We'll show you medicines available at nearby pharmacies with
                      accurate prices and stock. If no nearby pharmacies found, we'll search your entire city.
                    </p>
                    <Button onClick={requestLocationPermission} size="sm">
                      <MapPin className="mr-2 h-4 w-4" />
                      Enable Location Access
                    </Button>
                  </div>
                </div>
              )}
              
              {permissionState === 'denied' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Location Access Denied</AlertTitle>
                  <AlertDescription>
                    Please enable location in your browser settings to see nearby
                    pharmacies. Without location, you'll see the medicine catalog only.
                  </AlertDescription>
                </Alert>
              )}
              
              {permissionState === 'unavailable' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Location Not Available</AlertTitle>
                  <AlertDescription>
                    Your browser doesn't support location services. Showing all available medicines.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search medicines, brands, or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-medium">Upload Prescription</p>
                  <p className="text-xs text-muted-foreground">For Rx medicines</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Upload Prescription
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver ? 'border-primary bg-primary/5' : 'border-border'
                  } ${selectedFile ? 'border-green-500 bg-green-50' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="font-medium text-green-700">{selectedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="mt-2"
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Drop your prescription here</p>
                        <p className="text-sm text-muted-foreground">or click to browse files</p>
                      </div>
                      <Label htmlFor="prescription" className="cursor-pointer">
                        <Button variant="outline" className="mt-2" asChild>
                          <span>
                            <Camera className="h-4 w-4 mr-2" />
                            Choose File
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id="prescription"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* File Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">File Requirements:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Supported formats: JPG, PNG, PDF</p>
                    <p>• Maximum file size: 10MB</p>
                    <p>• Ensure prescription is clearly visible</p>
                    <p>• Include doctor's signature and stamp</p>
                  </div>
                </div>

                {/* Process Info */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">What happens next?</h4>
                  <div className="text-sm text-orange-700 space-y-1">
                    <p>• Your prescription will be sent to nearby pharmacies</p>
                    <p>• Pharmacies will review your prescription manually</p>
                    <p>• First pharmacy to accept will prepare your order</p>
                    <p>• You'll be notified when a pharmacy accepts</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setSelectedFile(null);
                    }} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitPrescription}
                    className="flex-1"
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Submit Prescription"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium">Fast Delivery</p>
              <p className="text-xs text-muted-foreground">Within 30 mins</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium">24/7 Support</p>
              <p className="text-xs text-muted-foreground">Always available</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Badge className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium">Verified Meds</p>
              <p className="text-xs text-muted-foreground">100% authentic</p>
            </CardContent>
          </Card>
        </div>

        {/* Search Strategy Indicator */}
        {medicines.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            {searchStrategy === 'nearby' && (
              <UIBadge variant="default" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Showing nearby pharmacies within 10km
              </UIBadge>
            )}
            {searchStrategy === 'city' && (
              <UIBadge variant="secondary" className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                No nearby pharmacies found. Showing city-wide options
              </UIBadge>
            )}
            {searchStrategy === 'catalog' && (
              <UIBadge variant="outline" className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                Showing medicine catalog (enable location for availability)
              </UIBadge>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Medicine Grid */}
          <div className="lg:col-span-3">
            {/* Medicine Grid */}
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading medicines...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {medicines.length > 0 ? (
                  medicines.map((medicine) => (
                    <MedicineCard 
                      key={'vendor_medicine_id' in medicine ? medicine.vendor_medicine_id : medicine.id} 
                      medicine={medicine} 
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">No medicines found</h3>
                    <p className="text-muted-foreground mb-4">
                      {!userLocation 
                        ? "Please enable location access to see medicines from nearby pharmacies."
                        : "Try adjusting your search terms or browse different categories."
                      }
                    </p>
                    {!userLocation && (
                      <Button onClick={() => window.location.reload()}>
                        Enable Location
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>

        {/* Prescription Processing Modal */}
        <PrescriptionProcessingModal
          isOpen={isProcessingModalOpen}
          onClose={() => {
            setIsProcessingModalOpen(false);
            setCurrentBroadcastId(null);
          }}
          broadcastId={currentBroadcastId}
          onSuccess={handleProcessingSuccess}
        />

        {/* Checkout Dialog */}
        <CheckoutDialog
          open={isCheckoutDialogOpen}
          onOpenChange={setIsCheckoutDialogOpen}
          cartItems={cartItems}
          subtotal={getSubtotal()}
          totalDiscount={getTotalDiscount()}
          deliveryFee={getSubtotal() > 500 ? 0 : 50}
          total={getTotalPrice() + (getSubtotal() > 500 ? 0 : 50)}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          onConfirmOrder={handleConfirmOrder}
          isProcessing={isProcessingOrder}
        />
      </div>
    </div>
  );
}