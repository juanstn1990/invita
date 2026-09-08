/**
 * Qué campos soporta cada diseño.
 *
 * Este archivo abría el HTML del template con linkedom y comprobaba, campo
 * por campo, si el selector del mapa encontraba algo — y el editor escondía
 * los que no. Hacía falta porque los 14 diseños hechos a mano no traían las
 * 11 secciones ni los ~45 campos: Vintage no tenía pie de página, los de
 * quince no tenían frase en la portada, 13 de 14 no tenían sección de redes.
 * Eran 213 combinaciones campo/diseño escondidas.
 *
 * Los 27 salen ahora del mismo esqueleto, que trae **todos** los campos del
 * esquema. Así que no hay nada que detectar ni nada que esconder: el soporte
 * se declara. Queda una sola excepción, y es real —no una ausencia de
 * marcado, sino de sentido: la opacidad del panel de la portada sólo
 * significa algo donde hay un panel translúcido que atenuar.
 */

import { fontableOp } from "./bindings";
import { SECTIONS } from "./schema";
import { designOf } from "./templates";

export { fontableOp };

/** Campos cuyo tipo de letra viene de otro binding. */
export const FONT_ALIAS: Record<string, string> = {
  "event.name1": "event.names",
  "event.name2": "event.names",
  "event.couple": "event.names",
};

export interface TemplateSupport {
  /** Secciones que el diseño incluye. */
  sections: string[];
  /** Campos soportados, como "hero.label" o "events.items.icon". */
  fields: string[];
}

const cache = new Map<string, TemplateSupport>();

/**
 * ¿Tiene sentido el control de opacidad en este diseño?
 *
 * Sólo donde la portada apoya los nombres en un panel translúcido. En
 * `editorial` el bloque es sólido a propósito —para que se lea sea la foto
 * clara u oscura—, en `minimal` el texto va directo sobre la foto con su
 * velo, en `split` la foto y el texto no se superponen, y en `frame` lo que
 * enmarca es un trazo. En ninguno hay nada que atenuar.
 */
const CON_PANEL = new Set(["panel", "band"]);

export function templateSupport(templateId: string): TemplateSupport {
  const cached = cache.get(templateId);
  if (cached) return cached;

  const design = designOf(templateId);
  const panel = !!design && CON_PANEL.has(design.layout.hero);

  const sections: string[] = [];
  const fields: string[] = [];

  for (const spec of SECTIONS) {
    sections.push(spec.key);

    for (const field of spec.fields) {
      const path = `${spec.key}.${field.key}`;
      if (path === "hero.panelOpacity" && !panel) continue;
      fields.push(path);
      // Cada campo de texto lleva su selector de tipografía. Ya no hay
      // campos que compartan selector con otro, así que ninguno se descarta:
      // antes los que iban con `nth` no ofrecían el control porque la regla
      // habría afectado a los dos.
      if (field.type === "text" || field.type === "textarea") fields.push(`${path}@font`);
    }

    if (!spec.list) continue;
    fields.push(`${spec.key}.items`);
    for (const f of spec.list.fields) {
      fields.push(`${spec.key}.items.${f.key}`);
      if (f.type === "text" || f.type === "textarea") {
        fields.push(`${spec.key}.items.${f.key}@font`);
      }
    }
  }

  const support = { sections, fields };
  cache.set(templateId, support);
  return support;
}

/**
 * Campos que el organizador ya llenó pero este diseño no puede mostrar.
 *
 * Alimenta el aviso de "esto no va a caber" antes de cambiar de diseño. Con
 * los 27 soportando todo, lo normal es que devuelva la lista vacía y el aviso
 * no aparezca — que es exactamente lo que se quería. Se conserva porque sigue
 * siendo la respuesta correcta a la pregunta, y porque un diseño futuro que
 * se salga del esqueleto la volvería a necesitar.
 */
export function unsupportedFilled(
  templateId: string,
  data: Record<string, Record<string, unknown>>
): string[] {
  const { sections, fields } = templateSupport(templateId);
  const out: string[] = [];
  for (const spec of SECTIONS) {
    const d = data[spec.key];
    if (!d) continue;
    if (spec.key !== "event" && !sections.includes(spec.key)) {
      if (d.enabled !== false) out.push(spec.label);
      continue;
    }
    for (const f of spec.fields) {
      const v = d[f.key];
      if (typeof v === "string" && v.trim() && !fields.includes(`${spec.key}.${f.key}`)) {
        out.push(`${spec.label} · ${f.label}`);
      }
    }
  }
  return out;
}
