import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Star,
  TrendingUp,
  BarChart3,
  GitCompare,
  UserCheck,
  Shield,
  Award,
  Sparkles,
  ArrowRight,
  Tv,
  CheckCircle2,
  LogIn,
  Layers,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { seriesApi, analyticsApi } from '../services/api';
import { Series, AnalyticsOverview } from '../types';
import { PlatformBadge, SentimentBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const AboutLandingPage: React.FC = () => {
  const { openAuthModal } = useAuth();
  const [spotlightSeries, setSpotlightSeries] = useState<Series[]>([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    Promise.all([seriesApi.getAll(), analyticsApi.getOverview()]).then(([all, ov]) => {
      setSpotlightSeries(all.slice(0, 4));
      setCatalogCount(all.length);
      setAnalytics(ov);
    });
  }, []);

  return (
    <div className="space-y-16 pb-16 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-8 sm:p-14 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/20 via-transparent to-slate-900/50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Streaming Intelligence Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            OTT Series Review & Sentiment Analytics
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            OTTIntel aggregates verified critical consensus, natural language sentiment polarity, and multi-dimensional quality benchmarks across Netflix, HBO Max, Apple TV+, Prime Video, Hulu, and Disney+.
          </p>

          {/* Action CTAs: trigger the blurred auth modal */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => openAuthModal('login')}
            >
              <LogIn className="h-4 w-4" />
              Sign In to Full Dashboard
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => openAuthModal('register')}
            >
              Create Critic Account
            </Button>

          </div>
        </div>

        {/* Live metric summary pill bar */}
        <div className="relative z-10 mt-10 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Total Titles Monitored
            </p>
            <p className="text-2xl font-black text-white mt-0.5">
              {catalogCount} Live {catalogCount === 1 ? 'Title' : 'Titles'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Reviews Processed
            </p>
            <p className="text-2xl font-black text-rose-400 mt-0.5">
              {analytics?.totalReviews.toLocaleString() ?? '...'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Platform Mean Score
            </p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">
              {analytics?.totalReviews ? `${analytics.overallAverageRating.toFixed(2)} / 10` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Positive Sentiment
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">
              {analytics?.totalReviews ? `${analytics.sentimentDistribution.positive}%` : 'N/A'}
            </p>
          </div>
        </div>
      </section>

      {/* DEDICATED SECTION: The Role of the Critic Profile */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 backdrop-blur-sm space-y-8">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="h-4 w-4" />
            <span>Platform Core Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            What is the Role of the Critic Profile?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            In OTTIntel, a Critic Profile is not just a passive user account—it is an authoritative critique credential that powers the platform’s scoring and recommendation algorithms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-rose-600/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Weighted Critic Scoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Critics submit in-depth ratings on a 1–10 scale. Certified critic scores are weighted in the platform's Bayesian average to prevent review-bombing and ensure authentic critical consensus.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Sentiment Engine Feed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each review published by a critic feeds into our Natural Language Processing (NLP) sentiment engine, classifying polarity into Positive, Neutral, or Critical vectors and generating audience sentiment ratios.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-sky-600/15 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Portfolio & Reputation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The profile tracks your entire review portfolio, community helpful votes, rating history, and certified titles (*Senior Critic & Editorial Lead*, *Sentiment Data Scientist*).
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
              <Tv className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Curated OTT Watchlist</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Critics curate and manage their personalized streaming watchlist categorized into <em>Currently Watching</em>, <em>Plan to Watch</em>, and <em>Completed</em> across all major OTT services.
            </p>
          </div>
        </div>
      </section>

      {/* Pre-Login Teaser: Featured OTT Series Catalog */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Spotlight Series Preview
            </h2>
            <p className="text-xs text-slate-400">
              Sign in to unlock full filtering, review writing, and comparisons
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              TVMaze network and web-channel names do not guarantee streaming availability.
            </p>
          </div>

          <button
            onClick={() => openAuthModal('login')}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            Sign In to Full Dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {spotlightSeries.map((series) => (
            <div
              key={series.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col group hover:border-slate-700 transition-colors"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img
                  src={series.backdropUrl}
                  alt={series.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                  <PlatformBadge platform={series.platform} size="sm" />
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-white text-xs">{series.averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800/60">
                    {series.totalReviews > 0 ? `${series.sentimentBreakdown.positive}% Pos` : 'No reviews'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1">{series.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{series.releaseYear}</span>
                    <span>·</span>
                    <span>{series.seasons} Seasons</span>
                    <span>·</span>
                    <span>{series.genres.slice(0, 2).join(', ')}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {series.description}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => openAuthModal('login')}
                >
                  Sign In to Read Reviews
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Deep-Dive Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-white">Full Analytics Suite</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gain executive insight with score histograms, 12-month review velocity lines, and streaming network share benchmarks.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center">
            <GitCompare className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-white">Compare 2 to 4 Shows</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-series radar graphs compare Storytelling, Production Value, Pacing, and Character Depth side-by-side in real-time.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-base text-white">Django REST Ready</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Backed by the Django REST API for catalog, account, review, and analytics data.
          </p>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-950 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Ready to explore verified reviews and streaming trends?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Sign in to access your account and the interactive dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="lg"
            onClick={() => openAuthModal('login')}
          >
            Sign In Now
          </Button>
        </div>
      </section>
    </div>
  );
};
