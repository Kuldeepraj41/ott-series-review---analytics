import {
  Series,
  Review,
  AnalyticsOverview,
  UserProfile,
  SentimentType,
  Platform,
} from '../types';
import {
  INITIAL_SERIES,
  INITIAL_REVIEWS,
  INITIAL_USER,
  INITIAL_ANALYTICS,
} from '../data/mockData';

// Storage keys for offline persistence and seamless Django REST switchover
const STORAGE_KEYS = {
  SERIES: 'cinepulse_series_data',
  REVIEWS: 'cinepulse_reviews_data',
  USER: 'cinepulse_user_profile',
  ANALYTICS: 'cinepulse_analytics_cache',
  USERS: 'cinepulse_all_users_list',
  BACKEND_MODE: 'cinepulse_backend_mode', // 'mock' | 'django'
  BACKEND_MODE_OVERRIDE: 'cinepulse_backend_mode_override',
  BACKEND_URL: 'cinepulse_django_url',
  ACCESS_TOKEN: 'cinepulse_access_token',
  REFRESH_TOKEN: 'cinepulse_refresh_token',
};

const environmentApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

// Helper to simulate realistic async network delay
const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error reading from localStorage key: ${key}`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing to localStorage key: ${key}`, e);
  }
}

const DEMO_CACHE_CLEANUP_KEY = 'cinepulse_demo_cache_removed_v1';
if (localStorage.getItem(DEMO_CACHE_CLEANUP_KEY) !== 'true') {
  const demoSeriesIds = new Set([
    'severance',
    'succession',
    'the-bear',
    'the-last-of-us',
    'the-boys',
    'wednesday',
    'shogun',
    'fallout',
    'house-of-the-dragon',
  ]);
  const demoUserEmails = new Set([
    'alex.mercer@ottintel.io',
    'priya.sharma@ottintel.io',
    'jordan.reed@gmail.com',
    'admin@ottintel.io',
  ]);
  saveToStorage(
    STORAGE_KEYS.SERIES,
    loadFromStorage<Series[]>(STORAGE_KEYS.SERIES, []).filter((item) => !demoSeriesIds.has(item.id))
  );
  saveToStorage(
    STORAGE_KEYS.REVIEWS,
    loadFromStorage<Review[]>(STORAGE_KEYS.REVIEWS, []).filter((item) => !demoSeriesIds.has(item.seriesId))
  );
  saveToStorage(
    STORAGE_KEYS.USERS,
    loadFromStorage<UserProfile[]>(STORAGE_KEYS.USERS, []).filter((user) => !demoUserEmails.has(user.email))
  );
  const cachedUser = loadFromStorage<UserProfile | null>(STORAGE_KEYS.USER, null);
  if (cachedUser && demoUserEmails.has(cachedUser.email)) {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } else if (cachedUser) {
    saveToStorage(STORAGE_KEYS.USER, {
      ...cachedUser,
      watchlist: cachedUser.watchlist.filter((item) => !demoSeriesIds.has(item.seriesId)),
      ratings: cachedUser.ratings.filter((item) => !demoSeriesIds.has(item.seriesId)),
    });
  }
  localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
  localStorage.setItem(DEMO_CACHE_CLEANUP_KEY, 'true');
}

