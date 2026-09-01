#!/bin/sh
set -e

echo "Waiting for postgres..."
while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
  sleep 0.5
done
echo "PostgreSQL started"

echo "Applying database migrations..."
python manage.py makemigrations
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Seeding TDC 2026 default database..."
python scripts/seed_tdc_data.py || true

exec "$@"
