/**
 * De campo del esquema a elemento del marcado.
 *
 * **Antes**: una tabla de 555 líneas donde cada campo declaraba una lista de
 * selectores CSS candidatos y ganaba el primero que existiera en ese diseño,
 * más un bloque de `OVERRIDES` para los que se salían del patrón. Los 14
 * templates estaban escritos a mano, así que el mapa acertaba casi siempre y
 * fallaba 213 veces, y el renderer no podía distinguir "el diseño no trae
 * este elemento" de "mi selector no lo encontró".
 *
 * **Ahora**: todos salen del mismo esqueleto y cada elemento editable lleva
 * `data-inv="seccion.campo"`. El mapa se **deriva del esquema**: el tipo del
 * campo dice qué operación le toca, y el atributo dice dónde va. Cero
 * overrides, cero campos sin mapear, y añadir un campo al esquema lo hace
 * editable en todos sin tocar este archivo.
 *
 * Queda una tabla de clases, `CLASES`, y es pequeña a propósito: el marcado
 * que sintetiza `blocks.ts` para las variantes lleva las clases canónicas
 * —son las que estiliza el CSS de cada diseño— pero no lleva los atributos.
 * Así que cada campo declara dos candidatos: el atributo, que es el contrato
 * de datos, y la clase, que es el contrato visual y sólo hace falta en
 * nuestro propio marcado. Una tabla de clases compartida no es lo que dolía;
 * lo que dolía eran catorce tablas de selectores por template.
 */

import { SECTIONS, type FieldType } from "./schema";
import { BLOCKS } from "./blocks";

interface OpBase {
  /** Selectores candidatos: gana el primero que exista. */
  sel: string[];
  /** Aplicar a todas las coincidencias, no sólo a la primera. */
  all?: boolean;
}

export type Op =
  | ({ kind: "text"; keepAffix?: boolean } & OpBase)
  /** El valor ya viene con marcado (los iconos son svg dibujados). */
  | ({ kind: "html" } & OpBase)
  /** "Juan & María" respetando la estructura del diseño. */
  | ({ kind: "couple" } & OpBase)
  /** <img src> si el candidato es una imagen, si no background-image. */
  | ({ kind: "image"; clearPlaceholder?: boolean } & OpBase)
  /** Reescribe sólo la opacidad del panel de la portada. */
  | ({ kind: "alpha" } & OpBase)
  /** Foto de portada, con su forma y su sitio. */
  | ({ kind: "heroPhoto" } & OpBase)
  | ({ kind: "attr"; attr: string; /** Prefijo para armar la URL. */ prefix?: string } & OpBase);

export interface ListBinding {
  container: string[];
  item: string[];
  fields: Record<string, Op[]>;
  /** Qué hacer cuando el organizador deja la lista vacía. */
  whenEmpty: "keep" | "removeContainer";
}

export interface TemplateMap {
  sections: Record<string, string[]>;
  fields: Record<string, Op[]>;
  lists: Record<string, ListBinding>;
}

/* ────────────────────────────────────────────────────────────────
   Las clases del marcado sintetizado
   ──────────────────────────────────────────────────────────────── */

/**
 * Sólo los campos que aparecen en el marcado de `blocks.ts`. Un campo que no
 * está aquí se resuelve únicamente por atributo, que es lo normal.
 */
const CLASES: Record<string, string> = {
  /* Las cabeceras, iguales en todas las variantes. */
  "countdown.label": ".section-label",
  "countdown.title": ".section-title",
  "countdown.text": ".section-body",
  "guests.label": ".section-label",
  "guests.title": ".section-title",
  "guests.text": ".section-body",
  "events.label": ".section-label",
  "events.title": ".section-title",
  "events.text": ".section-body",
  "confirm.label": ".section-label",
  "confirm.title": ".section-title",
  "confirm.text": ".section-body",
  "gallery.label": ".section-label",
  "gallery.title": ".section-title",
  "gallery.text": ".section-body",
  "features.label": ".section-label",
  "features.title": ".section-title",
  "gifts.label": ".section-label",
  "gifts.title": ".section-title",
  "gifts.text": ".section-body",
  "gifts.bankLabel": ".gifts-bank",
  "gifts.url": ".gifts-btn",
  "gifts.account": ".gifts-iban",
  "gifts.note": ".gifts-note",
  "social.label": ".section-label",
  "social.title": ".section-title",
  "social.text": ".section-body",
  "social.hashtag": ".social-hashtag",
  "social.instagram": ".social-ig",

  /* Bloques sin sección en el esquema: sólo existen como marcado nuestro. */
  "paragraph.label": ".section-label",
  "paragraph.title": ".section-title",
  "paragraph.text": ".section-body",
  "photo.label": ".section-label",
  "photo.title": ".section-title",
  "photo.caption": ".inv-foto-pie",
  "photo.url": ".gallery-ph",
  "video.label": ".section-label",
  "video.title": ".section-title",
  "video.caption": ".inv-video-pie",
  "ubicacion.label": ".section-label",
  "ubicacion.title": ".section-title",
  "ubicacion.text": ".section-body",
  "ubicacion.place": ".inv-mapa-lugar",
  "ubicacion.address": ".inv-mapa-dir",
  "ubicacion.buttonText": ".inv-mapa-btn",
  // El href del botón. Sin esta línea el bloque de Ubicación salía con
  // href="#": el atributo `data-inv` sólo existe en el esqueleto, y este
  // bloque es marcado sintetizado, que se resuelve por clase.
  "ubicacion.mapUrl": ".inv-mapa-btn",
};

