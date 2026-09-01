#!/bin/bash
# Restore Script for TDC PostgreSQL Database

if [ -z "$1" ]; then
  echo "Usage: ./scripts/restore_database.sh <chemin_du_fichier_backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Fichier introuvable : $BACKUP_FILE"
  exit 1
fi

echo "Restauration de la base de données TDC depuis $BACKUP_FILE..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | docker exec -i tdc_postgres psql -U tdc_user -d tdc_db
else
  docker exec -i tdc_postgres psql -U tdc_user -d tdc_db < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
  echo "✅ Restauration effectuée avec succès !"
else
  echo "❌ Erreur lors de la restauration."
  exit 1
fi
