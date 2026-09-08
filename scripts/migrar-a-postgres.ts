/**
 * Pasa los datos de la base SQLite a Postgres.
 *
 *   DATABASE_URL=postgres://… npx tsx scripts/migrar-a-postgres.ts [ruta/dev.db]
 *
 * Se corre **una vez**, al cambiar de proveedor. El esquema de Prisma ahora
 * dice `postgresql`, así que el archivo `dev.db` deja de ser accesible por el
 * cliente: sin este paso las invitaciones y la biblioteca siguen ahí, en
 * disco, pero la aplicación ya no las ve.
 *
 * Lee el SQLite con `node:sqlite`, que viene en Node desde la 22, así que no
 * hace falta traer un driver sólo para esto. Escribe con el cliente de Prisma
 * ya apuntando a Postgres.
 *
 * Es idempotente: usa `skipDuplicates`, así que volver a correrlo no duplica
 * nada. Y respeta el orden de las claves ajenas —invitaciones, luego enlaces
 * de invitado, luego respuestas— porque en Postgres sí se comprueban.
 */

import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import { prisma } from "../src/lib/prisma";

const ORIGEN = path.resolve(
  process.cwd(),
  process.argv[2] || "prisma/dev.db"
);

if (!fs.existsSync(ORIGEN)) {
  console.error(`No existe: ${ORIGEN}`);
  process.exit(1);
}
if (!/^postgres/.test(process.env.DATABASE_URL || "")) {
  console.error("DATABASE_URL tiene que apuntar a Postgres para migrar hacia allá.");
  process.exit(1);
}

const db = new DatabaseSync(ORIGEN, { readOnly: true });

/** Las tablas que existen en el SQLite de origen. */
const tablas = new Set(
  db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r: any) => String(r.name))
);

const leer = (tabla: string): any[] =>
  tablas.has(tabla) ? db.prepare(`SELECT * FROM "${tabla}"`).all() : [];

/** SQLite guarda las fechas como número o texto; Postgres quiere Date. */
const fecha = (v: unknown): Date =>
  v instanceof Date ? v : new Date(typeof v === "number" ? v : String(v));

/** Y los booleanos como 0/1. */
const bool = (v: unknown): boolean => v === 1 || v === true || v === "1";

(async () => {
  console.log(`De  ${ORIGEN}`);
  console.log(`A   ${(process.env.DATABASE_URL || "").replace(/:[^:@/]+@/, ":***@")}\n`);

  /* El orden importa: en Postgres las claves ajenas se comprueban de verdad,
     así que una respuesta no puede entrar antes que su invitación. */
  const invitaciones = leer("Invitation").map((r) => ({
    id: r.id,
    slug: r.slug,
    mode: r.mode ?? "plantilla",
    templateId: r.templateId,
    title: r.title,
    data: r.data,
    tree: r.tree ?? null,
    manageToken: r.manageToken ?? null,
    published: bool(r.published),
    views: Number(r.views ?? 0),
    createdAt: fecha(r.createdAt),
    updatedAt: fecha(r.updatedAt),
  }));

  const enlaces = leer("GuestLink").map((r) => ({
    id: r.id,
    invitationId: r.invitationId,
    names: r.names,
    code: r.code,
    note: r.note ?? null,
    createdAt: fecha(r.createdAt),
  }));

  const respuestas = leer("Rsvp").map((r) => ({ ...r, createdAt: fecha(r.createdAt) }));

  const medios = leer("Media").map((r) => ({
    id: r.id,
    url: r.url,
    name: r.name,
    mime: r.mime,
    bytes: Number(r.bytes ?? 0),
    width: r.width == null ? null : Number(r.width),
    height: r.height == null ? null : Number(r.height),
    kind: r.kind ?? "foto",
    createdAt: fecha(r.createdAt),
  }));

  const pasos: [string, any[], (d: any[]) => Promise<{ count: number }>][] = [
    ["invitaciones", invitaciones, (d) => prisma.invitation.createMany({ data: d, skipDuplicates: true })],
    ["enlaces de invitado", enlaces, (d) => prisma.guestLink.createMany({ data: d, skipDuplicates: true })],
    ["respuestas", respuestas, (d) => prisma.rsvp.createMany({ data: d, skipDuplicates: true })],
    ["imágenes", medios, (d) => prisma.media.createMany({ data: d, skipDuplicates: true })],
  ];

  for (const [nombre, datos, meter] of pasos) {
    if (!datos.length) {
      console.log(`  ${nombre.padEnd(22)} nada que pasar`);
      continue;
    }
    const { count } = await meter(datos);
    const repetidas = datos.length - count;
    console.log(
      `  ${nombre.padEnd(22)} ${String(count).padStart(4)} pasadas` +
        (repetidas ? `  (${repetidas} ya estaban)` : "")
    );
  }

  db.close();
  await prisma.$disconnect();
  console.log("\nListo. Comprueba la app antes de tocar el archivo de SQLite.");
})();
