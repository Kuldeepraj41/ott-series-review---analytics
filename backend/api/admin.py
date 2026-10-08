from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Genre, Platform, Review, ReviewVote, Series, User, UserRating, WatchlistItem


admin.site.register(User, UserAdmin)
admin.site.register([Genre, Platform, Review, ReviewVote, Series, UserRating, WatchlistItem])