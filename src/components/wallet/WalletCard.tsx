import { Card } from "@/components/ui/card";
import { Wallet, TrendingUp, ArrowDownToLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface WalletCardProps {
  balance: number;
  totalEarned: number;
  loading?: boolean;
}

export const WalletCard = ({ balance, totalEarned, loading }: WalletCardProps) => {
  return (
    <Card className="relative overflow-hidden p-8 bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 backdrop-blur-sm">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Wallet Balance</span>
          </div>
          <Sparkles className="h-5 w-5 text-primary/60 animate-pulse" />
        </div>

        {/* Balance */}
        <motion.div 
          className="mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              `₹${balance.toFixed(2)}`
            )}
          </div>
          <p className="text-sm text-muted-foreground">Available to withdraw</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Total Earned</span>
            </div>
            <p className="text-xl font-semibold text-foreground">
              ₹{totalEarned.toFixed(2)}
            </p>
          </div>
          
          <div className="p-4 rounded-xl bg-background/50 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownToLine className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Withdrawn</span>
            </div>
            <p className="text-xl font-semibold text-foreground">
              ₹0.00
            </p>
          </div>
        </div>

        {/* Withdraw Button */}
        <Button
          variant="outline"
          className="w-full group hover:bg-primary/10 hover:border-primary/50 transition-all"
          disabled
        >
          <ArrowDownToLine className="mr-2 h-4 w-4 group-hover:animate-bounce" />
          Withdraw Funds (Coming Soon)
        </Button>
      </div>
    </Card>
  );
};
