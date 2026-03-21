import { supabase } from "@/integrations/supabase/client";
import { walletService, Wallet, WalletTransaction, EarningsSummary, DailyEarnings } from "./walletService";

class DoctorWalletService {
  async getDoctorWallet(userId: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('owner_type', 'doctor')
        .maybeSingle();

      if (error) throw error;
      return data as Wallet | null;
    } catch (error) {
      console.error('Error fetching doctor wallet:', error);
      return null;
    }
  }

  async getOrCreateDoctorWallet(userId: string): Promise<Wallet | null> {
    try {
      // Try to get existing wallet
      let wallet = await this.getDoctorWallet(userId);
      if (wallet) return wallet;

      // Create wallet via RPC
      const { data: walletId, error } = await supabase.rpc('get_or_create_wallet', {
        _user_id: userId,
        _owner_type: 'doctor',
        _owner_id: userId,
      });

      if (error) throw error;

      // Fetch the created wallet
      const { data, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (fetchError) throw fetchError;
      return data as Wallet;
    } catch (error) {
      console.error('Error creating doctor wallet:', error);
      return null;
    }
  }

  async getTransactions(walletId: string, limit = 20): Promise<WalletTransaction[]> {
    return walletService.getTransactions(walletId, { limit });
  }

  async getEarningsSummary(walletId: string): Promise<EarningsSummary> {
    return walletService.getEarningsSummary(walletId);
  }

  async getDailyEarnings(walletId: string, days = 7): Promise<DailyEarnings[]> {
    return walletService.getDailyEarnings(walletId, days);
  }

  async getConsultationFee(doctorId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('consultation_fee')
        .eq('id', doctorId)
        .single();

      if (error) throw error;
      return data?.consultation_fee || 0;
    } catch (error) {
      console.error('Error fetching consultation fee:', error);
      return 0;
    }
  }

  async updateConsultationFee(doctorId: string, fee: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ consultation_fee: fee })
        .eq('id', doctorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating consultation fee:', error);
      return false;
    }
  }

  async collectCashPayment(appointmentId: string, doctorId: string, amount: number, patientName?: string): Promise<boolean> {
    try {
      // Fetch patient name from appointment if not provided
      let displayName = patientName || 'Patient';
      if (!patientName) {
        const { data: appt } = await supabase
          .from('appointments')
          .select('user_id')
          .eq('id', appointmentId)
          .single();
        if (appt?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', appt.user_id)
            .single();
          if (profile) {
            displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Patient';
          }
        }
      }

      // Update appointment payment status
      const { error: apptError } = await supabase
        .from('appointments')
        .update({ payment_status: 'collected_cash' })
        .eq('id', appointmentId);

      if (apptError) throw apptError;

      // Credit doctor wallet
      const { data: walletId } = await supabase.rpc('get_or_create_wallet', {
        _user_id: doctorId,
        _owner_type: 'doctor',
        _owner_id: doctorId,
      });

      if (walletId) {
        await supabase.rpc('credit_wallet', {
          _wallet_id: walletId,
          _order_id: null,
          _amount: amount,
          _description: `Cash collection - ${displayName}`,
          _category: 'consultation_fee',
        });
      }

      return true;
    } catch (error) {
      console.error('Error collecting cash payment:', error);
      return false;
    }
  }
}

export const doctorWalletService = new DoctorWalletService();