/** Las clases de los campos de una ficha de lista. */
const CLASES_ITEM: Record<string, Record<string, string>> = {
  guests: { name: ".guest-name", role: ".guest-role", initial: ".guest-avatar" },
  events: {
    icon: ".event-icon",
    kind: ".event-type",
    title: ".event-title",
    time: ".event-time",
    place: ".event-place",
    address: ".event-place small",
    note: ".event-note",
    mapUrl: ".event-map-btn",
  },
  gallery: { url: ".gallery-ph" },
  features: { icon: ".feature-icon", title: ".feature-title", text: ".feature-text" },
  gifts: { icon: ".gift-icon", title: ".gift-title", text: ".gift-desc", url: ".gift-link" },
};

/* ────────────────────────────────────────────────────────────────
   Del tipo del campo a la operación
   ──────────────────────────────────────────────────────────────── */

/**
 * Campos que no se escriben con una operación: los resuelve otra parte del
 * renderer, o no van al marcado en absoluto.
 *
 * - `textColor` lo aplica una regla CSS por sección.
 * - los de RSVP los usa `wireRsvp`, que reemplaza el formulario entero.
 * - `event.date` alimenta la cuenta atrás; `event.dateLabel` es lo que se ve.
 * - `hero.disposicion` es la forma de la foto, no un texto.
 * - `guests.saludoInvitado` lo consume el script que lee `?invitado=`.
 */
const APARTE = new Set([
  "textColor",
  "mode",
  "greeting",
  "buttonText",
  "declineText",
  "whatsapp",
  "date",
  "type",
  "disposicion",
  "saludoInvitado",
  // La paleta no escribe texto: sustituye variables CSS.
  "paleta",
  "musicUrl",
  // El fondo de la sección lo pone `ponerFondo` en una capa propia.
  "fondoUrl",
  "fondoAjuste",
  "fondoOpacidad",
]);

/** Operaciones a mano: el tipo del campo no basta para deducirlas. */
const A_MANO: Record<string, Op[]> = {
  // Los nombres van en la portada, el splash y el pie a la vez.
  "event.names": [{ kind: "couple", sel: ['[data-inv="event.names"]'], all: true }],
  "event.dateLabel": [{ kind: "text", sel: ['[data-inv="event.dateLabel"]'], all: true, keepAffix: true }],
  "event.quote": [{ kind: "text", sel: ['[data-inv="event.quote"]'] }],
  // El valor llega con un <strong> alrededor de la fecha límite.
  "confirm.text": [{ kind: "html", sel: ['[data-inv="confirm.text"]', ".section-body"] }],
  "hero.backgroundUrl": [{ kind: "heroPhoto", sel: ['[data-inv="hero.backgroundUrl"]'] }],
  "hero.panelOpacity": [{ kind: "alpha", sel: [".hero-content"] }],
  // Lo guardado es un arroba; el enlace se arma con el prefijo.
  "social.instagram": [
    { kind: "text", sel: ['[data-inv="social.instagram"]', ".social-ig"] },
    { kind: "attr", attr: "href", prefix: "https://instagram.com/", sel: ['[data-inv="social.instagram"]', ".social-ig"] },
  ],
  // Calculado a partir de lo que se busca en el mapa (ver deriveSection).
  "ubicacion.mapSrc": [{ kind: "attr", attr: "src", sel: [".inv-mapa-frame"] }],
  /* El botón secundario del velo lleva el `data-inv` de su texto, así que su
     href se resuelve por clase. Si queda sin link, el render lo esconde: ver
     el paso "3 · ter" de renderInvitation. */
  "splash.mapUrl": [{ kind: "attr", attr: "href", sel: [".splash-btn-mapa"] }],
};

