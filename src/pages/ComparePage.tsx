import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  Plus,
  X,
  Star,
  Check,
  Award,
  Sparkles,
  Tv,
  ArrowRight,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { Series } from '../types';
import { seriesApi } from '../services/api';
import { PlatformBadge, SentimentBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Default comparison ids
  const paramIds = searchParams.get('ids')?.split(',').filter(Boolean) || [
    'severance',
    'succession',
  ];

  useEffect(() => {
    const load = async () => {
      const all = await seriesApi.getAll();
      setAllSeries(all);

      const requestedSeries = await seriesApi.compareSeries(paramIds);
      if (requestedSeries.length === 1) {
        const secondSeries = all.find((series) => series.id !== requestedSeries[0].id);
        if (secondSeries) requestedSeries.push(secondSeries);
      }
      setSelectedSeries(requestedSeries.length > 0 ? requestedSeries : all.slice(0, 2));
    };
    load();
  }, [searchParams.get('ids')]);

  const updateIds = (next: Series[]) => {
    setSelectedSeries(next);
    const newIds = next.map((s) => s.id).join(',');
    setSearchParams({ ids: newIds });
  };

  const removeSeries = (id: string) => {
    if (selectedSeries.length <= 1) {
      alert('You must retain at least one series in comparison.');
      return;
    }
    const next = selectedSeries.filter((s) => s.id !== id);
    updateIds(next);
  };

  const addSeries = (series: Series) => {
    if (selectedSeries.some((s) => s.id === series.id)) return;
    if (selectedSeries.length >= 4) {
      alert('You can compare a maximum of 4 series side by side.');
      return;
    }
    const next = [...selectedSeries, series];
    updateIds(next);
    setIsAddModalOpen(false);
  };

  const colors = ['#f43f5e', '#38bdf8', '#10b981', '#fbbf24'];

  // Radar chart multi-series comparative data
  const dimensions = [
    { key: 'storytelling', label: 'Storytelling' },
    { key: 'production', label: 'Production' },
    { key: 'pacing', label: 'Pacing' },
    { key: 'characterDepth', label: 'Characters' },
    { key: 'soundtrack', label: 'Soundtrack' },
    { key: 'rewatchability', label: 'Rewatchability' },
  ];

  const radarComparativeData = dimensions.map((dim) => {
    const row: any = { subject: dim.label };
    selectedSeries.forEach((s) => {
      row[s.title] = s.radarMetrics ? s.radarMetrics[dim.key as keyof typeof s.radarMetrics] : 85;
    });
    return row;
  });

  // Bar chart comparing Rating and Positive Sentiment
  const barComparisonData = selectedSeries.map((s) => ({
    name: s.title,
    Rating: s.averageRating,
    SentimentPositive: s.totalReviews > 0 ? s.sentimentBreakdown.positive : null,
    Reviews: s.totalReviews,
  }));

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <GitCompare className="h-7 w-7 text-rose-500" />
            Compare OTT Series Head-to-Head
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare 2 to 4 series across storytelling dimensions, critic ratings, and sentiment density.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedSeries.length < 4 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Series to Compare ({selectedSeries.length}/4)
            </Button>
          ) : (
            <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              Max 4 Selected
            </span>
          )}
        </div>
      </div>

      {/* Series Cards Row */}
      <div
        className={`grid gap-4 ${
          selectedSeries.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : selectedSeries.length === 3
            ? 'grid-cols-1 md:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {selectedSeries.map((s, idx) => (
          <div
            key={s.id}
            className="relative rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 backdrop-blur-sm shadow-md"
            style={{ borderTopColor: colors[idx], borderTopWidth: '3px' }}
          >
            {/* Remove button */}
            <button
              onClick={() => removeSeries(s.id)}
              className="absolute top-3 right-3 p-1 rounded-md bg-slate-950/80 text-slate-400 hover:text-white transition-colors"
              title="Remove from comparison"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 pr-6">
              <img
                src={s.posterUrl}
                alt={s.title}
                className="h-16 w-12 object-cover rounded-md shadow-md"
              />
              <div className="min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-500">Network / Service</span>
                <PlatformBadge platform={s.platform} size="sm" />
                <h3 className="text-sm font-bold text-white truncate mt-1">{s.title}</h3>
                <span className="text-[11px] text-slate-400">
                  {s.releaseYear} · {s.seasons} Season{s.seasons > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Metrics snapshot */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">
                  Rating
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white text-sm">
                    {s.averageRating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500">/10</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">
                  Sentiment
                </span>
                <div className="mt-0.5 text-emerald-400 font-bold text-sm">
                  {s.totalReviews > 0 ? `${s.sentimentBreakdown.positive}% Pos` : 'N/A'}
                </div>
              </div>
            </div>

            <Link
              to={`/series/${s.id}`}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 w-full py-1.5 rounded-lg transition-colors"
            >
              Full Profile
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>

      {/* Interactive Charts: Multi-Series Radar & Direct Bar Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Comparison */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rose-500" />
                Multi-Dimensional Dimension Radar
              </h3>
              <p className="text-xs text-slate-400">
                Comparing Storytelling, Production, Pacing, and Character Depth
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarComparativeData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis stroke="#475569" angle={30} domain={[60, 100]} tick={false} />
                {selectedSeries.map((s, idx) => (
                  <Radar
                    key={s.id}
                    name={s.title}
                    dataKey={s.title}
                    stroke={colors[idx]}
                    fill={colors[idx]}
                    fillOpacity={0.25}
                  />
                ))}
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
                  verticalAlign="bottom"
                  formatter={(val) => (
                    <span className="text-xs text-slate-300 font-medium ml-1 mr-2">{val}</span>
                  )}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Comparison: Rating and Sentiment */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Overall Rating & Sentiment Metric Comparison
              </h3>
              <p className="text-xs text-slate-400">
                TVMaze rating or CinePulse review average vs review sentiment
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barComparisonData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" domain={[6, 10]} stroke="#64748b" fontSize={11} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[60, 100]}
                  stroke="#64748b"
                  fontSize={11}
                />
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
                  verticalAlign="bottom"
                  formatter={(val) => (
                    <span className="text-xs text-slate-300 font-medium ml-1 mr-2">{val}</span>
                  )}
                />
                <Bar
                  yAxisId="left"
                  dataKey="Rating"
                  name="Rating (Out of 10)"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="SentimentPositive"
                  name="Positive Sentiment %"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Granular Comparison Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm space-y-4">
        <h3 className="text-base font-bold text-white">Side-by-Side Matrix Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-40">Dimension</th>
                {selectedSeries.map((s) => (
                  <th key={s.id} className="py-3 px-4">
                    {s.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-400">Network / Service</td>
                {selectedSeries.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    <PlatformBadge platform={s.platform} size="sm" />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-400">Genres</td>
                {selectedSeries.map((s) => (
                  <td key={s.id} className="py-3 px-4 text-slate-300">
                    {s.genres.join(', ')}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-400">Seasons & Episodes</td>
                {selectedSeries.map((s) => (
                  <td key={s.id} className="py-3 px-4 font-mono text-slate-300">
                    {s.seasons} Seasons ({s.episodes} eps)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-400">Average Rating</td>
                {selectedSeries.map((s) => (
                  <td key={s.id} className="py-3 px-4 font-bold text-amber-400 text-sm">
                    {s.averageRating.toFixed(1)} / 10
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-400">Sentiment Density</td>
                {selectedSeries.map((s) => (
                  <td key={s.id} className="py-3 px-4">
                    {s.totalReviews > 0 ? <>
                      <span className="text-emerald-400 font-bold">{s.sentimentBreakdown.positive}% Pos</span>{' '}
                      · <span className="text-slate-400">{s.sentimentBreakdown.neutral}% Neu</span>
                    </> : <span className="text-slate-500">No reviews yet</span>}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-400">Total Reviews</td>
                {selectedSeries.map((s) => (
                  <td key={s.id} className="py-3 px-4 font-mono text-slate-300">
                    {s.totalReviews} verified reviews
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-400">Key Strengths</td>
                {selectedSeries.map((s) => (
                  <td key={s.id} className="py-3 px-4 text-[11px] text-slate-300">
                    Pacing ({s.radarMetrics?.pacing}/100), Storytelling ({s.radarMetrics?.storytelling}/100)
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Series Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Select Series to Compare"
        description="Choose another OTT series from the catalog to add to the side-by-side analysis."
        maxWidth="lg"
      >
        <div className="space-y-4 pt-2">
          <input
            type="text"
            placeholder="Search series title or platform..."
            value={modalSearch}
            onChange={(e) => setModalSearch(e.target.value)}
            className="w-full h-9 rounded-lg bg-slate-950 border border-slate-700 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />

          <div className="max-h-72 overflow-y-auto space-y-2">
            {allSeries
              .filter(
                (s) =>
                  !selectedSeries.some((sel) => sel.id === s.id) &&
                  (modalSearch === '' ||
                    s.title.toLowerCase().includes(modalSearch.toLowerCase()) ||
                    s.platform.toLowerCase().includes(modalSearch.toLowerCase()))
              )
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={s.posterUrl}
                      alt={s.title}
                      className="h-10 w-8 object-cover rounded"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">{s.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <PlatformBadge platform={s.platform} size="sm" />
                        <span>·</span>
                        <span className="text-amber-400 font-bold">★ {s.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <Button size="sm" variant="secondary" onClick={() => addSeries(s)}>
                    Select
                  </Button>
                </div>
              ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button size="sm" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
