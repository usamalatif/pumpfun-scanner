'use client';

import { Badge } from '@/components/ui/badge';
import { Classification } from '@/lib/types';
import { getClassificationEmoji } from '@/lib/utils';

interface ClassificationBadgeProps {
  classification: Classification;
  showEmoji?: boolean;
  size?: 'sm' | 'default';
}

const variantMap: Record<Classification, 'utility' | 'hybrid' | 'meme' | 'pumpfun' | 'unknown'> = {
  'Likely Utility Token': 'utility',
  'Possible Utility/Hybrid': 'hybrid',
  'Likely Meme Token': 'meme',
  'Pump.fun Token': 'pumpfun',
  'Unknown/Speculative': 'unknown',
};

const shortLabels: Record<Classification, string> = {
  'Likely Utility Token': 'Utility',
  'Possible Utility/Hybrid': 'Hybrid',
  'Likely Meme Token': 'Meme',
  'Pump.fun Token': 'Pump.fun',
  'Unknown/Speculative': 'Unknown',
};

export function ClassificationBadge({
  classification,
  showEmoji = true,
  size = 'default',
}: ClassificationBadgeProps) {
  return (
    <Badge
      variant={variantMap[classification]}
      className={size === 'sm' ? 'text-[10px] px-1.5 py-0' : ''}
    >
      {showEmoji && <span className="mr-1">{getClassificationEmoji(classification)}</span>}
      {shortLabels[classification]}
    </Badge>
  );
}
