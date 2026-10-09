import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Bookmark,
  GitCompare,
  ArrowLeft,
  Calendar,
  Layers,
  User,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ShieldAlert,
  Share2,
  Check,
  Sparkles,
  BarChart2,
  Tv,
  Award,
  Users,
} from 'lucide-react';
import { Series, Review } from '../types';
import { seriesApi, reviewsApi } from '../services/api';
import { PlatformBadge, SentimentBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RatingStars } from '../components/ui/RatingStars';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

export const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    user,
    isInWatchlist,
    toggleWatchlist,
    rateSeries,
    getUserRating,
    isAuthenticated,
    isCritic,
    openAuthModal,
  } = useAuth();

  const [series, setSeries] = useState<Series | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review filters & sorting
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [reviewSort, setReviewSort] = useState<'newest' | 'rating_desc' | 'helpful'>('newest');
  const [reviewSourceFilter, setReviewSourceFilter] = useState<'all' | 'critics' | 'audience'>('all');

  // Add Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState<number>(8);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Share link feedback
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      setIsLoading(true);
      const [seriesData, reviewData] = await Promise.all([
        seriesApi.getById(id),
        reviewsApi.getBySeriesId(id, sentimentFilter, reviewSort),
      ]);
      if (!seriesData) {
        navigate('/');
        return;
      }
      setSeries(seriesData);
      setReviews(reviewData);
      setIsLoading(false);
    };

    loadData();
  }, [id, sentimentFilter, reviewSort, navigate]);

  const handleVote = async (reviewId: string, direction: 'up' | 'down') => {
    const updated = await reviewsApi.voteReview(reviewId, direction);
    if (updated) {
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ...updated } : r))
      );
    }
  };

  const generateReviewHeadline = () => {
    const sentences = newContent
      .trim()
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const source = sentences.sort((a, b) => b.length - a.length)[0];
    if (!source) return;

    const words = source.replace(/[.!?]+$/, '').split(/\s+/);
    let headline = words.slice(0, 12).join(' ');
    if (words.length > 12) headline += '…';
    if (headline.length > 100) {
      headline = `${headline.slice(0, 97).trimEnd()}…`;
    }
    setNewTitle(headline);
    if (formError) setFormError('');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!newTitle.trim()) {
      setFormError('Review headline cannot be empty.');
      return;
    }
    if (!newContent.trim()) {
      setFormError('Review details cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const added = await reviewsApi.createReview({
        seriesId: id,
        authorName: user?.name || 'Verified Critic',
        rating: newRating,
        title: newTitle,
        content: newContent,
        containsSpoilers,
      });

      // Save user rating to profile
      await rateSeries(id, newRating);

      // Refresh series metrics
      const freshSeries = await seriesApi.getById(id);
      if (freshSeries) setSeries(freshSeries);

      setReviews((prev) => [added, ...prev]);
      setIsReviewModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setFormError('');
    } catch (err) {
      setFormError('Failed to publish review. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading || !series) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(series.id);
  const userExistingRating = getUserRating(series.id);

  // Prepare radar metrics data for Recharts
  const radarData = series.radarMetrics
    ? [
        { subject: 'Storytelling', A: series.radarMetrics.storytelling, fullMark: 100 },
        { subject: 'Production', A: series.radarMetrics.production, fullMark: 100 },
        { subject: 'Pacing', A: series.radarMetrics.pacing, fullMark: 100 },
        { subject: 'Characters', A: series.radarMetrics.characterDepth, fullMark: 100 },
        { subject: 'Soundtrack', A: series.radarMetrics.soundtrack, fullMark: 100 },
        { subject: 'Rewatchable', A: series.radarMetrics.rewatchability, fullMark: 100 },
      ]
    : [];

  // Prepare rating distribution histogram data
  const histogramData = Object.entries(series.ratingDistribution || {})
    .map(([score, count]) => ({
      score: `${score}★`,
      count,
    }))
    .sort((a, b) => parseInt(a.score) - parseInt(b.score));

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewSort === 'rating_desc') return b.rating - a.rating;
    if (reviewSort === 'helpful') return b.helpfulCount - a.helpfulCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Series'}</span>
          </button>

          <Link to={`/compare?ids=${series.id}`}>
            <Button variant="secondary" size="sm">
              <GitCompare className="h-3.5 w-3.5" />
              Compare
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Backdrop & Details Header */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="absolute inset-0">
          <img
            src={series.backdropUrl}
            alt={series.title}
            className="w-full h-full object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-start gap-8">
          {/* Poster image */}
          <div className="shrink-0 w-44 sm:w-56 rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-900">
            <img
              src={series.posterUrl}
              alt={series.title}
              className="w-full h-auto object-cover aspect-[2/3]"
            />
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Network / Service</span>
              <PlatformBadge platform={series.platform} size="md" />
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-mono">
                {series.releaseYear}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-300">
                {series.seasons} {series.seasons === 1 ? 'Season' : 'Seasons'} ({series.episodes} Episodes)
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs font-mono uppercase bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                {series.ageRating}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-medium">
                Status: <span className="text-slate-200">{series.status}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {series.title}
            </h1>

            <p className="text-sm sm:text-base text-rose-300 font-medium italic">
              "{series.tagline}"
            </p>

            {/* Clean unboxed genres list with separator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">Genres:</span>
              {series.genres.map((genre, idx) => (
                <React.Fragment key={genre}>
                  <Link
                    to={`/?genre=${genre}`}
                    className="hover:text-rose-400 transition-colors"
                  >
                    {genre}
                  </Link>
                  {idx < series.genres.length - 1 ? <span className="text-slate-600">/</span> : null}
                </React.Fragment>
              ))}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {series.description}
            </p>

            {/* Creator and Cast */}
            <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 space-y-1">
              <div>
                <span className="text-slate-500">Created by: </span>
                <span className="text-slate-200 font-medium">{series.creator}</span>
              </div>
              <div>
                <span className="text-slate-500">Starring: </span>
                <span className="text-slate-200">{series.cast.join(', ')}</span>
              </div>
            </div>

            {/* Rating Scores & CTA Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              {/* Critic Consensus Rating Block */}
              <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
                <Award className="h-5 w-5 text-amber-400" />
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">
                      {series.averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/10</span>
                  </div>
                  <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                    {series.totalReviews > 0 ? 'CinePulse Review Avg' : 'TVMaze Rating'}
                  </p>
                </div>
              </div>

              {/* Audience Score Block */}
              <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl">
                <Users className="h-5 w-5 text-sky-400" />
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white">
                      {series.totalReviews > 0 ? (series.audienceRating || series.averageRating).toFixed(1) : 'N/A'}
                    </span>
                    {series.totalReviews > 0 ? <span className="text-xs text-slate-400 font-mono">/10</span> : null}
                  </div>
                  <p className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">
                    Audience Review Avg
                  </p>
                </div>
              </div>

              {/* Sentiment Summary */}
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Review Sentiment
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {series.totalReviews === 0 ? <span className="text-slate-400">No reviews yet</span> : null}
                    {series.totalReviews > 0 ? <>
                    <span className="text-emerald-400 font-bold">
                      {series.sentimentBreakdown.positive}% Pos
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-amber-400 font-medium">
                      {series.sentimentBreakdown.neutral}% Neu
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-rose-400 font-medium">
                      {series.sentimentBreakdown.negative}% Crit
                    </span>
                    </> : null}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={inWatchlist ? 'secondary' : 'outline'}
                  size="md"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal('login');
                      return;
                    }
                    toggleWatchlist(series.id);
                  }}
                >
                  <Bookmark className="h-4 w-4" fill={inWatchlist ? 'currentColor' : 'none'} />
                  {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal('login');
                      return;
                    }
                    setFormError('');
                    setIsReviewModalOpen(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Write Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Analytics Grid (Rating Histogram & Radar Dimensions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Score Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-rose-500" />
              Rating Frequency Distribution
            </h3>
            <span className="text-xs text-slate-400 font-mono">1 to 10 Scale</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="score" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: any) => [`${value} reviews`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index >= 7 ? '#e11d48' : index >= 5 ? '#f59e0b' : '#64748b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Consensus: Strong clustering in the 8–10 range reflects critical acclaim.
          </p>
        </div>

        {/* Multi-Dimensional Radar Metric Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-500" />
              Quality Radar (0–100 Dimensions)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Text estimates · unmentioned = 50
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} tick={false} />
                <Radar
                  name={series.title}
                  dataKey="A"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val}/100`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 text-center">
            Highest scoring vectors:{' '}
            <span className="text-rose-400 font-medium">Storytelling</span> and{' '}
            <span className="text-rose-400 font-medium">Production Value</span>.
          </p>
        </div>
      </div>

      {/* Reviews & Community Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-rose-500" />
              Community & Critic Reviews
            </h2>
            <p className="text-xs text-slate-400">
              {reviews.filter((r) => r.isCriticReview).length} Critic Consensus · {reviews.filter((r) => !r.isCriticReview).length} Audience Reviews
            </p>
          </div>

          {/* Sentiment & sorting controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Review Source Filter: All vs Critics vs Audience */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs">
              <button
                onClick={() => setReviewSourceFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  reviewSourceFilter === 'all'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({reviews.length})
              </button>
              <button
                onClick={() => setReviewSourceFilter('critics')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors font-medium ${
                  reviewSourceFilter === 'critics'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="h-3 w-3" />
                Critics ({reviews.filter((r) => r.isCriticReview).length})
              </button>
              <button
                onClick={() => setReviewSourceFilter('audience')}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors font-medium ${
                  reviewSourceFilter === 'audience'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="h-3 w-3" />
                Audience ({reviews.filter((r) => !r.isCriticReview).length})
              </button>
            </div>

            {/* Sentiment filters */}
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs">
              {['all', 'positive', 'neutral', 'negative'].map((sent) => (
                <button
                  key={sent}
                  onClick={() => setSentimentFilter(sent)}
                  className={`px-2 py-1 rounded-md capitalize transition-colors font-medium ${
                    sentimentFilter === sent
                      ? 'bg-slate-800 text-rose-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sent}
                </button>
              ))}
            </div>

            {/* Sorting */}
            <select
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value as any)}
              className="h-8 rounded-lg bg-slate-900 border border-slate-800 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="rating_desc">Highest Rated</option>
              <option value="helpful">Most Helpful</option>
            </select>

            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                  return;
                }
                setFormError('');
                setIsReviewModalOpen(true);
              }}
            >
              + Add Review
            </Button>
          </div>
        </div>

        {/* Reviews List */}
        {sortedReviews.filter((r) => {
          if (sentimentFilter !== 'all' && r.sentiment !== sentimentFilter) return false;
          if (reviewSourceFilter === 'critics' && !r.isCriticReview) return false;
          if (reviewSourceFilter === 'audience' && r.isCriticReview) return false;
          return true;
        }).length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 space-y-2">
            <p className="text-sm font-semibold text-slate-300">
               No reviews match this filter.
            </p>
            <p className="text-xs text-slate-500">
               Be the first to share your thoughts for {series.title}!
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal('login');
                  return;
                }
                setFormError('');
                setIsReviewModalOpen(true);
              }}
              className="mt-2"
            >
              Write First Review
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReviews
              .filter((r) => {
                if (sentimentFilter !== 'all' && r.sentiment !== sentimentFilter) return false;
                if (reviewSourceFilter === 'critics' && !r.isCriticReview) return false;
                if (reviewSourceFilter === 'audience' && r.isCriticReview) return false;
                return true;
              })
              .map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700/80 transition-colors"
              >
                {/* Header row: Author + Rating + Sentiment */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        rev.authorAvatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={rev.authorName}
                      className="h-9 w-9 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white">{rev.authorName}</span>
                        {rev.isCriticReview ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-full">
                            <Award className="h-3 w-3 text-amber-400" />
                            Verified Critic {rev.criticOutlet ? `· ${rev.criticOutlet}` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 font-medium bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                            <Users className="h-3 w-3 text-sky-400" />
                            Audience Review
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <SentimentBadge sentiment={rev.sentiment} />
                    <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-xs text-white">{rev.rating}</span>
                      <span className="text-[10px] text-slate-500 font-mono">/10</span>
                    </div>
                  </div>
                </div>

                {/* Review Headline & Body */}
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{rev.title}</h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {rev.content}
                  </p>
                </div>

                {/* Footer: Spoilers warning & Helpful voting */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  {rev.containsSpoilers ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                      <ShieldAlert className="h-3.5 w-3.5" /> Contains Spoilers
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500">Spoiler-Free</span>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">Was this review helpful?</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleVote(rev.id, 'up')}
                        className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
                          rev.userHelpfulVote === 'up'
                            ? 'bg-rose-950/70 border-rose-600 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>{rev.helpfulCount}</span>
                      </button>

                      <button
                        onClick={() => handleVote(rev.id, 'down')}
                        className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
                          rev.userHelpfulVote === 'down'
                            ? 'bg-rose-950/70 border-rose-600 text-rose-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <ThumbsDown className="h-3 w-3" />
                        <span>{rev.unhelpfulCount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Review ${series.title}`}
        description="Share your critical assessment and rating with the OTTIntel community."
        maxWidth="lg"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
          {/* Author Role Transparency Banner */}
          {isCritic ? (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs text-amber-200 flex items-center gap-2.5">
              <Award className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold">Posting with Certified Critic Authority ({user?.role})</p>
                <p className="text-[11px] text-amber-300/80">
                  Your evaluation factors directly into the Critic Consensus score and Bayes weighting.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5">
              <Users className="h-5 w-5 text-sky-400 shrink-0" />
              <div>
                <p className="font-bold text-white">
                  Posting as Community Reviewer ({user?.name || 'User'})
                </p>
                <p className="text-[11px] text-slate-400">
                  Share your genuine perspective! Your review is categorized under Audience Reviews. Critic status is administrator-governed.
                </p>
              </div>
            </div>
          )}

          {formError ? (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
              {formError}
            </div>
          ) : null}

          {/* Rating Slider / Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Your Rating (1–10 Scale)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={newRating}
                onChange={(e) => setNewRating(parseInt(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <div className="shrink-0 flex items-center gap-1 bg-slate-950 border border-slate-700 px-3 py-1 rounded-lg">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-white">{newRating}</span>
                <span className="text-xs text-slate-500">/10</span>
              </div>
            </div>
          </div>

          {/* Review Headline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="review-headline" className="text-xs font-semibold text-slate-300">
                Review Headline
              </label>
              <button
                type="button"
                onClick={generateReviewHeadline}
                disabled={!newContent.trim() || isSubmitting}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                title={newContent.trim() ? 'Generate a headline from your review text' : 'Write your review first'}
              >
                <Sparkles className="h-3 w-3" />
                Generate from review
              </button>
            </div>
            {!newContent.trim() ? (
              <p className="mb-1 text-[11px] text-slate-500">
                Write your review details first to generate a headline suggestion.
              </p>
            ) : null}
            <input
              id="review-headline"
              type="text"
              maxLength={200}
              placeholder="e.g. Masterclass in suspense and cinematography"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (formError) setFormError('');
              }}
              className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Review Content */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Detailed Review
            </label>
            <textarea
              rows={4}
              placeholder="Write your analysis regarding screenwriting, performances, direction, and pacing..."
              value={newContent}
              onChange={(e) => {
                setNewContent(e.target.value);
                if (formError) setFormError('');
              }}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Sentiment is automatically analyzed from your review text.
            </p>
          </div>

          {/* Spoilers checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="spoilers"
              checked={containsSpoilers}
              onChange={(e) => setContainsSpoilers(e.target.checked)}
              className="rounded border-slate-700 accent-rose-600 cursor-pointer"
            />
            <label htmlFor="spoilers" className="text-xs text-slate-400 cursor-pointer">
              This review contains major plot spoilers
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsReviewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