// In-memory / stored caches initialized
let seriesStore: Series[] = loadFromStorage(STORAGE_KEYS.SERIES, INITIAL_SERIES);
let reviewsStore: Review[] = loadFromStorage(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
let userStore: UserProfile = loadFromStorage(STORAGE_KEYS.USER, INITIAL_USER);
let analyticsStore: AnalyticsOverview = loadFromStorage(
  STORAGE_KEYS.ANALYTICS,
  INITIAL_ANALYTICS
);

export const API_CONFIG = {
  get backendMode(): 'mock' | 'django' {
    if (import.meta.env.PROD) return 'django';
    const savedMode = localStorage.getItem(STORAGE_KEYS.BACKEND_MODE) as 'mock' | 'django' | null;
    const hasUserOverride = localStorage.getItem(STORAGE_KEYS.BACKEND_MODE_OVERRIDE) === 'true';

    if (!savedMode || (savedMode === 'mock' && !hasUserOverride)) {
      localStorage.setItem(STORAGE_KEYS.BACKEND_MODE, 'django');
      localStorage.setItem(STORAGE_KEYS.BACKEND_MODE_OVERRIDE, 'false');
      return 'django';
    }

    return savedMode;
  },
  setBackendMode(mode: 'mock' | 'django') {
    localStorage.setItem(STORAGE_KEYS.BACKEND_MODE, mode);
    localStorage.setItem(STORAGE_KEYS.BACKEND_MODE_OVERRIDE, 'true');
  },
  get djangoUrl(): string {
    const savedUrl = localStorage.getItem(STORAGE_KEYS.BACKEND_URL);
    const url = environmentApiUrl || (import.meta.env.PROD ? '' : savedUrl || 'http://127.0.0.1:8000/api/v1');
    if (!url) throw new Error('VITE_API_URL must be set to the deployed Django API base URL.');
    return url;
  },
  setDjangoUrl(url: string) {
    localStorage.setItem(STORAGE_KEYS.BACKEND_URL, url);
  },
};

const isDjangoMode = () => API_CONFIG.backendMode === 'django';

function normalizeExternalSeries(item: any): Series {
  const image = item?.image || {};
  const rating = item?.rating || {};
  const network = item?.network || {};
  const premiered = item?.premiered || '';
  const posterUrl = item?.posterUrl || image?.original || image?.medium || '';
  const releaseYear = item?.releaseYear || (premiered && /^\d{4}/.test(premiered)
    ? Number(premiered.slice(0, 4))
    : 0);

  return {
    id: String(item?.id ?? ''),
    title: item?.title || item?.name || 'Untitled Series',
    tagline: item?.tagline || '',
    description: (item?.description || item?.summary || '').replace(/<[^>]*>/g, '').trim(),
    platform: (item?.platform || network?.name || 'Netflix') as Platform,
    genres: (item?.genres || []).map((genre: string) => genre as any),
    releaseYear,
    seasons: Number(item?.seasons ?? 0),
    episodes: Number(item?.episodes ?? 0),
    averageRating: Number(item?.averageRating ?? rating?.average ?? 0),
    totalReviews: Number(item?.totalReviews ?? 0),
    sentimentBreakdown: item?.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 },
    ratingDistribution: item?.ratingDistribution || {},
    posterUrl,
    backdropUrl: item?.backdropUrl || posterUrl,
    ageRating: item?.ageRating || '',
    status: item?.status || 'Ongoing',
    creator: item?.creator || '',
    cast: item?.cast || [],
    isTrending: item?.isTrending || false,
    isTopRated: item?.isTopRated || false,
    isRecentlyAdded: item?.isRecentlyAdded || false,
    radarMetrics: item?.radarMetrics || {
      storytelling: 50,
      production: 50,
      pacing: 50,
      characterDepth: 50,
      rewatchability: 50,
      soundtrack: 50,
    },
    radarMetricEvidence: item?.radarMetricEvidence || {},
  };
}

