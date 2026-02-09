'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LineChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface LineChartWidgetProps {
  title: string;
  data: LineChartData[];
  lines?: { dataKey: string; color: string; name?: string }[];
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function LineChartWidget({
  title,
  data,
  lines = [{ dataKey: 'value', color: 'hsl(var(--primary))' }],
  height = 300,
  valueFormatter,
}: LineChartWidgetProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={valueFormatter}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: unknown) => {
                const num = Number(value) || 0;
                return [
                  valueFormatter ? valueFormatter(num) : num.toLocaleString(),
                  '',
                ];
              }}
            />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name={line.name || line.dataKey}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
