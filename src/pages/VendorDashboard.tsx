import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Package, ShoppingCart, Eye, CheckCircle, XCircle, Clock, Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { medicineService, Medicine, VendorMedicine, CustomMedicine } from '@/services/medicineService';
import { PrescriptionNotificationModal } from '@/components/pharmacy/PrescriptionNotificationModal';

interface VendorNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  created_at: string;
  order_id: string;
}

interface MedicineOrder {
  id: string;
  order_number: string;
  total_amount: number;
  final_amount: number;
  order_status: string;
  prescription_required: boolean;
  prescription_url?: string;
  prescription_status: string;
  customer_phone: string;
  delivery_address: string;
  created_at: string;
  items: Array<{
    medicine_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<VendorNotification[]>([]);
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [vendorMedicines, setVendorMedicines] = useState<VendorMedicine[]>([]);
  const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [isEditMedicineOpen, setIsEditMedicineOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<VendorMedicine | null>(null);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [isCustomMedicine, setIsCustomMedicine] = useState(false);
  const [activeNotification, setActiveNotification] = useState<any>(null);
  
  // Form state for adding medicines
  const [newMedicine, setNewMedicine] = useState({
    medicine_id: '',
    selling_price: '',
    stock_quantity: '',
    discount_percentage: '0',
    expiry_date: '',
    batch_number: ''
  });

  // Form state for custom medicines
  const [customMedicine, setCustomMedicine] = useState<CustomMedicine>({
    name: '',
    brand: '',
    generic_name: '',
    manufacturer: '',
    category: '',
    composition: '',
    dosage: '',
    form: '',
    pack_size: '',
    mrp: 0,
    description: '',
    side_effects: '',
    contraindications: '',
    storage_instructions: '',
    prescription_required: false,
    drug_schedule: '',
    image_url: ''
  });

  useEffect(() => {
    if (user) {
      loadVendorData();
    }
  }, [user]);

  // Real-time subscription for prescription notifications
  useEffect(() => {
    if (!vendorInfo) return;

    const channel = supabase
      .channel('vendor-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendor_notifications',
          filter: `vendor_id=eq.${vendorInfo.id}`
        },
        (payload) => {
          const newNotif = payload.new as any;
          
          // If it's a prescription notification, show modal immediately
          if (newNotif.type === 'prescription_upload' && newNotif.priority === 'high') {
            // Play notification sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKR5/g8r5sIQUxh9Hz04IzBh5uwO/jmVUUCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRQKCkef4PK+bCEFMYfR89OCMwYebsDv45lVFApHn+DyvmwhBTGH0fPTgjMGHm7A7+OZVRC=');
            audio.play().catch(() => {}); // Ignore if autoplay blocked
            
            setActiveNotification({
              id: newNotif.id,
              broadcast_id: newNotif.metadata?.broadcast_id,
              prescription_id: newNotif.metadata?.prescription_id,
              order_id: newNotif.order_id,
              patient_latitude: newNotif.metadata?.patient_latitude,
              patient_longitude: newNotif.metadata?.patient_longitude,
              distance_km: newNotif.metadata?.distance_km,
              timeout_at: newNotif.metadata?.timeout_at,
              prescription_url: newNotif.metadata?.prescription_url
            });
          }
          
          // Add to notifications list
          setNotifications(prev => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorInfo]);

  const loadVendorData = async () => {
    try {
      // Get vendor info
      const { data: vendor, error: vendorError } = await supabase
        .from('medicine_vendors')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (vendorError) throw vendorError;
      setVendorInfo(vendor);

      // Get notifications
      const { data: notificationData, error: notifError } = await supabase
        .from('vendor_notifications')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;
      setNotifications(notificationData || []);

      // Get orders
      const { data: orderData, error: orderError } = await supabase
        .from('medicine_orders')
        .select(`
          *,
          items:medicine_order_items(
            quantity,
            unit_price,
            total_price,
            medicine:medicines(name)
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      const transformedOrders = orderData?.map(order => ({
        ...order,
        items: order.items?.map((item: any) => ({
          medicine_name: item.medicine?.name || 'Unknown Medicine',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })) || []
      })) || [];

      setOrders(transformedOrders);

      // Get vendor medicines
      const vendorMedicineData = await medicineService.getVendorMedicines(vendor.id);
      // Transform the data to match VendorMedicine interface
      const transformedMedicines = vendorMedicineData.map((item: any) => ({
        ...item.medicine,
        vendor_medicine_id: item.id,
        vendor_id: item.vendor_id,
        selling_price: item.selling_price,
        stock_quantity: item.stock_quantity,
        discount_percentage: item.discount_percentage,
        is_available: item.is_available,
        expiry_date: item.expiry_date,
        batch_number: item.batch_number,
        pharmacy_name: vendor.pharmacy_name,
        vendor_address: vendor.address,
        vendor_phone: vendor.phone,
        is_custom_medicine: item.is_custom_medicine
      }));
      setVendorMedicines(transformedMedicines);

      // Get all medicines for the dropdown
      const allMedicineData = await medicineService.getAllMedicines();
      setAllMedicines(allMedicineData);

    } catch (error) {
      console.error('Error loading vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('medicine_orders')
        .update({ 
          order_status: status,
          vendor_notes: notes
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, order_status: status }
          : order
      ));

      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  const approvePrescription = async (orderId: string, approved: boolean, rejectionReason?: string) => {
    try {
      const result = await medicineService.approvePrescription(orderId, vendorInfo.id, approved, rejectionReason);

      if (result.success) {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, prescription_status: approved ? 'approved' : 'rejected' }
            : order
        ));

        toast({
          title: "Success",
          description: `Prescription ${approved ? 'approved' : 'rejected'} successfully.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update prescription status.",
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAddMedicine = async () => {
    if (!isCustomMedicine && !newMedicine.medicine_id) {
      toast({
        title: "Error",
        description: "Please select a medicine.",
        variant: "destructive",
      });
      return;
    }

    if (isCustomMedicine && (!customMedicine.name || !customMedicine.brand || !customMedicine.manufacturer)) {
      toast({
        title: "Error",
        description: "Please fill in required custom medicine fields (name, brand, manufacturer).",
        variant: "destructive",
      });
      return;
    }

    if (!newMedicine.selling_price || !newMedicine.stock_quantity) {
      toast({
        title: "Error",
        description: "Please fill in selling price and stock quantity.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await medicineService.addVendorMedicine({
        vendor_id: vendorInfo.id,
        medicine_id: isCustomMedicine ? undefined : newMedicine.medicine_id,
        selling_price: parseFloat(newMedicine.selling_price),
        stock_quantity: parseInt(newMedicine.stock_quantity),
        discount_percentage: parseFloat(newMedicine.discount_percentage),
        expiry_date: newMedicine.expiry_date || undefined,
        batch_number: newMedicine.batch_number || undefined,
        is_custom_medicine: isCustomMedicine,
        custom_medicine: isCustomMedicine ? customMedicine : undefined
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `${isCustomMedicine ? 'Custom medicine' : 'Medicine'} added to inventory successfully.`,
        });
        setIsAddMedicineOpen(false);
        setIsCustomMedicine(false);
        setNewMedicine({
          medicine_id: '',
          selling_price: '',
          stock_quantity: '',
          discount_percentage: '0',
          expiry_date: '',
          batch_number: ''
        });
        setCustomMedicine({
          name: '',
          brand: '',
          generic_name: '',
          manufacturer: '',
          category: '',
          composition: '',
          dosage: '',
          form: '',
          pack_size: '',
          mrp: 0,
          description: '',
          side_effects: '',
          contraindications: '',
          storage_instructions: '',
          prescription_required: false,
          drug_schedule: '',
          image_url: ''
        });
        await loadVendorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add medicine. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditMedicine = async () => {
    if (!editingMedicine) return;

    try {
      const result = await medicineService.updateVendorMedicine(editingMedicine.vendor_medicine_id, {
        selling_price: parseFloat(newMedicine.selling_price),
        stock_quantity: parseInt(newMedicine.stock_quantity),
        discount_percentage: parseFloat(newMedicine.discount_percentage),
        expiry_date: newMedicine.expiry_date || undefined,
        batch_number: newMedicine.batch_number || undefined,
        is_available: true
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Medicine updated successfully.",
        });
        setIsEditMedicineOpen(false);
        setEditingMedicine(null);
        await loadVendorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update medicine.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMedicine = async (vendorMedicineId: string) => {
    try {
      const result = await medicineService.deleteVendorMedicine(vendorMedicineId);

      if (result.success) {
        toast({
          title: "Success",
          description: "Medicine removed from inventory.",
        });
        await loadVendorData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove medicine.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMedicines = allMedicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    medicine.brand.toLowerCase().includes(medicineSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  if (!vendorInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Please complete vendor registration first.</p>
          <Button onClick={() => window.location.href = '/vendor-registration'}>
            Register as Vendor
          </Button>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const pendingOrders = orders.filter(o => o.order_status === 'placed').length;
  const completedOrders = orders.filter(o => o.order_status === 'delivered').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {vendorInfo.pharmacy_name}!
          </h1>
          <p className="text-gray-600">Manage your pharmacy inventory and orders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{unreadNotifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Order #{order.order_number}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.order_status)}>
                          {order.order_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium">Customer:</p>
                          <p className="text-sm">{order.customer_phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Amount:</p>
                          <p className="text-sm">₹{order.final_amount}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Items:</p>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm flex justify-between">
                              <span>{item.medicine_name} x {item.quantity}</span>
                              <span>₹{item.total_price}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.prescription_required && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            Prescription Required
                          </p>
                          {order.prescription_url ? (
                            <div className="flex items-center gap-2">
                              <a 
                                href={order.prescription_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View Prescription
                              </a>
                              <Badge variant={order.prescription_status === 'approved' ? 'default' : 'destructive'}>
                                {order.prescription_status}
                              </Badge>
                              {order.prescription_status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => approvePrescription(order.id, true)}
                                    className="h-8"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => approvePrescription(order.id, false)}
                                    className="h-8"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-yellow-700">Waiting for prescription upload</p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {order.order_status === 'placed' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          >
                            Confirm Order
                          </Button>
                        )}
                        {order.order_status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                          >
                            Start Processing
                          </Button>
                        )}
                        {order.order_status === 'processing' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                          >
                            Mark as Shipped
                          </Button>
                        )}
                        {order.order_status === 'shipped' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                          >
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {orders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No orders yet. Orders will appear here when customers place them.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Medicine Inventory</CardTitle>
                  <Dialog open={isAddMedicineOpen} onOpenChange={setIsAddMedicineOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Medicine
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Medicine to Inventory</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="custom-medicine"
                              checked={isCustomMedicine}
                              onChange={(e) => setIsCustomMedicine(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="custom-medicine">Add Custom Medicine</Label>
                          </div>

                          {!isCustomMedicine ? (
                            <div>
                              <Label htmlFor="medicine-select">Select Medicine from Catalog *</Label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  id="medicine-search"
                                  placeholder="Search medicines..."
                                  value={medicineSearch}
                                  onChange={(e) => setMedicineSearch(e.target.value)}
                                  className="pl-10 mb-2"
                                />
                              </div>
                              <Select value={newMedicine.medicine_id} onValueChange={(value) => setNewMedicine({...newMedicine, medicine_id: value})}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a medicine" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredMedicines.map((medicine) => (
                                    <SelectItem key={medicine.id} value={medicine.id}>
                                      <div>
                                        <div className="font-medium">{medicine.name}</div>
                                        <div className="text-sm text-muted-foreground">{medicine.brand} - {medicine.dosage}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <h4 className="font-medium">Custom Medicine Details</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="custom-name">Medicine Name *</Label>
                                  <Input
                                    id="custom-name"
                                    value={customMedicine.name}
                                    onChange={(e) => setCustomMedicine({...customMedicine, name: e.target.value})}
                                    placeholder="Enter medicine name"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="custom-brand">Brand *</Label>
                                  <Input
                                    id="custom-brand"
                                    value={customMedicine.brand}
                                    onChange={(e) => setCustomMedicine({...customMedicine, brand: e.target.value})}
                                    placeholder="Enter brand name"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="custom-manufacturer">Manufacturer *</Label>
                                  <Input
                                    id="custom-manufacturer"
                                    value={customMedicine.manufacturer}
                                    onChange={(e) => setCustomMedicine({...customMedicine, manufacturer: e.target.value})}
                                    placeholder="Enter manufacturer"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="custom-category">Category</Label>
                                  <Input
                                    id="custom-category"
                                    value={customMedicine.category}
                                    onChange={(e) => setCustomMedicine({...customMedicine, category: e.target.value})}
                                    placeholder="Enter category"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="custom-dosage">Dosage</Label>
                                  <Input
                                    id="custom-dosage"
                                    value={customMedicine.dosage}
                                    onChange={(e) => setCustomMedicine({...customMedicine, dosage: e.target.value})}
                                    placeholder="e.g., 500mg"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="custom-form">Form</Label>
                                  <Input
                                    id="custom-form"
                                    value={customMedicine.form}
                                    onChange={(e) => setCustomMedicine({...customMedicine, form: e.target.value})}
                                    placeholder="e.g., Tablet, Syrup"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="custom-pack-size">Pack Size</Label>
                                  <Input
                                    id="custom-pack-size"
                                    value={customMedicine.pack_size}
                                    onChange={(e) => setCustomMedicine({...customMedicine, pack_size: e.target.value})}
                                    placeholder="e.g., 10 tablets"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="custom-mrp">MRP (₹)</Label>
                                  <Input
                                    id="custom-mrp"
                                    type="number"
                                    step="0.01"
                                    value={customMedicine.mrp}
                                    onChange={(e) => setCustomMedicine({...customMedicine, mrp: parseFloat(e.target.value) || 0})}
                                    placeholder="Enter MRP"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="selling-price">Selling Price (₹) *</Label>
                            <Input
                              id="selling-price"
                              type="number"
                              step="0.01"
                              value={newMedicine.selling_price}
                              onChange={(e) => setNewMedicine({...newMedicine, selling_price: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="stock-quantity">Stock Quantity *</Label>
                            <Input
                              id="stock-quantity"
                              type="number"
                              value={newMedicine.stock_quantity}
                              onChange={(e) => setNewMedicine({...newMedicine, stock_quantity: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="discount">Discount (%)</Label>
                            <Input
                              id="discount"
                              type="number"
                              step="0.01"
                              value={newMedicine.discount_percentage}
                              onChange={(e) => setNewMedicine({...newMedicine, discount_percentage: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label htmlFor="expiry-date">Expiry Date</Label>
                            <Input
                              id="expiry-date"
                              type="date"
                              value={newMedicine.expiry_date}
                              onChange={(e) => setNewMedicine({...newMedicine, expiry_date: e.target.value})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="batch-number">Batch Number</Label>
                          <Input
                            id="batch-number"
                            value={newMedicine.batch_number}
                            onChange={(e) => setNewMedicine({...newMedicine, batch_number: e.target.value})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddMedicine} className="flex-1">
                            Add Medicine
                          </Button>
                          <Button variant="outline" onClick={() => setIsAddMedicineOpen(false)} className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {vendorMedicines.map((medicine) => (
                    <Card key={medicine.vendor_medicine_id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
                                {medicine.image_url ? (
                                  <img src={medicine.image_url} alt={medicine.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <span className="text-2xl">💊</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{medicine.name}</h4>
                                  {medicine.is_custom_medicine && (
                                    <Badge variant="secondary">Custom</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{medicine.brand} - {medicine.dosage}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Price:</span>
                                <p className="font-medium">₹{medicine.selling_price}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Stock:</span>
                                <p className="font-medium">{medicine.stock_quantity}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Discount:</span>
                                <p className="font-medium">{medicine.discount_percentage}%</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={medicine.is_available && medicine.stock_quantity > 0 ? "default" : "destructive"}>
                                  {medicine.is_available && medicine.stock_quantity > 0 ? "Available" : "Out of Stock"}
                                </Badge>
                              </div>
                            </div>
                            {medicine.batch_number && (
                              <p className="text-xs text-muted-foreground mt-2">Batch: {medicine.batch_number}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMedicine(medicine);
                                setNewMedicine({
                                  medicine_id: medicine.id,
                                  selling_price: medicine.selling_price.toString(),
                                  stock_quantity: medicine.stock_quantity.toString(),
                                  discount_percentage: medicine.discount_percentage.toString(),
                                  expiry_date: medicine.expiry_date || '',
                                  batch_number: medicine.batch_number || ''
                                });
                                setIsEditMedicineOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMedicine(medicine.vendor_medicine_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {vendorMedicines.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No medicines in inventory. Add medicines to start selling.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                        notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => {
                        // Handle prescription notifications
                        if (notification.type === 'prescription_upload' && (notification as any).metadata) {
                          const metadata = (notification as any).metadata;
                          setActiveNotification({
                            id: notification.id,
                            broadcast_id: metadata?.broadcast_id,
                            prescription_id: metadata?.prescription_id,
                            order_id: notification.order_id,
                            patient_latitude: metadata?.patient_latitude,
                            patient_longitude: metadata?.patient_longitude,
                            distance_km: metadata?.distance_km,
                            timeout_at: metadata?.timeout_at,
                            prescription_url: metadata?.prescription_url
                          });
                        }
                        
                        // Mark as read
                        if (!notification.is_read) {
                          markNotificationAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              notification.priority === 'high' ? 'destructive' :
                              notification.priority === 'medium' ? 'default' : 'secondary'
                            }
                          >
                            {notification.priority}
                          </Badge>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                      {notification.type === 'prescription_upload' && (
                        <Badge variant="outline" className="mt-2">
                          Click to view prescription
                        </Badge>
                      )}
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Medicine Dialog */}
        <Dialog open={isEditMedicineOpen} onOpenChange={setIsEditMedicineOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Medicine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-selling-price">Selling Price (₹) *</Label>
                  <Input
                    id="edit-selling-price"
                    type="number"
                    step="0.01"
                    value={newMedicine.selling_price}
                    onChange={(e) => setNewMedicine({...newMedicine, selling_price: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock-quantity">Stock Quantity *</Label>
                  <Input
                    id="edit-stock-quantity"
                    type="number"
                    value={newMedicine.stock_quantity}
                    onChange={(e) => setNewMedicine({...newMedicine, stock_quantity: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-discount">Discount (%)</Label>
                  <Input
                    id="edit-discount"
                    type="number"
                    step="0.01"
                    value={newMedicine.discount_percentage}
                    onChange={(e) => setNewMedicine({...newMedicine, discount_percentage: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-expiry-date">Expiry Date</Label>
                  <Input
                    id="edit-expiry-date"
                    type="date"
                    value={newMedicine.expiry_date}
                    onChange={(e) => setNewMedicine({...newMedicine, expiry_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-batch-number">Batch Number</Label>
                <Input
                  id="edit-batch-number"
                  value={newMedicine.batch_number}
                  onChange={(e) => setNewMedicine({...newMedicine, batch_number: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditMedicine} className="flex-1">
                  Update Medicine
                </Button>
                <Button variant="outline" onClick={() => setIsEditMedicineOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Real-time Prescription Notification Modal */}
        {activeNotification && vendorInfo && (
          <PrescriptionNotificationModal
            notification={activeNotification}
            vendorId={vendorInfo.id}
            onClose={() => {
              setActiveNotification(null);
              loadVendorData(); // Refresh orders and notifications
            }}
          />
        )}
      </div>
    </div>
  );
}