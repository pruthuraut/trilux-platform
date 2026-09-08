#!/bin/bash
set -e

# RUN_MIGRATIONS=1 (default for the web service) runs collectstatic + migrate and
# optionally seeds a superuser. Workers/beat set RUN_MIGRATIONS=0 to avoid racing.
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "[entrypoint] collectstatic..."
  python manage.py collectstatic --noinput || true

  echo "[entrypoint] migrate..."
  python manage.py migrate --noinput

  # Optional: auto-create a superuser if DJANGO_SUPERUSER_EMAIL/PASSWORD are set.
  if [ -n "${DJANGO_SUPERUSER_EMAIL}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD}" ]; then
    echo "[entrypoint] ensuring superuser ${DJANGO_SUPERUSER_EMAIL}..."
    python manage.py createsuperuser --noinput --email "${DJANGO_SUPERUSER_EMAIL}" 2>/dev/null \
      && echo "[entrypoint] superuser created" \
      || echo "[entrypoint] superuser already exists (ok)"
  fi
fi

exec "$@"
