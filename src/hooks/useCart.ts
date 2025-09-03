import { useState, useEffect } from 'react';
import { VendorMedicine } from '@/services/medicineService';
import { useToast } from '@/hooks/use-toast';

export interface CartItem extends VendorMedicine {
  quantity: number;
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('medicine-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('medicine-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (medicine: VendorMedicine, quantity: number = 1) => {
    if (!medicine.vendor_medicine_id) {
      toast({
        title: "Error",
        description: "This medicine is not available from any nearby vendor.",
        variant: "destructive",
      });
      return;
    }

    if (medicine.prescription_required) {
      toast({
        title: "Prescription Required",
        description: "This medicine requires a prescription. Please upload your prescription after placing the order.",
        variant: "default",
      });
    }

    const existingItem = cartItems.find(item => item.vendor_medicine_id === medicine.vendor_medicine_id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > medicine.stock_quantity) {
        toast({
          title: "Stock Limit Exceeded",
          description: `Only ${medicine.stock_quantity} units available in stock.`,
          variant: "destructive",
        });
        return;
      }

      setCartItems(items =>
        items.map(item =>
          item.vendor_medicine_id === medicine.vendor_medicine_id
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      if (quantity > medicine.stock_quantity) {
        toast({
          title: "Stock Limit Exceeded",
          description: `Only ${medicine.stock_quantity} units available in stock.`,
          variant: "destructive",
        });
        return;
      }

      setCartItems(items => [...items, { ...medicine, quantity }]);
    }

    toast({
      title: "Added to Cart",
      description: `${medicine.name} has been added to your cart.`,
    });
  };

  const updateQuantity = (vendorMedicineId: string, change: number) => {
    setCartItems(items =>
      items.map(item => {
        if (item.vendor_medicine_id === vendorMedicineId) {
          const newQuantity = item.quantity + change;
          
          if (newQuantity <= 0) {
            return null; // Will be filtered out
          }
          
          if (newQuantity > item.stock_quantity) {
            toast({
              title: "Stock Limit Exceeded",
              description: `Only ${item.stock_quantity} units available in stock.`,
              variant: "destructive",
            });
            return item;
          }
          
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item !== null) as CartItem[]
    );
  };

  const removeFromCart = (vendorMedicineId: string) => {
    setCartItems(items => items.filter(item => item.vendor_medicine_id !== vendorMedicineId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const discountedPrice = item.selling_price * (1 - item.discount_percentage / 100);
      return total + (discountedPrice * item.quantity);
    }, 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
  };

  const getTotalDiscount = () => {
    return cartItems.reduce((total, item) => {
      const discountAmount = item.selling_price * (item.discount_percentage / 100) * item.quantity;
      return total + discountAmount;
    }, 0);
  };

  // Group cart items by vendor for checkout
  const getCartByVendor = () => {
    const vendorGroups: { [vendorId: string]: CartItem[] } = {};
    
    cartItems.forEach(item => {
      if (!vendorGroups[item.vendor_id]) {
        vendorGroups[item.vendor_id] = [];
      }
      vendorGroups[item.vendor_id].push(item);
    });

    return vendorGroups;
  };

  const hasMultipleVendors = () => {
    const vendors = new Set(cartItems.map(item => item.vendor_id));
    return vendors.size > 1;
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    getTotalDiscount,
    getCartByVendor,
    hasMultipleVendors
  };
}