#!/bin/sh
# Respalda el volumen de la base a la carpeta de datos.
#
#   sh scripts/docker-backup.sh
#   INVITA_DATA=/mnt/d/Invita sh scripts/docker-backup.sh
#
# Un volumen con nombre **no se respalda con `cp`**: no tiene ruta accesible
# desde el host. Se monta en un contenedor de paso —eso es el `alpine` de
# abajo— y se saca desde dentro.
#
# La biblioteca de imágenes no aparece aquí a propósito: va en un bind mount,
# así que ya está en el disco de Windows y la respalda lo que respalde C:.
set -e

DATOS="${INVITA_DATA:-/mnt/c/Users/Public/Invita}"
DESTINO="$DATOS/respaldos"
VOLUMEN="$(basename "$(pwd)")_base"
SELLO="$(date +%Y-%m-%d-%H-%M)"

mkdir -p "$DESTINO"

if ! docker volume inspect "$VOLUMEN" >/dev/null 2>&1; then
  echo "No existe el volumen $VOLUMEN. ¿Levantaste con docker compose up?" >&2
  exit 1
fi

# La base se saca con VACUUM INTO y no copiando el archivo: es la forma que
# trae SQLite de obtener una copia consistente con la aplicación escribiendo.
# Copiar el .db a pelo en medio de una transacción da una copia corrupta.
docker run --rm \
  -v "$VOLUMEN":/base \
  -v "$DESTINO":/salida \
  alpine:3 sh -c "
    apk add --no-cache sqlite >/dev/null 2>&1
    sqlite3 /base/dev.db \"VACUUM INTO '/salida/base-$SELLO.db'\"
    sqlite3 /salida/base-$SELLO.db 'PRAGMA integrity_check;'
  "

echo "→ $DESTINO/base-$SELLO.db"
ls -lh "$DESTINO/base-$SELLO.db" | awk '{print "  ", $5}'
