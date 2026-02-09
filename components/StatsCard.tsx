'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              color || 'bg-primary/10'
            )}
          >
            <Icon className={cn('h-6 w-6', color ? 'text-white' : 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
