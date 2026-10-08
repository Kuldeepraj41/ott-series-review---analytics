from django.contrib.auth.models import AbstractUser
from django.db import models


class Platform(models.Model):
    name = models.CharField(max_length=60, unique=True)
    color = models.CharField(max_length=20, default='#e11d48')
    brand_bg = models.CharField(max_length=40, default='bg-rose-600')

    def __str__(self):
        return self.name


class Genre(models.Model):
    name = models.CharField(max_length=60, unique=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=120, blank=True)
    avatar = models.URLField(blank=True)
    bio = models.TextField(blank=True)
    role = models.CharField(max_length=80, default='Community Reviewer')
    is_certified_critic = models.BooleanField(default=False)
    critic_outlet = models.CharField(max_length=160, blank=True)
    verification_status = models.CharField(max_length=12, default='none')
    preferred_platforms = models.ManyToManyField(Platform, blank=True, related_name='preferred_by')

    @property
    def name(self):
        return self.display_name or self.get_full_name() or self.username


class Series(models.Model):
    STATUS_CHOICES = [('Ongoing', 'Ongoing'), ('Ended', 'Ended'), ('Upcoming', 'Upcoming')]
    id = models.SlugField(primary_key=True, max_length=180)
    title = models.CharField(max_length=200)
    tagline = models.CharField(max_length=300, blank=True)
    description = models.TextField(blank=True)
    platform = models.ForeignKey(Platform, on_delete=models.PROTECT, related_name='series')
    genres = models.ManyToManyField(Genre, related_name='series')
    release_year = models.PositiveSmallIntegerField()
    seasons = models.PositiveSmallIntegerField(default=1)
    episodes = models.PositiveSmallIntegerField(default=1)
    poster_url = models.URLField(blank=True)
    backdrop_url = models.URLField(blank=True)
    age_rating = models.CharField(max_length=12, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='Ongoing')
    creator = models.CharField(max_length=180, blank=True)
    cast = models.JSONField(default=list, blank=True)
    is_trending = models.BooleanField(default=False)
    is_top_rated = models.BooleanField(default=False)
    is_recently_added = models.BooleanField(default=False)
    radar_metrics = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Review(models.Model):
    SENTIMENT_CHOICES = [('positive', 'Positive'), ('neutral', 'Neutral'), ('negative', 'Negative')]
    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name='reviews')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200)
    content = models.TextField()
    sentiment = models.CharField(max_length=8, choices=SENTIMENT_CHOICES, default='neutral')
    contains_spoilers = models.BooleanField(default=False)
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=10), name='review_rating_1_to_10')]


class ReviewVote(models.Model):
    UP = 'up'
    DOWN = 'down'
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_votes')
    direction = models.CharField(max_length=4, choices=[(UP, 'Up'), (DOWN, 'Down')])

    class Meta:
        constraints = [models.UniqueConstraint(fields=['review', 'user'], name='unique_review_vote')]


class WatchlistItem(models.Model):
    STATUS_CHOICES = [('watching', 'Watching'), ('plan_to_watch', 'Plan to watch'), ('completed', 'Completed')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlist')
    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name='watchlist_entries')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='plan_to_watch')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'series'], name='unique_user_watchlist_series')]


class UserRating(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='series_ratings')
    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name='user_ratings')
    rating = models.PositiveSmallIntegerField()
    rated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'series'], name='unique_user_series_rating'),
            models.CheckConstraint(condition=models.Q(rating__gte=1, rating__lte=10), name='user_rating_1_to_10'),
        ]