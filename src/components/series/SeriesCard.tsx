import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Bookmark, Check, Plus, MessageSquare } from 'lucide-react';
import { Series } from '../../types';
import { PlatformBadge, SentimentBadge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/Button';

interface SeriesCardProps {
  series: Series;
  viewMode?: 'grid' | 'list';
  onToggleCompare?: (seriesId: string) => void;
  isCompared?: boolean;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  series,
  viewMode = 'grid',
  onToggleCompare,
  isCompared = false,
}) => {
  const { isInWatchlist, toggleWatchlist, isAuthenticated, openAuthModal } = useAuth();
  const inWatchlist = isInWatchlist(series.id);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    toggleWatchlist(series.id);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleCompare) onToggleCompare(series.id);
  };

  if (viewMode === 'list') {
    return (
      <div className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700/80 p-4 transition-all duration-200">
        <Link to={`/series/${series.id}`} className="shrink-0 w-24 h-32 rounded-lg overflow-hidden relative">
          <img
            src={series.posterUrl}
            alt={series.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-1.5 left-1.5">
            <PlatformBadge platform={series.platform} size="sm" />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link to={`/series/${series.id}`}>
                <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                  {series.title}
                </h3>
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{series.releaseYear}</span>
                <span aria-hidden="true">·</span>
                <span>{series.seasons} {series.seasons === 1 ? 'Season' : 'Seasons'}</span>
                <span aria-hidden="true">·</span>
                <span>{series.genres.slice(0, 2).join(', ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-lg">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-sm text-white">{series.averageRating.toFixed(1)}</span>
              <span className="text-[10px] text-slate-500 font-mono">/10</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
            {series.description}
          </p>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              {series.totalReviews > 0
                ? <SentimentBadge sentiment="positive" percentage={series.sentimentBreakdown.positive} />
                : <span>No reviews yet</span>}
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <MessageSquare className="h-3 w-3 text-slate-500" />
                {series.totalReviews} reviews
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onToggleCompare ? (
                <button
                  onClick={handleCompareClick}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-md border font-medium transition-colors',
                    isCompared
                      ? 'bg-rose-950/60 text-rose-300 border-rose-700'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:text-white'
                  )}
                >
                  {isCompared ? 'Compared ✓' : '+ Compare'}
                </button>
              ) : null}

              <button
                onClick={handleWatchlistClick}
                className={cn(
                  'p-1.5 rounded-md border transition-colors',
                  inWatchlist
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                )}
                title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                <Bookmark className="h-4 w-4" fill={inWatchlist ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700/80 transition-all duration-200 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-xl hover:shadow-black/50">
      {/* Poster Image Container */}
      <Link to={`/series/${series.id}`} className="relative block aspect-[16/10] overflow-hidden bg-slate-950">
        <img
          src={series.backdropUrl || series.posterUrl}
          alt={series.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <PlatformBadge platform={series.platform} size="sm" />
        </div>

        {/* Watchlist button floating */}
        <button
          onClick={handleWatchlistClick}
          className={cn(
            'absolute top-2.5 right-2.5 p-1.5 rounded-lg border backdrop-blur-md transition-all',
            inWatchlist
              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/40'
              : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-900'
          )}
          title={inWatchlist ? 'Saved in Watchlist' : 'Save to Watchlist'}
        >
          <Bookmark className="h-3.5 w-3.5" fill={inWatchlist ? 'currentColor' : 'none'} />
        </button>

        {/* Score & reviews badge on backdrop */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2 py-1 rounded-md border border-slate-800">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-white text-xs">{series.averageRating.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400 font-mono">/10</span>
          </div>

          <div className={`text-[11px] font-medium backdrop-blur-md px-2 py-0.5 rounded-md border ${
            series.totalReviews > 0
              ? 'text-emerald-400 bg-emerald-950/85 border-emerald-800/60'
              : 'text-slate-300 bg-slate-950/85 border-slate-800'
          }`}>
            {series.totalReviews > 0 ? `${series.sentimentBreakdown.positive}% Positive` : 'No reviews'}
          </div>
        </div>
      </Link>

      {/* Series Metadata */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/series/${series.id}`}>
            <h3 className="font-bold text-sm text-white group-hover:text-rose-400 transition-colors line-clamp-1">
              {series.title}
            </h3>
          </Link>

          {/* Clean unboxed metadata with separators */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <span>{series.releaseYear}</span>
            <span aria-hidden="true">·</span>
            <span>{series.seasons} {series.seasons === 1 ? 'Season' : 'Seasons'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 truncate">{series.genres.slice(0, 2).join(', ')}</span>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
            {series.description}
          </p>
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <MessageSquare className="h-3 w-3 text-slate-500" />
            <span>{series.totalReviews} reviews</span>
          </div>

          {onToggleCompare ? (
            <button
              onClick={handleCompareClick}
              className={cn(
                'text-[11px] px-2 py-1 rounded border font-medium transition-colors',
                isCompared
                  ? 'bg-rose-950/70 text-rose-300 border-rose-700'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700/60 hover:text-white hover:bg-slate-800'
              )}
            >
              {isCompared ? 'Compared ✓' : '+ Compare'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
