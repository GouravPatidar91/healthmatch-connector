import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Package } from "lucide-react";
import type { WalletTransaction } from "@/services/walletService";
import { motion } from "framer-motion";

interface TransactionHistoryProps {
  transactions: WalletTransaction[];
  loading?: boolean;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "credit":
      return ArrowDownLeft;
    case "debit":
      return ArrowUpRight;
    case "withdrawal":
      return WalletIcon;
    default:
      return Package;
  }
};

const getCategoryBadge = (category: string | null) => {
  if (!category) return null;

  const variants: Record<string, { bg: string; text: string }> = {
    delivery_fee: { bg: "bg-blue-500/10", text: "text-blue-500" },
    tip: { bg: "bg-green-500/10", text: "text-green-500" },
    commission: { bg: "bg-purple-500/10", text: "text-purple-500" },
    medicine_sale: { bg: "bg-orange-500/10", text: "text-orange-500" },
  };

  const variant = variants[category] || { bg: "bg-muted", text: "text-muted-foreground" };

  return (
    <Badge variant="outline" className={`${variant.bg} ${variant.text} border-0 text-xs`}>
      {category.replace(/_/g, " ")}
    </Badge>
  );
};

export const TransactionHistory = ({ transactions, loading }: TransactionHistoryProps) => {
  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-6 bg-muted rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <WalletIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
          <p className="text-sm text-muted-foreground">
            Your transaction history will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Recent Transactions</h3>
      <div className="space-y-2">
        {transactions.map((transaction, index) => {
          const Icon = getTransactionIcon(transaction.transaction_type);
          const isCredit = transaction.transaction_type === "credit";

          return (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg border border-border/50 hover:bg-muted/30 hover:border-border transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`p-2 rounded-full ${
                  isCredit 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-red-500/10 text-red-500"
                } group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {transaction.description || "Transaction"}
                    </p>
                    {getCategoryBadge(transaction.category)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    isCredit ? "text-green-500" : "text-red-500"
                  }`}>
                    {isCredit ? "+" : "-"}₹{Math.abs(transaction.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Balance: ₹{transaction.balance_after.toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};
