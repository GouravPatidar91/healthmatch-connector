import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react";
import type { WalletTransaction } from "@/services/walletService";
import { format } from "date-fns";

interface TransactionHistoryProps {
  transactions: WalletTransaction[];
  loading?: boolean;
}

export const TransactionHistory = ({ transactions, loading }: TransactionHistoryProps) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case 'debit':
      case 'withdrawal':
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;

    const categoryStyles: Record<string, string> = {
      delivery_fee: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
      tip: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
      medicine_sale: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
      withdrawal: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
    };

    return (
      <Badge variant="secondary" className={categoryStyles[category] || ""}>
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Transaction History</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-10 w-10 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
              <div className="h-6 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Transaction History</h3>
        <div className="text-center py-8 text-muted-foreground">
          No transactions yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Transaction History</h3>
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
          >
            <div className="flex-shrink-0">
              {getTransactionIcon(transaction.transaction_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {transaction.description || 'Transaction'}
                </p>
                {getCategoryBadge(transaction.category)}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(transaction.created_at), 'MMM dd, yyyy hh:mm a')}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-lg font-semibold ${
                  transaction.transaction_type === 'credit'
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {transaction.transaction_type === 'credit' ? '+' : '-'}₹
                {Number(transaction.amount).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Balance: ₹{Number(transaction.balance_after).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
