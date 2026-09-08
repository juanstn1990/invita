#!/bin/sh
# Restaura un respaldo de la base al volumen.
#
#   sh scripts/docker-restore.sh /mnt/c/Users/Public/Invita/respaldos/base-2026-09-08-21-00.db
#
# Sobrescribe la base del volumen, así que pide confirmación.
set -e

COPIA="$1"
[ -n "$COPIA" ] || { echo "Uso: sh scripts/docker-restore.sh <archivo.db>" >&2; exit 1; }
[ -f "$COPIA" ] || { echo "No existe: $COPIA" >&2; exit 1; }

VOLUMEN="$(basename "$(pwd)")_base"
printf "Esto reemplaza la base de %s por %s. ¿Seguro? [escribe si] " "$VOLUMEN" "$COPIA"
read -r r
[ "$r" = "si" ] || { echo "Cancelado."; exit 1; }

docker compose stop app 2>/dev/null || true
docker run --rm \
  -v "$VOLUMEN":/base \
  -v "$(cd "$(dirname "$COPIA")" && pwd)":/entrada:ro \
  alpine:3 sh -c "cp /entrada/$(basename "$COPIA") /base/dev.db && rm -f /base/dev.db-wal /base/dev.db-shm"

echo "Restaurada. Levanta con: docker compose up -d"
