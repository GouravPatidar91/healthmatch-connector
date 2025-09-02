import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Star,
  Clock,
  Truck,
  Shield,
  MapPin,
  Pill,
  Heart,
  Brain,
  Bone,
  Eye,
  FileText,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface Medicine {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  prescriptionRequired: boolean;
  fastDelivery: boolean;
  discount?: number;
}

interface CartItem extends Medicine {
  quantity: number;
}

const categories = [
  { id: 'all', name: 'All Categories', icon: Pill },
  { id: 'pain-relief', name: 'Pain Relief', icon: Heart },
  { id: 'vitamins', name: 'Vitamins & Supplements', icon: Shield },
  { id: 'digestive', name: 'Digestive Health', icon: Heart },
  { id: 'respiratory', name: 'Respiratory', icon: Brain },
  { id: 'orthopedic', name: 'Orthopedic', icon: Bone },
  { id: 'eye-care', name: 'Eye Care', icon: Eye },
  { id: 'skin-care', name: 'Skin Care', icon: Heart }
];

const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    brand: 'Crocin',
    category: 'pain-relief',
    price: 25.50,
    originalPrice: 30.00,
    description: 'Effective pain relief and fever reducer',
    image: '/api/placeholder/200/200',
    inStock: true,
    rating: 4.5,
    reviewCount: 128,
    prescriptionRequired: false,
    fastDelivery: true,
    discount: 15
  },
  {
    id: '2',
    name: 'Vitamin D3 60K',
    brand: 'HealthKart',
    category: 'vitamins',
    price: 145.00,
    description: 'Bone health and immunity booster',
    image: '/api/placeholder/200/200',
    inStock: true,
    rating: 4.8,
    reviewCount: 95,
    prescriptionRequired: false,
    fastDelivery: true
  },
  {
    id: '3',
    name: 'Omeprazole 20mg',
    brand: 'Omez',
    category: 'digestive',
    price: 89.25,
    originalPrice: 95.00,
    description: 'Acid reflux and stomach ulcer treatment',
    image: '/api/placeholder/200/200',
    inStock: true,
    rating: 4.3,
    reviewCount: 67,
    prescriptionRequired: true,
    fastDelivery: false,
    discount: 6
  },
  {
    id: '4',
    name: 'Cetirizine 10mg',
    brand: 'Zyrtec',
    category: 'respiratory',
    price: 32.00,
    description: 'Allergy relief antihistamine',
    image: '/api/placeholder/200/200',
    inStock: false,
    rating: 4.6,
    reviewCount: 156,
    prescriptionRequired: false,
    fastDelivery: true
  },
  {
    id: '5',
    name: 'Calcium + Magnesium',
    brand: 'Shelcal',
    category: 'orthopedic',
    price: 167.50,
    originalPrice: 185.00,
    description: 'Bone strength and joint health',
    image: '/api/placeholder/200/200',
    inStock: true,
    rating: 4.4,
    reviewCount: 89,
    prescriptionRequired: false,
    fastDelivery: true,
    discount: 9
  },
  {
    id: '6',
    name: 'Eye Drops Refresh',
    brand: 'Systane',
    category: 'eye-care',
    price: 78.00,
    description: 'Dry eye relief lubricating drops',
    image: '/api/placeholder/200/200',
    inStock: true,
    rating: 4.7,
    reviewCount: 43,
    prescriptionRequired: false,
    fastDelivery: true
  }
];

const Medicine = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPrescriptionUpload, setShowPrescriptionUpload] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const filteredMedicines = mockMedicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (medicine: Medicine) => {
    if (!medicine.inStock) {
      toast({
        title: "Out of Stock",
        description: "This medicine is currently unavailable.",
        variant: "destructive"
      });
      return;
    }

    if (medicine.prescriptionRequired) {
      setShowPrescriptionUpload(true);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === medicine.id);
      if (existing) {
        return prev.map(item => 
          item.id === medicine.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });

    toast({
      title: "Added to Cart",
      description: `${medicine.name} has been added to your cart.`
    });
  };

  const updateQuantity = (medicineId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === medicineId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const MedicineCard = ({ medicine }: { medicine: Medicine }) => (
    <Card className="modern-card group hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-3 relative">
        <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
          <Pill className="h-16 w-16 text-blue-400" />
          {medicine.discount && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
              -{medicine.discount}%
            </Badge>
          )}
          {medicine.fastDelivery && (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">
              <Truck className="h-3 w-3 mr-1" />
              Fast
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {medicine.name}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            by {medicine.brand}
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{medicine.rating}</span>
            <span className="text-xs text-gray-500">({medicine.reviewCount})</span>
          </div>
          {medicine.prescriptionRequired && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Rx
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {medicine.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">₹{medicine.price}</span>
            {medicine.originalPrice && (
              <span className="text-sm text-gray-500 line-through">₹{medicine.originalPrice}</span>
            )}
          </div>
          <Badge variant={medicine.inStock ? "default" : "secondary"} className="text-xs">
            {medicine.inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>
        
        <Button 
          onClick={() => addToCart(medicine)}
          disabled={!medicine.inStock}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );

  const CartSummary = () => (
    <Card className="modern-card sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Cart ({getTotalItems()})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery:</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total:</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <MapPin className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-4 px-4 md:py-6 md:px-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold gradient-text">Quick Medicine</h1>
          <p className="text-gray-600 text-sm md:text-base">Order medicines and healthcare products online</p>
        </div>

        {/* Search and Filters */}
        <Card className="modern-card">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search medicines, brands, or health conditions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:ring-blue-500"
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-blue-200">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="modern-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-sm">Upload Prescription</p>
            </CardContent>
          </Card>
          
          <Card className="modern-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-sm">Fast Delivery</p>
            </CardContent>
          </Card>
          
          <Card className="modern-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-sm">24/7 Support</p>
            </CardContent>
          </Card>
          
          <Card className="modern-card hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <p className="font-medium text-sm">Authentic Meds</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredMedicines.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMedicines.map((medicine) => (
                  <MedicineCard key={medicine.id} medicine={medicine} />
                ))}
              </div>
            ) : (
              <Card className="modern-card">
                <CardContent className="text-center py-8">
                  <Pill className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No medicines found matching your criteria.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>

        {/* Prescription Upload Modal */}
        {showPrescriptionUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Upload Prescription</CardTitle>
                <CardDescription>
                  This medicine requires a prescription. Please upload your prescription to proceed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop your prescription</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPrescriptionUpload(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowPrescriptionUpload(false);
                      toast({
                        title: "Prescription Uploaded",
                        description: "We'll review your prescription and contact you shortly."
                      });
                    }}
                    className="flex-1"
                  >
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicine;