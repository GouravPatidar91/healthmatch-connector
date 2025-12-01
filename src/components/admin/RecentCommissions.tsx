import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Stethoscope } from 'lucide-react';

interface RecentCommissionsProps {
  todayEarning: number;
}

export function RecentCommissions({ todayEarning }: RecentCommissionsProps) {
  // Generate mock recent transactions
  const generateMockTransactions = () => {
    const transactions = [];
    const now = new Date();
    
    // Generate 8-12 recent transactions
    const count = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < count; i++) {
      const isOrder = Math.random() > 0.35; // 65% orders, 35% consultations
      const minutesAgo = Math.floor(Math.random() * 240) + (i * 5); // Spread over ~4 hours
      const timestamp = new Date(now.getTime() - minutesAgo * 60000);
      
      const amount = isOrder 
        ? Math.floor(Math.random() * 50) + 20  // ₹20-70 for orders
        : Math.floor(Math.random() * 80) + 30; // ₹30-110 for consultations
      
      transactions.push({
        id: `txn_${Date.now()}_${i}`,
        type: isOrder ? 'order_handling' : 'doctor_consultation',
        amount,
        reference: isOrder 
          ? `Order #${Math.floor(Math.random() * 9000) + 1000}`
          : `Dr. ${['Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy'][Math.floor(Math.random() * 5)]}`,
        timestamp
      });
    }
    
    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const transactions = generateMockTransactions();

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Commission Transactions</CardTitle>
        <CardDescription>Latest earnings from platform activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((txn) => (
            <div 
              key={txn.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  txn.type === 'order_handling' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {txn.type === 'order_handling' ? (
                    <Package className="h-4 w-4" />
                  ) : (
                    <Stethoscope className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{txn.reference}</div>
                  <div className="text-xs text-muted-foreground">
                    {txn.type === 'order_handling' ? 'Order Handling Fee' : 'Consultation Commission'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600 dark:text-green-400">
                  +₹{txn.amount}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeAgo(txn.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
