import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { CommissionEarningsChart } from './CommissionEarningsChart';
import { RecentCommissions } from './RecentCommissions';

// Fixed past 7 days earnings that total exactly ₹7,690
const PAST_7_DAYS_EARNINGS = [1120, 1080, 1150, 1090, 1100, 1070, 1080]; // Total: ₹7,690

// Generate daily earning for today (100-200 rupees per day)
function getTodayBaseEarning(): number {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const month = today.getMonth();
  // Deterministic "random" based on date (100-199 rupees)
  const seed = (dayOfMonth * 13 + month * 7) % 100;
  return 100 + seed;
}

// Split earning into order handling (65%) and doctor consultation (35%)
function splitEarning(total: number) {
  return {
    orderHandling: Math.round(total * 0.65),
    doctorConsultation: Math.round(total * 0.35)
  };
}

export function AdminCommissionWallet() {
  const [todayBonus, setTodayBonus] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Calculate base earnings
  const today = new Date();
  const todayBaseEarning = getTodayBaseEarning();

  // Past 7 days - using fixed values that sum to ₹7,690
  const past7DaysEarnings = PAST_7_DAYS_EARNINGS;
  const past7DaysTotal = 7690; // Fixed total

  // This month calculation (sum of past days + today)
  const daysInMonth = today.getDate();
  const thisMonthTotal = past7DaysTotal + todayBaseEarning + (daysInMonth > 7 ? (daysInMonth - 7) * 1100 : 0);

  // Today's total with bonus
  const todayTotal = todayBaseEarning + todayBonus;
  const todaySplit = splitEarning(todayTotal);
  const thisMonthSplit = splitEarning(thisMonthTotal);

  // Auto-increment simulation (₹5-20 every 30-60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const increment = Math.floor(Math.random() * 16) + 5; // 5-20 rupees
      setTodayBonus(prev => prev + increment);
      setLastUpdate(new Date());
    }, (Math.random() * 30000) + 30000); // 30-60 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Admin Commission Wallet
              </CardTitle>
              <CardDescription>Platform earnings from orders and consultations</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Balance</div>
              <div className="text-3xl font-bold text-primary">₹{thisMonthTotal.toLocaleString()}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Handling Commission</p>
                    <p className="text-2xl font-bold">₹{thisMonthSplit.orderHandling.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">65% of platform fees</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/50 border-secondary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Doctor Consultation Commission</p>
                    <p className="text-2xl font-bold">₹{thisMonthSplit.doctorConsultation.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">35% of consultation fees</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-secondary-foreground/60" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today's Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todayTotal.toLocaleString()}</div>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <div>Orders: ₹{todaySplit.orderHandling}</div>
              <div>Consults: ₹{todaySplit.doctorConsultation}</div>
            </div>
            {todayBonus > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +₹{todayBonus} earned today
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Past 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{past7DaysTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-2">
              Avg: ₹{Math.round(past7DaysTotal / 7)} per day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{thisMonthTotal.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {today.getDate()} days • Avg: ₹{Math.round(thisMonthTotal / today.getDate())} per day
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <CommissionEarningsChart past7DaysEarnings={past7DaysEarnings} />

      {/* Recent Transactions */}
      <RecentCommissions todayEarning={todayTotal} />

      {/* Live Update Indicator */}
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}
