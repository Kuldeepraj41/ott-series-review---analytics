import re
from datetime import date

import requests
from django.contrib.auth import authenticate, password_validation
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Avg, CharField, Count, Q
from django.db.models.functions import Cast
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Genre, Platform, Review, ReviewVote, Series, User, UserRating, WatchlistItem
from .sentiment import classify_sentiment
from .serializers import (
    GenreSerializer, PlatformSerializer, ReviewSerializer, SeriesSerializer,
    SeriesWriteSerializer, UserSerializer,
)


def _user_payload(user):
    return UserSerializer(user).data


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        name = request.data.get('name', '')
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        if not isinstance(name, str) or not isinstance(email, str) or not isinstance(password, str):
            return Response({'detail': 'Name, email, and password must be text.'}, status=400)
        name = name.strip()
        email = email.strip().lower()
        if not name or not email or not password:
            return Response({'detail': 'Name, email, and password are required.'}, status=400)
        if User.objects.filter(email__iexact=email).exists():
            return Response({'detail': 'An account with this email already exists.'}, status=400)
        user = User(username=email, email=email, display_name=name)
        try:
            password_validation.validate_password(password, user)
        except ValidationError as error:
            return Response({'detail': list(error.messages)}, status=400)
        user.set_password(password)
        user.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': _user_payload(user), 'access': str(refresh.access_token), 'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        email = request.data.get('email', '')
        password = request.data.get('password', '')
        if not isinstance(email, str) or not isinstance(password, str):
            return Response({'detail': 'Email and password must be text.'}, status=400)
        email = email.strip().lower()
        user_record = User.objects.filter(email__iexact=email).first()
        user = authenticate(request, username=user_record.username, password=password) if user_record else None
        if not user:
            return Response({'detail': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': _user_payload(user), 'access': str(refresh.access_token), 'refresh': str(refresh),
        })


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get('currentPassword', '')
        new_password = request.data.get('newPassword', '')
        if not isinstance(current_password, str) or not isinstance(new_password, str):
            return Response({'detail': 'Current and new passwords must be text.'}, status=400)
        if not request.user.check_password(current_password):
            return Response({'detail': 'Current password is incorrect.'}, status=400)
        try:
            password_validation.validate_password(new_password, request.user)
        except ValidationError as error:
            return Response({'detail': list(error.messages)}, status=400)
        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_user_payload(request.user))

    def patch(self, request):
        user = request.user
        for field in ['display_name', 'bio', 'avatar']:
            alias = 'name' if field == 'display_name' else field
            if alias in request.data:
                setattr(user, field, request.data[alias])
        if 'criticOutlet' in request.data:
            user.critic_outlet = request.data['criticOutlet']
        if request.data.get('verificationStatus') == 'pending':
            user.verification_status = 'pending'
        if 'preferredPlatforms' in request.data:
            platforms = Platform.objects.filter(name__in=request.data['preferredPlatforms'])
            user.preferred_platforms.set(platforms)
        user.save()
        return Response(_user_payload(user))


class SeriesListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        series = Series.objects.select_related('platform').prefetch_related('genres', 'reviews__author')
        search = request.query_params.get('search', '').strip()
        platform = request.query_params.get('platform')
        genre = request.query_params.get('genre')
        if search:
            series = series.annotate(cast_text=Cast('cast', output_field=CharField())).filter(
                Q(title__icontains=search) | Q(creator__icontains=search) |
                Q(description__icontains=search) | Q(cast_text__icontains=search)
            ).distinct()
        if platform and platform != 'All':
            series = series.filter(platform__name=platform)
        if genre and genre != 'All':
            series = series.filter(genres__name=genre)
        sort = request.query_params.get('sortBy')
        if sort == 'year':
            series = series.order_by('-release_year')
        elif sort == 'reviews':
            series = series.annotate(review_count=Count('reviews')).order_by('-review_count')
        elif sort in ('rating', 'popular'):
            series = series.annotate(
                critic_rating=Avg('reviews__rating', filter=Q(reviews__author__is_certified_critic=True)),
                overall_rating=Avg('reviews__rating'),
                review_count=Count('reviews', distinct=True),
            ).order_by('-critic_rating', '-overall_rating')
            if sort == 'popular':
                series = series.order_by('-is_trending', '-review_count', '-critic_rating')
        return Response(SeriesSerializer(series, many=True, context={'request': request}).data)


