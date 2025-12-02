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
          <div className="h-5 bg-muted rounded w-1/3 mb-6" />
          <div className="h-64 bg-muted/30 rounded-xl" />
        </div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    ...(ownerType === 'delivery_partner'
      ? {
          "Delivery Fees": item.deliveryFees || 0,
          Tips: item.tips || 0,
        }
      : {
          "Medicine Sales": item.medicineSales || 0,
        }),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">
          {payload[0].payload.date}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-sm text-muted-foreground">
              {entry.name}: <span className="font-semibold text-foreground">₹{entry.value.toFixed(2)}</span>
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Daily Earnings
        </h3>
        <div className="text-xs text-muted-foreground">
          Last 7 Days
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            iconSize={8}
          />
          {ownerType === 'delivery_partner' ? (
            <>
              <Bar 
                dataKey="Delivery Fees" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
              <Bar 
                dataKey="Tips" 
                fill="hsl(var(--chart-2))" 
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
            </>
          ) : (
            <Bar 
              dataKey="Medicine Sales" 
              fill="hsl(var(--primary))" 
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};