async function fetchExternalSeriesById(id: string): Promise<Series | null> {
  try {
    const external = await djangoRequest<any>(`/series/external/${encodeURIComponent(id)}/`);
    return normalizeExternalSeries(external);
  } catch (error) {
    if (error instanceof Error && (error as Error & { status?: number }).status === 404) {
      return null;
    }
    throw error;
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

function saveTokens(access: string, refresh: string, remember = true): void {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  target.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
  target.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  other.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  other.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.setItem('cinepulse_auth_session', 'active');
}

export function clearAuthTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.setItem('cinepulse_auth_session', 'logged_out');
}

async function djangoRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const baseUrl = API_CONFIG.djangoUrl.replace(/\/$/, '');
  const send = (accessToken: string | null) => {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    else headers.delete('Authorization');
    return fetch(`${baseUrl}${path}`, { ...init, headers });
  };

  let response = await send(token);
  const isAuthRequest = path.startsWith('/auth/login/') || path.startsWith('/auth/register/') || path.startsWith('/auth/token/refresh/');
  const isPublicRead = (init.method || 'GET').toUpperCase() === 'GET' && (
    path.startsWith('/series/') ||
    path.startsWith('/reviews/') ||
    ['/analytics/overview/', '/platforms/', '/genres/'].includes(path)
  );
  if (response.status === 401 && token && !isAuthRequest) {
    const refresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refresh) {
      const refreshResponse = await fetch(`${baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (refreshResponse.ok) {
        const refreshed = await refreshResponse.json();
        const remember = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) !== null;
        saveTokens(refreshed.access, refresh, remember);
        response = await send(refreshed.access);
      }
    }
  }
  if (response.status === 401 && token && isPublicRead) {
    response = await send(null);
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail || Object.values(payload || {}).flat().join(' ');
    throw Object.assign(new Error(detail || `Request failed (${response.status})`), {
      status: response.status,
    });
  }
  return payload as T;
}

const jsonBody = (method: string, data?: unknown): RequestInit => ({
  method,
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});

export const authApi = {
  async login(email: string, password: string, remember = true): Promise<UserProfile> {
    const result = await djangoRequest<{ user: UserProfile; access: string; refresh: string }>(
      '/auth/login/', jsonBody('POST', { email, password })
    );
    saveTokens(result.access, result.refresh, remember);
    return result.user;
  },

  async register(name: string, email: string, password: string): Promise<UserProfile> {
    const result = await djangoRequest<{ user: UserProfile; access: string; refresh: string }>(
      '/auth/register/', jsonBody('POST', { name, email, password })
    );
    saveTokens(result.access, result.refresh);
    return result.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await djangoRequest('/auth/password/', jsonBody('POST', { currentPassword, newPassword }));
  },

  logout: clearAuthTokens,
};

// ==================== SERIES API ====================
type SeriesListParams = {
  search?: string;
  platform?: string;
  genre?: string;
  sortBy?: 'rating' | 'popular' | 'year' | 'reviews';
};

function applySeriesListParams(items: Series[], params?: SeriesListParams): Series[] {
  let result = [...items];

  if (params?.platform && params.platform !== 'All') {
    result = result.filter((series) => series.platform === params.platform);
  }

  if (params?.genre && params.genre !== 'All') {
    result = result.filter((series) => series.genres.includes(params.genre as any));
  }

  if (params?.sortBy === 'rating') {
    result.sort((a, b) => b.averageRating - a.averageRating);
  } else if (params?.sortBy === 'popular') {
    result.sort((a, b) =>
      (Number(b.isTrending) - Number(a.isTrending)) ||
      (b.totalReviews - a.totalReviews) ||
      (b.averageRating - a.averageRating)
    );
  } else if (params?.sortBy === 'year') {
    result.sort((a, b) => b.releaseYear - a.releaseYear);
  } else if (params?.sortBy === 'reviews') {
    result.sort((a, b) => b.totalReviews - a.totalReviews);
  }

  return result;
}

function classifyMockSentiment(text: string): SentimentType {
  const positiveTerms = /\b(amazing|awesome|brilliant|compelling|enjoyable|excellent|fantastic|good|great|impressive|love|loved|masterful|wonderful)\b/gi;
  const negativeTerms = /\b(awful|bad|boring|confusing|disappointing|dull|hate|hated|mediocre|poor|terrible|weak)\b/gi;
  const positiveScore = text.match(positiveTerms)?.length || 0;
  const negativeScore = text.match(negativeTerms)?.length || 0;
  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

export const seriesApi = {
  async liveSearch(query: string): Promise<Series[]> {
    if (!query.trim()) return [];
    const response = await djangoRequest<{ results: any[] }>(`/series/external/?q=${encodeURIComponent(query)}`);
    return (response.results || []).map(normalizeExternalSeries);
  },

  async getAll(params?: SeriesListParams): Promise<Series[]> {
    if (isDjangoMode()) {
      if (params?.search && params.search.trim()) {
        return applySeriesListParams(await this.liveSearch(params.search), params);
      }

      const defaultQueries = ['Breaking Bad', 'The Office', 'Stranger Things', 'Severance'];
      const combined = [] as Series[];
      for (const query of defaultQueries) {
        try {
          const results = await this.liveSearch(query);
          combined.push(...results);
        } catch (error) {
          console.warn('live search fallback failed for query', query, error);
        }
      }

      if (combined.length > 0) {
        const unique = combined.filter((item, idx, arr) => arr.findIndex((next) => next.id === item.id) === idx);
        return applySeriesListParams(unique, params);
      }

      const query = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      return djangoRequest(`/series/${query.size ? `?${query}` : ''}`);
    }
    await delay();
    let result = [...seriesStore];

    if (params?.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.creator.toLowerCase().includes(q) ||
          s.cast.some((c) => c.toLowerCase().includes(q)) ||
          s.description.toLowerCase().includes(q)
      );
    }

    return applySeriesListParams(result, params);
  },

  async getById(id: string): Promise<Series | null> {
    if (isDjangoMode()) {
      try {
        return await djangoRequest(`/series/${encodeURIComponent(id)}/`);
      } catch (error) {
        if (error instanceof Error && (error as Error & { status?: number }).status === 404) {
          return fetchExternalSeriesById(id);
        }
        throw error;
      }
    }
    await delay();
    return seriesStore.find((s) => s.id === id) || null;
  },

  async getTrending(): Promise<Series[]> {
    if (isDjangoMode()) return djangoRequest('/series/trending/');
    await delay();
    return seriesStore.filter((s) => s.isTrending);
  },

  async getTopRated(limit = 6): Promise<Series[]> {
    if (isDjangoMode()) return djangoRequest(`/series/top-rated/?limit=${limit}`);
    await delay();
    return [...seriesStore]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  },

  async getRecentlyAdded(limit = 4): Promise<Series[]> {
    if (isDjangoMode()) return djangoRequest(`/series/recently-added/?limit=${limit}`);
    await delay();
    return seriesStore
      .filter((s) => s.isRecentlyAdded || s.releaseYear >= 2024)
      .slice(0, limit);
  },

  async compareSeries(ids: string[]): Promise<Series[]> {
    if (isDjangoMode()) {
      const query = new URLSearchParams();
      ids.forEach((id) => query.append('ids', id));
      const localSeries = await djangoRequest<Series[]>(`/series/compare/?${query}`);
      const foundIds = new Set(localSeries.map((series) => series.id));
      const externalSeries = await Promise.all(
        ids.filter((id) => !foundIds.has(id)).map(fetchExternalSeriesById)
      );
      const seriesById = new Map(
        [...localSeries, ...externalSeries.filter((series): series is Series => series !== null)]
          .map((series) => [series.id, series])
      );
      return ids.map((id) => seriesById.get(id)).filter((series): series is Series => !!series);
    }
    await delay();
    return seriesStore.filter((s) => ids.includes(s.id));
  },
};

// ==================== REVIEWS API ====================
export const reviewsApi = {
  async getBySeriesId(
    seriesId: string,
    filterSentiment?: string,
    sortBy: 'newest' | 'rating_desc' | 'rating_asc' | 'helpful' = 'newest'
  ): Promise<Review[]> {
    if (isDjangoMode()) {
      const query = new URLSearchParams({ sortBy });
      if (filterSentiment) query.set('sentiment', filterSentiment);
      return djangoRequest(`/reviews/series/${encodeURIComponent(seriesId)}/?${query}`);
    }
    await delay();
    let filtered = reviewsStore.filter((r) => r.seriesId === seriesId);

    if (filterSentiment && filterSentiment !== 'all') {
      filtered = filtered.filter((r) => r.sentiment === filterSentiment);
    }

    if (sortBy === 'newest') {
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'rating_desc') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating_asc') {
      filtered.sort((a, b) => a.rating - b.rating);
    } else if (sortBy === 'helpful') {
      filtered.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }

    return filtered;
  },

  async createReview(data: {
    seriesId: string;
    authorName: string;
    rating: number;
    title: string;
    content: string;
    containsSpoilers?: boolean;
  }): Promise<Review> {
    if (isDjangoMode()) {
      return djangoRequest('/reviews/', jsonBody('POST', {
        seriesId: data.seriesId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        containsSpoilers: data.containsSpoilers,
      }));
    }
    await delay(300);

    const targetSeries = seriesStore.find((s) => s.id === data.seriesId);

    const calculatedSentiment = classifyMockSentiment(`${data.title}. ${data.content}`);

    const isCritic =
      userStore.isCertifiedCritic ??
      (userStore.role?.toLowerCase().includes('critic') ||
        userStore.role?.toLowerCase().includes('lead') ||
        userStore.role?.toLowerCase().includes('scientist'));

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      seriesId: data.seriesId,
      seriesTitle: targetSeries ? targetSeries.title : 'Series',
      seriesPoster: targetSeries?.posterUrl,
      authorName: data.authorName || userStore.name || 'Community Member',
      authorAvatar: userStore.avatar,
      authorRole: userStore.role || (isCritic ? 'Certified Critic' : 'Audience Reviewer'),
      isCriticReview: isCritic,
      criticOutlet: isCritic ? userStore.criticOutlet : undefined,
      rating: data.rating,
      title: data.title,
      content: data.content,
      sentiment: calculatedSentiment,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
      unhelpfulCount: 0,
      containsSpoilers: data.containsSpoilers || false,
    };

    reviewsStore = [newReview, ...reviewsStore];
    saveToStorage(STORAGE_KEYS.REVIEWS, reviewsStore);

    // Recalculate series rating, audience score, and sentiment
    if (targetSeries) {
      const allSeriesReviews = reviewsStore.filter((r) => r.seriesId === data.seriesId);
      const criticRevs = allSeriesReviews.filter((r) => r.isCriticReview === true);
      const audienceRevs = allSeriesReviews.filter((r) => r.isCriticReview !== true);

      // Critic Consensus score
      if (criticRevs.length > 0) {
        const sumCritic = criticRevs.reduce((acc, r) => acc + r.rating, 0);
        targetSeries.averageRating = Number((sumCritic / criticRevs.length).toFixed(1));
      } else {
        const sumAll = allSeriesReviews.reduce((acc, r) => acc + r.rating, 0);
        targetSeries.averageRating = Number((sumAll / allSeriesReviews.length).toFixed(1));
      }

      // Audience Community score
      if (audienceRevs.length > 0) {
        const sumAudience = audienceRevs.reduce((acc, r) => acc + r.rating, 0);
        targetSeries.audienceRating = Number((sumAudience / audienceRevs.length).toFixed(1));
      } else {
        targetSeries.audienceRating = targetSeries.averageRating;
      }

      targetSeries.totalReviews = allSeriesReviews.length;
      targetSeries.totalCriticReviews = criticRevs.length;
      targetSeries.totalAudienceReviews = audienceRevs.length;

      const posCount = allSeriesReviews.filter((r) => r.sentiment === 'positive').length;
      const neuCount = allSeriesReviews.filter((r) => r.sentiment === 'neutral').length;
      const negCount = allSeriesReviews.filter((r) => r.sentiment === 'negative').length;
      const total = allSeriesReviews.length;

      targetSeries.sentimentBreakdown = {
        positive: Math.round((posCount / total) * 100),
        neutral: Math.round((neuCount / total) * 100),
        negative: Math.round((negCount / total) * 100),
      };

      if (!targetSeries.ratingDistribution[data.rating]) {
        targetSeries.ratingDistribution[data.rating] = 0;
      }
      targetSeries.ratingDistribution[data.rating] += 1;

      saveToStorage(STORAGE_KEYS.SERIES, seriesStore);
    }

    return newReview;
  },

  async voteReview(reviewId: string, direction: 'up' | 'down'): Promise<Review | null> {
    if (isDjangoMode()) {
      return djangoRequest(`/reviews/${encodeURIComponent(reviewId)}/vote/`, jsonBody('POST', { direction }));
    }
    await delay(100);
    const rev = reviewsStore.find((r) => r.id === reviewId);
    if (!rev) return null;

    if (direction === 'up') {
      if (rev.userHelpfulVote === 'up') {
        rev.helpfulCount = Math.max(0, rev.helpfulCount - 1);
        rev.userHelpfulVote = null;
      } else {
        if (rev.userHelpfulVote === 'down') rev.unhelpfulCount = Math.max(0, rev.unhelpfulCount - 1);
        rev.helpfulCount += 1;
        rev.userHelpfulVote = 'up';
      }
    } else {
      if (rev.userHelpfulVote === 'down') {
        rev.unhelpfulCount = Math.max(0, rev.unhelpfulCount - 1);
        rev.userHelpfulVote = null;
      } else {
        if (rev.userHelpfulVote === 'up') rev.helpfulCount = Math.max(0, rev.helpfulCount - 1);
        rev.unhelpfulCount += 1;
        rev.userHelpfulVote = 'down';
      }
    }

    saveToStorage(STORAGE_KEYS.REVIEWS, reviewsStore);
    return rev;
  },

  async getUserReviews(authorName?: string): Promise<Review[]> {
    if (isDjangoMode()) return djangoRequest('/reviews/mine/');
    await delay();
    const targetName = authorName || userStore.name;
    return reviewsStore.filter((r) => r.authorName.toLowerCase() === targetName.toLowerCase());
  },

  async deleteReview(reviewId: string): Promise<boolean> {
    if (isDjangoMode()) {
      await djangoRequest(`/reviews/${encodeURIComponent(reviewId)}/`, { method: 'DELETE' });
      return true;
    }
    await delay(200);
    reviewsStore = reviewsStore.filter((r) => r.id !== reviewId);
    saveToStorage(STORAGE_KEYS.REVIEWS, reviewsStore);
    return true;
  },
};

// ==================== USER API ====================
export const userApi = {
  async getProfile(): Promise<UserProfile> {
    if (isDjangoMode()) return djangoRequest('/auth/profile/');
    await delay();
    return userStore;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (isDjangoMode()) return djangoRequest('/auth/profile/', jsonBody('PATCH', updates));
    await delay(250);
    userStore = { ...userStore, ...updates };
    saveToStorage(STORAGE_KEYS.USER, userStore);
    return userStore;
  },

  async toggleWatchlist(
    seriesId: string,
    status: 'watching' | 'plan_to_watch' | 'completed' = 'plan_to_watch'
  ): Promise<UserProfile> {
    if (isDjangoMode()) return djangoRequest('/watchlist/', jsonBody('POST', { seriesId, status }));
    await delay(150);
    const existingIndex = userStore.watchlist.findIndex((w) => w.seriesId === seriesId);

    if (existingIndex >= 0) {
      userStore.watchlist.splice(existingIndex, 1);
    } else {
      userStore.watchlist.push({
        seriesId,
        status,
        addedAt: new Date().toISOString().split('T')[0],
      });
    }

    saveToStorage(STORAGE_KEYS.USER, userStore);
    return { ...userStore };
  },

  async updateWatchlistStatus(
    seriesId: string,
    status: 'watching' | 'plan_to_watch' | 'completed'
  ): Promise<UserProfile> {
    if (isDjangoMode()) return djangoRequest('/watchlist/', jsonBody('PATCH', { seriesId, status }));
    await delay(150);
    const item = userStore.watchlist.find((w) => w.seriesId === seriesId);
    if (item) {
      item.status = status;
      saveToStorage(STORAGE_KEYS.USER, userStore);
    }
    return { ...userStore };
  },

  async rateSeries(seriesId: string, rating: number): Promise<UserProfile> {
    if (isDjangoMode()) return djangoRequest('/ratings/', jsonBody('POST', { seriesId, rating }));
    await delay(150);
    const existingIndex = userStore.ratings.findIndex((r) => r.seriesId === seriesId);
    const ratedAt = new Date().toISOString().split('T')[0];

    if (existingIndex >= 0) {
      userStore.ratings[existingIndex].rating = rating;
      userStore.ratings[existingIndex].ratedAt = ratedAt;
    } else {
      userStore.ratings.push({ seriesId, rating, ratedAt });
    }

    saveToStorage(STORAGE_KEYS.USER, userStore);
    return { ...userStore };
  },
};

// ==================== ANALYTICS API ====================
export const analyticsApi = {
  async getOverview(): Promise<AnalyticsOverview> {
    if (isDjangoMode()) return djangoRequest('/analytics/overview/');
    await delay();
    return analyticsStore;
  },
};

// ==================== ADMIN API ====================
let usersStore: UserProfile[] = loadFromStorage(STORAGE_KEYS.USERS, []);

export const adminApi = {
  async getStats() {
    if (isDjangoMode()) return djangoRequest('/admin/stats/');
    await delay(150);
    return {
      totalSeries: seriesStore.length,
      totalReviews: reviewsStore.length,
      totalUsers: usersStore.length,
      flaggedReviews: reviewsStore.filter((r) => r.unhelpfulCount > 5).length,
      systemHealth: 'Optimal' as const,
      databaseStatus: API_CONFIG.backendMode === 'django' ? ('Synchronized' as const) : ('Local Mock' as const),
    };
  },

  async getAllSeries(): Promise<Series[]> {
    if (isDjangoMode()) return djangoRequest('/admin/series/');
    await delay();
    return [...seriesStore];
  },

  async createSeries(data: {
    title: string;
    tagline: string;
    description: string;
    platform: any;
    genres: any[];
    releaseYear: number;
    seasons: number;
    episodes: number;
    posterUrl: string;
    backdropUrl: string;
    ageRating: string;
    creator: string;
    cast: string[];
    isTrending?: boolean;
    isTopRated?: boolean;
  }): Promise<Series> {
    if (isDjangoMode()) return djangoRequest('/admin/series/', jsonBody('POST', data));
    await delay(250);
    const newId = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSeries: Series = {
      ...data,
      id: newId,
      status: 'Ongoing',
      averageRating: 8.5,
      totalReviews: 1,
      sentimentBreakdown: { positive: 100, neutral: 0, negative: 0 },
      ratingDistribution: { 9: 1 },
      radarMetrics: {
        storytelling: 90,
        production: 92,
        pacing: 88,
        characterDepth: 90,
        soundtrack: 89,
        rewatchability: 85,
      },
    };

    seriesStore = [newSeries, ...seriesStore];
    saveToStorage(STORAGE_KEYS.SERIES, seriesStore);
    return newSeries;
  },

  async updateSeries(id: string, updates: Partial<Series>): Promise<Series | null> {
    if (isDjangoMode()) {
      return djangoRequest(`/series/${encodeURIComponent(id)}/`, jsonBody('PATCH', updates));
    }
    await delay(200);
    const idx = seriesStore.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    seriesStore[idx] = { ...seriesStore[idx], ...updates };
    saveToStorage(STORAGE_KEYS.SERIES, seriesStore);
    return seriesStore[idx];
  },

  async deleteSeries(id: string): Promise<boolean> {
    if (isDjangoMode()) {
      await djangoRequest(`/series/${encodeURIComponent(id)}/`, { method: 'DELETE' });
      return true;
    }
    await delay(200);
    seriesStore = seriesStore.filter((s) => s.id !== id);
    reviewsStore = reviewsStore.filter((r) => r.seriesId !== id);
    saveToStorage(STORAGE_KEYS.SERIES, seriesStore);
    saveToStorage(STORAGE_KEYS.REVIEWS, reviewsStore);
    return true;
  },

  async getAllReviews(): Promise<Review[]> {
    if (isDjangoMode()) return djangoRequest('/admin/reviews/');
    await delay();
    return [...reviewsStore];
  },

  async deleteReview(id: string): Promise<boolean> {
    if (isDjangoMode()) {
      await djangoRequest(`/reviews/${encodeURIComponent(id)}/`, { method: 'DELETE' });
      return true;
    }
    await delay(150);
    reviewsStore = reviewsStore.filter((r) => r.id !== id);
    saveToStorage(STORAGE_KEYS.REVIEWS, reviewsStore);
    return true;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (isDjangoMode()) return djangoRequest('/admin/users/');
    await delay();
    return [...usersStore];
  },

  async createCriticUser(data: {
    name: string;
    email: string;
    role: string;
    criticOutlet: string;
    bio: string;
  }): Promise<UserProfile> {
    if (isDjangoMode()) return djangoRequest('/admin/users/', jsonBody('POST', data));
    await delay(200);
    const newCritic: UserProfile = {
      id: `usr-critic-${Date.now()}`,
      name: data.name,
      email: data.email,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      bio: data.bio || 'Certified critic accredited by OTTIntel editorial integrity board.',
      role: data.role || 'Certified Critic',
      isCertifiedCritic: true,
      criticOutlet: data.criticOutlet || 'Independent Press',
      verificationStatus: 'verified',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      preferredPlatforms: ['Netflix', 'HBO Max', 'Apple TV+'],
      watchlist: [],
      ratings: [],
    };
    usersStore = [newCritic, ...usersStore];
    saveToStorage(STORAGE_KEYS.USERS, usersStore);
    return newCritic;
  },

  async approveCriticVerification(userId: string): Promise<UserProfile | null> {
    if (isDjangoMode()) {
      return djangoRequest(`/admin/users/${encodeURIComponent(userId)}/`, jsonBody('PATCH', { action: 'approve_critic' }));
    }
    await delay(150);
    const user = usersStore.find((u) => u.id === userId);
    if (!user) return null;
    user.isCertifiedCritic = true;
    user.verificationStatus = 'verified';
    if (!user.role.includes('Critic')) {
      user.role = 'Certified Critic';
    }
    if (!user.criticOutlet) {
      user.criticOutlet = 'Accredited Member';
    }
    saveToStorage(STORAGE_KEYS.USERS, usersStore);
    return user;
  },

  async updateUserRole(userId: string, newRole: string): Promise<UserProfile | null> {
    if (isDjangoMode()) {
      return djangoRequest(`/admin/users/${encodeURIComponent(userId)}/`, jsonBody('PATCH', { role: newRole }));
    }
    await delay(150);
    const user = usersStore.find((u) => u.id === userId);
    if (!user) return null;
    user.role = newRole;
    if (newRole === 'Platform Administrator') {
      user.isAdmin = true;
      user.isCertifiedCritic = true;
      user.verificationStatus = 'verified';
    } else if (
      newRole.includes('Critic') ||
      newRole.includes('Lead') ||
      newRole.includes('Scientist') ||
      newRole.includes('Editor')
    ) {
      user.isCertifiedCritic = true;
      user.verificationStatus = 'verified';
      if (!user.criticOutlet) user.criticOutlet = 'Accredited Reviewer';
    } else {
      user.isCertifiedCritic = false;
      user.isAdmin = false;
      user.verificationStatus = 'none';
    }
    saveToStorage(STORAGE_KEYS.USERS, usersStore);
    return user;
  },

  async deleteUser(userId: string): Promise<boolean> {
    if (isDjangoMode()) {
      await djangoRequest(`/admin/users/${encodeURIComponent(userId)}/`, { method: 'DELETE' });
      return true;
    }
    await delay(150);
    const initialCount = usersStore.length;
    usersStore = usersStore.filter((user) => user.id !== userId);
    if (usersStore.length === initialCount) return false;
    saveToStorage(STORAGE_KEYS.USERS, usersStore);
    return true;
  },

};