/** El atributo y, si existe, la clase de respaldo. */
const candidatos = (path: string): string[] =>
  [`[data-inv="${path}"]`, CLASES[path]].filter(Boolean) as string[];

function opDe(path: string, tipo: FieldType): Op[] | null {
  if (A_MANO[path]) return A_MANO[path];
  const sel = candidatos(path);
  switch (tipo) {
    case "text":
    case "textarea":
    case "tel":
    case "select":
      return [{ kind: "text", sel }];
    case "emoji":
      return [{ kind: "html", sel }];
    case "url":
      return [{ kind: "attr", attr: "href", sel }];
    case "image":
    case "gallery":
      return [{ kind: "image", clearPlaceholder: true, sel }];
    default:
      return null;
  }
}

/* ────────────────────────────────────────────────────────────────
   El mapa
   ──────────────────────────────────────────────────────────────── */

/** Las listas que se quedan con su marcador cuando están vacías. */
const CONSERVAR_VACIA = new Set(["gallery"]);

function construir(): TemplateMap {
  const sections: Record<string, string[]> = {};
  const fields: Record<string, Op[]> = {};
  const lists: Record<string, ListBinding> = {};

  const campos = (key: string, specs: { key: string; type: FieldType }[]) => {
    for (const f of specs) {
      if (APARTE.has(f.key)) continue;
      const path = `${key}.${f.key}`;
      const ops = opDe(path, f.type);
      if (ops) fields[path] = ops;
    }
  };

  for (const s of SECTIONS) {
    sections[s.key] = [`[data-inv-section="${s.key}"]`];
    campos(s.key, s.fields);

    if (!s.list) continue;
    const itemClases = CLASES_ITEM[s.key] || {};
    lists[s.key] = {
      container: [`[data-inv-list="${s.key}"]`],
      item: ["[data-inv-item]"],
      whenEmpty: CONSERVAR_VACIA.has(s.key) ? "keep" : "removeContainer",
      fields: Object.fromEntries(
        s.list.fields
          .map((f) => {
            const sel = [
              `[data-inv="${s.key}.items.${f.key}"]`,
              itemClases[f.key],
            ].filter(Boolean) as string[];
            const kind: Op["kind"] =
              f.type === "emoji"
                ? "html"
                : f.type === "url"
                  ? "attr"
                  : f.type === "image" || f.type === "gallery"
                    ? "image"
                    : "text";
            const op: Op =
              kind === "attr"
                ? { kind: "attr", attr: "href", sel }
                : kind === "image"
                  ? { kind: "image", clearPlaceholder: true, sel }
                  : ({ kind, sel } as Op);
            return [f.key, [op]] as const;
          })
      ),
    };
  }

  /* La rejilla de invitados no es una lista del esquema —no se edita— pero
     existe en el marcado y hay que vaciarla siempre: cada diseño la trae con
     nombres de ejemplo (Abuelos Pérez, Tía Sara) y su sitio lo ocupa el
     nombre de quien abre su enlace personalizado. */
  lists.guests = {
    container: ['[data-inv-list="guests"]'],
    item: ["[data-inv-item]"],
    whenEmpty: "removeContainer",
    fields: Object.fromEntries(
      Object.entries(CLASES_ITEM.guests).map(([k, clase]) => [
        k,
        [{ kind: "text", sel: [`[data-inv="guests.items.${k}"]`, clase] } as Op],
      ])
    ),
  };

  /* Los bloques que no son una sección del esquema (Párrafo, Foto,
     Ubicación) existen sólo como marcado nuestro: se resuelven por clase. */
  for (const b of BLOCKS) {
    if (b.section || !b.fields) continue;
    campos(b.type, b.fields);
  }
  for (const [path, ops] of Object.entries(A_MANO)) {
    if (!fields[path]) fields[path] = ops;
  }

  return { sections, fields, lists };
}

const MAPA = construir();

/**
 * El mapa. Ya no depende del diseño —todos comparten el marcado— pero se
 * conserva la firma con el id porque es lo que llaman el renderer y los
 * scripts de auditoría, y porque deja la puerta abierta a un diseño que
 * algún día quiera salirse del esqueleto.
 */
export function mapFor(_templateId?: string): TemplateMap {
  return MAPA;
}

/**
 * Un campo admite cambio de tipografía si escribe texto en un elemento
 * concreto. Antes se descartaban además las operaciones con `nth`, que
 * compartían selector con otro campo y habrían cambiado la letra de los dos;
 * con un atributo por campo ese caso ya no existe.
 */
export function fontableOp(op: Op): boolean {
  return op.kind === "text" || op.kind === "html" || op.kind === "couple";
}
