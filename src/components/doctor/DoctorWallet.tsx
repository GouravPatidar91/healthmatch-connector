import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doctorWalletService } from '@/services/doctorWalletService';
import { walletService } from '@/services/walletService';
import { WalletCard } from '@/components/wallet/WalletCard';
import { EarningsOverview } from '@/components/wallet/EarningsOverview';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import type { Wallet, WalletTransaction, EarningsSummary } from '@/services/walletService';

const DoctorWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary>({ today: 0, thisWeek: 0, thisMonth: 0, allTime: 0 });
  const [loading, setLoading] = useState(true);

  const loadWalletData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const walletData = await doctorWalletService.getOrCreateDoctorWallet(user.id);
      setWallet(walletData);

      if (walletData) {
        const [txns, earningsSummary] = await Promise.all([
          doctorWalletService.getTransactions(walletData.id, 50),
          doctorWalletService.getEarningsSummary(walletData.id),
        ]);
        setTransactions(txns);
        setEarnings(earningsSummary);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, [user]);

  // Subscribe to real-time wallet updates
  useEffect(() => {
    if (!wallet) return;
    const unsubWallet = walletService.subscribeToWalletUpdates(wallet.id, (updated) => setWallet(updated));
    const unsubTxns = walletService.subscribeToTransactionUpdates(wallet.id, () => loadWalletData());
    return () => { unsubWallet(); unsubTxns(); };
  }, [wallet?.id]);

  return (
    <div className="space-y-6">
      <WalletCard
        balance={wallet?.balance || 0}
        totalEarned={wallet?.total_earned || 0}
        loading={loading}
      />
      <EarningsOverview earnings={earnings} loading={loading} />
      <TransactionHistory transactions={transactions} loading={loading} />
    </div>
  );
};

export default DoctorWallet;
