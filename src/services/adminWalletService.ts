import { supabase } from "@/integrations/supabase/client";
import type { Wallet, WalletTransaction } from "./walletService";

export interface WithdrawalRequest {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  bank_details: any;
  requested_at: string;
  processed_at: string | null;
  processed_by: string | null;
  admin_notes: string | null;
  created_at: string;
}

export interface AdminWalletStats {
  totalWallets: number;
  totalBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
}

class AdminWalletService {
  async getAdminStats(): Promise<AdminWalletStats> {
    try {
      // Get wallet stats
      const { data: wallets } = await supabase
        .from('wallets')
        .select('balance, total_earned, total_withdrawn');

      const totalWallets = wallets?.length || 0;
      const totalBalance = wallets?.reduce((sum, w) => sum + Number(w.balance), 0) || 0;
      const totalEarnings = wallets?.reduce((sum, w) => sum + Number(w.total_earned), 0) || 0;
      const totalWithdrawals = wallets?.reduce((sum, w) => sum + Number(w.total_withdrawn), 0) || 0;

      // Get pending withdrawal stats
      const { data: pendingRequests } = await supabase
        .from('withdrawal_requests')
        .select('amount')
        .eq('status', 'pending');

      const pendingWithdrawals = pendingRequests?.length || 0;
      const pendingWithdrawalAmount = pendingRequests?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      return {
        totalWallets,
        totalBalance,
        totalEarnings,
        totalWithdrawals,
        pendingWithdrawals,
        pendingWithdrawalAmount,
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalWallets: 0,
        totalBalance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
        pendingWithdrawals: 0,
        pendingWithdrawalAmount: 0,
      };
    }
  }

  async getAllWallets(filters?: { ownerType?: string }): Promise<Wallet[]> {
    try {
      let query = supabase.from('wallets').select('*').order('created_at', { ascending: false });

      if (filters?.ownerType) {
        query = query.eq('owner_type', filters.ownerType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Wallet[];
    } catch (error) {
      console.error('Error fetching all wallets:', error);
      return [];
    }
  }

  async getAllTransactions(filters?: {
    startDate?: string;
    endDate?: string;
    transactionType?: string;
    limit?: number;
  }): Promise<WalletTransaction[]> {
    try {
      let query = supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.transactionType) {
        query = query.eq('transaction_type', filters.transactionType);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as WalletTransaction[];
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      return [];
    }
  }

  async getWithdrawalRequests(status?: string): Promise<WithdrawalRequest[]> {
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as WithdrawalRequest[];
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }
  }

  async processWithdrawal(requestId: string, approved: boolean, adminNotes: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('process_withdrawal', {
        _request_id: requestId,
        _approved: approved,
        _admin_notes: adminNotes,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw error;
    }
  }
}

export const adminWalletService = new AdminWalletService();
