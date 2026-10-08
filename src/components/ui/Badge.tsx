import React from 'react';
import { cn } from './Button';
import { Platform, SentimentType } from '../../types';

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
  size?: 'sm' | 'md';
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, className, size = 'sm' }) => {
  const styles: Record<Platform, string> = {
    Netflix: 'bg-red-950/60 text-red-300 border-red-800/60 hover:border-red-600',
    'HBO Max': 'bg-purple-950/60 text-purple-300 border-purple-800/60 hover:border-purple-600',
    'Apple TV+': 'bg-sky-950/60 text-sky-300 border-sky-800/60 hover:border-sky-600',
    Hulu: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:border-emerald-600',
    'Prime Video': 'bg-blue-950/60 text-blue-300 border-blue-800/60 hover:border-blue-600',
    'Disney+': 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60 hover:border-indigo-600',
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-semibold';

  return (
    <span
      title="Network or service; TVMaze values may be broadcast networks, not streaming providers"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded border uppercase tracking-wider transition-colors',
        styles[platform] || 'bg-slate-800 text-slate-300 border-slate-700',
        sizeClasses,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {platform}
    </span>
  );
};

interface SentimentBadgeProps {
  sentiment: SentimentType;
  percentage?: number;
  className?: string;
  showIcon?: boolean;
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  percentage,
  className,
}) => {
  const styles = {
    positive: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60',
    neutral: 'bg-amber-950/50 text-amber-300 border-amber-800/60',
    negative: 'bg-rose-950/50 text-rose-300 border-rose-800/60',
  };

  const labels = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Critical',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded border capitalize',
        styles[sentiment],
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          sentiment === 'positive' && 'bg-emerald-400',
          sentiment === 'neutral' && 'bg-amber-400',
          sentiment === 'negative' && 'bg-rose-400'
        )}
      />
      <span>{labels[sentiment]}</span>
      {percentage !== undefined ? (
        <span className="opacity-75 font-mono text-[11px] ml-0.5">({percentage}%)</span>
      ) : null}
    </span>
  );
};
