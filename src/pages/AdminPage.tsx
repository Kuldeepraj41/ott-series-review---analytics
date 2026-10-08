import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Film,
  MessageSquare,
  Users,
  Server,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Download,
  Star,
  ExternalLink,
  Lock,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi, seriesApi } from '../services/api';
import { Series, Review, UserProfile, Platform, Genre, SentimentType } from '../types';
import { PlatformBadge, SentimentBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';

export const AdminPage: React.FC = () => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'series' | 'reviews' | 'users' | 'system'>('series');
  const [stats, setStats] = useState<any>(null);
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Series Search and Platform filter
  const [seriesSearch, setSeriesSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');

  // Add/Edit Series Modal
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPlatform, setFormPlatform] = useState<Platform>('Netflix');
  const [formGenres, setFormGenres] = useState<string>('Sci-Fi, Drama');
  const [formYear, setFormYear] = useState<number>(2024);
  const [formSeasons, setFormSeasons] = useState<number>(1);
  const [formEpisodes, setFormEpisodes] = useState<number>(8);
  const [formAgeRating, setFormAgeRating] = useState('TV-MA');
  const [formCreator, setFormCreator] = useState('');
  const [formCast, setFormCast] = useState('');
  const [formPosterUrl, setFormPosterUrl] = useState('');
  const [formBackdropUrl, setFormBackdropUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Review search & sentiment filter
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewSentimentFilter, setReviewSentimentFilter] = useState<string>('all');

  // Accredit Critic Modal
  const [isCriticModalOpen, setIsCriticModalOpen] = useState(false);
  const [criticName, setCriticName] = useState('');
  const [criticEmail, setCriticEmail] = useState('');
  const [criticRole, setCriticRole] = useState('Senior Critic & Editorial Lead');
  const [criticOutlet, setCriticOutlet] = useState('');
  const [criticBio, setCriticBio] = useState('');
  const [criticError, setCriticError] = useState('');

  // User search & filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'critics' | 'audience'>('all');

  // Status banners
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [st, series, revs, users] = await Promise.all([
      adminApi.getStats(),
      adminApi.getAllSeries(),
      adminApi.getAllReviews(),
      adminApi.getAllUsers(),
    ]);
    setStats(st);
    setAllSeries(series);
    setAllReviews(revs);
    setAllUsers(users);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showBanner = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // If not logged in as Admin, show elevation screen
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-16 text-center space-y-5 p-8 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl">
        <div className="h-14 w-14 rounded-2xl bg-rose-600/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400">
            This console is restricted to OTTIntel platform operators and review integrity managers.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => openAuthModal('login')}
        >
          <ShieldCheck className="h-4 w-4" />
          Sign in as administrator
        </Button>
      </div>
    );
  }

  // Handle Series Save (Create or Update)
  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Please enter a title.');
      return;
    }

    const parsedGenres = formGenres
      .split(',')
      .map((g) => g.trim() as Genre)
      .filter(Boolean);

    const parsedCast = formCast
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const poster =
      formPosterUrl.trim() ||
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=700&q=80';
    const backdrop =
      formBackdropUrl.trim() ||
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1400&q=80';

    if (editingSeriesId) {
      await adminApi.updateSeries(editingSeriesId, {
        title: formTitle,
        tagline: formTagline,
        description: formDesc,
        platform: formPlatform,
        genres: parsedGenres,
        releaseYear: formYear,
        seasons: formSeasons,
        episodes: formEpisodes,
        ageRating: formAgeRating,
        creator: formCreator,
        cast: parsedCast,
        posterUrl: poster,
        backdropUrl: backdrop,
      });
      showBanner(`Updated series "${formTitle}" successfully.`);
    } else {
      await adminApi.createSeries({
        title: formTitle,
        tagline: formTagline,
        description: formDesc,
        platform: formPlatform,
        genres: parsedGenres,
        releaseYear: formYear,
        seasons: formSeasons,
        episodes: formEpisodes,
        ageRating: formAgeRating,
        creator: formCreator,
        cast: parsedCast,
        posterUrl: poster,
        backdropUrl: backdrop,
        isTrending: true,
      });
      showBanner(`Created and published new series "${formTitle}".`);
    }

    setIsSeriesModalOpen(false);
    loadData();
  };

  const openCreateModal = () => {
    setEditingSeriesId(null);
    setFormTitle('');
    setFormTagline('');
    setFormDesc('');
    setFormPlatform('Netflix');
    setFormGenres('Sci-Fi, Drama');
    setFormYear(2025);
    setFormSeasons(1);
    setFormEpisodes(8);
    setFormAgeRating('TV-MA');
    setFormCreator('');
    setFormCast('');
    setFormPosterUrl('');
    setFormBackdropUrl('');
    setFormError('');
    setIsSeriesModalOpen(true);
  };

  const openEditModal = (s: Series) => {
    setEditingSeriesId(s.id);
    setFormTitle(s.title);
    setFormTagline(s.tagline);
    setFormDesc(s.description);
    setFormPlatform(s.platform);
    setFormGenres(s.genres.join(', '));
    setFormYear(s.releaseYear);
    setFormSeasons(s.seasons);
    setFormEpisodes(s.episodes);
    setFormAgeRating(s.ageRating);
    setFormCreator(s.creator);
    setFormCast(s.cast.join(', '));
    setFormPosterUrl(s.posterUrl);
    setFormBackdropUrl(s.backdropUrl);
    setFormError('');
    setIsSeriesModalOpen(true);
  };

  const handleDeleteSeries = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      await adminApi.deleteSeries(id);
      showBanner(`Removed "${title}" from the OTT catalog.`);
      loadData();
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (window.confirm('Delete this review for violation of review standards?')) {
      await adminApi.deleteReview(id);
      showBanner('Review removed by administrator.');
      loadData();
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await adminApi.updateUserRole(userId, newRole);
    showBanner(`Updated user role to "${newRole}".`);
    loadData();
  };

  const handleDeleteUser = async (target: UserProfile) => {
    if (target.isAdmin || target.id === user?.id) return;
    if (!window.confirm(`Permanently delete ${target.name} (${target.email}) and their reviews?`)) return;

    try {
      const deleted = await adminApi.deleteUser(target.id);
      if (!deleted) {
        showBanner(`Could not find ${target.name}.`);
        return;
      }
      showBanner(`Deleted ${target.name} and their account data.`);
      await loadData();
    } catch (error) {
      showBanner(error instanceof Error ? error.message : `Could not delete ${target.name}.`);
    }
  };

  const handleCreateCritic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criticName.trim() || !criticEmail.includes('@')) {
      setCriticError('Valid name and email are required.');
      return;
    }
    await adminApi.createCriticUser({
      name: criticName,
      email: criticEmail,
      role: criticRole,
      criticOutlet: criticOutlet || 'OTTIntel Accredited Press',
      bio: criticBio,
    });
    showBanner(`Accredited and created certified critic account for "${criticName}".`);
    setIsCriticModalOpen(false);
    setCriticName('');
    setCriticEmail('');
    setCriticOutlet('');
    setCriticBio('');
    setCriticError('');
    loadData();
  };

  const handleApproveVerification = async (userId: string, name: string) => {
    await adminApi.approveCriticVerification(userId);
    showBanner(`Granted certified critic credentials to ${name}.`);
    loadData();
  };

  const handleExportDatabase = () => {
    const dump = {
      series: allSeries,
      reviews: allReviews,
      users: allUsers,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ottintel_database_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSeries = allSeries.filter((s) => {
    const matchSearch =
      seriesSearch === '' ||
      s.title.toLowerCase().includes(seriesSearch.toLowerCase()) ||
      s.creator.toLowerCase().includes(seriesSearch.toLowerCase());
    const matchPlatform = selectedPlatform === 'All' || s.platform === selectedPlatform;
    return matchSearch && matchPlatform;
  });

  const filteredReviews = allReviews.filter((r) => {
    const matchSearch =
      reviewSearch === '' ||
      r.seriesTitle.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.authorName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.content.toLowerCase().includes(reviewSearch.toLowerCase());
    const matchSentiment =
      reviewSentimentFilter === 'all' || r.sentiment === reviewSentimentFilter;
    return matchSearch && matchSentiment;
  });

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Banner Message */}
      {actionMessage ? (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 font-bold">
            ×
          </button>
        </div>
      ) : null}

      {/* Header and Global Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="h-7 w-7 text-rose-500" />
              Platform Administration Console
            </h1>
            <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold uppercase">
              Root Level
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage OTT titles, moderate sentiment analyses, govern critic privileges, and audit system integrity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportDatabase}>
            <Download className="h-3.5 w-3.5" />
            Export JSON Dump
          </Button>

          <Button variant="primary" size="sm" onClick={openCreateModal}>
            <Plus className="h-3.5 w-3.5" />
            Add New Series
          </Button>
        </div>
      </div>

      {/* 4 Quick KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 backdrop-blur-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Series Managed
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{allSeries.length}</span>
            <Film className="h-4 w-4 text-rose-500" />
          </div>
          <span className="text-[11px] text-slate-500">Active across 6 streaming platforms</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 backdrop-blur-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Active Reviews in DB
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{allReviews.length}</span>
            <MessageSquare className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-[11px] text-slate-500">Live NLP sentiment scores applied</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 backdrop-blur-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Flagged Review Queue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400">
              {stats?.flaggedReviews || 0}
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-[11px] text-slate-500">Reviews exceeding downvote threshold</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-1 backdrop-blur-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Critic & User Accounts
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{allUsers.length}</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <span className="text-[11px] text-slate-500">Authenticated critic profiles</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('series')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'series'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="h-4 w-4" />
          Series Catalog ({allSeries.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Review Moderation ({allReviews.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Critics & Permissions ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'system'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="h-4 w-4" />
          System & API Health
        </button>
      </div>

      {/* TAB 1: Series Catalog Management */}
      {activeTab === 'series' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={seriesSearch}
                onChange={(e) => setSeriesSearch(e.target.value)}
                placeholder="Search catalog by title or creator..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="h-8 rounded-lg bg-slate-950 border border-slate-800 px-3 text-xs text-slate-300"
              >
                <option value="All">All Platforms</option>
                <option value="Netflix">Netflix</option>
                <option value="HBO Max">HBO Max</option>
                <option value="Apple TV+">Apple TV+</option>
                <option value="Prime Video">Prime Video</option>
                <option value="Hulu">Hulu</option>
                <option value="Disney+">Disney+</option>
              </select>

              <Button size="sm" variant="primary" onClick={openCreateModal}>
                <Plus className="h-3.5 w-3.5" />
                New Show
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Platform</th>
                    <th className="py-3 px-3">Year / Seasons</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Sentiment</th>
                    <th className="py-3 px-3">Reviews</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSeries.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.posterUrl}
                            alt={s.title}
                            className="h-10 w-8 object-cover rounded shadow-sm shrink-0"
                          />
                          <div>
                            <Link
                              to={`/series/${s.id}`}
                              className="font-bold text-white hover:text-rose-400 transition-colors"
                            >
                              {s.title}
                            </Link>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">
                              {s.genres.join(', ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <PlatformBadge platform={s.platform} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {s.releaseYear} · {s.seasons} Season{s.seasons > 1 ? 's' : ''}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 font-bold text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{s.averageRating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-emerald-400">
                          {s.sentimentBreakdown.positive}% Pos
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{s.totalReviews}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Edit Series"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSeries(s.id, s.title)}
                            className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300"
                            title="Delete Series"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 2: Review Moderation Queue */}
      {activeTab === 'reviews' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search reviews by show, author, or content..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <select
              value={reviewSentimentFilter}
              onChange={(e) => setReviewSentimentFilter(e.target.value)}
              className="h-8 rounded-lg bg-slate-950 border border-slate-800 px-3 text-xs text-slate-300"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive Only</option>
              <option value="neutral">Neutral Only</option>
              <option value="negative">Critical Only</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{rev.seriesTitle}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-xs text-slate-300">{rev.authorName}</span>
                      {rev.authorRole ? (
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                          {rev.authorRole}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <SentimentBadge sentiment={rev.sentiment} />
                    <span className="text-amber-400 font-bold text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      ★ {rev.rating}/10
                    </span>
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-950/60 rounded transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200">{rev.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rev.content}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                  <span>Helpful: {rev.helpfulCount} | Unhelpful: {rev.unhelpfulCount}</span>
                  {rev.unhelpfulCount > 5 ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Flagged by community
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* TAB 3: User & Critic Permissions */}
      {activeTab === 'users' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users or critics by name, email, or role..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                className="h-8 rounded-lg bg-slate-950 border border-slate-800 px-3 text-xs text-slate-300"
              >
                <option value="all">All Users & Critics ({allUsers.length})</option>
                <option value="critics">Certified Critics ({allUsers.filter((u) => u.isCertifiedCritic).length})</option>
                <option value="audience">Community Audience ({allUsers.filter((u) => !u.isCertifiedCritic).length})</option>
              </select>

              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsCriticModalOpen(true)}
              >
                <Award className="h-3.5 w-3.5" />
                + Accredit New Critic
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 uppercase font-mono text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Authority Status</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4 text-right">Access Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allUsers
                    .filter((u) => {
                      const matchSearch =
                        userSearch === '' ||
                        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.role.toLowerCase().includes(userSearch.toLowerCase());
                      const matchRole =
                        userRoleFilter === 'all' ||
                        (userRoleFilter === 'critics' && u.isCertifiedCritic) ||
                        (userRoleFilter === 'audience' && !u.isCertifiedCritic);
                      return matchSearch && matchRole;
                    })
                    .map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="h-8 w-8 rounded-full object-cover border border-slate-700"
                          />
                          <div>
                            <span className="font-semibold text-white block">{u.name}</span>
                            <span className="text-[10px] text-slate-500">Joined {u.joinedDate}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{u.email}</td>
                      <td className="py-3 px-4">
                        {u.isCertifiedCritic ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/80 text-amber-300">
                            <Award className="h-3 w-3 text-amber-400" />
                            Certified Critic {u.criticOutlet ? `· ${u.criticOutlet}` : ''}
                          </span>
                        ) : u.verificationStatus === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[10px] px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300">
                            <AlertTriangle className="h-3 w-3 text-rose-400" />
                            Pending Verification
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            <Users className="h-3 w-3 text-sky-400" />
                            Community Reviewer
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!u.isCertifiedCritic ? (
                            <button
                              onClick={() => handleApproveVerification(u.id, u.name)}
                              className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[11px] font-semibold transition-colors"
                            >
                              Grant Critic Status
                            </button>
                          ) : null}

                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="h-7 text-[11px] rounded bg-slate-950 border border-slate-700 px-2 text-slate-200"
                          >
                            <option value="Platform Administrator">Platform Administrator</option>
                            <option value="Senior Critic & Editorial Lead">
                              Senior Critic & Editorial Lead
                            </option>
                            <option value="Sentiment Data Scientist">Sentiment Data Scientist</option>
                            <option value="Staff Critic">Staff Critic</option>
                            <option value="Community Reviewer">Community Reviewer</option>
                            <option value="Verified Binge Watcher">Verified Binge Watcher</option>
                          </select>
                          {!u.isAdmin && u.id !== user?.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="inline-flex items-center gap-1 rounded border border-rose-800 px-2 py-1 text-[11px] font-semibold text-rose-300 transition-colors hover:bg-rose-950/70 hover:text-white"
                              aria-label={`Delete user ${u.name}`}
                              title={`Delete ${u.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 4: System & API Health */}
      {activeTab === 'system' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" />
              REST API Endpoints & Health Check
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span> /api/v1/series/
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Catalog list with sentiment breakdown
                  </p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold">GET</span> /api/v1/analytics/overview/
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Aggregated sentiment density & platform stats
                  </p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">POST</span> /api/v1/reviews/create/
                  <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                    Critic review ingestion with auto NLP sentiment tagging
                  </p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-rose-500" />
              Database Operations
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Catalog, review, and account records are managed through the Django REST API.
                Export a JSON copy before making bulk changes.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add / Edit Series Modal */}
      <Modal
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        title={editingSeriesId ? 'Edit Series Information' : 'Add New OTT Series'}
        description="Provide metadata, platform distribution, and streaming details."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveSeries} className="space-y-4 pt-2">
          {formError ? (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {formError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Series Title *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Severance"
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Streaming Platform
              </label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value as any)}
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="Netflix">Netflix</option>
                <option value="HBO Max">HBO Max</option>
                <option value="Apple TV+">Apple TV+</option>
                <option value="Prime Video">Prime Video</option>
                <option value="Hulu">Hulu</option>
                <option value="Disney+">Disney+</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Tagline</label>
            <input
              type="text"
              value={formTagline}
              onChange={(e) => setFormTagline(e.target.value)}
              placeholder="e.g. Please do not attempt to remember this."
              className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description / Synopsis
            </label>
            <textarea
              rows={3}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Synopsis of the series..."
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Year</label>
              <input
                type="number"
                value={formYear}
                onChange={(e) => setFormYear(parseInt(e.target.value))}
                className="w-full h-8 px-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Seasons</label>
              <input
                type="number"
                value={formSeasons}
                onChange={(e) => setFormSeasons(parseInt(e.target.value))}
                className="w-full h-8 px-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Episodes</label>
              <input
                type="number"
                value={formEpisodes}
                onChange={(e) => setFormEpisodes(parseInt(e.target.value))}
                className="w-full h-8 px-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Age Rating</label>
              <input
                type="text"
                value={formAgeRating}
                onChange={(e) => setFormAgeRating(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Genres (Comma Separated)
              </label>
              <input
                type="text"
                value={formGenres}
                onChange={(e) => setFormGenres(e.target.value)}
                placeholder="Sci-Fi, Thriller, Drama"
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Creator</label>
              <input
                type="text"
                value={formCreator}
                onChange={(e) => setFormCreator(e.target.value)}
                placeholder="e.g. Dan Erickson"
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Cast Members (Comma Separated)
            </label>
            <input
              type="text"
              value={formCast}
              onChange={(e) => setFormCast(e.target.value)}
              placeholder="Adam Scott, Patricia Arquette, John Turturro"
              className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Poster Image URL
              </label>
              <input
                type="url"
                value={formPosterUrl}
                onChange={(e) => setFormPosterUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Backdrop Banner URL
              </label>
              <input
                type="url"
                value={formBackdropUrl}
                onChange={(e) => setFormBackdropUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSeriesModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingSeriesId ? 'Save Changes' : 'Publish Series'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Accredit Critic Modal */}
      <Modal
        isOpen={isCriticModalOpen}
        onClose={() => setIsCriticModalOpen(false)}
        title="Accredit & Create Certified Critic Account"
        description="Provision an accredited critic profile with verified review authority."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCritic} className="space-y-4 pt-2">
          {criticError ? (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {criticError}
            </div>
          ) : null}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Critic Full Name *
            </label>
            <input
              type="text"
              required
              value={criticName}
              onChange={(e) => setCriticName(e.target.value)}
              placeholder="e.g. Rachel Weisz"
              className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={criticEmail}
              onChange={(e) => setCriticEmail(e.target.value)}
              placeholder="critic@pressoutlet.com"
              className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Publication / Outlet
              </label>
              <input
                type="text"
                value={criticOutlet}
                onChange={(e) => setCriticOutlet(e.target.value)}
                placeholder="e.g. IndieWire, Screen Rant"
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Critic Rank / Title
              </label>
              <select
                value={criticRole}
                onChange={(e) => setCriticRole(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="Senior Critic & Editorial Lead">Senior Critic & Editorial Lead</option>
                <option value="Staff Critic">Staff Critic</option>
                <option value="Sentiment Data Scientist">Sentiment Data Scientist</option>
                <option value="Certified Critic">Certified Critic</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Biography / Press Credentials
            </label>
            <textarea
              rows={2}
              value={criticBio}
              onChange={(e) => setCriticBio(e.target.value)}
              placeholder="Accreditation details, television focus..."
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCriticModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              <Award className="h-3.5 w-3.5" />
              Accredit Critic
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
