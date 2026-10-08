export type Platform = 'Netflix' | 'Prime Video' | 'HBO Max' | 'Apple TV+' | 'Disney+' | 'Hulu';

export type Genre =
  | 'Sci-Fi'
  | 'Drama'
  | 'Thriller'
  | 'Crime'
  | 'Fantasy'
  | 'Comedy'
  | 'Action'
  | 'Mystery'
  | 'Horror';

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface RadarMetrics {
  storytelling: number; // 0-100
  production: number;   // 0-100
  pacing: number;       // 0-100
  characterDepth: number; // 0-100
  rewatchability: number; // 0-100
  soundtrack: number;   // 0-100
}

export type RadarMetricEvidence = Partial<Record<keyof RadarMetrics, number>>;

export interface Series {
  id: string;
  title: string;
  tagline: string;
  description: string;
  platform: Platform;
  genres: Genre[];
  releaseYear: number;
  seasons: number;
  episodes: number;
  averageRating: number; // Critic Consensus score out of 10
  audienceRating?: number; // Audience community score out of 10
  totalReviews: number;
  totalCriticReviews?: number;
  totalAudienceReviews?: number;
  sentimentBreakdown: {
    positive: number; // e.g. 82%
    neutral: number;  // e.g. 12%
    negative: number; // e.g. 6%
  };
  ratingDistribution: Record<number, number>; // 1 to 10
  posterUrl: string;
  backdropUrl: string;
  ageRating: string;
  status: 'Ongoing' | 'Ended' | 'Upcoming';
  creator: string;
  cast: string[];
  isTrending?: boolean;
  isTopRated?: boolean;
  isRecentlyAdded?: boolean;
  radarMetrics: RadarMetrics;
  radarMetricEvidence?: RadarMetricEvidence;
}

export interface Review {
  id: string;
  seriesId: string;
  seriesTitle: string;
  seriesPoster?: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;
  isCriticReview?: boolean;
  criticOutlet?: string;
  rating: number; // 1 to 10
  title: string;
  content: string;
  sentiment: SentimentType;
  createdAt: string;
  helpfulCount: number;
  unhelpfulCount: number;
  userHelpfulVote?: 'up' | 'down' | null;
  containsSpoilers?: boolean;
}

export interface WatchlistItem {
  seriesId: string;
  status: 'watching' | 'plan_to_watch' | 'completed';
  addedAt: string;
}

export interface UserRating {
  seriesId: string;
  rating: number;
  ratedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  role: string;
  isAdmin?: boolean;
  isCertifiedCritic?: boolean;
  criticOutlet?: string;
  verificationStatus?: 'verified' | 'pending' | 'none';
  joinedDate: string;
  preferredPlatforms: Platform[];
  watchlist: WatchlistItem[];
  ratings: UserRating[];
}

export interface AdminStats {
  totalSeries: number;
  totalReviews: number;
  totalUsers: number;
  flaggedReviews: number;
  systemHealth: 'Optimal' | 'Degraded' | 'Offline';
  databaseStatus: 'Synchronized' | 'Local Mock';
}

export interface GenreAnalysisItem {
  genre: string;
  seriesCount: number;
  avgRating: number;
  reviewCount: number;
  positivePercentage: number;
}

export interface PlatformAnalysisItem {
  platform: Platform;
  seriesCount: number;
  avgRating: number;
  totalReviews: number;
  sentimentPositive: number;
  color: string;
  brandBg: string;
}

export interface MonthlyReviewTrend {
  month: string;
  totalReviews: number;
  positive: number;
  neutral: number;
  negative: number;
  avgRating: number;
}

export interface AnalyticsOverview {
  totalSeries: number;
  totalReviews: number;
  overallAverageRating: number;
  sentimentDistribution: {
    positive: number; // percentage
    neutral: number;
    negative: number;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
  };
  ratingHistogram: Array<{ rating: number; count: number }>;
  genreAnalysis: GenreAnalysisItem[];
  platformAnalysis: PlatformAnalysisItem[];
  reviewsOverTime: MonthlyReviewTrend[];
}
