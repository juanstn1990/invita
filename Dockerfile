# Invita — imagen de producción.
#
# `node:22-slim` y no Alpine a propósito: los engines de Prisma en musl piden
# configuración extra que no compensa para lo que se gana en tamaño.

# ── Dependencias ────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `--ignore-scripts` para que el esquema de Prisma no entre en esta capa: si
# entra, cada cambio del esquema invalida el `npm ci` y son cinco minutos de
# espera por tocar una línea. El cliente se genera en la etapa de build, que
# es donde de verdad hace falta.
RUN npm ci --ignore-scripts

# ── Build ───────────────────────────────────────────────────────
FROM node:22-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` valida los tipos, así que compilar aquí también verifica.
RUN npx prisma generate && npm run build

# ── Ejecución ───────────────────────────────────────────────────
FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
# openssl lo necesita el engine de Prisma; ca-certificates, cualquier fetch.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates sqlite3 \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Los 27 diseños se leen con una ruta armada en tiempo de ejecución, así que el
# trazado de Next no los incluye: van a mano o la invitación no renderiza.
COPY --from=build /app/templates ./templates

# El esquema y el cliente de Prisma. `db push` al arrancar los necesita.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
