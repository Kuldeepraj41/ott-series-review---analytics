import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  Bookmark,
  Star,
  MessageSquare,
  Settings,
  Trash2,
  ExternalLink,
  Plus,
  Tv,
  Edit2,
  Check,
  Server,
  ShieldCheck,
  Award,
  Users,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Review, Series } from '../types';
import { authApi, reviewsApi, seriesApi } from '../services/api';
import { PlatformBadge, SentimentBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const ProfilePage: React.FC = () => {
  const {
    user,
    isAuthenticated,
    logout,
    toggleWatchlist,
    updateWatchlistStatus,
    rateSeries,
    updateProfile,
    openAuthModal,
    requestCriticVerification,
    isCritic,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'reviews';

  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [seriesCatalog, setSeriesCatalog] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit bio state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Critic verification application state
  const [isApplyingCritic, setIsApplyingCritic] = useState(false);
  const [applicationOutlet, setApplicationOutlet] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const load = async () => {
      setIsLoading(true);
      const [revs, series] = await Promise.all([
        reviewsApi.getUserReviews(user?.name),
        seriesApi.getAll(),
      ]);
      setUserReviews(revs);
      setSeriesCatalog(series);
      setIsLoading(false);
    };
    load();
  }, [isAuthenticated, user?.name]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4 p-8 rounded-2xl border border-slate-800 bg-slate-900/80">
        <User className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In to View Your Profile</h2>
        <p className="text-xs text-slate-400">
          Access your personal reviews, custom watchlist, and ratings history.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={() => openAuthModal('login')}>
            Sign In
          </Button>
          <Button variant="secondary" size="md" onClick={() => openAuthModal('register')}>
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Are you sure you want to remove this review?')) {
      await reviewsApi.deleteReview(reviewId);
      setUserReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ name: editName, bio: editBio });
    setIsEditingBio(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password changed successfully.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Unable to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Watchlist detailed items
  const watchlistItems = user.watchlist.map((w) => {
    const s = seriesCatalog.find((item) => item.id === w.seriesId);
    return { ...w, series: s };
  }).filter((w) => w.series !== undefined);

  // Rated detailed items
  const ratedItems = user.ratings.map((r) => {
    const s = seriesCatalog.find((item) => item.id === r.seriesId);
    return { ...r, series: s };
  }).filter((r) => r.series !== undefined);

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Profile Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="h-20 w-20 rounded-2xl object-cover border-2 border-rose-500 shadow-xl"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {user.name}
                </h1>
                {isCritic ? (
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <Award className="h-3 w-3 text-amber-400" />
                    Certified Critic {user.criticOutlet ? `· ${user.criticOutlet}` : ''}
                  </span>
                ) : user.verificationStatus === 'pending' ? (
                  <span className="text-[10px] font-mono uppercase bg-amber-950/60 text-amber-300 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-amber-400" />
                    Accreditation Pending
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                    <Users className="h-3 w-3 text-sky-400" />
                    Community Reviewer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              <p className="text-xs text-slate-300 max-w-xl">{user.bio}</p>

              {/* Critic Accreditation application status / CTA */}
              {!isCritic && (
                <div className="pt-2">
                  {user.verificationStatus === 'pending' || appliedSuccess ? (
                    <div className="inline-flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800/80 text-[11px] text-amber-300">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span>Critic application submitted. Pending administrator accreditation.</span>
                    </div>
                  ) : isApplyingCritic ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 max-w-md">
                      <input
                        type="text"
                        value={applicationOutlet}
                        onChange={(e) => setApplicationOutlet(e.target.value)}
                        placeholder="Your publication or outlet (e.g. Medium, RottenTomatoes)"
                        className="flex-1 h-7 rounded bg-slate-950 border border-slate-700 px-2 text-xs text-white placeholder:text-slate-500"
                      />
                      <button
                        onClick={async () => {
                          if (!applicationOutlet.trim()) return;
                          await requestCriticVerification(applicationOutlet);
                          setAppliedSuccess(true);
                          setIsApplyingCritic(false);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setIsApplyingCritic(false)}
                        className="text-xs text-slate-400 hover:text-white px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsApplyingCritic(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Are you a press or verified reviewer? Apply for Critic Accreditation →</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-stretch sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(user.name);
                setEditBio(user.bio);
                setIsEditingBio(!isEditingBio);
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
              {isEditingBio ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-slate-500 font-mono">
            Joined {user.joinedDate}
          </span>
        </div>
      </div>

      {/* Edit Bio Form (Collapsible) */}
      {isEditingBio ? (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-xl border border-rose-500/40 bg-slate-900/90 p-5 space-y-3"
        >
          <h3 className="text-sm font-bold text-white">Update Critic Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bio & Credentials</label>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full h-8 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditingBio(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      ) : null}

      <form
        onSubmit={handleChangePassword}
        className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4"
      >
        <div>
          <h3 className="text-sm font-bold text-white">Change Password</h3>
          <p className="mt-1 text-xs text-slate-400">Choose a unique password with at least 8 characters.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Current password"
            aria-label="Current password"
            className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white"
          />
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            aria-label="New password"
            className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white"
          />
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white"
          />
        </div>
        {passwordError && <p role="alert" className="text-xs text-rose-400">{passwordError}</p>}
        {passwordMessage && <p role="status" className="text-xs text-emerald-400">{passwordMessage}</p>}
        <div className="flex justify-end">
          <Button size="sm" variant="outline" disabled={isChangingPassword}>
            {isChangingPassword ? 'Changing…' : 'Update Password'}
          </Button>
        </div>
      </form>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setSearchParams({ tab: 'reviews' })}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'reviews'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          My Reviews ({userReviews.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'watchlist' })}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'watchlist'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          My Watchlist ({user.watchlist.length})
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'ratings' })}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'ratings'
              ? 'border-rose-500 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="h-4 w-4" />
          My Ratings ({user.ratings.length})
        </button>
      </div>

      {/* Tab 1: My Reviews */}
      {activeTab === 'reviews' ? (
        <div className="space-y-4">
          {userReviews.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                You haven't posted any reviews yet.
              </p>
              <p className="text-xs text-slate-500">
                Visit any series details page to submit your first analysis.
              </p>
              <Link to="/">
                <Button size="sm" variant="secondary" className="mt-2">
                  Browse Series Catalog
                </Button>
              </Link>
            </div>
          ) : (
            userReviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/series/${rev.seriesId}`}
                      className="text-base font-bold text-white hover:text-rose-400 transition-colors"
                    >
                      {rev.seriesTitle}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>
                        Posted on{' '}
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <SentimentBadge sentiment={rev.sentiment} />
                    <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-white">{rev.rating}/10</span>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-200">{rev.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {rev.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Helpful votes: {rev.helpfulCount}</span>
                  <Link
                    to={`/series/${rev.seriesId}`}
                    className="text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 font-semibold"
                  >
                    View Series Page
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* Tab 2: My Watchlist */}
      {activeTab === 'watchlist' ? (
        <div className="space-y-4">
          {watchlistItems.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
              <Bookmark className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Your watchlist is empty.</p>
              <p className="text-xs text-slate-500">
                Click the bookmark button on any series card to save it here.
              </p>
              <Link to="/">
                <Button size="sm" variant="secondary" className="mt-2">
                  Browse Series
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {watchlistItems.map(({ series, status, addedAt }) => {
                if (!series) return null;
                return (
                  <div
                    key={series.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-3.5"
                  >
                    <img
                      src={series.posterUrl}
                      alt={series.title}
                      className="h-20 w-14 object-cover rounded-lg shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/series/${series.id}`}
                        className="font-bold text-sm text-white hover:text-rose-400 transition-colors truncate block"
                      >
                        {series.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <PlatformBadge platform={series.platform} size="sm" />
                        <span>·</span>
                        <span className="text-amber-400 font-bold">★ {series.averageRating.toFixed(1)}</span>
                      </div>

                      {/* Status changer */}
                      <div className="flex items-center gap-2 mt-2">
                        <select
                          value={status}
                          onChange={(e) =>
                            updateWatchlistStatus(series.id, e.target.value as any)
                          }
                          className="h-7 text-[11px] rounded bg-slate-950 border border-slate-700 px-2 text-slate-300"
                        >
                          <option value="plan_to_watch">Plan to Watch</option>
                          <option value="watching">Currently Watching</option>
                          <option value="completed">Completed</option>
                        </select>

                        <button
                          onClick={() => toggleWatchlist(series.id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 p-1"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Tab 3: My Ratings */}
      {activeTab === 'ratings' ? (
        <div className="space-y-4">
          {ratedItems.length === 0 ? (
            <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-2">
              <Star className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                You haven't scored any shows yet.
              </p>
              <p className="text-xs text-slate-500">
                Rate series to build your critic profile score history.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ratedItems.map(({ series, rating, ratedAt }) => {
                if (!series) return null;
                return (
                  <div
                    key={series.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/80"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={series.posterUrl}
                        alt={series.title}
                        className="h-14 w-10 object-cover rounded shrink-0"
                      />
                      <div>
                        <Link
                          to={`/series/${series.id}`}
                          className="font-bold text-xs text-white hover:text-rose-400 transition-colors"
                        >
                          {series.title}
                        </Link>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Rated on {ratedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black text-white">{rating}</span>
                        <span className="text-[10px] text-slate-500">/10</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
