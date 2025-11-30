import { supabase } from "@/integrations/supabase/client";

export interface Wallet {
  id: string;
  user_id: string;
  owner_type: 'delivery_partner' | 'vendor';
  owner_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  order_id: string | null;
  transaction_type: 'credit' | 'debit' | 'withdrawal' | 'refund';
  amount: number;
  description: string | null;
  balance_after: number;
  category: string | null;
  created_at: string;
}

export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
}

export interface DailyEarnings {
  date: string;
  amount: number;
  deliveryFees?: number;
  tips?: number;
  medicineSales?: number;
}

class WalletService {
  async getWallet(userId: string, ownerType: 'delivery_partner' | 'vendor'): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('owner_type', ownerType)
        .single();

      if (error) throw error;
      return data as Wallet;
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }
  }

  async getTransactions(
    walletId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      category?: string;
      limit?: number;
    }
  ): Promise<WalletTransaction[]> {
    try {
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as WalletTransaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async getEarningsSummary(walletId: string): Promise<EarningsSummary> {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Get today's earnings
      const { data: todayData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'credit')
        .gte('created_at', todayStart);

      const today = todayData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get this week's earnings
      const { data: weekData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'credit')
        .gte('created_at', weekStart);

      const thisWeek = weekData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get this month's earnings
      const { data: monthData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'credit')
        .gte('created_at', monthStart);

      const thisMonth = monthData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Get all time earnings
      const { data: allTimeData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'credit');

      const allTime = allTimeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return { today, thisWeek, thisMonth, allTime };
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      return { today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 };
    }
  }

  async getDailyEarnings(walletId: string, days: number = 7): Promise<DailyEarnings[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('transaction_type', 'credit')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and category
      const dailyMap = new Map<string, DailyEarnings>();

      data?.forEach((transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            amount: 0,
            deliveryFees: 0,
            tips: 0,
            medicineSales: 0,
          });
        }

        const daily = dailyMap.get(date)!;
        const amount = Number(transaction.amount);
        daily.amount += amount;

        if (transaction.category === 'delivery_fee') {
          daily.deliveryFees = (daily.deliveryFees || 0) + amount;
        } else if (transaction.category === 'tip') {
          daily.tips = (daily.tips || 0) + amount;
        } else if (transaction.category === 'medicine_sale') {
          daily.medicineSales = (daily.medicineSales || 0) + amount;
        }
      });

      return Array.from(dailyMap.values());
    } catch (error) {
      console.error('Error fetching daily earnings:', error);
      return [];
    }
  }

  subscribeToWalletUpdates(walletId: string, callback: (wallet: Wallet) => void) {
    const channel = supabase
      .channel(`wallet-${walletId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `id=eq.${walletId}`,
        },
        (payload) => {
          callback(payload.new as Wallet);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToTransactionUpdates(walletId: string, callback: () => void) {
    const channel = supabase
      .channel(`transactions-${walletId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `wallet_id=eq.${walletId}`,
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const walletService = new WalletService();
