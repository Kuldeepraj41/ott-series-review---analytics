from django.core.management.base import BaseCommand

from api.models import Series, User


DEMO_SERIES_IDS = (
    'severance',
    'succession',
    'the-bear',
    'the-last-of-us',
    'the-boys',
    'wednesday',
)
DEMO_USER_EMAILS = (
    'demo-critic@cinepulse.local',
    'demo-viewer@cinepulse.local',
)


class Command(BaseCommand):
    help = 'Remove the sample series and sample accounts created by the old demo seeder.'

    def handle(self, *args, **options):
        deleted_series, _ = Series.objects.filter(pk__in=DEMO_SERIES_IDS).delete()
        deleted_users, _ = User.objects.filter(email__in=DEMO_USER_EMAILS).delete()
        self.stdout.write(self.style.SUCCESS(
            f'Removed {deleted_series} records belonging to legacy demo series and '
            f'{deleted_users} records belonging to demo accounts.'
        ))
