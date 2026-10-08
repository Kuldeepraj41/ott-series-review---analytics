from getpass import getpass

from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from api.models import User


class Command(BaseCommand):
    help = 'Create or update the application administrator account.'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin')
        parser.add_argument('--email', default='admin123@gmail.com')
        parser.add_argument('--password')

    def handle(self, *args, **options):
        username = options['username']
        email = options['email'].strip().lower()
        password = options['password'] or getpass('Administrator password: ')
        if not username or not email or not password:
            raise CommandError('Username, email, and password must not be empty.')

        existing_user = User.objects.filter(username=username).first()
        users_with_email = User.objects.filter(email__iexact=email)
        if existing_user:
            users_with_email = users_with_email.exclude(pk=existing_user.pk)
        if users_with_email.exists():
            raise CommandError(f'The email address {email} is already assigned to another account.')
        try:
            password_validation.validate_password(password, User(username=username, email=email))
        except ValidationError as error:
            raise CommandError('; '.join(error.messages)) from error

        user, _created = User.objects.get_or_create(
            username=username,
            defaults={'email': email},
        )
        user.email = email
        user.display_name = 'Admin'
        user.role = 'Platform Administrator'
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(f'Administrator account ready: {username} ({email}).'))
