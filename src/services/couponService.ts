import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  usage_count: number;
  is_active: boolean;
}

export interface CouponValidation {
  isValid: boolean;
  discountAmount: number;
  message?: string;
}

class CouponService {
  async validateCoupon(code: string, orderAmount: number): Promise<CouponValidation> {
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !coupon) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Invalid coupon code'
        };
      }

      // Check expiry
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = new Date(coupon.valid_until);

      if (now < validFrom) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Coupon not yet valid'
        };
      }

      if (now > validUntil) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Coupon has expired'
        };
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Coupon usage limit reached'
        };
      }

      // Check minimum order amount
      if (orderAmount < coupon.min_order_amount) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `Minimum order amount ₹${coupon.min_order_amount} required`
        };
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (orderAmount * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        discountAmount = coupon.discount_value;
      }

      return {
        isValid: true,
        discountAmount: Math.round(discountAmount * 100) / 100,
        message: `Discount of ₹${discountAmount} applied`
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Error validating coupon'
      };
    }
  }

  async applyCoupon(orderId: string, code: string): Promise<{ success: boolean; error?: string; discountAmount?: number }> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('medicine_orders')
        .select('total_amount, handling_charges, delivery_fee, tip_amount')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return { success: false, error: 'Order not found' };
      }

      // Validate coupon
      const validation = await this.validateCoupon(code, order.total_amount);

      if (!validation.isValid) {
        return { success: false, error: validation.message };
      }

      // Calculate new final amount
      const finalAmount = 
        order.total_amount + 
        (order.handling_charges || 0) + 
        (order.delivery_fee || 0) + 
        (order.tip_amount || 0) - 
        validation.discountAmount;

      // Update order with coupon
      const { error: updateError } = await supabase
        .from('medicine_orders')
        .update({
          coupon_code: code.toUpperCase(),
          coupon_discount: validation.discountAmount,
          discount_amount: validation.discountAmount,
          final_amount: finalAmount
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Increment coupon usage
      const { data: currentCoupon } = await supabase
        .from('coupons')
        .select('usage_count')
        .eq('code', code.toUpperCase())
        .single();

      if (currentCoupon) {
        await supabase
          .from('coupons')
          .update({ usage_count: currentCoupon.usage_count + 1 })
          .eq('code', code.toUpperCase());
      }

      return {
        success: true, 
        discountAmount: validation.discountAmount 
      };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, error: 'Failed to apply coupon' };
    }
  }

  async removeCoupon(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('medicine_orders')
        .select('total_amount, handling_charges, delivery_fee, tip_amount, coupon_discount')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        return { success: false, error: 'Order not found' };
      }

      const finalAmount = 
        order.total_amount + 
        (order.handling_charges || 0) + 
        (order.delivery_fee || 0) + 
        (order.tip_amount || 0);

      const { error } = await supabase
        .from('medicine_orders')
        .update({
          coupon_code: null,
          coupon_discount: 0,
          discount_amount: 0,
          final_amount: finalAmount
        })
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing coupon:', error);
      return { success: false, error: 'Failed to remove coupon' };
    }
  }
}

export const couponService = new CouponService();
