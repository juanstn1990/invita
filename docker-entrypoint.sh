#!/bin/sh
# Prepara los datos antes de arrancar el servidor.
set -e

# Las carpetas de datos llegan por volumen y pueden venir vacías la primera vez.
mkdir -p "${UPLOADS_DIR:-/data/biblioteca}" "$(dirname "${DB_FILE:-/data/base/dev.db}")"

# El esquema se aplica en cada arranque: `db push` es idempotente, así que
# levantar con la base ya hecha no cambia nada y levantar con el volumen
# recién creado la construye.
#
# Se invoca con `node` y la ruta completa, no con `npx prisma`: la salida
# autónoma de Next no trae `node_modules/.bin`, así que el nombre no está en
# el PATH y `npx` no lo encuentra.
echo "→ aplicando el esquema"
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

exec "$@"
