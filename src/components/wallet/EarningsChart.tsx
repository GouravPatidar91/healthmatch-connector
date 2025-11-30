import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DailyEarnings } from "@/services/walletService";

interface EarningsChartProps {
  data: DailyEarnings[];
  ownerType: 'delivery_partner' | 'vendor';
  loading?: boolean;
}

export const EarningsChart = ({ data, ownerType, loading }: EarningsChartProps) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: item.date,
    ...(ownerType === 'delivery_partner'
      ? {
          "Delivery Fees": item.deliveryFees || 0,
          Tips: item.tips || 0,
        }
      : {
          "Medicine Sales": item.medicineSales || 0,
        }),
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Daily Earnings (Last 7 Days)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`₹${value.toFixed(2)}`, ""]}
          />
          <Legend />
          {ownerType === 'delivery_partner' ? (
            <>
              <Bar dataKey="Delivery Fees" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Tips" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </>
          ) : (
            <Bar dataKey="Medicine Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
