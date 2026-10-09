from unittest.mock import patch

from django.contrib.auth import authenticate
from django.core.management import call_command
from rest_framework.test import APITestCase

from .models import Genre, Platform, Review, Series, User


class CinePulseApiTests(APITestCase):
    def setUp(self):
        self.platform = Platform.objects.create(name='Netflix')
        self.genre = Genre.objects.create(name='Drama')
        self.series = Series.objects.create(
            id='test-series', title='Test Series', platform=self.platform,
            release_year=2025, seasons=1, episodes=8,
        )
        self.series.genres.add(self.genre)

    def test_register_and_profile_return_frontend_user_shape(self):
        response = self.client.post('/api/v1/auth/register/', {
            'name': 'Casey Reviewer',
            'email': 'casey@example.com',
            'password': 'long-safe-password',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['user']['name'], 'Casey Reviewer')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        profile = self.client.get('/api/v1/auth/profile/')

        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data['email'], 'casey@example.com')
        self.assertEqual(profile.data['watchlist'], [])

    def test_registration_rejects_weak_password_and_authenticated_user_can_change_password(self):
        weak = self.client.post('/api/v1/auth/register/', {
            'name': 'Weak Password',
            'email': 'weak@example.com',
            'password': 'password',
        }, format='json')
        self.assertEqual(weak.status_code, 400)

        registration = self.client.post('/api/v1/auth/register/', {
            'name': 'Casey Reviewer',
            'email': 'casey@example.com',
            'password': 'Initial-Secure-Pass-123!',
        }, format='json')
        self.assertEqual(registration.status_code, 201)
        self.client.force_authenticate(user=User.objects.get(email='casey@example.com'))

        rejected = self.client.post('/api/v1/auth/password/', {
            'currentPassword': 'wrong-password',
            'newPassword': 'Next-Strong-Password-987!',
        }, format='json')
        self.assertEqual(rejected.status_code, 400)

        changed = self.client.post('/api/v1/auth/password/', {
            'currentPassword': 'Initial-Secure-Pass-123!',
            'newPassword': 'Next-Strong-Password-987!',
        }, format='json')
        self.assertEqual(changed.status_code, 200)
        user = User.objects.get(email='casey@example.com')
        self.assertTrue(user.check_password('Next-Strong-Password-987!'))

    def test_create_admin_command_provisions_admin_login(self):
        call_command('create_admin', '--password', 'Strong-Test-Only-Password-123!')

        admin = User.objects.get(username='admin')
        self.assertEqual(admin.email, 'admin123@gmail.com')
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.check_password('Strong-Test-Only-Password-123!'))
        self.assertEqual(authenticate(username='admin', password='Strong-Test-Only-Password-123!'), admin)

        response = self.client.post('/api/v1/auth/login/', {
            'email': 'admin123@gmail.com',
            'password': 'Strong-Test-Only-Password-123!',
        }, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data['user']['isAdmin'])

    def test_remove_demo_data_command_keeps_non_demo_series(self):
        demo_series = Series.objects.create(
            id='severance', title='Sample', platform=self.platform,
            release_year=2022, seasons=1, episodes=1,
        )
        demo_user = User.objects.create_user(
            username='demo-viewer@cinepulse.local',
            email='demo-viewer@cinepulse.local',
        )
        Review.objects.create(
            series=demo_series,
            author=demo_user,
            rating=7,
            title='Sample review',
            content='Sample review text.',
        )

        call_command('remove_demo_data')

        self.assertFalse(Series.objects.filter(pk='severance').exists())
        self.assertFalse(User.objects.filter(email='demo-viewer@cinepulse.local').exists())
        self.assertTrue(Series.objects.filter(pk='test-series').exists())

    def test_review_creation_classifies_sentiment_and_analytics_uses_database(self):
        user = self.client.post('/api/v1/auth/register/', {
            'name': 'Review Author',
            'email': 'author@example.com',
            'password': 'long-safe-password',
        }, format='json').data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user['access']}")

        response = self.client.post('/api/v1/reviews/', {
            'seriesId': self.series.pk,
            'rating': 9,
            'title': 'Excellent',
            'content': 'A wonderful, brilliant, and thoroughly enjoyable story.',
            'sentiment': 'negative',
            'containsSpoilers': False,
        }, format='json')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['sentiment'], 'positive')
        self.assertEqual(response.data['seriesId'], self.series.pk)
        self.assertEqual(Review.objects.count(), 1)

        analytics = self.client.get('/api/v1/analytics/overview/')
        self.assertEqual(analytics.status_code, 200)
        self.assertEqual(analytics.data['totalReviews'], 1)
        self.assertEqual(analytics.data['sentimentDistribution']['positiveCount'], 1)
        self.assertEqual(analytics.data['ratingHistogram'][8]['count'], 1)

    def test_radar_metrics_are_estimated_from_dimension_mentions_in_reviews(self):
        user = User.objects.create_user(
            username='radar-reviewer@example.com',
            email='radar-reviewer@example.com',
        )
        Review.objects.create(
            series=self.series,
            author=user,
            rating=8,
            title='A strong story',
            content=(
                'The storytelling is brilliant. The cinematography looks stunning. '
                'The pacing is painfully slow. The characters are compelling.'
            ),
            sentiment='positive',
        )

        response = self.client.get(f'/api/v1/series/{self.series.pk}/')

        self.assertEqual(response.status_code, 200)
        metrics = response.data['radarMetrics']
        evidence = response.data['radarMetricEvidence']
        self.assertGreater(metrics['storytelling'], 50)
        self.assertGreater(metrics['production'], 50)
        self.assertLess(metrics['pacing'], 50)
        self.assertGreater(metrics['characterDepth'], 50)
        self.assertEqual(metrics['soundtrack'], 50)
        self.assertEqual(metrics['rewatchability'], 50)
        self.assertEqual(evidence['storytelling'], 1)
        self.assertEqual(evidence['soundtrack'], 0)

    def test_analytics_counts_all_reviews(self):
        test_user = User.objects.create_user(
            username='reviewer@example.com',
            email='reviewer@example.com',
        )
        Review.objects.create(
            series=self.series,
            author=test_user,
            rating=8,
            title='Real review',
            content='Review text.',
            sentiment='positive',
        )

        response = self.client.get('/api/v1/analytics/overview/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['totalReviews'], 1)
        self.assertEqual(response.data['totalSeries'], 1)
        self.assertEqual(response.data['sentimentDistribution']['positiveCount'], 1)

    def test_series_list_matches_frontend_camel_case_shape(self):
        response = self.client.get('/api/v1/series/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]['id'], 'test-series')
        self.assertEqual(response.data[0]['releaseYear'], 2025)
        self.assertEqual(response.data[0]['platform'], 'Netflix')
        self.assertIn('sentimentBreakdown', response.data[0])

    def test_series_list_serializes_review_metrics_without_per_series_queries(self):
        second_series = Series.objects.create(
            id='second-test-series', title='Second Test Series', platform=self.platform,
            release_year=2024, seasons=1, episodes=6,
        )
        reviewer = User.objects.create_user(
            username='query-reviewer@example.com',
            email='query-reviewer@example.com',
        )
        Review.objects.create(
            series=self.series,
            author=reviewer,
            rating=8,
            title='A brilliant story',
            content='The storytelling is excellent.',
            sentiment='positive',
        )
        Review.objects.create(
            series=second_series,
            author=reviewer,
            rating=6,
            title='A mixed story',
            content='The story is good, but the pacing is slow.',
            sentiment='neutral',
        )

        with self.assertNumQueries(4):
            response = self.client.get('/api/v1/series/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        first = next(item for item in response.data if item['id'] == self.series.pk)
        self.assertEqual(first['averageRating'], 8)
        self.assertEqual(first['totalReviews'], 1)

    def test_platform_and_genre_catalogs_and_admin_series_creation(self):
        self.assertEqual(self.client.get('/api/v1/platforms/').data[0]['name'], 'Netflix')
        self.assertEqual(self.client.get('/api/v1/genres/').data[0]['name'], 'Drama')
        denied = self.client.post('/api/v1/series/test-series/', {'title': 'Changed'}, format='json')
        self.assertEqual(denied.status_code, 401)

        admin = self.client.post('/api/v1/auth/register/', {
            'name': 'Catalog Admin',
            'email': 'admin@example.com',
            'password': 'long-safe-password',
        }, format='json')
        from .models import User
        admin_user = User.objects.get(pk=admin.data['user']['id'])
        admin_user.is_staff = True
        admin_user.save(update_fields=['is_staff'])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {admin.data['access']}")
        created = self.client.post('/api/v1/admin/series/', {
            'title': 'New Show',
            'platform': 'Netflix',
            'genres': ['Drama'],
            'releaseYear': 2024,
            'seasons': 1,
            'episodes': 6,
            'posterUrl': '',
            'backdropUrl': '',
        }, format='json')
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data['id'], 'new-show')

    def test_admin_can_delete_user_but_cannot_delete_self_or_superuser(self):
        admin = User.objects.create_superuser(
            username='admin',
            email='admin123@gmail.com',
            password='admin123',
        )
        critic = User.objects.create_user(
            username='critic@example.com',
            email='critic@example.com',
            password='safe-password',
            is_certified_critic=True,
        )
        other_superuser = User.objects.create_superuser(
            username='other-admin',
            email='other-admin@example.com',
            password='another-safe-password',
        )
        self.client.force_authenticate(user=admin)

        denied_self = self.client.delete(f'/api/v1/admin/users/{admin.pk}/')
        self.assertEqual(denied_self.status_code, 400)
        denied_superuser = self.client.delete(f'/api/v1/admin/users/{other_superuser.pk}/')
        self.assertEqual(denied_superuser.status_code, 403)

        deleted = self.client.delete(f'/api/v1/admin/users/{critic.pk}/')
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(User.objects.filter(pk=critic.pk).exists())

    @patch('api.views.requests.get')
    def test_external_live_series_search_returns_tvmaze_results(self, mock_get):
        mock_get.return_value.json.return_value = [
            {
                'show': {
                    'id': 42,
                    'name': 'Breaking Bad',
                    'summary': '<p>A chemistry teacher turns to cooking meth.</p>',
                    'genres': ['Drama', 'Crime'],
                    'premiered': '2008-01-20',
                    'network': {'name': 'AMC'},
                    'image': {'original': 'https://example.com/poster.jpg'},
                    'rating': {'average': 9.4},
                }
            },
            {
                'show': {
                    'id': 99,
                    'name': 'Breaking Dad',
                    'summary': 'Not the same show',
                    'genres': ['Adventure'],
                    'premiered': '2024-01-01',
                    'network': {'name': 'ITV1'},
                    'image': {'original': 'https://example.com/other.jpg'},
                    'rating': {'average': 0.0},
                }
            },
            {
                'show': {
                    'id': 123,
                    'name': 'Untitled Series',
                    'summary': 'No real info',
                    'genres': [],
                    'premiered': '2023-01-01',
                    'network': {'name': 'TVMaze'},
                    'image': {},
                    'rating': {'average': 0.0},
                }
            }
        ]
        mock_get.return_value.raise_for_status.return_value = None

        response = self.client.get('/api/v1/series/external/', {'q': 'breaking bad'})

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['results'][0]['id'], 42)
        self.assertEqual(response.data['results'][0]['title'], 'Breaking Bad')
        self.assertEqual(response.data['results'][0]['platform'], 'AMC')
        self.assertEqual(response.data['results'][0]['genres'], ['Drama', 'Crime'])
        self.assertGreater(response.data['results'][0]['averageRating'], 0)
        self.assertNotIn('Untitled Series', [item['title'] for item in response.data['results']])

    @patch('api.views.requests.get')
    def test_external_series_detail_returns_normalized_tvmaze_show(self, mock_get):
        mock_get.return_value.json.return_value = {
            'id': 42,
            'name': 'Breaking Bad',
            'summary': '<p>A chemistry teacher turns to cooking meth.</p>',
            'genres': ['Drama', 'Crime'],
            'premiered': '2008-01-20',
            'network': {'name': 'AMC'},
            'webChannel': {'name': 'OTTIntel Test Channel'},
            'image': {'original': 'https://example.com/poster.jpg'},
            'rating': {'average': 9.4},
            'status': 'Ended',
            '_embedded': {
                'seasons': [{}, {}, {}, {}, {}],
                'episodes': [{}, {}, {}],
                'cast': [
                    {'person': {'name': 'Bryan Cranston'}},
                    {'person': {'name': 'Aaron Paul'}},
                ],
            },
        }
        mock_get.return_value.raise_for_status.return_value = None

        response = self.client.get('/api/v1/series/external/42/')

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['id'], 42)
        self.assertEqual(response.data['title'], 'Breaking Bad')
        self.assertEqual(response.data['platform'], 'OTTIntel Test Channel')
        self.assertEqual(response.data['posterUrl'], 'https://example.com/poster.jpg')
        self.assertEqual(response.data['seasons'], 5)
        self.assertEqual(response.data['episodes'], 3)
        self.assertEqual(response.data['cast'], ['Bryan Cranston', 'Aaron Paul'])
        self.assertEqual(response.data['status'], 'Ended')
        mock_get.assert_called_once_with(
            'https://api.tvmaze.com/shows/42',
            params={'embed[]': ['seasons', 'episodes', 'cast']},
            timeout=10,
        )

    @patch('api.views.requests.get')
    def test_live_series_can_be_reviewed_rated_and_added_to_watchlist(self, mock_get):
        mock_get.return_value.json.return_value = {
            'id': 42,
            'name': 'Breaking Bad',
            'summary': '<p>A chemistry teacher turns to cooking meth.</p>',
            'genres': ['Drama', 'Crime'],
            'premiered': '2008-01-20',
            'network': {'name': 'AMC'},
            'image': {'original': 'https://example.com/poster.jpg'},
            'rating': {'average': 9.4},
        }
        mock_get.return_value.raise_for_status.return_value = None
        auth = self.client.post('/api/v1/auth/register/', {
            'name': 'Live Series Reviewer',
            'email': 'live-reviewer@example.com',
            'password': 'long-safe-password',
        }, format='json').data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {auth['access']}")

        review = self.client.post('/api/v1/reviews/', {
            'seriesId': '42', 'rating': 9, 'title': 'Excellent',
            'content': 'A brilliant series.', 'containsSpoilers': False,
        }, format='json')
        self.assertEqual(review.status_code, 201, review.data)
        self.assertTrue(Series.objects.filter(pk='42', title='Breaking Bad').exists())

        analytics = self.client.get('/api/v1/analytics/overview/')
        self.assertEqual(analytics.status_code, 200, analytics.data)
        self.assertEqual(analytics.data['totalReviews'], 1)
        self.assertEqual(analytics.data['totalSeries'], 1)
        self.assertEqual(analytics.data['sentimentDistribution']['positiveCount'], 1)

        watchlist = self.client.post('/api/v1/watchlist/', {'seriesId': '42'}, format='json')
        self.assertEqual(watchlist.status_code, 200, watchlist.data)
        self.assertEqual(watchlist.data['watchlist'][0]['seriesId'], '42')

        rating = self.client.post('/api/v1/ratings/', {'seriesId': '42', 'rating': 8}, format='json')
        self.assertEqual(rating.status_code, 200, rating.data)
        self.assertEqual(rating.data['ratings'][0]['seriesId'], '42')
        mock_get.assert_called_once_with(
            'https://api.tvmaze.com/shows/42',
            params={'embed[]': ['seasons', 'episodes', 'cast']},
            timeout=10,
        )
