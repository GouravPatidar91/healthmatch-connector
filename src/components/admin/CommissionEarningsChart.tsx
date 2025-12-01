import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CommissionEarningsChartProps {
  past7DaysEarnings: number[];
}

export function CommissionEarningsChart({ past7DaysEarnings }: CommissionEarningsChartProps) {
  // Generate data for the chart
  const chartData = past7DaysEarnings.map((total, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    
    const orderHandling = Math.round(total * 0.65);
    const doctorConsultation = Math.round(total * 0.35);
    
    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      'Order Handling': orderHandling,
      'Doctor Consultation': doctorConsultation,
      total: total
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Earnings Breakdown</CardTitle>
        <CardDescription>Commission sources over the past 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => `₹${value}`}
            />
            <Legend />
            <Bar 
              dataKey="Order Handling" 
              stackId="a" 
              fill="hsl(var(--primary))"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Doctor Consultation" 
              stackId="a" 
              fill="hsl(var(--secondary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
