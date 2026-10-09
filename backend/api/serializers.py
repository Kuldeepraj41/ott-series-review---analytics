from django.db.models import Avg, Count, Q
from rest_framework import serializers

from .models import Genre, Platform, Review, Series, User, UserRating, WatchlistItem
from .sentiment import estimate_radar_metrics


class PlatformSerializer(serializers.ModelSerializer):
    class Meta:
        model = Platform
        fields = ['name', 'color', 'brand_bg']


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['name']


class SeriesSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    platform = serializers.CharField(source='platform.name', read_only=True)
    genres = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    releaseYear = serializers.IntegerField(source='release_year', read_only=True)
    averageRating = serializers.SerializerMethodField()
    audienceRating = serializers.SerializerMethodField()
    totalReviews = serializers.SerializerMethodField()
    totalCriticReviews = serializers.SerializerMethodField()
    totalAudienceReviews = serializers.SerializerMethodField()
    sentimentBreakdown = serializers.SerializerMethodField()
    ratingDistribution = serializers.SerializerMethodField()
    posterUrl = serializers.CharField(source='poster_url', read_only=True)
    backdropUrl = serializers.CharField(source='backdrop_url', read_only=True)
    ageRating = serializers.CharField(source='age_rating', read_only=True)
    isTrending = serializers.BooleanField(source='is_trending', read_only=True)
    isTopRated = serializers.BooleanField(source='is_top_rated', read_only=True)
    isRecentlyAdded = serializers.BooleanField(source='is_recently_added', read_only=True)
    radarMetrics = serializers.SerializerMethodField()
    radarMetricEvidence = serializers.SerializerMethodField()

    class Meta:
        model = Series
        fields = [
            'id', 'title', 'tagline', 'description', 'platform', 'genres', 'releaseYear',
            'seasons', 'episodes', 'averageRating', 'audienceRating', 'totalReviews',
            'totalCriticReviews', 'totalAudienceReviews', 'sentimentBreakdown',
            'ratingDistribution', 'posterUrl', 'backdropUrl', 'ageRating', 'status',
            'creator', 'cast', 'isTrending', 'isTopRated', 'isRecentlyAdded', 'radarMetrics',
            'radarMetricEvidence',
        ]

    def _radar_data(self, obj):
        cached = getattr(obj, '_serialized_radar_data', None)
        if cached is None:
            estimated, evidence = estimate_radar_metrics(self._review_records(obj))
            metrics = dict(estimated)
            for dimension, value in (obj.radar_metrics or {}).items():
                if dimension in metrics and isinstance(value, (int, float)) and value > 0:
                    metrics[dimension] = value
            cached = (metrics, evidence)
            obj._serialized_radar_data = cached
        return cached

    def get_radarMetrics(self, obj):
        return self._radar_data(obj)[0]

    def get_radarMetricEvidence(self, obj):
        return self._radar_data(obj)[1]

    def _review_records(self, obj):
        cached = getattr(obj, '_serialized_review_records', None)
        if cached is None:
            if 'reviews' in getattr(obj, '_prefetched_objects_cache', {}):
                cached = obj._prefetched_objects_cache['reviews']
            else:
                cached = list(obj.reviews.select_related('author').all())
            obj._serialized_review_records = cached
        return cached

    def _review_summary(self, obj):
        cached = getattr(obj, '_serialized_review_summary', None)
        if cached is not None:
            return cached

        reviews = self._review_records(obj)
        critics = [review.rating for review in reviews if review.author.is_certified_critic]
        audience = [review.rating for review in reviews if not review.author.is_certified_critic]
        all_ratings = [review.rating for review in reviews]
        sentiment_counts = {'positive': 0, 'neutral': 0, 'negative': 0}
        rating_distribution = {}
        for review in reviews:
            sentiment_counts[review.sentiment] += 1
            rating_distribution[review.rating] = rating_distribution.get(review.rating, 0) + 1

        total = len(reviews)
        def average(values):
            return round(sum(values) / len(values), 1) if values else 0

        cached = {
            'averageRating': average(critics or all_ratings),
            'audienceRating': average(audience) if audience else average(critics or all_ratings),
            'totalReviews': total,
            'totalCriticReviews': len(critics),
            'totalAudienceReviews': len(audience),
            'sentimentBreakdown': {
                key: round(count * 100 / total) if total else 0
                for key, count in sentiment_counts.items()
            },
            'ratingDistribution': rating_distribution,
        }
        obj._serialized_review_summary = cached
        return cached

    def get_averageRating(self, obj):
        return self._review_summary(obj)['averageRating']

    def get_audienceRating(self, obj):
        return self._review_summary(obj)['audienceRating']

    def get_totalReviews(self, obj):
        return self._review_summary(obj)['totalReviews']

    def get_totalCriticReviews(self, obj):
        return self._review_summary(obj)['totalCriticReviews']

    def get_totalAudienceReviews(self, obj):
        return self._review_summary(obj)['totalAudienceReviews']

    def get_sentimentBreakdown(self, obj):
        return self._review_summary(obj)['sentimentBreakdown']

    def get_ratingDistribution(self, obj):
        return self._review_summary(obj)['ratingDistribution']


class ReviewSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    seriesId = serializers.CharField(source='series_id', read_only=True)
    seriesTitle = serializers.CharField(source='series.title', read_only=True)
    seriesPoster = serializers.CharField(source='series.poster_url', read_only=True)
    authorName = serializers.CharField(source='author.name', read_only=True)
    authorAvatar = serializers.CharField(source='author.avatar', read_only=True)
    authorRole = serializers.CharField(source='author.role', read_only=True)
    isCriticReview = serializers.BooleanField(source='author.is_certified_critic', read_only=True)
    criticOutlet = serializers.CharField(source='author.critic_outlet', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    helpfulCount = serializers.SerializerMethodField()
    unhelpfulCount = serializers.SerializerMethodField()
    userHelpfulVote = serializers.SerializerMethodField()
    containsSpoilers = serializers.BooleanField(source='contains_spoilers')

    class Meta:
        model = Review
        fields = [
            'id', 'seriesId', 'seriesTitle', 'seriesPoster', 'authorName', 'authorAvatar',
            'authorRole', 'isCriticReview', 'criticOutlet', 'rating', 'title', 'content',
            'sentiment', 'createdAt', 'helpfulCount', 'unhelpfulCount', 'userHelpfulVote',
            'containsSpoilers',
        ]
        read_only_fields = ['sentiment']

    def validate_rating(self, value):
        if not 1 <= value <= 10:
            raise serializers.ValidationError('Rating must be between 1 and 10.')
        return value

    def get_helpfulCount(self, obj):
        return obj.votes.filter(direction='up').count()

    def get_unhelpfulCount(self, obj):
        return obj.votes.filter(direction='down').count()

    def get_userHelpfulVote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.direction if vote else None
        return None


class WatchlistSerializer(serializers.ModelSerializer):
    seriesId = serializers.CharField(source='series_id')
    addedAt = serializers.DateTimeField(source='added_at', read_only=True)

    class Meta:
        model = WatchlistItem
        fields = ['seriesId', 'status', 'addedAt']


class UserRatingSerializer(serializers.ModelSerializer):
    seriesId = serializers.CharField(source='series_id')
    ratedAt = serializers.DateTimeField(source='rated_at', read_only=True)

    class Meta:
        model = UserRating
        fields = ['seriesId', 'rating', 'ratedAt']


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    joinedDate = serializers.DateTimeField(source='date_joined', read_only=True)
    preferredPlatforms = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field='name', source='preferred_platforms'
    )
    isCertifiedCritic = serializers.BooleanField(source='is_certified_critic', read_only=True)
    isAdmin = serializers.BooleanField(source='is_staff', read_only=True)
    criticOutlet = serializers.CharField(source='critic_outlet', read_only=True)
    verificationStatus = serializers.CharField(source='verification_status', read_only=True)
    watchlist = WatchlistSerializer(many=True, read_only=True)
    ratings = UserRatingSerializer(many=True, read_only=True, source='series_ratings')

    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'avatar', 'bio', 'role', 'isAdmin', 'isCertifiedCritic',
            'criticOutlet', 'verificationStatus', 'joinedDate', 'preferredPlatforms',
            'watchlist', 'ratings',
        ]


class SeriesWriteSerializer(serializers.ModelSerializer):
    id = serializers.SlugField(required=False)
    platform = serializers.SlugRelatedField(slug_field='name', queryset=Platform.objects.all())
    genres = serializers.SlugRelatedField(slug_field='name', queryset=Genre.objects.all(), many=True)
    releaseYear = serializers.IntegerField(source='release_year')
    posterUrl = serializers.URLField(source='poster_url', required=False, allow_blank=True)
    backdropUrl = serializers.URLField(source='backdrop_url', required=False, allow_blank=True)
    ageRating = serializers.CharField(source='age_rating', required=False, allow_blank=True)
    isTrending = serializers.BooleanField(source='is_trending', required=False)
    isTopRated = serializers.BooleanField(source='is_top_rated', required=False)

    class Meta:
        model = Series
        fields = [
            'id', 'title', 'tagline', 'description', 'platform', 'genres', 'releaseYear',
            'seasons', 'episodes', 'posterUrl', 'backdropUrl', 'ageRating', 'creator',
            'cast', 'isTrending', 'isTopRated', 'status', 'radar_metrics',
        ]

    def create(self, validated_data):
        genres = validated_data.pop('genres')
        item = Series.objects.create(**validated_data)
        item.genres.set(genres)
        return item

    def update(self, instance, validated_data):
        genres = validated_data.pop('genres', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        if genres is not None:
            instance.genres.set(genres)
        return instance