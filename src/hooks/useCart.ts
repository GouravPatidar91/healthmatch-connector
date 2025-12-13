import { useState, useEffect } from 'react';
import { Medicine } from '@/services/medicineService';
import { useToast } from '@/hooks/use-toast';

export interface CartItem extends Medicine {
  quantity: number;
  selling_price: number;
  discount_percentage: number;
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

  const addToCart = (medicine: Medicine, quantity: number = 1) => {
    if (medicine.prescription_required) {
      toast({
        title: "Prescription Required",
        description: "This medicine requires a prescription. Please upload your prescription after placing the order.",
        variant: "default",
      });
    }

    const existingItem = cartItems.find(item => item.id === medicine.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      setCartItems(items =>
        items.map(item =>
          item.id === medicine.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      // Add with MRP as selling price (0% discount for catalog medicines)
      const cartItem: CartItem = {
        ...medicine,
        quantity,
        selling_price: medicine.mrp,
        discount_percentage: 0
      };
      setCartItems(items => [...items, cartItem]);
    }

    toast({
      title: "Added to Cart",
      description: `${medicine.name} has been added to your cart.`,
    });
  };

  const updateQuantity = (medicineId: string, change: number) => {
    setCartItems(items =>
      items.map(item => {
        if (item.id === medicineId) {
          const newQuantity = item.quantity + change;
          
          if (newQuantity <= 0) {
            return null; // Will be filtered out
          }
          
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item !== null) as CartItem[]
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCartItems(items => items.filter(item => item.id !== medicineId));
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

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    getTotalDiscount
  };
}
