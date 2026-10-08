from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminReviewsView, AdminSeriesView, AdminUserDetailView, AdminUsersView,
    ChangePasswordView, CompareSeriesView, ExternalSeriesDetailView, ExternalSeriesSearchView, GenreListView, LoginView,
    PlatformListView, ProfileView, RecentlyAddedSeriesView, RegisterView,
    ReviewDeleteView, ReviewListCreateView, ReviewVoteView, SeriesDetailView,
    SeriesListView, TopRatedSeriesView, TrendingSeriesView, UserRatingView,
    UserReviewListView, WatchlistView, admin_stats,
    analytics_overview,
)


urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/password/', ChangePasswordView.as_view(), name='change-password'),
    path('platforms/', PlatformListView.as_view(), name='platform-list'),
    path('genres/', GenreListView.as_view(), name='genre-list'),
    path('series/', SeriesListView.as_view(), name='series-list'),
    path('series/trending/', TrendingSeriesView.as_view(), name='series-trending'),
    path('series/top-rated/', TopRatedSeriesView.as_view(), name='series-top-rated'),
    path('series/recently-added/', RecentlyAddedSeriesView.as_view(), name='series-recently-added'),
    path('series/external/', ExternalSeriesSearchView.as_view(), name='series-external-search'),
    path('series/external/<int:show_id>/', ExternalSeriesDetailView.as_view(), name='series-external-detail'),
    path('series/compare/', CompareSeriesView.as_view(), name='series-compare'),
    path('series/<slug:pk>/', SeriesDetailView.as_view(), name='series-detail'),
    path('reviews/', ReviewListCreateView.as_view(), name='review-list-create'),
    path('reviews/series/<slug:series_id>/', ReviewListCreateView.as_view(), name='series-reviews'),
    path('reviews/mine/', UserReviewListView.as_view(), name='user-reviews'),
    path('reviews/<int:pk>/vote/', ReviewVoteView.as_view(), name='review-vote'),
    path('reviews/<int:pk>/', ReviewDeleteView.as_view(), name='review-delete'),
    path('watchlist/', WatchlistView.as_view(), name='watchlist'),
    path('ratings/', UserRatingView.as_view(), name='ratings'),
    path('analytics/overview/', analytics_overview, name='analytics-overview'),
    path('admin/stats/', admin_stats, name='admin-stats'),
    path('admin/series/', AdminSeriesView.as_view(), name='admin-series'),
    path('admin/reviews/', AdminReviewsView.as_view(), name='admin-reviews'),
    path('admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]