def _clean_tvmaze_summary(summary):
    if not summary:
        return ''
    cleaned = re.sub(r'<[^>]+>', '', summary)
    return cleaned.strip()


def _normalize_tvmaze_show(show):
    image = show.get('image') or {}
    network = show.get('network') or {}
    web_channel = show.get('webChannel') or {}
    rating = show.get('rating') or {}
    embedded = show.get('_embedded') or {}
    seasons = embedded.get('seasons') or []
    episodes = embedded.get('episodes') or []
    cast = embedded.get('cast') or []
    premiered = show.get('premiered') or ''
    release_year = int(premiered[:4]) if premiered and premiered[:4].isdigit() else 0
    poster_url = image.get('original') or image.get('medium') or ''
    tvmaze_status = show.get('status')
    status = 'Ended' if tvmaze_status == 'Ended' else 'Upcoming' if tvmaze_status == 'In Development' else 'Ongoing'
    return {
        'id': show.get('id'),
        'title': show.get('name') or 'Untitled Series',
        'tagline': '',
        'description': _clean_tvmaze_summary(show.get('summary') or ''),
        'platform': web_channel.get('name') or network.get('name') or 'Unknown',
        'genres': show.get('genres') or [],
        'releaseYear': release_year,
        'seasons': len(seasons),
        'episodes': len(episodes),
        'averageRating': float(rating.get('average') or 0),
        'posterUrl': poster_url,
        'backdropUrl': '',
        'ageRating': '',
        'status': status,
        'creator': '',
        'cast': [item['person']['name'] for item in cast if item.get('person', {}).get('name')][:8],
        'isTrending': False,
        'isTopRated': False,
        'isRecentlyAdded': False,
        'radarMetrics': {
            'storytelling': 0,
            'production': 0,
            'pacing': 0,
            'characterDepth': 0,
            'rewatchability': 0,
            'soundtrack': 0,
        },
    }


class ExternalSeriesSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': []})

        try:
            response = requests.get(
                'https://api.tvmaze.com/search/shows',
                params={'q': query},
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException:
            return Response({'detail': 'Could not fetch live series data from TVMaze.'}, status=502)

        q = query.lower()
        results = []
        for item in response.json() or []:
            show = item.get('show') or {}
            if not show:
                continue
            title = (show.get('name') or '').strip()
            if not title:
                continue

            title_lower = title.lower()
            exact_score = 0
            if q == title_lower:
                exact_score += 80
            if q in title_lower:
                exact_score += 40
            if title_lower.startswith(q):
                exact_score += 20
            if title_lower.endswith(q):
                exact_score += 10

            if exact_score <= 0:
                continue

            normalized = _normalize_tvmaze_show(show)
            if not normalized['posterUrl']:
                continue

            if normalized['averageRating'] <= 0 and exact_score < 80:
                continue

            results.append((exact_score, normalized))

        results.sort(key=lambda entry: (-entry[0], -entry[1]['averageRating'], entry[1]['title']))
        return Response({'results': [entry[1] for entry in results[:8]]})


class ExternalSeriesDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, show_id):
        try:
            response = requests.get(
                f'https://api.tvmaze.com/shows/{show_id}',
                params={'embed[]': ['seasons', 'episodes', 'cast']},
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException:
            return Response({'detail': 'Could not fetch live series data from TVMaze.'}, status=502)

        return Response(_normalize_tvmaze_show(response.json()))


def _get_or_import_external_series(series_id):
    series_id = str(series_id or '').strip()
    series = Series.objects.filter(pk=series_id).first()
    if series or not series_id.isdigit():
        return series

    try:
        response = requests.get(
            f'https://api.tvmaze.com/shows/{series_id}',
            params={'embed[]': ['seasons', 'episodes', 'cast']},
            timeout=10,
        )
        response.raise_for_status()
    except requests.HTTPError as error:
        if error.response is not None and error.response.status_code == 404:
            return None
        raise

    show = response.json() or {}
    if not show.get('id') or not (show.get('name') or '').strip():
        return None

    normalized = _normalize_tvmaze_show(show)
    platform, _ = Platform.objects.get_or_create(name=normalized['platform'])
    with transaction.atomic():
        series, created = Series.objects.get_or_create(
            pk=str(show['id']),
            defaults={
                'title': normalized['title'],
                'tagline': normalized['tagline'],
                'description': normalized['description'],
                'platform': platform,
                'release_year': normalized['releaseYear'],
                'seasons': normalized['seasons'],
                'episodes': normalized['episodes'],
                'poster_url': normalized['posterUrl'],
                'backdrop_url': normalized['posterUrl'],
                'age_rating': normalized['ageRating'],
                'status': normalized['status'],
                'creator': normalized['creator'],
                'cast': normalized['cast'],
                'radar_metrics': normalized['radarMetrics'],
            },
        )
        if created:
            series.genres.set([
                Genre.objects.get_or_create(name=name)[0]
                for name in normalized['genres']
            ])
    return series


class SeriesDetailView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAdminUser()]

    def get(self, request, pk):
        series = get_object_or_404(Series.objects.select_related('platform').prefetch_related('genres'), pk=pk)
        return Response(SeriesSerializer(series, context={'request': request}).data)

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial):
        series = get_object_or_404(Series, pk=pk)
        serializer = SeriesWriteSerializer(series, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        series = serializer.save()
        return Response(SeriesSerializer(series, context={'request': request}).data)

    def delete(self, _request, pk):
        get_object_or_404(Series, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TrendingSeriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        series = Series.objects.filter(is_trending=True).select_related('platform').prefetch_related('genres')
        return Response(SeriesSerializer(series, many=True, context={'request': request}).data)


class PlatformListView(APIView):
    permission_classes = [AllowAny]

    def get(self, _request):
        return Response(PlatformSerializer(Platform.objects.all(), many=True).data)


class GenreListView(APIView):
    permission_classes = [AllowAny]

    def get(self, _request):
        return Response(GenreSerializer(Genre.objects.all(), many=True).data)


class TopRatedSeriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        limit = min(max(int(request.query_params.get('limit', 6)), 1), 100)
        series = Series.objects.select_related('platform').prefetch_related('genres').annotate(
            rating=Avg('reviews__rating'),
        ).order_by('-rating')[:limit]
        return Response(SeriesSerializer(series, many=True, context={'request': request}).data)


class RecentlyAddedSeriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        limit = min(max(int(request.query_params.get('limit', 4)), 1), 100)
        series = Series.objects.filter(is_recently_added=True).select_related('platform').prefetch_related('genres').order_by('-created_at')[:limit]
        return Response(SeriesSerializer(series, many=True, context={'request': request}).data)


class CompareSeriesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ids = request.query_params.getlist('ids')
        series = Series.objects.filter(pk__in=ids).select_related('platform').prefetch_related('genres')
        return Response(SeriesSerializer(series, many=True, context={'request': request}).data)


class ReviewListCreateView(APIView):
    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == 'POST' else [AllowAny()]

    def get(self, request, series_id=None):
        reviews = Review.objects.select_related('series', 'author').prefetch_related('votes')
        if series_id:
            reviews = reviews.filter(series_id=series_id)
        sentiment = request.query_params.get('sentiment')
        if sentiment and sentiment != 'all':
            reviews = reviews.filter(sentiment=sentiment)
        sort = request.query_params.get('sortBy', 'newest')
        if sort == 'rating_desc':
            reviews = reviews.order_by('-rating', '-created_at')
        elif sort == 'rating_asc':
            reviews = reviews.order_by('rating', '-created_at')
        elif sort == 'helpful':
            reviews = reviews.annotate(helpful=Count('votes', filter=Q(votes__direction='up'))).order_by('-helpful', '-created_at')
        return Response(ReviewSerializer(reviews, many=True, context={'request': request}).data)

    def post(self, request):
        try:
            series = _get_or_import_external_series(request.data.get('seriesId'))
        except requests.RequestException:
            return Response({'detail': 'Could not fetch live series data from TVMaze.'}, status=502)
        if not series:
            return Response({'detail': 'Series not found.'}, status=404)
        serializer = ReviewSerializer(data={
            'rating': request.data.get('rating'),
            'title': request.data.get('title'),
            'content': request.data.get('content'),
            'containsSpoilers': request.data.get('containsSpoilers', False),
        }, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review = Review.objects.create(
            series=series,
            author=request.user,
            rating=serializer.validated_data['rating'],
            title=serializer.validated_data['title'],
            content=serializer.validated_data['content'],
            sentiment=classify_sentiment(serializer.validated_data['content']),
            contains_spoilers=serializer.validated_data.get('contains_spoilers', False),
        )
        return Response(ReviewSerializer(review, context={'request': request}).data, status=201)


class ReviewVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        direction = request.data.get('direction')
        if direction not in (ReviewVote.UP, ReviewVote.DOWN):
            return Response({'detail': 'direction must be up or down.'}, status=400)
        review = get_object_or_404(Review, pk=pk)
        vote = ReviewVote.objects.filter(review=review, user=request.user).first()
        if vote and vote.direction == direction:
            vote.delete()
        elif vote:
            vote.direction = direction
            vote.save(update_fields=['direction'])
        else:
            ReviewVote.objects.create(review=review, user=request.user, direction=direction)
        return Response(ReviewSerializer(review, context={'request': request}).data)


class UserReviewListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = Review.objects.filter(author=request.user).select_related('series', 'author').prefetch_related('votes')
        return Response(ReviewSerializer(reviews, many=True, context={'request': request}).data)


class ReviewDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        review = get_object_or_404(Review, pk=pk)
        if review.author_id != request.user.id and not request.user.is_staff:
            return Response({'detail': 'You cannot delete this review.'}, status=403)
        review.delete()
        return Response(status=204)


class WatchlistView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        series_id = request.data.get('seriesId')
        try:
            series = _get_or_import_external_series(series_id)
        except requests.RequestException:
            return Response({'detail': 'Could not fetch live series data from TVMaze.'}, status=502)
        if not series:
            return Response({'detail': 'Series not found.'}, status=404)
        item = WatchlistItem.objects.filter(user=request.user, series=series).first()
        if item:
            item.delete()
        else:
            WatchlistItem.objects.create(
                user=request.user, series=series,
                status=request.data.get('status', 'plan_to_watch'),
            )
        return Response(_user_payload(request.user))

    def patch(self, request):
        item = get_object_or_404(WatchlistItem, user=request.user, series_id=request.data.get('seriesId'))
        item.status = request.data.get('status', item.status)
        item.save(update_fields=['status'])
        return Response(_user_payload(request.user))


class UserRatingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            series = _get_or_import_external_series(request.data.get('seriesId'))
        except requests.RequestException:
            return Response({'detail': 'Could not fetch live series data from TVMaze.'}, status=502)
        if not series:
            return Response({'detail': 'Series not found.'}, status=404)
        rating = request.data.get('rating')
        if not isinstance(rating, int) or not 1 <= rating <= 10:
            return Response({'detail': 'Rating must be an integer from 1 to 10.'}, status=400)
        UserRating.objects.update_or_create(user=request.user, series=series, defaults={'rating': rating})
        return Response(_user_payload(request.user))


@api_view(['GET'])
@permission_classes([AllowAny])
def analytics_overview(_request):
    reviews = Review.objects.all()
    total_reviews = reviews.count()
    sentiment_counts = {row['sentiment']: row['count'] for row in reviews.values('sentiment').annotate(count=Count('id'))}
    sentiment_counts = {key: sentiment_counts.get(key, 0) for key in ['positive', 'neutral', 'negative']}
    percentages = {
        key: round(value * 100 / total_reviews) if total_reviews else 0
        for key, value in sentiment_counts.items()
    }
    histogram_counts = {row['rating']: row['count'] for row in reviews.values('rating').annotate(count=Count('id'))}
    genre_analysis = []
    for genre in Genre.objects.all():
        genre_reviews = reviews.filter(series__genres=genre)
        count = genre_reviews.count()
        positive = genre_reviews.filter(sentiment='positive').count()
        genre_analysis.append({
            'genre': genre.name, 'seriesCount': genre_reviews.values('series_id').distinct().count(),
            'avgRating': round(genre_reviews.aggregate(avg=Avg('rating'))['avg'] or 0, 2),
            'reviewCount': count,
            'positivePercentage': round(positive * 100 / count) if count else 0,
        })
    platform_analysis = []
    for platform in Platform.objects.all():
        platform_reviews = reviews.filter(series__platform=platform)
        count = platform_reviews.count()
        platform_analysis.append({
            'platform': platform.name,
            'seriesCount': platform_reviews.values('series_id').distinct().count(),
            'avgRating': round(platform_reviews.aggregate(avg=Avg('rating'))['avg'] or 0, 2),
            'totalReviews': count,
            'sentimentPositive': round(platform_reviews.filter(sentiment='positive').count() * 100 / count) if count else 0,
            'color': platform.color, 'brandBg': platform.brand_bg,
        })
    current_month = date.today().replace(day=1)
    months = []
    for offset in range(11, -1, -1):
        month_index = current_month.month - offset
        year = current_month.year + (month_index - 1) // 12
        month = (month_index - 1) % 12 + 1
        start = date(year, month, 1)
        end = date(year + (month == 12), 1 if month == 12 else month + 1, 1)
        month_reviews = reviews.filter(created_at__date__gte=start, created_at__date__lt=end)
        count = month_reviews.count()
        months.append({
            'month': start.strftime('%b'), 'totalReviews': count,
            'positive': month_reviews.filter(sentiment='positive').count(),
            'neutral': month_reviews.filter(sentiment='neutral').count(),
            'negative': month_reviews.filter(sentiment='negative').count(),
            'avgRating': round(month_reviews.aggregate(avg=Avg('rating'))['avg'] or 0, 2),
        })
    return Response({
        'totalSeries': reviews.values('series_id').distinct().count(),
        'totalReviews': total_reviews,
        'overallAverageRating': round(reviews.aggregate(avg=Avg('rating'))['avg'] or 0, 2),
        'sentimentDistribution': {
            **percentages,
            'positiveCount': sentiment_counts['positive'],
            'neutralCount': sentiment_counts['neutral'],
            'negativeCount': sentiment_counts['negative'],
        },
        'ratingHistogram': [{'rating': rating, 'count': histogram_counts.get(rating, 0)} for rating in range(1, 11)],
        'genreAnalysis': genre_analysis,
        'platformAnalysis': platform_analysis,
        'reviewsOverTime': months,
    })


class AdminSeriesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        items = Series.objects.select_related('platform').prefetch_related('genres')
        return Response(SeriesSerializer(items, many=True, context={'request': request}).data)

    def post(self, request):
        data = dict(request.data)
        if not data.get('id'):
            import re
            data['id'] = re.sub(r'[^a-z0-9]+', '-', data.get('title', '').lower()).strip('-')
        serializer = SeriesWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        return Response(SeriesSerializer(item, context={'request': request}).data, status=201)


class AdminReviewsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        items = Review.objects.select_related('series', 'author').prefetch_related('votes')
        return Response(ReviewSerializer(items, many=True, context={'request': request}).data)


class AdminUsersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(UserSerializer(User.objects.all(), many=True).data)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'display_name': request.data.get('name', ''),
                'role': request.data.get('role', 'Certified Critic'),
                'critic_outlet': request.data.get('criticOutlet', ''),
                'bio': request.data.get('bio', ''),
                'is_certified_critic': True,
                'verification_status': 'verified',
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
        return Response(UserSerializer(user).data, status=201 if created else 200)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user.pk == request.user.pk:
            return Response(
                {'detail': 'You cannot delete your own administrator account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.is_superuser:
            return Response(
                {'detail': 'Superuser accounts cannot be deleted from the admin panel.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        action = request.data.get('action')
        if action == 'approve_critic':
            user.is_certified_critic = True
            user.verification_status = 'verified'
            if 'critic' not in user.role.lower():
                user.role = 'Certified Critic'
            if not user.critic_outlet:
                user.critic_outlet = 'Accredited Member'
        elif 'role' in request.data:
            user.role = request.data['role']
            user.is_staff = user.role == 'Platform Administrator'
            user.is_certified_critic = any(word in user.role.lower() for word in ['critic', 'lead', 'scientist', 'editor'])
            user.verification_status = 'verified' if user.is_certified_critic else 'none'
        user.save()
        return Response(UserSerializer(user).data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(_request):
    return Response({
        'totalSeries': Series.objects.count(),
        'totalReviews': Review.objects.count(),
        'totalUsers': User.objects.count(),
        'flaggedReviews': Review.objects.filter(is_flagged=True).count(),
        'systemHealth': 'Optimal',
        'databaseStatus': 'Synchronized',
    })
