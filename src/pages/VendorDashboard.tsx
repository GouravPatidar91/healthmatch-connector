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
import { medicineService, Medicine, VendorMedicine } from '@/services/medicineService';

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
  
  // Form state for adding medicines
  const [newMedicine, setNewMedicine] = useState({
    medicine_id: '',
    selling_price: '',
    stock_quantity: '',
    discount_percentage: '0',
    expiry_date: '',
    batch_number: ''
  });

  useEffect(() => {
    if (user) {
      loadVendorData();
    }
  }, [user]);

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
          medicine_order_items (
            quantity,
            unit_price,
            total_price,
            medicines (name)
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (orderError) throw orderError;

      const formattedOrders = orderData?.map(order => ({
        ...order,
        items: order.medicine_order_items?.map((item: any) => ({
          medicine_name: item.medicines?.name || 'Unknown Medicine',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })) || []
      })) || [];

      setOrders(formattedOrders);

      // Get vendor medicines
      const vendorMeds = await medicineService.getVendorMedicines(vendor.id);
      setVendorMedicines(vendorMeds);

      // Get all medicines for adding new ones
      const allMeds = await medicineService.getAllMedicines();
      setAllMedicines(allMeds);
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
      const updates: any = { order_status: status };
      if (notes) updates.vendor_notes = notes;

      const { error } = await supabase
        .from('medicine_orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, order_status: status }
          : order
      ));

      toast({
        title: "Success",
        description: `Order status updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    }
  };

  const approvePrescription = async (orderId: string, approved: boolean) => {
    try {
      const status = approved ? 'approved' : 'rejected';
      const { error } = await supabase
        .from('medicine_orders')
        .update({ prescription_status: status })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, prescription_status: status }
          : order
      ));

      toast({
        title: "Success",
        description: `Prescription ${approved ? 'approved' : 'rejected'}.`,
      });
    } catch (error) {
      console.error('Error updating prescription status:', error);
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
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.map(notif =>
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAddMedicine = async () => {
    try {
      if (!vendorInfo?.id || !newMedicine.medicine_id || !newMedicine.selling_price || !newMedicine.stock_quantity) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const result = await medicineService.addVendorMedicine({
        vendor_id: vendorInfo.id,
        medicine_id: newMedicine.medicine_id,
        selling_price: parseFloat(newMedicine.selling_price),
        stock_quantity: parseInt(newMedicine.stock_quantity),
        discount_percentage: parseFloat(newMedicine.discount_percentage) || 0,
        expiry_date: newMedicine.expiry_date || undefined,
        batch_number: newMedicine.batch_number || undefined
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Medicine added to your inventory.",
        });
        setIsAddMedicineOpen(false);
        setNewMedicine({
          medicine_id: '',
          selling_price: '',
          stock_quantity: '',
          discount_percentage: '0',
          expiry_date: '',
          batch_number: ''
        });
        // Reload vendor medicines
        const vendorMeds = await medicineService.getVendorMedicines(vendorInfo.id);
        setVendorMedicines(vendorMeds);
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
    try {
      if (!editingMedicine?.vendor_medicine_id) return;

      const result = await medicineService.updateVendorMedicine(editingMedicine.vendor_medicine_id, {
        selling_price: editingMedicine.selling_price,
        stock_quantity: editingMedicine.stock_quantity,
        discount_percentage: editingMedicine.discount_percentage,
        is_available: editingMedicine.is_available,
        expiry_date: editingMedicine.expiry_date,
        batch_number: editingMedicine.batch_number
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Medicine updated successfully.",
        });
        setIsEditMedicineOpen(false);
        setEditingMedicine(null);
        // Reload vendor medicines
        const vendorMeds = await medicineService.getVendorMedicines(vendorInfo.id);
        setVendorMedicines(vendorMeds);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update medicine. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMedicine = async (vendorMedicineId: string, medicineName: string) => {
    if (!confirm(`Are you sure you want to remove ${medicineName} from your inventory?`)) {
      return;
    }

    try {
      const result = await medicineService.deleteVendorMedicine(vendorMedicineId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Medicine removed from inventory.",
        });
        // Reload vendor medicines
        const vendorMeds = await medicineService.getVendorMedicines(vendorInfo.id);
        setVendorMedicines(vendorMeds);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove medicine. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-blue-500';
      case 'confirmed': return 'bg-green-500';
      case 'packed': return 'bg-purple-500';
      case 'picked_up': return 'bg-orange-500';
      case 'out_for_delivery': return 'bg-yellow-500';
      case 'delivered': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      case 'rejected': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredMedicines = allMedicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    medicine.brand.toLowerCase().includes(medicineSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Vendor Registration Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to register as a vendor to access this dashboard.
            </p>
            <Button onClick={() => window.location.href = '/vendor-registration'}>
              Register as Vendor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {vendorInfo.pharmacy_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.order_status === 'placed').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread Notifications</p>
                  <p className="text-2xl font-bold">
                    {notifications.filter(n => !n.is_read).length}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Orders</p>
                  <p className="text-2xl font-bold">
                    {orders.filter(o => o.order_status === 'delivered').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory ({vendorMedicines.length})</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications 
              {notifications.filter(n => !n.is_read).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notifications.filter(n => !n.is_read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Order #{order.order_number}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.order_status)}>
                        {order.order_status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {order.prescription_required && (
                        <Badge variant={order.prescription_status === 'approved' ? 'default' : 'destructive'}>
                          Prescription: {order.prescription_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Customer Details:</p>
                        <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                        <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                      </div>
                      <div>
                        <p className="font-medium">Order Amount:</p>
                        <p className="text-sm text-muted-foreground">
                          Total: ₹{order.total_amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Final: ₹{order.final_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium mb-2">Items:</p>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.medicine_name} x {item.quantity}</span>
                            <span>₹{item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.prescription_required && order.prescription_url && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(order.prescription_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Prescription
                        </Button>
                        {order.prescription_status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approvePrescription(order.id, true)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approvePrescription(order.id, false)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
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
                          onClick={() => updateOrderStatus(order.id, 'packed')}
                        >
                          Mark as Packed
                        </Button>
                      )}
                      {order.order_status === 'packed' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'picked_up')}
                        >
                          Hand Over to Delivery
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Medicine Inventory</h3>
              <Dialog open={isAddMedicineOpen} onOpenChange={setIsAddMedicineOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Medicine to Inventory</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="medicine-search">Search Medicine</Label>
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
                            <h4 className="font-semibold">{medicine.name}</h4>
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
                        {medicine.expiry_date && (
                          <p className="text-xs text-muted-foreground">Expires: {new Date(medicine.expiry_date).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMedicine(medicine);
                            setIsEditMedicineOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMedicine(medicine.vendor_medicine_id, medicine.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {vendorMedicines.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No medicines in inventory</h3>
                    <p className="text-muted-foreground mb-4">Start by adding medicines to your inventory</p>
                    <Button onClick={() => setIsAddMedicineOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Medicine
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Edit Medicine Dialog */}
          <Dialog open={isEditMedicineOpen} onOpenChange={setIsEditMedicineOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Medicine</DialogTitle>
              </DialogHeader>
              {editingMedicine && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">{editingMedicine.name}</h4>
                    <p className="text-sm text-muted-foreground">{editingMedicine.brand} - {editingMedicine.dosage}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-selling-price">Selling Price (₹)</Label>
                      <Input
                        id="edit-selling-price"
                        type="number"
                        step="0.01"
                        value={editingMedicine.selling_price}
                        onChange={(e) => setEditingMedicine({...editingMedicine, selling_price: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-stock-quantity">Stock Quantity</Label>
                      <Input
                        id="edit-stock-quantity"
                        type="number"
                        value={editingMedicine.stock_quantity}
                        onChange={(e) => setEditingMedicine({...editingMedicine, stock_quantity: parseInt(e.target.value)})}
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
                        value={editingMedicine.discount_percentage}
                        onChange={(e) => setEditingMedicine({...editingMedicine, discount_percentage: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-expiry-date">Expiry Date</Label>
                      <Input
                        id="edit-expiry-date"
                        type="date"
                        value={editingMedicine.expiry_date || ''}
                        onChange={(e) => setEditingMedicine({...editingMedicine, expiry_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-batch-number">Batch Number</Label>
                    <Input
                      id="edit-batch-number"
                      value={editingMedicine.batch_number || ''}
                      onChange={(e) => setEditingMedicine({...editingMedicine, batch_number: e.target.value})}
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
              )}
            </DialogContent>
          </Dialog>

          <TabsContent value="notifications" className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer ${!notification.is_read ? 'border-primary' : ''}`}
                onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.is_read && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                        <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}