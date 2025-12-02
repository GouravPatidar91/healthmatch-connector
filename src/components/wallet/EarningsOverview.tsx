import { Card } from "@/components/ui/card";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import type { EarningsSummary } from "@/services/walletService";
import { motion } from "framer-motion";

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
      gradient: "from-green-500/10 to-green-500/5",
      iconColor: "text-green-500",
      borderColor: "border-green-500/20",
    },
    {
      label: "This Week",
      value: earnings.thisWeek,
      icon: Calendar,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-500",
      borderColor: "border-blue-500/20",
    },
    {
      label: "This Month",
      value: earnings.thisMonth,
      icon: TrendingUp,
      gradient: "from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-500",
      borderColor: "border-purple-500/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-3" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`p-6 bg-gradient-to-br ${stat.gradient} border ${stat.borderColor} hover:shadow-lg transition-all group cursor-pointer`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-bold text-foreground group-hover:scale-105 transition-transform">
                  ₹{stat.value.toFixed(2)}
                </h3>
              </div>
              <div className={`p-3 rounded-xl bg-background/50 border ${stat.borderColor} group-hover:scale-110 transition-transform`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
