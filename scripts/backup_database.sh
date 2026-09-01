#!/bin/bash
# Backup Script for TDC PostgreSQL Database

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tdc_backup_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Démarrage de la sauvegarde de la base de données TDC..."

docker exec -t tdc_postgres pg_dump -U tdc_user tdc_db > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  gzip "$BACKUP_FILE"
  echo "✅ Sauvegarde réussie : ${BACKUP_FILE}.gz"
else
  echo "❌ Erreur lors de la sauvegarde"
  exit 1
fi
