'use client';

import { Progress } from '@/components/ui/progress';
import { getScorePercentage } from '@/lib/utility-analyzer';
import { cn } from '@/lib/utils';

interface UtilityScoreBadgeProps {
  score: number;
  maxScore?: number;
  showBar?: boolean;
  size?: 'sm' | 'default';
}

function getScoreColor(percentage: number): string {
  if (percentage >= 60) return 'bg-emerald-500';
  if (percentage >= 30) return 'bg-amber-500';
  return 'bg-gray-500';
}

export function UtilityScoreBadge({
  score,
  maxScore = 15,
  showBar = true,
  size = 'default',
}: UtilityScoreBadgeProps) {
  const percentage = getScorePercentage(score, maxScore);

  return (
    <div className={cn('flex items-center gap-2', size === 'sm' ? 'w-20' : 'w-32')}>
      <span
        className={cn(
          'font-mono font-bold',
          size === 'sm' ? 'text-xs' : 'text-sm',
          percentage >= 60 ? 'text-emerald-500' :
          percentage >= 30 ? 'text-amber-500' : 'text-gray-400'
        )}
      >
        {score}
      </span>
      {showBar && (
        <Progress
          value={percentage}
          className={cn('flex-1', size === 'sm' ? 'h-1.5' : 'h-2')}
          indicatorClassName={getScoreColor(percentage)}
        />
      )}
    </div>
  );
}
