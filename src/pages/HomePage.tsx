import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Flame,
  Award,
  Sparkles,
  LayoutGrid,
  List,
  GitCompare,
  ArrowRight,
  Star,
  Play,
  X,
  TrendingUp,
  Tv,
} from 'lucide-react';
import { Series, Genre } from '../types';
import { seriesApi } from '../services/api';
import { SeriesCard } from '../components/series/SeriesCard';
import { Button } from '../components/ui/Button';
import { PlatformBadge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const searchQuery = searchParams.get('q') || '';
  const selectedPlatform = searchParams.get('platform') || 'All';
  const selectedGenre = searchParams.get('genre') || 'All';
  const sortBy = (searchParams.get('sort') as any) || 'rating';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Compared series selection
  const [comparedIds, setComparedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSeries = async () => {
      setIsLoading(true);
      const data = await seriesApi.getAll({
        search: searchQuery,
        platform: selectedPlatform,
        genre: selectedGenre,
        sortBy: sortBy,
      });
      setSeriesList(data);
      setIsLoading(false);
    };

    fetchSeries();
  }, [searchQuery, selectedPlatform, selectedGenre, sortBy]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'All') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleToggleCompare = (id: string) => {
    setComparedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 series simultaneously.');
        return prev;
      }
      return [...prev, id];
    });
  };

  const platforms = Array.from(new Set([
    'All',
    'Netflix',
    'HBO Max',
    'Apple TV+',
    'Prime Video',
    'Hulu',
    'Disney+',
    ...seriesList.map((series) => series.platform),
  ]));

  const genres: (Genre | 'All')[] = [
    'All',
    'Sci-Fi',
    'Drama',
    'Thriller',
    'Crime',
    'Fantasy',
    'Comedy',
    'Action',
    'Mystery',
  ];

  // Spotlight series for hero banner
  const heroSpotlight = seriesList.find((s) => s.id === 'severance') || seriesList[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Spotlight Banner */}
      {heroSpotlight && !searchQuery && selectedPlatform === 'All' && selectedGenre === 'All' ? (
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="absolute inset-0">
            <img
              src={heroSpotlight.backdropUrl}
              alt={heroSpotlight.title}
              className="w-full h-full object-cover object-center opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-16 max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded">
                Spotlight Series
              </span>
              <PlatformBadge platform={heroSpotlight.platform} size="md" />
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-mono">
                {heroSpotlight.releaseYear} · {heroSpotlight.seasons} Seasons
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              {heroSpotlight.title}
            </h1>

            <p className="text-sm sm:text-base text-rose-300/90 font-medium italic">
              "{heroSpotlight.tagline}"
            </p>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-2xl">
              {heroSpotlight.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-base font-bold text-white">
                  {heroSpotlight.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-mono">/10</span>
                <span className="text-xs text-slate-400 ml-1">
                  ({heroSpotlight.totalReviews} reviews)
                </span>
              </div>

              <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
                {heroSpotlight.totalReviews > 0
                  ? `${heroSpotlight.sentimentBreakdown.positive}% Positive Sentiment`
                  : 'No user reviews yet'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link to={`/series/${heroSpotlight.id}`}>
                <Button variant="primary" size="md">
                  View Full Analytics & Reviews
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={`/compare?ids=${heroSpotlight.id}`}>
                <Button variant="secondary" size="md">
                  <GitCompare className="h-4 w-4" />
                  Compare Metrics
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Filter and Control Bar */}
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-4 backdrop-blur-md">
          {/* Top row: search & sort */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => updateParam('q', e.target.value)}
                placeholder="Search series by title, cast or plot..."
                className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700/80 pl-9 pr-9 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
              />
              {searchQuery ? (
                <button
                  onClick={() => updateParam('q', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {/* Genre Filter */}
              <div className="w-36 sm:w-44">
                <select
                  value={selectedGenre}
                  onChange={(e) => updateParam('genre', e.target.value)}
                  className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700/80 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      Genre: {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort selector */}
              <div className="w-36 sm:w-44">
                <select
                  value={sortBy}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700/80 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="rating">Sort: Highest Rated</option>
                  <option value="popular">Sort: Most Popular</option>
                  <option value="reviews">Sort: Most Reviews</option>
                  <option value="year">Sort: Release Year</option>
                </select>
              </div>

              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${
                    viewMode === 'grid'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${
                    viewMode === 'list'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Platform segment bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Tv className="h-3 w-3" />
              Network / Service:
            </span>
            {platforms.map((p) => {
              const isActive = selectedPlatform === p;
              return (
                <button
                  key={p}
                  onClick={() => updateParam('platform', p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                    isActive
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Active filters summary */}
          {(searchQuery || selectedPlatform !== 'All' || selectedGenre !== 'All') ? (
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span>Active filters:</span>
                {searchQuery ? (
                  <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                    "{searchQuery}"
                  </span>
                ) : null}
                {selectedPlatform !== 'All' ? (
                  <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {selectedPlatform}
                  </span>
                ) : null}
                {selectedGenre !== 'All' ? (
                  <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {selectedGenre}
                  </span>
                ) : null}
              </div>

              <button
                onClick={clearAllFilters}
                className="text-rose-400 hover:text-rose-300 text-xs font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Series Grid / List Results */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              OTT Catalog & Reviews
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              ({seriesList.length} titles)
            </span>
          </div>

          <div className="text-xs text-slate-400">
            TVMaze networks and web channels may not indicate streaming availability
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No series match your search</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              We couldn't find any series matching "{searchQuery}" for {selectedPlatform}.
              Try adjusting keywords or clearing genre filters.
            </p>
            <Button variant="secondary" size="sm" onClick={clearAllFilters}>
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5'
                : 'space-y-4'
            }
          >
            {seriesList.map((series) => (
              <SeriesCard
                key={series.id}
                series={series}
                viewMode={viewMode}
                onToggleCompare={handleToggleCompare}
                isCompared={comparedIds.includes(series.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Floating Comparison Tray */}
      {comparedIds.length > 0 ? (
        <aside aria-label="Compare selection" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-rose-500/50 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/80">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white font-bold">
                <GitCompare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {comparedIds.length} Series Selected for Comparison
                </p>
                <p className="text-[11px] text-slate-400">
                  Compare ratings, radar dimensions & audience sentiment
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparedIds([])}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
              >
                Clear
              </button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate(`/compare?ids=${comparedIds.join(',')}`)}
              >
                Compare Now
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
};
