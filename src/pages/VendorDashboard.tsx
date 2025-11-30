import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, Package, ShoppingCart, Eye, CheckCircle, XCircle, Clock, Plus, Edit, Trash2, Search,
  LayoutDashboard, Store, LogOut, FileText, AlertCircle, CheckCircle2, X, User, ChevronDown, ChevronUp, Wallet as WalletIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { medicineService, Medicine, VendorMedicine, CustomMedicine } from '@/services/medicineService';
import { PrescriptionNotificationModal } from '@/components/pharmacy/PrescriptionNotificationModal';
import { walletService, type Wallet, type WalletTransaction, type EarningsSummary, type DailyEarnings } from '@/services/walletService';
import { WalletCard } from '@/components/wallet/WalletCard';
import { EarningsOverview } from '@/components/wallet/EarningsOverview';
import { EarningsChart } from '@/components/wallet/EarningsChart';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';

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
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState('orders');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary>({ today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 });
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarnings[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  
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

  // Real-time subscription for orders
  useEffect(() => {
    if (!vendorInfo) return;

    const channel = supabase
      .channel('vendor-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicine_orders',
          filter: `vendor_id=eq.${vendorInfo.id}`
        },
        (payload) => {
          console.log('Order update:', payload);
          loadVendorData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorInfo]);

  // Auto-refresh notifications every 10 seconds
  useEffect(() => {
    if (!vendorInfo) return;

    const refreshInterval = setInterval(async () => {
      try {
        const { data: notificationData, error: notifError } = await supabase
          .from('vendor_notifications')
          .select('*')
          .eq('vendor_id', vendorInfo.id)
          .order('created_at', { ascending: false });

        if (!notifError && notificationData) {
          setNotifications(notificationData);
        }
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(refreshInterval);
  }, [vendorInfo]);

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

  // Load wallet data
  useEffect(() => {
    const loadWalletData = async () => {
      if (!user?.id || !vendorInfo) return;

      setWalletLoading(true);
      const walletData = await walletService.getWallet(user.id, 'vendor');
      
      if (walletData) {
        setWallet(walletData);
        
        // Load earnings summary
        const earningsData = await walletService.getEarningsSummary(walletData.id);
        setEarnings(earningsData);
        
        // Load daily earnings
        const dailyData = await walletService.getDailyEarnings(walletData.id, 7);
        setDailyEarnings(dailyData);
        
        // Load transactions
        const transactionsData = await walletService.getTransactions(walletData.id, { limit: 20 });
        setTransactions(transactionsData);

        // Subscribe to wallet updates
        const unsubscribeWallet = walletService.subscribeToWalletUpdates(walletData.id, (updatedWallet) => {
          setWallet(updatedWallet);
        });

        // Subscribe to transaction updates
        const unsubscribeTransactions = walletService.subscribeToTransactionUpdates(walletData.id, async () => {
          const earningsData = await walletService.getEarningsSummary(walletData.id);
          setEarnings(earningsData);
          
          const dailyData = await walletService.getDailyEarnings(walletData.id, 7);
          setDailyEarnings(dailyData);
          
          const transactionsData = await walletService.getTransactions(walletData.id, { limit: 20 });
          setTransactions(transactionsData);
        });

        return () => {
          unsubscribeWallet();
          unsubscribeTransactions();
        };
      }
      
      setWalletLoading(false);
    };

    loadWalletData();
  }, [user, vendorInfo]);

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

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Logged out successfully.",
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to logout.",
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
  const pendingOrders = orders.filter(o => o.order_status === 'pending').length;
  const completedOrders = orders.filter(o => o.order_status === 'delivered').length;

  const stats = [
    { label: 'Total Orders', value: orders.length.toString(), icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending', value: pendingOrders.toString(), icon: Clock, color: 'bg-orange-50 text-orange-500' },
    { label: 'Alerts', value: unreadNotifications.toString(), icon: Bell, color: 'bg-red-50 text-red-500' },
    { label: 'Completed', value: completedOrders.toString(), icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-64 bg-card border-r border-border fixed h-full z-20 flex flex-col"
      >
        <div className="p-6 flex items-center gap-2 border-b border-border">
          <div className="bg-primary p-1.5 rounded-lg">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Curezy <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-1">Vendor</span>
          </span>
        </div>
        
        <div className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'orders' 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <ShoppingCart size={20} />
            <span className="text-sm">Orders</span>
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'inventory' 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Package size={20} />
            <span className="text-sm">Inventory</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all relative ${
              activeTab === 'notifications' 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Bell size={20} />
            <span className="text-sm">Notifications</span>
            {unreadNotifications > 0 && (
              <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('earnings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'earnings' 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <WalletIcon size={20} />
            <span className="text-sm">Earnings</span>
          </button>
        </div>
        
        <div className="p-4 border-t border-border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 max-w-7xl mx-auto w-full">
        {/* Top Bar */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wide">Store Open</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 bg-card px-3 py-1.5 rounded-full border border-border shadow-sm cursor-pointer hover:bg-muted/50 transition-all">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {vendorInfo.pharmacy_name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium pr-2">{vendorInfo.pharmacy_name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card">
                <DropdownMenuItem className="gap-2">
                  <User size={16} />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 focus:text-red-600">
                  <LogOut size={16} />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.header>

        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Welcome back, {vendorInfo.pharmacy_name}!</h1>
          <p className="text-muted-foreground mt-1">Manage your pharmacy inventory and orders</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs Content */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden min-h-[500px] flex flex-col"
        >
          <div className="flex border-b border-border">
            {[
              { id: 'orders', label: 'Orders' },
              { id: 'inventory', label: 'Inventory' },
              { id: 'notifications', label: 'Notifications' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-sm font-bold relative transition-colors ${
                  activeTab === tab.id 
                    ? 'text-primary bg-primary/5' 
                    : 'text-muted-foreground hover:bg-muted/30'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
          
          <div className="p-8 flex-1 bg-muted/20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <div className="text-center py-16">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No orders yet</h3>
                        <p className="text-muted-foreground">Orders will appear here once customers place them.</p>
                      </div>
                    ) : (
                      orders.map((order, i) => {
                        const isExpanded = expandedOrders.has(order.id);
                        return (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => navigate(`/vendor/order/${order.id}`)}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-bold">{order.order_number}</h3>
                                  {order.prescription_required && (
                                    <Badge variant="secondary" className="text-xs">
                                      Rx Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(order.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                                <p className="text-xl font-bold">₹{order.final_amount}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-end justify-between">
                              <div className="flex-1">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Customer</p>
                                <p className="text-sm font-medium">{order.customer_phone}</p>
                                {order.prescription_url && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(order.prescription_url, '_blank');
                                    }}
                                    className="mt-3 text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                  >
                                    <FileText size={12} /> View Prescription
                                  </button>
                                )}
                              </div>
                              <div>
                                <Badge 
                                  variant={
                                    order.order_status === 'delivered' ? 'default' :
                                    order.order_status === 'pending' ? 'secondary' : 
                                    'outline'
                                  }
                                  className="flex items-center gap-1.5"
                                >
                                  {order.order_status === 'delivered' && <CheckCircle2 size={14} />}
                                  {order.order_status === 'pending' && <Clock size={14} />}
                                  {order.order_status}
                                </Badge>
                              </div>
                            </div>

                            {order.items && order.items.length > 0 && (
                              <div 
                                className="mt-4 pt-4 border-t border-border/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedOrders(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(order.id)) {
                                      newSet.delete(order.id);
                                    } else {
                                      newSet.add(order.id);
                                    }
                                    return newSet;
                                  });
                                }}
                              >
                                <div className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Order Items ({order.items.length})
                                  </p>
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                                
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="space-y-2 mt-3 overflow-hidden"
                                    >
                                      {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded-lg">
                                          <div>
                                            <p className="font-medium">{item.medicine_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              ₹{item.unit_price} × {item.quantity}
                                            </p>
                                          </div>
                                          <p className="font-bold">₹{item.total_price}</p>
                                        </div>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                )}
                
                {activeTab === 'inventory' && (
                  <div>
                    {vendorMedicines.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                          <Package className="text-primary/30" size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Medicine Inventory</h3>
                        <p className="text-muted-foreground mb-8 max-w-sm">
                          Your inventory is currently empty. Add medicines from the master catalog or create custom entries.
                        </p>
                        <Button 
                          onClick={() => setIsAddMedicineOpen(true)}
                          className="shadow-lg flex items-center gap-2"
                        >
                          <Plus size={18} /> Add Medicine
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold">Your Inventory ({vendorMedicines.length} items)</h3>
                          <Button onClick={() => setIsAddMedicineOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" /> Add Medicine
                          </Button>
                        </div>
                        <div className="grid gap-4">
                          {vendorMedicines.map(medicine => (
                            <motion.div
                              key={medicine.vendor_medicine_id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                            >
                              <div>
                                <h4 className="font-bold">{medicine.name}</h4>
                                <p className="text-sm text-muted-foreground">{medicine.brand}</p>
                                <div className="flex gap-4 mt-2 text-xs">
                                  <span className="text-muted-foreground">Stock: <span className="font-bold text-foreground">{medicine.stock_quantity}</span></span>
                                  <span className="text-muted-foreground">Price: <span className="font-bold text-foreground">₹{medicine.selling_price}</span></span>
                                </div>
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
                                      discount_percentage: (medicine.discount_percentage || 0).toString(),
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
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-16">
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No notifications</h3>
                        <p className="text-muted-foreground">Notifications will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => {
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
                            if (!notification.is_read) {
                              markNotificationAsRead(notification.id);
                            }
                          }}
                          className={`p-4 border rounded-xl cursor-pointer hover:shadow-md transition-all ${
                            notification.is_read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-1">
                              <Clock size={16} className="text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold">{notification.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                                  {notification.priority}
                                </Badge>
                                {!notification.is_read && (
                                  <span className="text-[10px] font-bold text-primary">NEW</span>
                                )}
                              </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(notification.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'earnings' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1">
                        <WalletCard
                          balance={wallet?.balance || 0}
                          totalEarned={wallet?.total_earned || 0}
                          loading={walletLoading}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <EarningsOverview earnings={earnings} loading={walletLoading} />
                      </div>
                    </div>

                    <EarningsChart
                      data={dailyEarnings}
                      ownerType="vendor"
                      loading={walletLoading}
                    />

                    <TransactionHistory transactions={transactions} loading={walletLoading} />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Add Medicine Dialog */}
      <AnimatePresence>
        {isAddMedicineOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddMedicineOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-2xl z-10 p-6 border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add Medicine</h3>
                <button onClick={() => setIsAddMedicineOpen(false)}>
                  <X size={20} className="text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    placeholder="Search medicines..."
                    value={medicineSearch}
                    onChange={(e) => setMedicineSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={newMedicine.medicine_id}
                  onValueChange={(value) => setNewMedicine({...newMedicine, medicine_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medicine" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMedicines.slice(0, 10).map(medicine => (
                      <SelectItem key={medicine.id} value={medicine.id}>
                        {medicine.name} - {medicine.brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider">Selling Price (₹)</Label>
                    <Input
                      type="number"
                      value={newMedicine.selling_price}
                      onChange={(e) => setNewMedicine({...newMedicine, selling_price: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider">Stock Qty</Label>
                    <Input
                      type="number"
                      value={newMedicine.stock_quantity}
                      onChange={(e) => setNewMedicine({...newMedicine, stock_quantity: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Expiry Date</Label>
                  <Input
                    type="date"
                    value={newMedicine.expiry_date}
                    onChange={(e) => setNewMedicine({...newMedicine, expiry_date: e.target.value})}
                    className="mt-1.5"
                  />
                </div>
                <Button
                  onClick={handleAddMedicine}
                  className="w-full shadow-lg mt-2"
                >
                  Add to Inventory
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Medicine Dialog */}
      <AnimatePresence>
        {isEditMedicineOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditMedicineOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-2xl z-10 p-6 border border-border"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Edit Medicine</h3>
                <button onClick={() => setIsEditMedicineOpen(false)}>
                  <X size={20} className="text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider">Selling Price (₹)</Label>
                    <Input
                      type="number"
                      value={newMedicine.selling_price}
                      onChange={(e) => setNewMedicine({...newMedicine, selling_price: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-wider">Stock Qty</Label>
                    <Input
                      type="number"
                      value={newMedicine.stock_quantity}
                      onChange={(e) => setNewMedicine({...newMedicine, stock_quantity: e.target.value})}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider">Expiry Date</Label>
                  <Input
                    type="date"
                    value={newMedicine.expiry_date}
                    onChange={(e) => setNewMedicine({...newMedicine, expiry_date: e.target.value})}
                    className="mt-1.5"
                  />
                </div>
                <Button
                  onClick={handleEditMedicine}
                  className="w-full shadow-lg mt-2"
                >
                  Update Medicine
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Prescription Notification Modal */}
      {activeNotification && vendorInfo && (
        <PrescriptionNotificationModal
          notification={activeNotification}
          vendorId={vendorInfo.id}
          onClose={() => {
            setActiveNotification(null);
            loadVendorData();
          }}
        />
      )}
    </div>
  );
}