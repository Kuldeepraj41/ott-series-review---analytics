import React from 'react';
import { Star } from 'lucide-react';
import { cn } from './Button';

interface RatingStarsProps {
  rating: number; // e.g. 8.9 out of 10 or 4.5 out of 5
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  interactive?: boolean;
  onChange?: (val: number) => void;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  max = 10,
  size = 'md',
  showNumber = true,
  interactive = false,
  onChange,
  className,
}) => {
  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
  };

  // Convert to 5-star scale for visual stars representation
  const starCount = 5;
  const scaledScore = (rating / max) * starCount;

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: starCount }).map((_, idx) => {
          const fillRatio = Math.max(0, Math.min(1, scaledScore - idx));
          const isFilled = fillRatio >= 0.75;
          const isHalf = fillRatio >= 0.25 && fillRatio < 0.75;

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => {
                if (interactive && onChange) {
                  // If rating scale is 10, calculate corresponding score
                  onChange((idx + 1) * (max / starCount));
                }
              }}
              className={cn(
                'relative text-slate-600 transition-colors',
                interactive && 'hover:scale-110 cursor-pointer'
              )}
            >
              <Star
                className={cn(
                  iconSizes[size],
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-slate-600'
                )}
              />
            </button>
          );
        })}
      </div>
      {showNumber ? (
        <span className={cn('text-amber-400 font-mono tracking-tight', textSizes[size])}>
          {rating.toFixed(1)}
          <span className="text-slate-500 font-normal text-xs ml-0.5">/{max}</span>
        </span>
      ) : null}
    </div>
  );
};
