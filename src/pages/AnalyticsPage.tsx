import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Award,
  MessageSquare,
  Star,
  Tv,
  Film,
  Download,
  Filter,
  PieChart as PieIcon,
  Activity,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { AnalyticsOverview, Series } from '../types';
import { analyticsApi, seriesApi } from '../services/api';
import { PlatformBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [topSeries, setTopSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'12m' | '6m' | '3m'>('12m');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [overviewData, allSeries] = await Promise.all([
        analyticsApi.getOverview(),
        seriesApi.getAll({ sortBy: 'rating' }),
      ]);
      setAnalytics(overviewData);
      setTopSeries(allSeries);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleExportCSV = () => {
    if (!analytics || !topSeries) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Title,Platform,ReleaseYear,TVMazeRating\n';

    topSeries.forEach((s) => {
      csvContent += `"${s.title}","${s.platform}",${s.releaseYear},${s.averageRating}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ottintel_analytics_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const recentMonths = analytics.reviewsOverTime.slice(-2);
  const previousMonthReviews = recentMonths[0]?.totalReviews || 0;
  const currentMonthReviews = recentMonths[1]?.totalReviews || 0;
  const monthOverMonthChange = previousMonthReviews
    ? Math.round(((currentMonthReviews - previousMonthReviews) / previousMonthReviews) * 100)
    : 0;
  const monthOverMonthLabel = previousMonthReviews
    ? `${monthOverMonthChange > 0 ? '+' : ''}${monthOverMonthChange}% MoM`
    : currentMonthReviews
      ? 'New activity'
      : analytics.totalReviews
        ? 'No recent activity'
        : 'No history';

  // Sentiment donut data
  const sentimentData = [
    {
      name: 'Positive',
      value: analytics.sentimentDistribution.positiveCount,
      percentage: analytics.sentimentDistribution.positive,
      color: '#10b981',
    },
    {
      name: 'Neutral',
      value: analytics.sentimentDistribution.neutralCount,
      percentage: analytics.sentimentDistribution.neutral,
      color: '#f59e0b',
    },
    {
      name: 'Critical / Negative',
      value: analytics.sentimentDistribution.negativeCount,
      percentage: analytics.sentimentDistribution.negative,
      color: '#f43f5e',
    },
  ];
  const platformReviewData = analytics.platformAnalysis.filter((item) => item.totalReviews > 0);
  const genreReviewData = analytics.genreAnalysis.filter((item) => item.reviewCount > 0);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header with Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-rose-500" />
            OTT Review & Sentiment Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live TVMaze catalog ratings alongside sentiment from reviews submitted to OTTIntel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export CSV Dataset
          </Button>
        </div>
      </div>

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Series */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">TVMaze Titles Loaded</span>
            <Film className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{topSeries.length}</span>
            <span className="text-xs text-emerald-400 font-medium">Live Results</span>
          </div>
          <p className="text-[11px] text-slate-500">From the current TVMaze search set</p>
        </div>

        {/* KPI 2: Total Reviews */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Reviews Analyzed</span>
            <MessageSquare className="h-4 w-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {analytics.totalReviews.toLocaleString()}
            </span>
            <span className={`text-xs font-medium ${monthOverMonthChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {monthOverMonthLabel}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Reviews submitted by OTTIntel users</p>
        </div>

        {/* KPI 3: Average Rating */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Platform Mean Rating</span>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {analytics.totalReviews ? analytics.overallAverageRating.toFixed(2) : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 font-mono">/10</span>
          </div>
          <p className="text-[11px] text-slate-500">Mean rating from OTTIntel reviews</p>
        </div>

        {/* KPI 4: Positive Sentiment Ratio */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Positive Sentiment</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">
              {analytics.totalReviews ? `${analytics.sentimentDistribution.positive}%` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({analytics.sentimentDistribution.positiveCount})
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {analytics.totalReviews
              ? `${analytics.sentimentDistribution.negative}% categorized as critical/negative`
              : 'No OTTIntel reviews submitted yet'}
          </p>
        </div>
      </div>

      {/* Row 1: Sentiment Donut & Rating Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Donut Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-rose-500" />
                OTTIntel Review Sentiment
              </h3>
              <p className="text-xs text-slate-400">
                Sentiment from reviews submitted to OTTIntel
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
              {analytics.totalReviews ? `${analytics.totalReviews} Reviews` : 'No Reviews Yet'}
            </span>
          </div>

          <div className="h-64 w-full">
            {analytics.totalReviews ? <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val} reviews (${item.payload.percentage}%)`,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value, entry: any) => (
                    <span className="text-xs text-slate-300 font-medium ml-1">
                      {value} ({entry.payload.percentage}%)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-xs text-slate-500">No OTTIntel reviews yet.</div>}
          </div>
        </div>

        {/* Rating Score Frequency Distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                Overall Rating Histogram
              </h3>
              <p className="text-xs text-slate-400">
                Frequency count per rating point (1–10)
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">10 pt Scale</span>
          </div>

          <div className="h-64 w-full">
            {analytics.totalReviews ? <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.ratingHistogram}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="rating"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(val) => `${val}★`}
                  tickLine={false}
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val} reviews`, 'Frequency']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {analytics.ratingHistogram.map((entry, index) => (
                    <Cell
                      key={`hist-${index}`}
                      fill={entry.rating >= 8 ? '#f43f5e' : entry.rating >= 6 ? '#f59e0b' : '#64748b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-xs text-slate-500">No OTTIntel ratings yet.</div>}
          </div>
        </div>
      </div>

      {/* Row 2: Reviews Velocity Over Time */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-rose-500" />
              Review Volume & Sentiment Velocity Over Time
            </h3>
            <p className="text-xs text-slate-400">
              Monthly review count and positive sentiment momentum (Past 12 months)
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="px-2 py-0.5 text-slate-400 font-mono text-[11px]">Monthly Aggregate</span>
          </div>
        </div>

        <div className="h-72 w-full">
          {analytics.totalReviews ? <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={analytics.reviewsOverTime}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                formatter={(val) => <span className="text-xs text-slate-300 font-medium">{val}</span>}
              />
              <Area
                type="monotone"
                dataKey="totalReviews"
                name="Total Reviews"
                stroke="#e11d48"
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="positive"
                name="Positive Reviews"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorPos)"
              />
            </AreaChart>
          </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-xs text-slate-500">No OTTIntel review history yet.</div>}
        </div>
      </div>

      {/* Row 3: Platform Comparison & Genre Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Comparison */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tv className="h-4 w-4 text-rose-500" />
                Network / Service Review Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Ratings and sentiment grouped by the series network or service
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics.totalReviews ? <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={platformReviewData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="platform" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis
                  domain={[0, 10]}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val}/10`, 'Average Rating']}
                />
                <Bar dataKey="avgRating" radius={[4, 4, 0, 0]}>
                  {platformReviewData.map((p, idx) => (
                    <Cell key={`plat-${idx}`} fill={p.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-xs text-slate-500">No platform review data yet.</div>}
          </div>
        </div>

        {/* Genre Performance */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="h-4 w-4 text-rose-500" />
                Genre Review Breakdown
              </h3>
              <p className="text-xs text-slate-400">
                OTTIntel review ratings and volume across genres
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics.totalReviews ? <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={genreReviewData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" domain={[0, 10]} stroke="#64748b" fontSize={11} />
                <YAxis
                  dataKey="genre"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val}/10`, 'Avg Score']}
                />
                <Bar dataKey="avgRating" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer> : <div className="h-full flex items-center justify-center text-xs text-slate-500">No genre review data yet.</div>}
          </div>
        </div>
      </div>

      {/* Top Series Leaderboard Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              Live TVMaze Series Snapshot
            </h3>
            <p className="text-xs text-slate-400">
              Live TVMaze ratings and metadata; OTTIntel review analytics are shown above
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {topSeries.length} Live Results
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Series Title</th>
                <th className="py-3 px-3">Platform</th>
                <th className="py-3 px-3">Year</th>
                <th className="py-3 px-3">TVMaze Rating</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topSeries.map((s, idx) => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3 font-medium text-white flex items-center gap-2.5">
                    <img
                      src={s.posterUrl}
                      alt={s.title}
                      className="h-8 w-6 object-cover rounded shadow-sm"
                    />
                    <Link
                      to={`/series/${s.id}`}
                      className="group-hover:text-rose-400 transition-colors font-semibold"
                    >
                      {s.title}
                    </Link>
                  </td>
                  <td className="py-3 px-3">
                    <PlatformBadge platform={s.platform} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{s.releaseYear}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1 font-bold text-amber-400">
                      <Star className="h-3.5 w-3.5 fill-amber-400" />
                      <span>{s.averageRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/series/${s.id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Analyze
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
