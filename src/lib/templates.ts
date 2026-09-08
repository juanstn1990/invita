/**
 * El catálogo de diseños, **derivado** de `src/lib/design/designs/`.
 *
 * Antes era una lista escrita a mano en paralelo a los archivos de
 * `templates/`, y las dos se desincronizaban: Vintage aparecía dos veces
 * —una en bodas y otra en comunión— apuntando al mismo HTML, y los colores
 * del swatch se copiaban del CSS a mano. Ahora el diseño es la única fuente:
 * su nombre, su ocasión, su swatch y sus temas salen de su propia
 * declaración.
 */

import fs from "fs";
import path from "path";
import { DESIGNS, DESIGN_BY_SLUG, templateId } from "./design/designs";
import type { Occasion, Variant } from "./design/theme";

export interface TemplateInfo {
  id: string;
  name: string;
  kind: Occasion;
  mood: string;
  /** Tres colores para el swatch del selector. */
  palette: [string, string, string];
  /** Sólo en los infantiles: la versión niña o niño del mismo diseño. */
  variant?: "nina" | "nino";
  /** El diseño del que sale, para volver a generarlo. */
  design: string;
}

/** Un nombre por variante: "Globos · Niña". */
const NOMBRE_VARIANTE: Record<Variant, string> = {
  nina: " · Niña",
  nino: " · Niño",
  unico: "",
};

export const TEMPLATES: TemplateInfo[] = DESIGNS.flatMap((d) =>
  (Object.keys(d.themes) as Variant[]).map((v) => ({
    id: templateId(d.slug, v),
    name: d.name + NOMBRE_VARIANTE[v],
    kind: d.occasion,
    mood: d.mood,
    palette: d.swatch[v] ?? ["#ffffff", "#cccccc", "#333333"],
    variant: v === "unico" ? undefined : v,
    design: d.slug,
  }))
);


export const KIND_LABEL: Record<Occasion, string> = {
  boda: "Bodas",
  quince: "Quince años",
  comunion: "Primera comunión y bautizo",
  "primer-ano": "Primer añito",
  "baby-shower": "Baby shower",
};

/** La agrupación del selector de diseños. */
export const FAMILIES: { label: string; kinds: Occasion[] }[] = [
  { label: "", kinds: ["boda", "quince", "comunion"] },
  { label: "Infantiles", kinds: ["primer-ano", "baby-shower"] },
];

/**
 * Ids antiguos que siguen guardados en la base.
 *
 * `aurum-wine-ii` e `ivory-leaf-ii` perdieron el sufijo, que era el rastro de
 * una segunda versión que ya no significa nada. Sus tres invitaciones tienen
 * datos válidos del esquema actual, así que el alias las mantiene abriendo.
 *
 * Hay además nueve invitaciones en cuatro ids que no existen —`blanco`,
 * `boda-clasica`, `cumple-color`, `quince-noche`— y **no** llevan alias a
 * propósito. Son del constructor visual que se retiró: su `data` es el de por
 * defecto, idéntico en las nueve, y su contenido real vivía en la columna
 * `tree`, que ya no se lee. Apuntarlas a un diseño parecido las haría abrir,
 * sí, pero mostrando el contenido de muestra —los nombres de otra gente— como
 * si fuera la invitación de quien la publicó. `/[slug]` les devuelve su 404,
 * que es la respuesta honesta a una invitación sin contenido recuperable.
 */
const ALIAS: Record<string, string> = {
  "invitacion-aurum-wine-ii": "invitacion-aurum-wine",
  "invitacion-ivory-leaf-ii": "invitacion-ivory-leaf",
};

/** El id vigente de un template, resolviendo los alias. */
export const resolveTemplateId = (id: string): string => ALIAS[id] ?? id;

/**
 * El índice por id, **con los alias dentro**. Que los resuelva el propio
 * índice y no cada llamada es lo que evita nueve `resolveTemplateId(...)`
 * repartidos por la app y el olvido de uno.
 */
export const TEMPLATE_BY_ID: Record<string, TemplateInfo> = {
  ...Object.fromEntries(TEMPLATES.map((t) => [t.id, t])),
  ...Object.fromEntries(
    Object.entries(ALIAS)
      .map(([viejo, nuevo]) => [viejo, TEMPLATES.find((t) => t.id === nuevo)])
      .filter((e): e is [string, TemplateInfo] => !!e[1])
  ),
};

const DIR = path.join(process.cwd(), "templates");

export function readTemplate(id: string): string {
  const real = resolveTemplateId(id);
  if (!TEMPLATE_BY_ID[real]) throw new Error(`Template desconocido: ${id}`);
  return fs.readFileSync(path.join(DIR, `${real}.html`), "utf8");
}

/** El diseño del que sale un template, resolviendo alias. */
export function designOf(id: string) {
  const info = TEMPLATE_BY_ID[resolveTemplateId(id)];
  return info ? DESIGN_BY_SLUG[info.design] : undefined;
}
