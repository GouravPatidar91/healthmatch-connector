import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, DollarSign, Clock } from "lucide-react";
import type { AdminWalletStats as AdminStatsType } from "@/services/adminWalletService";

interface AdminWalletStatsProps {
  stats: AdminStatsType;
  loading?: boolean;
}

export const AdminWalletStats = ({ stats, loading }: AdminWalletStatsProps) => {
  const statCards = [
    {
      label: "Total Wallets",
      value: stats.totalWallets,
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      format: (v: number) => v.toString(),
    },
    {
      label: "Total Balance",
      value: stats.totalBalance,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
      format: (v: number) => `₹${v.toFixed(2)}`,
    },
    {
      label: "Total Earnings",
      value: stats.totalEarnings,
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      format: (v: number) => `₹${v.toFixed(2)}`,
    },
    {
      label: "Pending Withdrawals",
      value: stats.pendingWithdrawals,
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      format: (v: number) => `${v} (₹${stats.pendingWithdrawalAmount.toFixed(2)})`,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {stat.format(stat.value)}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
