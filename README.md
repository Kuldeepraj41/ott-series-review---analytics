# CinePulse

CinePulse is a React frontend backed by a Django REST API. Production deployments use a managed PostgreSQL database; the API serves static files through WhiteNoise.

## Local development

1. Install frontend dependencies with `npm install`.
2. Create a Python environment and install `backend/requirements.txt`.
3. Copy `.env.example` to `.env`. Keep `DJANGO_DEBUG=true` locally and provide a strong `DJANGO_SECRET_KEY`.
4. Run `python backend/manage.py migrate`.
5. Run `python backend/manage.py remove_demo_data` if upgrading a database that contains legacy sample data.
6. Provision the administrator interactively with `python backend/manage.py create_admin`. The command prompts for a password without echoing it and enforces Django's password validators.
7. Start the API with `python backend/manage.py runserver` and the frontend with `npm run dev`.

The local frontend connects to `http://127.0.0.1:8000/api/v1` by default. Set `VITE_API_URL` to override it.

## Production deployment

Deploy the frontend and API separately, for example with Vercel and Render, and attach a managed PostgreSQL database to the API.

### Django API service

- Set the service root directory to `backend`.
- Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Start command: `gunicorn cinepulse.wsgi:application`
- Configure `DJANGO_DEBUG=false`, a newly generated `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS` with the API host, `DATABASE_URL` with the PostgreSQL connection string, and `CORS_ALLOWED_ORIGINS` with the exact HTTPS frontend origin.
- Optionally set `CSRF_TRUSTED_ORIGINS` to the HTTPS frontend origin.
- Run `python manage.py migrate` as the provider's pre-deploy command, then run `python manage.py create_admin` in the deployed service shell to set the initial administrator password interactively.

Production refuses to start without a secret key, allowed host, frontend CORS origin, and PostgreSQL configuration. HTTPS redirects, secure cookies, HSTS, security headers, static-file middleware, and scoped login/registration throttling are enabled outside debug/test mode.

### React frontend

- Set the Vercel project root to the repository root, build command to `npm run build`, and output directory to `dist`.
- Set `VITE_API_URL` to the API base URL, including `/api/v1` (for example, `https://api.example.com/api/v1`).
- Set any frontend-required public build variables in the Vercel project environment. Never put backend credentials or the Django secret key in frontend variables.

Production always uses the Django API and fails clearly if `VITE_API_URL` is missing; local mock mode is not used in production.

## Accounts and passwords

Registration and administrator provisioning enforce Django's password validators. Users can change their own password from their profile after authenticating with their current password. Existing users retain their accounts and should change their passwords individually; do not reuse a shared password.

The API provides JWT authentication, profiles, catalog and review operations, watchlists, ratings, admin endpoints, and database-backed analytics. Routes are rooted at `/api/v1/`; `/api/v1/health/` provides a health check.
