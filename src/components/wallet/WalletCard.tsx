import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalletCardProps {
  balance: number;
  totalEarned: number;
  loading?: boolean;
}

export const WalletCard = ({ balance, totalEarned, loading }: WalletCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
          </div>
          <h2 className="text-4xl font-bold text-foreground">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              `₹${balance.toFixed(2)}`
            )}
          </h2>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Earned</span>
          <span className="text-sm font-semibold text-foreground">
            ₹{totalEarned.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full"
        disabled
      >
        Withdraw (Coming Soon)
      </Button>
    </Card>
  );
};
