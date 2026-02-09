'use client';

import { Globe, MessageCircle, Twitter } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SocialLinksProps {
  website?: string | null;
  telegram?: string | null;
  twitter?: string | null;
  size?: 'sm' | 'default';
}

export function SocialLinks({ website, telegram, twitter, size = 'default' }: SocialLinksProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const links = [
    { url: website, icon: Globe, label: 'Website', color: 'hover:text-blue-400' },
    { url: telegram ? `https://t.me/${telegram}` : null, icon: MessageCircle, label: 'Telegram', color: 'hover:text-sky-400' },
    { url: twitter ? `https://twitter.com/${twitter}` : null, icon: Twitter, label: 'Twitter', color: 'hover:text-blue-500' },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {links.map((link) => {
        const Icon = link.icon;
        if (!link.url) {
          return (
            <Icon
              key={link.label}
              className={cn(iconSize, 'text-muted-foreground/30')}
            />
          );
        }
        return (
          <Tooltip key={link.label}>
            <TooltipTrigger asChild>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('text-muted-foreground transition-colors', link.color)}
                onClick={(e) => e.stopPropagation()}
              >
                <Icon className={iconSize} />
              </a>
            </TooltipTrigger>
            <TooltipContent>{link.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
