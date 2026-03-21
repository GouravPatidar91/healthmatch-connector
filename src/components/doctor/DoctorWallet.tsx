import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doctorWalletService } from '@/services/doctorWalletService';
import { WalletCard } from '@/components/wallet/WalletCard';
import { EarningsOverview } from '@/components/wallet/EarningsOverview';
import { EarningsChart } from '@/components/wallet/EarningsChart';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import type { Wallet, WalletTransaction, EarningsSummary, DailyEarnings } from '@/services/walletService';

const DoctorWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary>({ today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 });
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarnings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadWalletData = async () => {
      setLoading(true);
      try {
        const walletData = await doctorWalletService.getOrCreateDoctorWallet(user.id);
        setWallet(walletData);

        if (walletData) {
          const [txns, earningsSummary, daily] = await Promise.all([
            doctorWalletService.getTransactions(walletData.id),
            doctorWalletService.getEarningsSummary(walletData.id),
            doctorWalletService.getDailyEarnings(walletData.id),
          ]);
          setTransactions(txns);
          setEarnings(earningsSummary);
          setDailyEarnings(daily);
        }
      } catch (error) {
        console.error('Error loading wallet data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, [user]);

  return (
    <div className="space-y-6">
      <WalletCard
        balance={wallet?.balance || 0}
        totalEarned={wallet?.total_earned || 0}
        loading={loading}
      />
      <EarningsOverview earnings={earnings} loading={loading} />
      <EarningsChart data={dailyEarnings} ownerType="doctor" loading={loading} />
      <TransactionHistory transactions={transactions} loading={loading} />
    </div>
  );
};

export default DoctorWallet;
