import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Classification } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMarketCap(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getClassificationColor(classification: Classification): string {
  switch (classification) {
    case 'Likely Utility Token':
      return '#10B981';
    case 'Possible Utility/Hybrid':
      return '#F59E0B';
    case 'Likely Meme Token':
      return '#A855F7';
    case 'Unknown/Speculative':
      return '#6B7280';
  }
}

export function getClassificationEmoji(classification: Classification): string {
  switch (classification) {
    case 'Likely Utility Token':
      return '🎯';
    case 'Possible Utility/Hybrid':
      return '🔀';
    case 'Likely Meme Token':
      return '🎭';
    case 'Unknown/Speculative':
      return '❓';
  }
}

export function getClassificationBgClass(classification: Classification): string {
  switch (classification) {
    case 'Likely Utility Token':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'Possible Utility/Hybrid':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'Likely Meme Token':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'Unknown/Speculative':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const str = String(value ?? '');
          return str.includes(',') ? `"${str}"` : str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToJSON(data: unknown, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
