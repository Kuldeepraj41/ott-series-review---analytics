import { AnalyticsOverview, Series, Review, UserProfile } from '../types';

export const INITIAL_SERIES: Series[] = [];
export const INITIAL_REVIEWS: Review[] = [];
export const INITIAL_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  bio: '',
  role: 'Community Reviewer',
  isAdmin: false,
  isCertifiedCritic: false,
  verificationStatus: 'none',
  joinedDate: '',
  preferredPlatforms: [],
  watchlist: [],
  ratings: [],
};
export const INITIAL_ANALYTICS: AnalyticsOverview = {
  totalSeries: 0,
  totalReviews: 0,
  overallAverageRating: 0,
  sentimentDistribution: {
    positive: 0,
    neutral: 0,
    negative: 0,
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
  },
  ratingHistogram: [],
  genreAnalysis: [],
  platformAnalysis: [],
  reviewsOverTime: [],
};
