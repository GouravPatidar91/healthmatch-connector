import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import type { EarningsSummary } from "@/services/walletService";

interface EarningsOverviewProps {
  earnings: EarningsSummary;
  loading?: boolean;
}

export const EarningsOverview = ({ earnings, loading }: EarningsOverviewProps) => {
  const stats = [
    {
      label: "Today's Earnings",
      value: earnings.today,
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      label: "This Week",
      value: earnings.thisWeek,
      icon: Calendar,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "This Month",
      value: earnings.thisMonth,
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.label}
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                ₹{stat.value.toFixed(2)}
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
