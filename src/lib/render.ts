/**
 * Renderer: template HTML estático + datos canónicos → HTML final.
 *
 * No reescribimos los templates: los parseamos con linkedom y aplicamos
 * las operaciones declaradas en `bindings.ts` (poner texto, repartir la
 * fecha entre spans, clonar/recortar listas, quitar secciones apagadas,
 * cablear el RSVP y la cuenta atrás).
 */

import { parseHTML } from "linkedom";
import { mapFor, type ListBinding, type Op } from "./bindings";
import { BLOCK_BY_TYPE, readLayout, variantOf, type Block } from "./blocks";
import { FONT_BY_ID, googleHref } from "./fonts";
import { pesoIconos } from "./design/designs";
import { ANCHOS } from "./storage";
import { variablesDePaleta } from "./design/css";
import { piel } from "./design/theme";
import { iconoHtml, type Peso } from "./iconos";
import { FONT_ALIAS, fontableOp } from "./support";
import { PALETA_POR_ID_VIEJO, TEMPLATE_BY_ID, designOf } from "./templates";
import {
  HERO_POR_ID,
  SECTION_BY_KEY,
  SITIOS,
  SECTIONS as SPEC,
  coupleName,
  formatDateLong,
  resolvedDateLabel,
  type HeroDisposicion,
  type InvitationData,
} from "./schema";

type El = any;
type Doc = any;

export interface RenderOptions {
  templateHtml: string;
  templateId: string;
  data: InvitationData;
  /** Slug público — el formulario de RSVP postea a /api/i/{slug}/rsvp. */
  slug?: string;
  /** En el editor: sin splash, sin envío real de RSVP. */
  preview?: boolean;
  /**
   * El origen público, para las etiquetas Open Graph.
   *
   * WhatsApp y compañía no resuelven rutas relativas: si `og:image` no es
   * absoluta, no hay tarjeta de vista previa. Sólo lo necesita la invitación
   * publicada; en el editor no se comparte nada.
   */
  origin?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ── texto ───────────────────────────────────────────────────── */

const AFFIX = /^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}]*)$/u;

/** Conserva la decoración alrededor: "— 15.05.2025 —" → "— nuevo —". */
function withAffix(current: string, next: string): string {
  const m = AFFIX.exec(current.trim());
  if (!m || !m[2]) return next;
  return `${m[1]}${next}${m[3]}`;
}

const hasText = (el: El) => !!(el.textContent || "").trim();

/**
 * Pone texto sin destruir hijos que llevan contenido propio: varios diseños
 * usan `<div class="event-place">Salón<small>Dirección</small></div>`, donde
 * sólo queremos tocar el nodo de texto suelto.
 */
function setText(el: El, value: string, keepAffix = false) {
  const meaningfulChildren = (Array.from(el.children) as El[]).filter(hasText);
  if (!meaningfulChildren.length) {
    el.textContent = keepAffix ? withAffix(el.textContent || "", value) : value;
    return;
  }
  const textNodes = (Array.from(el.childNodes) as El[]).filter((n) => n.nodeType === 3);
  const target = textNodes.find((n) => (n.textContent || "").trim()) || textNodes[0];
  if (target) {
    target.textContent = keepAffix ? withAffix(target.textContent || "", value) : value;
    for (const n of textNodes) if (n !== target) n.textContent = "";
  } else {
    el.insertBefore(el.ownerDocument.createTextNode(value), el.firstChild);
  }
}

/** Reparte "15 · Noviembre · 2025" entre los spans que ya trae el diseño. */
function setParts(el: El, value: string) {
  const content = (Array.from(el.children) as El[]).filter(
    (c) => (c.textContent || "").trim().length > 1
  );
  if (content.length === 0) {
    setText(el, value, true);
    return;
  }
  if (content.length === 1) {
    setParts(content[0], value);
    return;
  }
  const tokens = value.split(/\s*[·|/–—]\s*/).filter(Boolean);
  if (tokens.length === content.length) {
    content.forEach((c, i) => setText(c, tokens[i], true));
    return;
  }
  // No calza con la segmentación del diseño: dejamos el texto completo en el
  // primer hueco y quitamos el resto (separadores incluidos).
  setText(content[0], value, true);
  for (const c of Array.from(el.children) as El[]) if (c !== content[0]) c.remove();
}

/**
 * Pone una imagen. `clearPlaceholder` sólo va en las casillas de la galería,
 * donde el diseño trae un "Foto 1" que hay que sacar: si se aplicara también
 * a la portada, en los diseños que no tienen una capa `.hero-bg` propia el
 * candidato es la sección entera y le borraría el contenido.
 */
/* ── tamaños de imagen ───────────────────────────────────────── */

/** Sólo lo que servimos nosotros se puede redimensionar. */
const propia = (url: string) => /(^|\/)api\/media\//.test(url);

const conAncho = (url: string, w: number) =>
  `${url}${url.includes("?") ? "&" : "?"}w=${w}`;

/**
 * El `srcset` de una imagen nuestra.
 *
 * Deja que el navegador pida el tamaño que de verdad necesita. Sin esto una
 * casilla de galería de 120px descargaba la foto entera: 465 kB de media, y
 * una galería de seis más la portada eran 3,2 MB en un móvil.
 *
 * Una URL ajena —alguien pegó un enlace— se devuelve sin tocar: no la
 * servimos nosotros y no la podemos redimensionar.
 */
function srcSet(url: string): string {
  if (!propia(url)) return "";
  return ANCHOS.map((w) => `${conAncho(url, w)} ${w}w`).join(", ");
}

/**
 * Lo mismo para un `background-image`, donde `srcset` no existe.
 *
 * `image-set()` es su equivalente y lo entienden los navegadores que
 * importan; el `url()` de antes se deja como respaldo para el resto.
 */
function fondoImagen(url: string, ancho: number): string {
  const limpia = url.replace(/'/g, "%27");
  if (!propia(url)) return `background-image:url('${limpia}');`;
  const uno = conAncho(limpia, ancho);
  const dos = conAncho(limpia, Math.min(1600, ancho * 2));
  return (
    `background-image:url('${uno}');` +
    `background-image:image-set(url('${uno}') 1x, url('${dos}') 2x);`
  );
}

function setImage(el: El, url: string, clearPlaceholder: boolean, ancho = 800) {
  if (el.tagName?.toLowerCase() === "img") {
    el.setAttribute("src", propia(url) ? conAncho(url, ancho) : url);
    const ss = srcSet(url);
    if (ss) {
      el.setAttribute("srcset", ss);
      /* Sin `sizes` el navegador supone el ancho de la ventana y se pasa de
         tamaño en todo lo que no sea a sangre. */
      el.setAttribute("sizes", `${ancho}px`);
    }
    return;
  }
  const style = (el.getAttribute("style") || "")
    .replace(/background-image\s*:[^;]*;?/gi, "");
  const sep = style && !style.trim().endsWith(";") ? ";" : "";
  el.setAttribute(
    "style",
    `${style}${sep}${fondoImagen(url, ancho)}` +
      "background-size:cover;background-position:center;"
  );

  // Una foto puesta dentro de un hueco que recorta puede moverse al
  // desplazar: el recorte la contiene y no hay salto de maquetación.
  const clase = el.getAttribute("class") || "";
  if (clase.includes("gallery-ph")) {
    const completa = el.closest?.(".inv-v-completa");
    el.setAttribute("data-inv-px", completa ? "0.16" : "0.07");
    el.setAttribute("data-inv-px-escala", completa ? "1.24" : "1.16");
  }

  const inner = el.querySelector("img");
  if (inner) {
    setImage(inner, url, false, ancho);
    return;
  }
  if (!clearPlaceholder) return;
  if (!el.children.length) el.textContent = "";
  else for (const c of Array.from(el.children) as El[]) if (hasText(c)) c.remove();
}

/* ── resolución de selectores ────────────────────────────────── */

function pickAll(root: El, sel: string[]): El[] {
  for (const s of sel) {
    if (s === ":self") return [root];
    const found = Array.from(root.querySelectorAll(s)) as El[];
    if (found.length) return found;
  }
  return [];
}

const pick = (root: El, sel: string[]): El | null => pickAll(root, sel)[0] || null;

/** Como pick, pero devuelve también el selector que acertó (para el CSS). */
function pickWithSel(root: El, sel: string[]): [El, string] | null {
  for (const s of sel) {
    const el = s === ":self" ? root : root.querySelector(s);
    if (el) return [el, s];
  }
  return null;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Reglas CSS para la tipografía que el organizador eligió en un campo.
 *
 * El selector sale del propio binding: el que acertó al escribir el texto es
 * el mismo al que hay que cambiarle la letra. Lleva `!important` por la misma
 * razón que el color — varios diseños usan selectores más específicos.
 */
function fontRules(
  scopeSel: string | undefined,
  root: El,
  ops: Op[],
  fontCss: string,
  /** A qué equivale `:self` en este ámbito (la sección, o la ficha de lista). */
  selfSel = scopeSel
): string[] {
  const out: string[] = [];
  for (const op of ops) {
    if (!fontableOp(op)) continue;

    // Los campos globales (los nombres, la fecha) se escriben en varios
    // lugares a la vez; la letra tiene que cambiar en todos, no sólo en el
    // primero que aparezca.
    const crudos = op.all
      ? op.sel.filter((sel) => sel === ":self" || !!root.querySelector(sel))
      : [pickWithSel(root, op.sel)?.[1]].filter((x): x is string => !!x);

    const sels = crudos
      .map((sel) => (sel === ":self" ? selfSel : [scopeSel, sel].filter(Boolean).join(" ")))
      .filter((x): x is string => !!x);

    if (sels.length) out.push(`${sels.join(",")}{font-family:${fontCss} !important}`);
  }
  return out;
}

/** Une TODOS los selectores y descarta los que estén dentro de otro match. */
function pickEveryOutermost(root: El, sel: string[]): El[] {
  const all: El[] = [];
  for (const s of sel) {
    if (s === ":self") { if (!all.includes(root)) all.push(root); continue; }
    for (const el of Array.from(root.querySelectorAll(s)) as El[]) {
      if (!all.includes(el)) all.push(el);
    }
  }
  return all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
}

/* ── nombres de la pareja ────────────────────────────────────── */

const NAME_PARTS = ".hero-name, .wm-name, .splash-name, .couple-name, .name-part";
const AMP = ".hero-amp, .hero-amp-inline, .wm-amp, .splash-amp, .splash-ampersand, .amp, .amp-badge";

function applyCouple(el: El, name1: string, name2: string) {
  const joined = name2 ? `${name1} & ${name2}` : name1;

  const parts = Array.from(el.querySelectorAll(NAME_PARTS)) as El[];
  if (parts.length >= 2) {
    setText(parts[0], name1, true);
    if (name2) {
      setText(parts[parts.length - 1], name2, true);
    } else {
      parts[parts.length - 1].remove();
      el.querySelector(AMP)?.remove();
    }
    return;
  }
  if (parts.length === 1) {
    setText(parts[0], joined, true);
    return;
  }

  const sep = el.querySelector(AMP);
  if (sep) {
    // Estructura suelta: texto + <span>&</span> + texto
    const kids = Array.from(el.childNodes) as El[];
    const at = kids.indexOf(sep);
    let before: El | null = null;
    let after: El | null = null;
    for (let i = at - 1; i >= 0; i--) if (kids[i].nodeType === 3) { before = kids[i]; break; }
    for (let i = at + 1; i < kids.length; i++) if (kids[i].nodeType === 3) { after = kids[i]; break; }
    if (before || after) {
      if (before) before.textContent = name1;
      if (after) after.textContent = name2;
      if (!name2) sep.remove();
      return;
    }
  }

  // Envoltura de un solo hijo con el nombre dentro: bajamos un nivel.
  const kids = Array.from(el.children) as El[];
  if (kids.length === 1 && !(Array.from(el.childNodes) as El[]).some((n) => n.nodeType === 3 && (n.textContent || "").trim())) {
    applyCouple(kids[0], name1, name2);
    return;
  }

  setText(el, joined, true);
}

/* ── aplicar una operación ───────────────────────────────────── */

function applyOp(root: El, op: Op, value: string, ctx: Ctx) {
  if (op.kind === "heroPhoto") {
    if (value) applyHeroPhoto(root, value, ctx);
    return;
  }

  if (op.kind === "alpha") {
    if (!value) return;
    const alpha = Math.min(100, Math.max(0, Number(value))) / 100;
    for (const sel of op.sel) {
      if (root.querySelector(sel)) {
        // El color base es el del diseño; aquí sólo se reescribe el alfa.
        ctx.css.push(`${sel}{background-color:rgba(var(--panel-rgb),${alpha})}`);
        return;
      }
    }
    return;
  }

  if (op.kind === "couple") {
    for (const el of pickEveryOutermost(root, op.sel)) applyCouple(el, ctx.name1, ctx.name2);
    return;
  }

  const matches = op.all ? pickEveryOutermost(root, op.sel) : pickAll(root, op.sel);
  const targets = op.all ? matches : matches.slice(0, 1);

  for (const el of targets) {
    switch (op.kind) {
      case "text":
        // Un campo vacío no debe dejar un hueco en el diseño.
        if (!value) el.remove();
        else setText(el, value, op.keepAffix);
        break;
      case "html":
        if (!value) el.remove();
        else el.innerHTML = value;
        break;
      case "image":
        if (value) setImage(el, value, op.clearPlaceholder === true);
        break;
      case "attr":
        if (!value) {
          if (op.attr === "href") el.remove();
          break;
        }
        // Un arroba guardado se convierte en enlace con el prefijo declarado.
        el.setAttribute(
          op.attr,
          op.prefix ? op.prefix + value.replace(/^@/, "") : value
        );
        if (op.attr === "href" && /^https?:/.test(value) === false && !op.prefix) break;
        if (op.attr === "href") {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
        }
        break;
    }
  }
}

/* ── bloques ─────────────────────────────────────────────────── */

/** Un bloque ya resuelto: su elemento en el DOM y de dónde salen sus datos. */
interface Resuelto {
  block: Block;
  el: El;
  /** Selector CSS con el que apuntar al bloque desde una regla inyectada. */
  sel: string;
  /** Sección del esquema de la que salen los campos y los bindings. */
  key: string;
  data: InvitationData[string];
  /** Marcado nuestro, no el del template. */
  sintetizado: boolean;
}

/**
 * Contenedor y punto de inserción del flujo de secciones.
 *
 * En la mayoría de los templates las secciones son hermanas dentro de `body`;
 * en Aurum e Ivory viven dentro de un `#main`. Se deduce del elemento de la
 * portada en vez de asumirlo.
 */
function flujo(doc: Doc, hero: El | null): { padre: El; ancla: El | null } {
  const padre = hero?.parentNode || doc.body;
  return { padre, ancla: hero };
}

/**
 * Saca una sección del flujo sin borrarla del documento.
 *
 * Borrarla rompía los scripts del propio template: varios buscan sus
 * elementos por id cada segundo (la cuenta atrás) y quedaban lanzando errores
 * para siempre. Oculta sigue ahí para ellos, pero no se ve ni la lee un
 * lector de pantalla.
 */
function ocultar(el: El | null) {
  if (!el) return;
  el.setAttribute("hidden", "hidden");
  el.setAttribute("aria-hidden", "true");
  const style = (el.getAttribute("style") || "").replace(/display\s*:[^;]*;?/gi, "");
  el.setAttribute("style", `${style}display:none !important;`);
}

/** Divisor decorativo que va pegado a una sección (una ola, un filo). */
function divisorDe(el: El): El | null {
  const prev = el.previousElementSibling;
  return prev && /wave|divider|scallop|torn|cloudline|brush|dots/i.test(
    prev.getAttribute("class") || ""
  )
    ? prev
    : null;
}

/* ── foto de portada ─────────────────────────────────────────── */

/**
 * Marca una capa para que se mueva al desplazar.
 *
 * La capa se agranda con `scale` y el script limita el recorrido a ese
 * sobrante, así que al moverse nunca asoma el borde.
 */
function marcarParalaje(capa: El, factor: string, escala: string, ctx: Ctx) {
  capa.setAttribute("data-inv-px", factor);
  capa.setAttribute("data-inv-px-escala", escala);
  ctx.css.push(`${ctx.sectionSel || "#hero"}{overflow:hidden}`);
}

/**
 * La foto de portada recortada y colocada, en vez de a sangre.
 *
 * Se mete **en el flujo** del bloque de los nombres —antes o después, según
 * se pida— para que la portada la centre y la separe como centra y separa
 * todo lo suyo. Posicionarla en absoluto obligaría a pelearse con el
 * posicionado de cada diseño, que es de donde vienen los sustos.
 */
function colocarFotoPortada(hero: El, url: string, disp: HeroDisposicion, ctx: Ctx) {
  const doc = hero.ownerDocument;
  const media = doc.createElement("div");
  media.setAttribute("class", `inv-hero-media inv-hm-${disp.forma}`);
  const foto = doc.createElement("div");
  foto.setAttribute("class", "inv-hero-media-img");
  /* Recortada mide 260px como mucho; 800 le da de sobra en pantalla retina. */
  setImage(foto, url, false, disp.forma === "banda" ? 1600 : 800);
  media.appendChild(foto);

  const caja = hero.querySelector(".hero-content") || hero;
  if (disp.donde === "antes") caja.insertBefore(media, caja.firstChild);
  else caja.appendChild(media);

  // El envoltorio recorta, así que la capa de dentro se puede agrandar y
  // mover sin que la forma se descoloque. Con marco no: ahí el borde blanco
  // es parte de la pieza y moverla lo delataría.
  if (disp.forma !== "marco") {
    foto.setAttribute("data-inv-px", "0.10");
    foto.setAttribute("data-inv-px-escala", "1.20");
  }
}

/**
 * Pone la foto de portada.
 *
 * Los 27 diseños traen su capa `.hero-bg`, así que aquí ya no hay nada que
 * inventar. Antes había que inyectar una capa propia con su velo degradado y
 * subir el bloque de texto por encima, porque la mayoría de los diseños
 * hechos a mano no tenían dónde poner la foto: en unos el texto quedaba
 * ilegible encima y en otros los hijos opacos la tapaban del todo. También
 * había que buscar en el CSS crudo si el bloque de los nombres tenía fondo
 * propio, para no pintar de blanco un texto que ya se leía.
 *
 * Nada de eso hace falta: cada diseño declara en su slot de portada cómo
 * sostiene el texto sobre la foto —`minimal` pone su velo, `panel` su
 * tarjeta, `split` no superpone nada— y el CSS lo resuelve.
 */
function applyHeroPhoto(hero: El, url: string, ctx: Ctx) {
  const disp = HERO_POR_ID[ctx.heroDisposicion || ""] || HERO_POR_ID[""];

  // Recortada en una forma, la foto deja de ser fondo y pasa a ser una pieza
  // más dentro de la portada. Es la salida cuando el bloque de los nombres
  // tapa justo lo que se quería enseñar.
  if (disp.donde !== "fondo") {
    colocarFotoPortada(hero, url, disp, ctx);
    return;
  }

  const capa = hero.querySelector('[data-inv="hero.backgroundUrl"]') || hero.querySelector(".hero-bg");
  if (!capa) return;
  /* La portada ocupa la pantalla entera: es la única que pide el ancho mayor. */
  setImage(capa, url, false, 1600);
  // Los slots de portada que aclaran el texto sobre la foto se activan con
  // esta clase, no siempre: sin foto, aclarar el texto lo hace invisible.
  hero.setAttribute("class", `${hero.getAttribute("class") || ""} con-foto`.trim());
  marcarParalaje(capa, "0.22", "1.22", ctx);
}

/* ── fondo y adornos de una sección ──────────────────────────── */

/** Los sitios que declara el esquema. Lo que no esté aquí no se coloca. */
const SITIO_VALIDO = new Set(SITIOS.map((s) => s.value));

/** Cómo se ajusta la imagen de fondo de una sección. */
const AJUSTE: Record<string, string> = {
  "": "background-size:cover;background-position:center;background-repeat:no-repeat",
  contener: "background-size:contain;background-position:center;background-repeat:no-repeat",
  repetir: "background-size:auto;background-repeat:repeat",
};

/**
 * La imagen de fondo de una sección.
 *
 * Va en una capa propia y no en el `background` de la sección para poder
 * atenuarla: `opacity` sobre la sección se llevaría también el texto. La capa
 * se mete como primer hijo y el contenido se sube por encima.
 */
function ponerFondo(seccion: El, d: InvitationData[string], sel: string, ctx: Ctx) {
  const url = String(d.fondoUrl || "").trim();
  if (!url) return;
  const ajuste = AJUSTE[String(d.fondoAjuste || "")] ?? AJUSTE[""];
  const opacidad = Math.min(100, Math.max(0, Number(d.fondoOpacidad ?? 100))) / 100;

  const capa = seccion.ownerDocument.createElement("div");
  capa.setAttribute("class", "inv-fondo");
  capa.setAttribute("aria-hidden", "true");
  /* El fondo cubre la sección entera, así que va al ancho grande — salvo en
     mosaico, donde se repite en pequeño. */
  const anchoFondo = String(d.fondoAjuste || "") === "repetir" ? 800 : 1600;
  capa.setAttribute(
    "style",
    `${fondoImagen(url, anchoFondo)}${ajuste};opacity:${opacidad}`
  );
  seccion.insertBefore(capa, seccion.firstChild);

  /* Sin esto la capa, que está posicionada, se pinta encima del contenido de
     la sección, que no lo está. */
  ctx.css.push(`${sel}{position:relative}`, `${sel}>.container{position:relative;z-index:1}`);
}

/**
 * Los adornos de una sección: imágenes que el organizador coloca.
 *
 * Se usa `<img>` y no un `background-image` a propósito: así la pieza toma su
 * propia proporción sin que el renderer tenga que averiguar cuánto mide el
 * archivo, que es dato que aquí no hay.
 */
function ponerAdornos(seccion: El, d: InvitationData[string], sel: string, ctx: Ctx) {
  const items = (d.adornos as Record<string, string>[]) || [];
  if (!Array.isArray(items) || !items.length) return;

  let puestos = 0;
  for (const it of items) {
    const url = String(it?.url || "").trim();
    if (!url) continue;

    const sitio = SITIO_VALIDO.has(String(it.sitio)) ? String(it.sitio) : "arriba-izq";
    const tamano = Math.min(100, Math.max(5, Number(it.tamano) || 40));
    const opacidad = Math.min(100, Math.max(5, Number(it.opacidad ?? 100))) / 100;
    const giro = Math.min(180, Math.max(-180, Number(it.giro) || 0));
    const encima = String(it.capa || "") === "encima";
    const espejo = String(it.espejo || "");

    const caja = seccion.ownerDocument.createElement("div");
    caja.setAttribute("class", `inv-adorno inv-ad-${sitio}`);
    caja.setAttribute("aria-hidden", "true");
    caja.setAttribute(
      "style",
      (sitio === "sangre" ? "" : `width:${tamano}%;`) +
        `opacity:${opacidad};z-index:${encima ? 4 : 0}`
    );

    const img = seccion.ownerDocument.createElement("img");
    /* El adorno mide lo que se declaró, en % del ancho de la sección. Un
       tamaño 40 sobre un contenedor de ~780px son ~310px, y el doble en
       retina: 800 es el escalón que le toca. */
    setImage(img, url, false, tamano >= 70 || sitio === "sangre" ? 1600 : 800);
    img.setAttribute("alt", "");
    // La portada se ve al abrir; el resto puede esperar a que se llegue.
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    const t = [
      giro ? `rotate(${giro}deg)` : "",
      espejo.includes("h") ? "scaleX(-1)" : "",
      espejo.includes("v") ? "scaleY(-1)" : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (t) img.setAttribute("style", `transform:${t}`);
    caja.appendChild(img);

    seccion.appendChild(caja);
    puestos += 1;
  }

  if (puestos) {
    ctx.css.push(`${sel}{position:relative}`, `${sel}>.container{position:relative;z-index:1}`);
  }
}

/* ── vídeo ───────────────────────────────────────────────────── */

/**
 * Saca el identificador de un link de YouTube, en cualquiera de sus formas.
 *
 * Nadie copia el link "canónico": se copia lo que la barra del navegador
 * tenga, y eso puede ser `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, con
 * `?si=` de la app de compartir, con `&list=` de una lista, o con la hora a
 * la que iba el vídeo. Rechazar todo eso menos uno sería trasladar el
 * problema a quien edita.
 *
 * Un link que no sea de YouTube devuelve `null`, y el bloque se esconde en
 * lugar de dejar un recuadro roto.
 */
function youtube(link: string): { id: string; desde: number } | null {
  const bruto = link.trim();
  if (!bruto) return null;

  /* Un identificador pegado a secas: 11 caracteres del alfabeto de YouTube. */
  if (/^[\w-]{11}$/.test(bruto)) return { id: bruto, desde: 0 };

  let u: URL;
  try {
    u = new URL(bruto.includes("//") ? bruto : `https://${bruto}`);
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\.|^m\./, "");
  const partes = u.pathname.split("/").filter(Boolean);

  let id = "";
  if (host === "youtu.be") id = partes[0] || "";
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (partes[0] === "watch") id = u.searchParams.get("v") || "";
    else if (["embed", "shorts", "live", "v"].includes(partes[0])) id = partes[1] || "";
  }
  if (!/^[\w-]{11}$/.test(id)) return null;

  /* `t` viene como `90`, `1m30s` o `90s` según de dónde se copie. */
  const t = u.searchParams.get("t") || u.searchParams.get("start") || "";
  let desde = 0;
  const reloj = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  if (/^\d+$/.test(t)) desde = Number(t);
  else if (reloj && t) {
    desde = Number(reloj[1] || 0) * 3600 + Number(reloj[2] || 0) * 60 + Number(reloj[3] || 0);
  }

  return { id, desde };
}

/**
 * Resuelve un bloque de vídeo: elige el reproductor y borra el otro.
 *
 * El marcado trae los dos —un `<iframe>` y un `<video>`— porque se construye
 * sin saber qué eligió quien edita (ver `lienzoVideo`). Aquí ya se sabe.
 *
 * Sin vídeo de ninguna clase el bloque se esconde entero. Un reproductor
 * vacío no es "todavía sin llenar": es un rectángulo negro en medio de la
 * invitación, y quien la abre no distingue eso de algo roto.
 */
function ponerVideo(root: El, d: InvitationData[string]): boolean {
  const lienzo = root.querySelector?.(".inv-video-lienzo") as El | null;
  if (!lienzo) return true;

  const marco = lienzo.querySelector(".inv-video-frame") as El | null;
  const propio = lienzo.querySelector(".inv-video-propio") as El | null;

  const subido = String(d.url || "").trim();
  const enlace = String(d.youtubeUrl || "").trim();
  /* Lo elegido manda, pero si ese lado está vacío y el otro tiene algo, se
     usa el que hay: cambiar de fuente y olvidar el selector es lo normal. */
  const quiere = String(d.fuente || "").trim();
  const yt = youtube(enlace);
  const usaYoutube = quiere === "subido" ? Boolean(!subido && yt) : Boolean(yt);
  const sola = String(d.reproduccion || "").trim() === "automatica";

  if (usaYoutube && yt) {
    propio?.parentNode?.removeChild(propio);
    if (marco) {
      const q = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
      if (yt.desde) q.set("start", String(yt.desde));
      if (sola) {
        q.set("autoplay", "1");
        q.set("mute", "1");
        q.set("controls", "0");
        q.set("loop", "1");
        /* El bucle de YouTube sólo funciona con una lista, y una lista de un
           solo vídeo es el propio vídeo. Sin esto se reproduce una vez. */
        q.set("playlist", yt.id);
      }
      /* `-nocookie` es el mismo reproductor sin la cookie de seguimiento
         hasta que le dan al play: una invitación de boda no tiene por qué
         dejar a YouTube marcar a los invitados. */
      marco.setAttribute("src", `https://www.youtube-nocookie.com/embed/${yt.id}?${q}`);
    }
    return true;
  }

  if (subido) {
    marco?.parentNode?.removeChild(marco);
    if (propio) {
      /* Tal cual: el redimensionador de `/api/media` no toca el vídeo, y
         pedirle un `?w=` sólo añadiría una URL que no cachea igual. */
      propio.setAttribute("src", subido);
      const poster = String(d.poster || "").trim();
      if (poster) propio.setAttribute("poster", conAncho(poster, 800));
      if (sola) {
        /* Sonar sola no lo permite ningún navegador, así que la única
           reproducción automática posible es en silencio. Y sin `muted`
           puesto, el `autoplay` se ignora y queda un vídeo parado. */
        propio.setAttribute("muted", "");
        propio.setAttribute("autoplay", "");
        propio.setAttribute("loop", "");
        propio.removeAttribute("controls");
      }
    }
    return true;
  }

  ocultar(root);
  return false;
}

/* ── listas repetibles ───────────────────────────────────────── */

/**
 * Campos calculados de una sección: no están en el formulario pero el
 * marcado los necesita. Hoy sólo la ubicación, que arma la dirección del
 * mapa a partir de lo que se quiere buscar.
 */
function deriveSection(key: string, d: InvitationData[string]): Record<string, string> {
  if (key !== "ubicacion") return {};
  const busca = String(d.query || d.address || d.place || "").trim();
  const propio = String(d.mapUrl || "").trim();
  if (!busca) return { mapSrc: "", mapUrl: propio };
  const q = encodeURIComponent(busca);
  return {
    mapSrc: `https://maps.google.com/maps?q=${q}&output=embed&z=15`,
    mapUrl: propio || `https://www.google.com/maps/search/?api=1&query=${q}`,
  };
}

/** Campos que el diseño puede pedir pero el formulario no tiene. */
function deriveItem(section: string, item: Record<string, string>): Record<string, string> {
  const out = { ...item };
  if (section === "guests") out.initial = (item.name || "").trim().charAt(0).toUpperCase();
  if (section === "events") {
    out.subtitle = item.title || "";
    out.infoBlock = [item.time, item.place, item.address, item.note]
      .filter((x) => (x || "").trim())
      .map((x) => escapeHtml(x))
      .join("<br>");
  }
  return out;
}

type Ctx = {
  name1: string;
  name2: string;
  /** Reglas CSS que se inyectan al final del <head>. */
  css: string[];
  /** Selector de la sección que se está procesando, para las reglas de color. */
  sectionSel?: string;
  /** Forma y sitio de la foto de portada. */
  heroDisposicion?: string;
  /** El peso de los iconos de este diseño: `light` o `duotone`. */
  peso: Peso;
};

function applyList(
  root: El,
  key: string,
  binding: ListBinding,
  items: Record<string, string>[],
  ctx: Ctx
) {
  const container = pick(root, binding.container);
  if (!container) return;

  let current = pickAll(container, binding.item);
  if (!current.length) return;

  if (!items.length) {
    if (binding.whenEmpty === "removeContainer") container.remove();
    return;
  }

  // Crecer clonando los prototipos del diseño en ciclo, para conservar las
  // variaciones de estilo entre tarjetas.
  const protos = current.map((el) => el.cloneNode(true));
  while (current.length < items.length) {
    const clone = protos[current.length % protos.length].cloneNode(true);
    container.appendChild(clone);
    current.push(clone);
  }
  for (const el of current.slice(items.length)) el.remove();
  current = current.slice(0, items.length);

  current.forEach((el, i) => {
    const item = deriveItem(key, items[i]);
    for (const [field, ops] of Object.entries(binding.fields)) {
      // Lo guardado es un emoji o la clave de un icono; lo que se pinta es el
      // dibujo. `iconoHtml` escapa lo que no reconoce, así que nunca entra
      // marcado ajeno por aquí.
      const valor =
        field === "icon"
          ? iconoHtml(String(item[field] ?? ""), ctx.peso)
          : String(item[field] ?? "");
      for (const op of ops) applyOp(el, op, valor, ctx);
    }
  });
}

/* ── cuenta atrás ────────────────────────────────────────────── */

/**
 * Cada template lleva su fecha objetivo escrita a mano en el script:
 * `new Date('2026-03-21T19:30:00')`. Reescribimos la primera aparición.
 */
function rewriteCountdown(html: string, iso: string): string {
  if (!iso) return html;
  const target = iso.length === 16 ? `${iso}:00` : iso;
  let done = false;
  return html.replace(/new Date\(\s*(['"])[^'"]+\1\s*\)/, (m) => {
    if (done) return m;
    done = true;
    return `new Date('${target}')`;
  });
}

/* ── RSVP ────────────────────────────────────────────────────── */

const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/**
 * El trozo que hace funcionar `?invitado=`: un saludo y un hueco donde el
 * navegador pinta una casilla por persona. Va oculto hasta que llegan nombres
 * en la dirección, y se mete en cualquier formulario —el del diseño o el
 * nuestro— para que el componente sirva en las 27 invitaciones y no sólo en
 * las configuradas con link personalizado.
 */
const andamio = (saludo: string) =>
  `<p class="inv-rsvp-hola" data-inv-saludo="${escapeHtml(saludo)}" hidden></p>` +
  '<div class="inv-rsvp-lista" data-inv-lista hidden></div>';

function wireRsvp(doc: Doc, section: El, data: InvitationData, slug: string, preview: boolean) {
  const c = data.confirm || {};
  const buttonText = String(c.buttonText || "").trim() || "Confirmar asistencia";
  const noText = String(c.declineText || "").trim() || "No podré ir";
  const couple = coupleName(data);

  const controls = () => Array.from(section.querySelectorAll("input, select, textarea")) as El[];
  const links = Array.from(section.querySelectorAll("a")) as El[];
  const buttons = Array.from(section.querySelectorAll("button")) as El[];
  const waAnchor = links.find((a) => /wa\.me|whatsapp/i.test(a.getAttribute("href") || ""));

  /* Los controles llevan CSS nuestro, parametrizado con los tokens que
     `npm run tokens` extrajo de cada diseño. Antes se les ponían las clases
     del propio template y el resultado dependía de lo que cada uno hubiera
     definido: en unos el texto quedaba del color del fondo, en otros los dos
     botones salían de distinto tamaño. */
  const claseInput = "inv-rsvp-input";
  const claseBtn = "inv-rsvp-btn";
  const claseTitulo = "inv-rsvp-msg-titulo";

  /** Deja en la sección sólo lo que pongamos nosotros. */
  const reemplazar = (nodo: El) => {
    let target: El | null =
      section.querySelector("form") || waAnchor || buttons[0] || section.querySelector(".confirm-form");
    // Sustituir el <form> completo si lo hay: anidar formularios es HTML
    // inválido y el navegador descarta el de adentro.
    if (target && target.tagName?.toLowerCase() !== "form") target = target.closest?.("form") || target;
    if (target?.parentNode) target.parentNode.replaceChild(nodo, target);
    else section.appendChild(nodo);
    for (const el of controls()) if (!nodo.contains(el)) el.remove();
    for (const b of buttons) if (!nodo.contains(b) && b.parentNode) b.remove();
    for (const a of links) if (!nodo.contains(a) && /wa\.me|whatsapp/i.test(a.getAttribute("href") || "")) a.remove();
    const resto = section.querySelector(".confirm-form, .rsvp-form");
    if (resto && !resto.contains(nodo) && !nodo.contains(resto)) resto.remove();
  };

  if (String(c.mode) === "whatsapp") {
    const a = doc.createElement("a");
    a.setAttribute("href", waLink(String(c.whatsapp || ""), `¡Confirmo mi asistencia a ${couple}!`));
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
    a.setAttribute("class", claseBtn);
    a.setAttribute("data-inv-wa", "1");
    a.textContent = buttonText;
    reemplazar(a);
    return;
  }

  /* El mismo componente en todos los diseños: saludo y casillas ocultos hasta
     que la dirección traiga nombres (?invitado=…), y dos botones en vez de un
     desplegable de sí/no. Antes se reutilizaba el formulario de cada template
     y la confirmación cambiaba de forma según el diseño. */
  const form = doc.createElement("form");
  form.setAttribute("class", "inv-rsvp");
  form.innerHTML =
    andamio(String(c.greeting || "Hola, {nombre}")) +
    `<input class="${claseInput}" name="name" placeholder="Tu nombre" required data-inv-nombre>` +
    `<input class="${claseInput}" name="phone" type="tel" placeholder="Teléfono (opcional)">` +
    '<label class="inv-rsvp-lab" data-inv-cuantos>¿Cuántas personas van?' +
    `<input class="${claseInput}" name="partySize" type="number" min="1" max="20" value="1">` +
    "</label>" +
    `<textarea class="${claseInput}" name="note" rows="2" placeholder="Mensaje (opcional)"></textarea>` +
    '<div class="inv-rsvp-acciones">' +
    `<button class="${claseBtn}" type="submit" value="confirmado" name="status">${escapeHtml(buttonText)}</button>` +
    `<button class="${claseBtn} inv-rsvp-no" type="submit" value="rechazado" name="status">${escapeHtml(noText)}</button>` +
    "</div>";

  reemplazar(form);
  form.setAttribute("data-inv-rsvp", preview ? "preview" : slug);
}

/* ── estilos y scripts inyectados ────────────────────────────── */

export const INJECTED_CSS = `
/* ── Componentes propios ──────────────────────────────────────
   Todo lo que inyectamos se dibuja con estas reglas y se adapta con las
   variables --inv-* que declara el tema de cada diseño (ver design/css.ts). */

.inv-rsvp{display:flex;flex-direction:column;gap:11px;max-width:420px;margin:28px auto 0;text-align:center}
.inv-rsvp-input{width:100%;box-sizing:border-box;padding:14px 16px;
  font-family:var(--inv-font-ui);font-size:15px;line-height:1.4;
  color:var(--inv-field-ink);background:var(--inv-field-bg);
  border:1px solid var(--inv-field-border);border-radius:var(--inv-radius);
  transition:border-color .18s,box-shadow .18s}
.inv-rsvp-input::placeholder{color:var(--inv-field-ink);opacity:.5}
.inv-rsvp-input:focus{outline:none;border-color:var(--inv-accent);
  box-shadow:0 0 0 3px var(--inv-focus)}
.inv-rsvp-lab{display:block;font-family:var(--inv-font-ui);font-size:12.5px;
  color:var(--inv-ink);opacity:.72}
.inv-rsvp-lab .inv-rsvp-input{margin-top:5px}

.inv-rsvp-hola{margin:0 0 2px;font-family:var(--inv-font-title);
  font-size:clamp(18px,4.8vw,22px);line-height:1.3;color:var(--inv-ink)}
.inv-rsvp-lista{display:flex;flex-direction:column;gap:7px}
.inv-rsvp-quien{display:flex;align-items:center;gap:11px;padding:12px 15px;
  font-family:var(--inv-font-ui);font-size:15px;color:var(--inv-field-ink);
  background:var(--inv-field-bg);border:1px solid var(--inv-field-border);
  border-radius:var(--inv-radius);cursor:pointer;transition:opacity .18s}
.inv-rsvp-quien input{flex:none;width:17px;height:17px;accent-color:var(--inv-accent)}
.inv-rsvp-quien:has(input:not(:checked)){opacity:.5}

/* Los dos botones: mismo tamaño exacto, relleno y contorno. */
.inv-rsvp-acciones{display:flex;align-items:stretch;gap:10px;margin-top:3px}
.inv-rsvp-btn{flex:1 1 0;min-width:0;box-sizing:border-box;
  display:inline-flex;align-items:center;justify-content:center;text-align:center;
  padding:15px 12px;border:0;border-radius:var(--inv-btn-radius);cursor:pointer;
  font-family:var(--inv-font-ui);font-size:12px;line-height:1.35;
  letter-spacing:var(--inv-tracking);text-transform:var(--inv-caps);
  background:var(--inv-accent);color:var(--inv-on-accent);
  transition:transform .2s,opacity .2s}
.inv-rsvp-btn:hover{transform:translateY(-2px)}
.inv-rsvp-btn:disabled{opacity:.5;transform:none;cursor:default}
.inv-rsvp-no{background:transparent;color:var(--inv-accent);
  box-shadow:inset 0 0 0 1px var(--inv-accent)}

/* Un display de autor le gana al atributo hidden del navegador. */
.inv-rsvp-hola[hidden],.inv-rsvp-lista[hidden],.inv-rsvp-lab[hidden]{display:none !important}

/* El mensaje de después de confirmar. */
.inv-rsvp-msg{display:flex;flex-direction:column;align-items:center;gap:12px;
  max-width:420px;margin:28px auto 0;padding:32px 26px;text-align:center;
  color:var(--inv-ink);border:1px solid var(--inv-field-border);
  border-radius:var(--inv-radius);
  animation:inv-aparece .55s cubic-bezier(.2,.7,.3,1) both}
.inv-rsvp-marca{display:grid;place-items:center;flex:none;width:54px;height:54px;
  border:1px solid var(--inv-accent);border-radius:50%;color:var(--inv-accent)}
.inv-rsvp-marca svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.7;
  stroke-linecap:round;stroke-linejoin:round;
  stroke-dasharray:44;stroke-dashoffset:44;animation:inv-traza .7s .2s ease forwards}
.inv-rsvp-msg-titulo{margin:0;font-family:var(--inv-font-title);
  font-size:clamp(21px,5.6vw,27px);line-height:1.2}
.inv-rsvp-msg-texto{margin:0;max-width:32ch;font-family:var(--inv-font-ui);
  font-size:14.5px;line-height:1.6;opacity:.72}
@keyframes inv-aparece{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
@keyframes inv-traza{to{stroke-dashoffset:0}}
@media (prefers-reduced-motion:reduce){
  .inv-rsvp-msg{animation:none}
  .inv-rsvp-marca svg{animation:none;stroke-dashoffset:0}
  .inv-rsvp-btn:hover{transform:none}
}

.inv-link{display:inline-block;margin-top:12px;padding:10px 18px;
  font-family:var(--inv-font-ui);font-size:11.5px;
  letter-spacing:var(--inv-tracking);text-transform:var(--inv-caps);text-decoration:none;
  color:var(--inv-accent);border:1px solid var(--inv-accent);
  border-radius:var(--inv-btn-radius)}
.inv-link:hover{background:var(--inv-accent);color:var(--inv-on-accent)}
/* ── Foto de portada recortada ─────────────────────────────────
   Cuando la foto no va a sangre se mete en el flujo del bloque de los
   nombres. Se dibuja con aspect-ratio para no depender del alto de la
   portada, y con un margen que la separe del texto del diseño. */
/* El recorte va en el envoltorio y recorta; la capa de dentro es la que se
   mueve al desplazar. Si el recorte estuviera en la capa, moverla sacaría el
   círculo o el arco de su sitio. */
.inv-hero-media{margin:0 auto 22px;width:100%;max-width:260px;line-height:0;overflow:hidden}
.inv-hero-media .inv-hero-media-img{width:100%;height:100%;
  background-size:cover;background-position:center}
.inv-hero-media:last-child{margin:22px auto 0}

.inv-hm-circulo{aspect-ratio:1;border-radius:50%;
  box-shadow:0 0 0 1px rgba(255,255,255,.55),0 14px 34px -16px rgba(0,0,0,.55)}
.inv-hm-ovalo{max-width:224px;aspect-ratio:3/4;border-radius:50%}
.inv-hm-arco{max-width:236px;aspect-ratio:3/4;
  border-radius:999px 999px var(--inv-radius) var(--inv-radius)}
.inv-hm-marco{max-width:230px;aspect-ratio:4/5;overflow:visible}
.inv-hm-marco .inv-hero-media-img{border:11px solid #fff;border-bottom-width:34px;
  box-shadow:0 14px 34px -14px rgba(0,0,0,.5);box-sizing:border-box}
.inv-hm-tarjeta{max-width:420px;aspect-ratio:4/3;border-radius:var(--inv-radius)}
/* De lado a lado aunque esté dentro de un bloque centrado y con márgenes. */
.inv-hm-banda{max-width:none;width:100vw;aspect-ratio:16/9;
  margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw)}

@media (max-width:430px){
  /* Sólo las formas recortadas se estrechan; la banda y la tarjeta ya son
     anchas a propósito y esta regla, por venir después, las pisaba. */
  .inv-hm-circulo,.inv-hm-ovalo,.inv-hm-arco,.inv-hm-marco{max-width:212px}
  .inv-hm-tarjeta{max-width:100%}
}

/* ── Iconos ────────────────────────────────────────────────────
   Los dibuja Phosphor Icons (MIT) y heredan el color del diseño con
   currentColor, así que se ven igual en todos los teléfonos y se tiñen con
   la paleta — las dos cosas que un emoji no puede hacer.

   Aquí había veinte reglas de animación, una por pieza del dibujo
   (.i-late, .i-alea, .i-traza…), porque los iconos estaban dibujados a
   mano y cada uno traía sus piezas etiquetadas. El arte de Phosphor son
   formas rellenas y no trazos: no hay piezas sueltas que animar ni trazo que
   dibujar progresivamente. El movimiento va ahora en el <svg> entero, son
   cuatro, y cada uno lo declara la tabla de iconos.datos.ts.

   Siguen siendo lentos y cortos a propósito: son adornos, no reclamos. */
.inv-ico{display:inline-block;width:1.15em;height:1.15em;vertical-align:-.18em;
  fill:currentColor;overflow:visible}
.inv-ico-late{animation:invIcoLate 2.8s ease-in-out infinite}
.inv-ico-brilla{animation:invIcoBrilla 3.2s ease-in-out infinite}
.inv-ico-flota{animation:invIcoFlota 3.4s ease-in-out infinite}
.inv-ico-ondea{animation:invIcoOndea 3.6s ease-in-out infinite}

@keyframes invIcoLate{0%,100%{transform:scale(1)}45%{transform:scale(1.09)}}
@keyframes invIcoBrilla{0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.66;transform:scale(1.07)}}
@keyframes invIcoFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes invIcoOndea{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg)}}

/* ── Fondo y adornos por sección ───────────────────────────────
   El fondo cubre la sección entera y va detrás; un adorno es una pieza que
   se coloca en uno de nueve sitios, con su tamaño, su giro y su capa.

   La capa se decide con z-index y no con el orden en el DOM: los adornos se
   añaden al final de la sección, así que sin z-index todos taparían el texto.
   "Debajo" es 0 y "encima" es 4, con el contenido en 1. */
.inv-fondo{position:absolute;inset:0;z-index:0;pointer-events:none}
.inv-adorno{position:absolute;line-height:0;pointer-events:none}
.inv-adorno img{display:block;width:100%;height:auto}

.inv-ad-arriba-izq{top:0;left:0}
.inv-ad-arriba{top:0;left:50%;translate:-50% 0}
.inv-ad-arriba-der{top:0;right:0}
.inv-ad-izq{top:50%;left:0;translate:0 -50%}
.inv-ad-centro{top:50%;left:50%;translate:-50% -50%}
.inv-ad-der{top:50%;right:0;translate:0 -50%}
.inv-ad-abajo-izq{bottom:0;left:0}
.inv-ad-abajo{bottom:0;left:50%;translate:-50% 0}
.inv-ad-abajo-der{bottom:0;right:0}
/* A sangre: cubre la sección y recorta lo que sobre. */
.inv-ad-sangre{inset:0}
.inv-ad-sangre img{width:100%;height:100%;object-fit:cover}

/* El adorno bajo el título de cada sección. Lo elige el diseño en su deco. */
.inv-orn{width:100%;height:100%;fill:currentColor}

@media (prefers-reduced-motion:reduce){
  .inv-ico-late,.inv-ico-brilla,.inv-ico-flota,.inv-ico-ondea{animation:none}
}

/* ── El nombre de quien abre su enlace ─────────────────────────
   Es lo que sustituye a la lista de invitados de ejemplo que traía cada
   diseño. Los nombres entran uno a uno y el filete se abre debajo; todo con
   los tokens del template, así que se ve intencionado en todos. */
.inv-invitados{margin:16px auto 4px;max-width:22ch;text-align:center}
.inv-invitados[hidden]{display:none !important}
.inv-inv-antes,.inv-inv-despues{margin:0;font-family:var(--inv-font-ui);
  font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.72}
.inv-inv-antes:empty,.inv-inv-despues:empty{display:none}
.inv-inv-despues{margin-top:8px}
.inv-inv-nombres{margin:8px 0 0;font-family:var(--inv-font-title);
  font-size:clamp(25px,7.4vw,36px);line-height:1.22;color:var(--inv-accent)}
.inv-inv-pal{display:inline-block;white-space:pre}
.inv-inv-filete{display:block;width:0;height:1px;margin:14px auto 0;
  background:var(--inv-accent);opacity:.5}

/* La entrada, cuando el bloque asoma. */
.inv-invitados .inv-inv-pal{opacity:0;transform:translateY(14px)}
.inv-invitados.esta .inv-inv-pal{
  animation:invNombreEntra .62s cubic-bezier(.22,.7,.3,1) forwards;
  animation-delay:calc(var(--i,0) * 90ms)}
.inv-invitados .inv-inv-antes,.inv-invitados .inv-inv-despues{opacity:0}
.inv-invitados.esta .inv-inv-antes{animation:invSuave .5s ease forwards}
.inv-invitados.esta .inv-inv-despues{animation:invSuave .5s ease .3s forwards}
.inv-invitados.esta .inv-inv-filete{
  animation:invFilete .8s cubic-bezier(.22,.7,.3,1) .25s forwards}
@keyframes invNombreEntra{to{opacity:1;transform:none}}
@keyframes invSuave{to{opacity:.72}}
@keyframes invFilete{to{width:74px}}
.inv-invitados.sin-animacion .inv-inv-pal,
.inv-invitados.sin-animacion .inv-inv-antes,
.inv-invitados.sin-animacion .inv-inv-despues{animation:none;opacity:1;transform:none}
.inv-invitados.sin-animacion .inv-inv-antes,
.inv-invitados.sin-animacion .inv-inv-despues{opacity:.72}
.inv-invitados.sin-animacion .inv-inv-filete{animation:none;width:74px}

/* Antetítulo de portada creado por nosotros: el diseño no lo estiliza. */
.inv-hero-label{display:block;margin:0 0 10px;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;opacity:.72}

.inv-block{position:relative;padding:64px 22px;text-align:center}
/* Centrado siempre: algunos diseños alinean a la izquierda desde un selector
   de id, que gana a cualquier clase nuestra. */
.inv-block :is(p,h1,h2,h3,h4,h5,li,span,div,figcaption,label,time){text-align:center !important}
/* El adorno que trae el diseño bajo el título se descoloca en nuestra
   maquetación; en los bloques nuestros no se pinta. */
.inv-block .ornament{display:none}
.inv-block>.container{width:min(760px,100%);margin:0 auto}
/* Mínimos para los diseños que no estilizan estas clases: el bloque tiene que
   verse bien igual, aunque su CSS no las conozca. */
.inv-block .event-place small{display:block;margin-top:2px;opacity:.82}
.gallery-ph .inv-ico{display:block;width:26px;height:26px;margin:0 auto 7px;opacity:.5}
.gallery-ph-text{display:block;text-align:center;line-height:1.3}
.gallery-ph-text b{font-weight:400;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;opacity:.62}
.inv-block .gallery-ph{width:100%;height:100%;display:grid;place-items:center;
  /* Sin foto todavía, el hueco tiene que verse: si no, elegir entre una
     disposición y otra en el editor es elegir entre dos rectángulos vacíos. */
  background-color:var(--inv-field-bg);box-shadow:inset 0 0 0 1px var(--inv-field-border);
  background-size:cover;background-position:center}
.inv-block .gallery-item{overflow:hidden}
.inv-block .guest-avatar{display:grid;place-items:center}

/* ── Cuenta atrás: cinco componentes propios ──────────────────
   Mismo marcado, distinto CSS. Todos con los tokens del diseño, así que se
   ven intencionales en todos en vez de heredar las cajas de cada template. */
.inv-cd{margin:28px auto 0}
.inv-cd .countdown-ring{background:transparent;border:0;box-shadow:none;padding:0}
/* Varios diseños superponen su número sobre un svg subiendo .ring-inner con
   un margen superior negativo y alto fijo. Nuestro marcado no trae ese svg,
   así que sin esto el reloj se sube encima del párrafo y se recorta. */
.inv-cd .ring-inner{position:static;display:block;margin:0;height:auto;width:auto}
.inv-cd .ring-number{display:block;font-family:var(--inv-font-title);line-height:1;
  font-variant-numeric:tabular-nums}
.inv-cd .ring-label{display:block;margin-top:5px;font-family:var(--inv-font-ui);
  font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;opacity:.62}

/* 1 · Círculos */
.inv-cd-circulos{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:430px}
.inv-cd-circulos .countdown-ring{aspect-ratio:1;display:grid;place-items:center;
  border:1px solid var(--inv-accent);border-radius:50%}
.inv-cd-circulos .ring-inner{text-align:center}
.inv-cd-circulos .ring-number{font-size:clamp(21px,6.2vw,29px);color:var(--inv-accent)}

/* 2 · Tarjetas */
.inv-cd-tarjetas{display:flex;align-items:stretch;justify-content:center;gap:8px;max-width:430px}
.inv-cd-tarjetas .countdown-ring{flex:1 1 0;min-width:0;display:grid;place-items:center;
  padding:16px 4px;background:var(--inv-accent);border-radius:var(--inv-radius)}
.inv-cd-tarjetas .ring-inner{text-align:center}
.inv-cd-tarjetas .ring-number{font-size:clamp(21px,6vw,28px);color:var(--inv-on-accent)}
.inv-cd-tarjetas .ring-label{color:var(--inv-on-accent);opacity:.78}

/* 3 · Anillos — el aro se vacía a medida que corre el tiempo */
.inv-cd-anillos{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:430px}
.inv-cd-anillos .countdown-ring{position:relative;aspect-ratio:1;display:grid;place-items:center}
.inv-cd-anillos .countdown-ring::before{content:"";position:absolute;inset:0;border-radius:50%;
  background:conic-gradient(var(--inv-accent) calc(var(--p,0) * 1turn), var(--inv-field-border) 0);
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px));
          mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 2px))}
.inv-cd-anillos .ring-inner{position:relative;text-align:center}
.inv-cd-anillos .ring-number{font-size:clamp(19px,5.6vw,26px);color:var(--inv-ink)}

/* 4 · Tipográfico */
.inv-cd-tipo{display:flex;align-items:flex-end;justify-content:center;max-width:470px}
.inv-cd-tipo .countdown-ring{flex:1 1 0;min-width:0;padding:0 4px;text-align:center;
  /* El borde de campo puede ser casi del color del fondo: se usa el acento
     rebajado, que se ve tanto en claro como en oscuro. */
  border-left:1px solid var(--inv-focus)}
.inv-cd-tipo .countdown-ring:first-child{border-left:0}
.inv-cd-tipo .ring-number{font-size:clamp(28px,9.5vw,50px);color:var(--inv-ink)}
.inv-cd-tipo .ring-label{margin-top:7px}

/* 5 · Una línea */
.inv-cd-linea{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:4px 13px}
.inv-cd-linea .countdown-ring{width:auto;height:auto;aspect-ratio:auto}
.inv-cd-linea .ring-inner{display:flex;flex-direction:row;align-items:baseline;gap:5px}
.inv-cd-linea .ring-number{font-size:clamp(19px,5.4vw,26px);color:var(--inv-accent)}
.inv-cd-linea .ring-label{display:inline;margin:0;font-size:9px;letter-spacing:.1em}

/* 6 · Cápsulas */
.inv-cd-capsulas{display:grid;grid-template-columns:repeat(2,1fr);justify-items:center;
  gap:9px;max-width:330px}
.inv-cd-capsulas .countdown-ring{padding:9px 17px;border-radius:999px;background:var(--inv-accent)}
.inv-cd-capsulas .ring-inner{display:flex;flex-direction:row;align-items:baseline;gap:7px}
.inv-cd-capsulas .ring-number{font-size:clamp(17px,4.8vw,23px);color:var(--inv-on-accent)}
.inv-cd-capsulas .ring-label{display:inline;margin:0;font-size:9px;color:var(--inv-on-accent);opacity:.8}

/* 7 · Placas — la ranura a media altura recuerda al reloj de tablero */
.inv-cd-placas{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;max-width:330px}
.inv-cd-placas .countdown-ring{display:grid;place-items:center;padding:18px 4px 13px;
  border:1px solid var(--inv-field-border);border-radius:var(--inv-radius);
  background:var(--inv-field-bg);
  background-image:linear-gradient(var(--inv-field-border),var(--inv-field-border));
  background-size:100% 1px;background-position:0 58%;background-repeat:no-repeat}
.inv-cd-placas .ring-inner{text-align:center}
.inv-cd-placas .ring-number{font-size:clamp(22px,6.4vw,30px);color:var(--inv-ink)}
.inv-cd-placas .ring-label{margin-top:11px}

/* 8 · Reloj — los cuatro seguidos, con dos puntos en medio */
.inv-cd-reloj{display:flex;align-items:flex-start;justify-content:center;gap:20px;max-width:430px}
.inv-cd-reloj .countdown-ring{position:relative;text-align:center}
.inv-cd-reloj .countdown-ring+.countdown-ring::before{content:":";position:absolute;
  left:-13px;top:0;line-height:1;font-family:var(--inv-font-title);
  font-size:clamp(24px,7vw,38px);color:var(--inv-accent);opacity:.55}
.inv-cd-reloj .ring-number{font-size:clamp(26px,8vw,42px);color:var(--inv-ink)}

/* 9 · En columna — número a la izquierda, unidad a la derecha */
.inv-cd-vertical{display:flex;flex-direction:column;gap:0;max-width:330px}
.inv-cd-vertical .countdown-ring{padding:12px 2px;border-bottom:1px solid var(--inv-focus)}
.inv-cd-vertical .countdown-ring:last-child{border-bottom:0}
.inv-cd-vertical .ring-inner{display:flex;flex-direction:row;align-items:baseline;justify-content:space-between;gap:14px}
.inv-cd-vertical .ring-number{font-size:clamp(24px,6.6vw,32px);color:var(--inv-accent)}
.inv-cd-vertical .ring-label{margin:0;font-size:10px}

/* 10 · Medallón — los días mandan, el resto acompaña */
.inv-cd-medallon{display:grid;grid-template-columns:repeat(3,1fr);justify-items:center;
  gap:18px 10px;max-width:330px}
.inv-cd-medallon .countdown-ring{display:grid;place-items:center;text-align:center}
.inv-cd-medallon .countdown-ring:first-child{grid-column:1 / -1;width:168px;aspect-ratio:1;
  border:1px solid var(--inv-accent);border-radius:50%}
.inv-cd-medallon .countdown-ring:first-child .ring-number{font-size:clamp(44px,13vw,62px);color:var(--inv-accent)}
.inv-cd-medallon .countdown-ring:first-child .ring-label{margin-top:2px;font-size:10px}
.inv-cd-medallon .countdown-ring:not(:first-child) .ring-number{font-size:clamp(17px,4.8vw,22px);color:var(--inv-ink)}

.inv-guests-tarjetas{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:12px;margin-top:26px}
.inv-guests-lista{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:26px}
.inv-guests-lista .guest-card{display:flex;align-items:baseline;gap:8px;padding:9px 17px;
  border:1px solid currentColor;border-radius:999px;background:none;box-shadow:none}
.inv-guests-lista .guest-name,.inv-guests-lista .guest-role{margin:0}
.inv-guests-lista .guest-role{font-size:12px;opacity:.62}

.inv-ev-tarjetas{display:grid;grid-template-columns:repeat(auto-fit,minmax(248px,1fr));gap:16px;margin-top:28px}
.inv-ev-lista{display:flex;flex-direction:column;gap:10px;margin-top:28px}
.inv-ev-lista .event-card{display:grid;grid-template-columns:auto 1fr;column-gap:16px;text-align:center;padding:18px 20px}
.inv-ev-lista .event-icon{grid-column:1;grid-row:1 / span 6;align-self:center;font-size:26px}
.inv-ev-lista .event-card>:not(.event-icon){grid-column:2;margin:0}
.inv-ev-timeline{position:relative;display:flex;flex-direction:column;gap:12px;margin-top:28px;padding-left:26px}
.inv-ev-timeline::before{content:"";position:absolute;left:7px;top:14px;bottom:14px;width:1px;background:currentColor;opacity:.22}
.inv-ev-timeline .event-card{position:relative;text-align:center;padding:18px 20px}
.inv-ev-timeline .event-card::before{content:"";position:absolute;left:-24px;top:24px;
  width:9px;height:9px;border-radius:50%;background:currentColor;opacity:.5}

.inv-ga-cuadricula{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:26px}
.inv-ga-cuadricula .gallery-item{aspect-ratio:1}
.inv-ga-mosaico{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:104px;gap:9px;margin-top:26px}
.inv-ga-mosaico .gallery-item{aspect-ratio:auto;height:100%}
.inv-ga-mosaico .gallery-item:nth-child(6n+1){grid-column:span 2;grid-row:span 2}
.inv-ga-tira{display:flex;gap:10px;margin-top:26px;padding-bottom:10px;
  overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.inv-ga-tira .gallery-item{flex:0 0 74%;max-width:320px;aspect-ratio:4/5;scroll-snap-align:center}
.inv-ga-polaroid{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-top:26px}
.inv-ga-polaroid .gallery-item{flex:0 0 134px;aspect-ratio:3/4;padding:9px 9px 30px;border-radius:2px;
  background:#fff;box-shadow:0 8px 22px -10px rgba(0,0,0,.42)}
.inv-ga-polaroid .gallery-item:nth-child(odd){transform:rotate(-2deg)}
.inv-ga-polaroid .gallery-item:nth-child(even){transform:rotate(1.6deg)}
.inv-ga-polaroid .gallery-ph{width:100%;height:100%}

/* Galería · Arco — el remate de las tarjetas de Comunión Tropical */
.inv-ga-arco{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:26px}
.inv-ga-arco .gallery-item{aspect-ratio:3/4;border-radius:999px 999px var(--inv-radius) var(--inv-radius);
  overflow:hidden}
.inv-ga-arco .gallery-ph{width:100%;height:100%}

/* Galería · Círculos */
.inv-ga-circulos{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:26px}
.inv-ga-circulos .gallery-item{flex:0 0 108px;aspect-ratio:1;border-radius:50%;overflow:hidden;
  box-shadow:0 0 0 1px var(--inv-accent),0 0 0 5px var(--inv-surface)}
.inv-ga-circulos .gallery-ph{width:100%;height:100%}

/* Galería · Paspartú — margen y un filete por dentro, como un cuadro */
.inv-ga-marco{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:26px}
.inv-ga-marco .gallery-item{position:relative;aspect-ratio:4/5;padding:11px;
  border:1px solid var(--inv-field-border);border-radius:var(--inv-radius);background:var(--inv-field-bg)}
.inv-ga-marco .gallery-item::after{content:"";position:absolute;inset:6px;pointer-events:none;
  border:1px solid var(--inv-accent);opacity:.34;border-radius:calc(var(--inv-radius) / 2)}
.inv-ga-marco .gallery-ph{width:100%;height:100%}

/* Galería · Revista — una manda y las demás la acompañan */
.inv-ga-revista{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:26px}
.inv-ga-revista .gallery-item{aspect-ratio:1;border-radius:var(--inv-radius);overflow:hidden}
.inv-ga-revista .gallery-item:first-child{grid-column:1 / -1;aspect-ratio:16/10}
.inv-ga-revista .gallery-ph{width:100%;height:100%}

/* Galería · Escalera — la segunda columna baja media foto */
.inv-ga-escalera{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:26px}
.inv-ga-escalera .gallery-item{aspect-ratio:3/4;border-radius:var(--inv-radius);overflow:hidden}
.inv-ga-escalera .gallery-item:nth-child(even){transform:translateY(28px)}
.inv-ga-escalera .gallery-ph{width:100%;height:100%}

/* Galería · Apiladas */
.inv-ga-apilada{display:flex;flex-direction:column;gap:14px;margin-top:26px}
.inv-ga-apilada .gallery-item{width:100%;aspect-ratio:4/3;border-radius:var(--inv-radius);overflow:hidden}
.inv-ga-apilada .gallery-ph{width:100%;height:100%}

.inv-fe-tarjetas{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:28px}
.inv-fe-lista{display:flex;flex-direction:column;gap:10px;margin-top:28px}
.inv-fe-lista .feature-card{display:grid;grid-template-columns:auto 1fr;column-gap:16px;text-align:center;padding:18px 20px}
.inv-fe-lista .feature-icon{grid-column:1;grid-row:1 / span 3;align-self:center;font-size:26px}
.inv-fe-lista .feature-card>:not(.feature-icon){grid-column:2;margin:0}

.inv-foto{margin:0}
.inv-foto-pie{margin-top:10px;text-align:center;font-size:12.5px;opacity:.68}
.inv-foto .gallery-item{overflow:hidden}
.inv-block.inv-v-completa{padding:0}
.inv-foto-completa .gallery-item{aspect-ratio:16/10;border-radius:0}
.inv-foto-completa .inv-foto-pie{padding:10px 22px 26px}
.inv-foto-marco-centrado .gallery-item{max-width:520px;margin:26px auto 0;aspect-ratio:4/3;border-radius:8px}
.inv-foto-arco .gallery-item{max-width:340px;margin:26px auto 0;aspect-ratio:3/4;
  border-radius:50% 50% 10px 10px / 34% 34% 5px 5px}

/* ── Vídeo ── */
.inv-video{margin:0}
.inv-video-lienzo{position:relative;overflow:hidden;margin:26px auto 0;
  border-radius:var(--inv-radius);border:1px solid var(--inv-field-border);
  background:#000}
.inv-video-frame,.inv-video-propio{position:absolute;inset:0;width:100%;height:100%;
  border:0;display:block}
/* cover y no contain: el marco ya lleva la proporción del vídeo, y una franja
   negra alrededor delata que la forma elegida no era la del vídeo. */
.inv-video-propio{object-fit:cover;background:#000}
.inv-video-pie{margin-top:10px;text-align:center;font-size:12.5px;opacity:.68}

.inv-video-16-9 .inv-video-lienzo{aspect-ratio:16/9;max-width:620px}
.inv-video-9-16 .inv-video-lienzo{aspect-ratio:9/16;max-width:320px}

.inv-block.inv-v-completa .inv-video-lienzo{margin:0;border-radius:0;
  border-left:0;border-right:0;aspect-ratio:16/9}
/* El divisor del diseño (una ola, un arco) se monta sobre el final de la
   sección anterior con un margen negativo y z-index 4. Sobre un vídeo a
   sangre eso cae justo en la barra de controles: se veía el vídeo y no se
   podía darle al play. El vídeo pasa por encima. */
.inv-block.inv-v-completa:has(.inv-video){position:relative;z-index:5}
@media (max-width:640px){
  .inv-block.inv-v-completa .inv-video-lienzo{aspect-ratio:4/3}
}

/* ── Ubicación ── */
.inv-mapa{margin-top:26px}
.inv-mapa-lienzo{position:relative;overflow:hidden;border-radius:var(--inv-radius);
  border:1px solid var(--inv-field-border);background:var(--inv-field-bg)}
.inv-mapa-lienzo::before{content:"";display:block;padding-top:62%}
.inv-mapa-frame{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}
/* Sin nada que buscar el renderer quita el iframe: el hueco sobra. */
.inv-mapa-lienzo:not(:has(.inv-mapa-frame)){display:none}
.inv-mapa-datos{margin-top:16px;text-align:center}
.inv-mapa-lugar{margin:0;font-family:var(--inv-font-title);
  font-size:clamp(19px,5vw,24px);line-height:1.25;color:var(--inv-ink)}
.inv-mapa-dir{margin:5px 0 0;font-family:var(--inv-font-ui);font-size:14px;
  line-height:1.55;color:var(--inv-ink);opacity:.72}
.inv-mapa-btn{display:inline-block;margin-top:15px;padding:13px 24px;
  font-family:var(--inv-font-ui);font-size:11.5px;letter-spacing:var(--inv-tracking);
  text-transform:var(--inv-caps);text-decoration:none;
  background:var(--inv-accent);color:var(--inv-on-accent);
  border-radius:var(--inv-btn-radius);transition:transform .2s}
.inv-mapa-btn:hover{transform:translateY(-2px)}

.inv-block.inv-v-ancho{padding:0}
.inv-mapa-ancho{position:relative;margin:0}
.inv-mapa-ancho .inv-mapa-lienzo{border-radius:0;border-left:0;border-right:0}
.inv-mapa-ancho .inv-mapa-lienzo::before{padding-top:70%}
.inv-mapa-ancho .inv-mapa-datos{margin:0;padding:26px 22px 34px;background:var(--inv-surface)}
.inv-mapa-sola .inv-mapa-datos{padding:26px 22px;border:1px solid var(--inv-field-border);
  border-radius:var(--inv-radius)}
@media (min-width:640px){
  .inv-mapa-ancho .inv-mapa-lienzo::before{padding-top:44%}
}

/* ── Regalos y redes con marcado propio ── */
.inv-cuenta{max-width:340px;margin:24px auto 0;padding:20px;text-align:center;
  border:1px dashed var(--inv-accent);border-radius:var(--inv-radius)}
.inv-cuenta .gifts-bank{margin:0;font-family:var(--inv-font-ui);font-size:10.5px;
  letter-spacing:var(--inv-tracking);text-transform:var(--inv-caps);color:var(--inv-accent)}
.inv-cuenta .gifts-iban{margin:7px 0 0;font-family:var(--inv-font-ui);
  font-size:15px;font-weight:600;color:var(--inv-ink)}
.inv-gi-tarjetas{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));
  gap:12px;margin-top:24px}
.inv-gi-tarjetas .gift-card{padding:22px 14px;text-align:center;
  border:1px solid var(--inv-field-border);border-radius:var(--inv-radius)}
.inv-gi-tarjetas .gift-icon{display:block;font-size:24px;line-height:1}
.inv-gi-tarjetas .gift-title{margin:8px 0 0;font-family:var(--inv-font-title);
  font-size:17px;color:var(--inv-ink)}
.inv-gi-tarjetas .gift-desc{margin:4px 0 0;font-family:var(--inv-font-ui);
  font-size:13px;color:var(--inv-ink);opacity:.72}
.inv-hashtag{display:block;margin-top:16px;font-family:var(--inv-font-title);
  font-size:clamp(23px,6.2vw,32px);color:var(--inv-accent)}
.inv-boton{display:block;width:max-content;max-width:100%;margin:22px auto 0;
  padding:13px 26px;font-family:var(--inv-font-ui);font-size:11.5px;
  letter-spacing:var(--inv-tracking);text-transform:var(--inv-caps);text-decoration:none;
  background:var(--inv-accent);color:var(--inv-on-accent);border-radius:var(--inv-btn-radius)}
.inv-boton:hover{opacity:.88}

.inv-pa-simple{max-width:56ch;margin:0 auto;text-align:center}
.inv-pa-destacado{max-width:34ch;margin:0 auto;text-align:center;font-style:italic;
  font-size:clamp(19px,4.6vw,26px);line-height:1.5}
.inv-pa-destacado::before{content:"“";display:block;margin-bottom:4px;font-size:2.4em;line-height:.7;opacity:.32}
.inv-pa-dividido{display:grid;gap:18px;text-align:center}
.inv-pa-dividido .section-label,.inv-pa-dividido .section-title,.inv-pa-dividido .section-body{
  text-align:left;margin-left:0;max-width:none}
@media (min-width:680px){
  .inv-pa-dividido{grid-template-columns:minmax(0,34%) 1fr;gap:34px;align-items:start}
}
/* En pantallas estrechas algunas rejillas piden menos columnas. */
@media (min-width:560px){
  .inv-cd-capsulas{grid-template-columns:repeat(4,1fr);max-width:560px}
  .inv-cd-placas{grid-template-columns:repeat(4,1fr);max-width:460px}
}
@media (max-width:430px){
  .inv-ga-arco{grid-template-columns:repeat(2,1fr)}
  .inv-ga-circulos .gallery-item{flex:0 0 88px}
  .inv-cd-reloj{gap:15px}
  .inv-cd-reloj .countdown-ring+.countdown-ring::before{left:-10px}
}

@media (prefers-reduced-motion:reduce){
  .inv-ico *{animation:none !important}
  .inv-ico .i-traza > *{stroke-dasharray:none}
  .inv-ga-polaroid .gallery-item{transform:none}
  .inv-ga-escalera .gallery-item:nth-child(even){transform:none}
}
`;

export const RSVP_JS = `
(function(){
  var form = document.querySelector('[data-inv-rsvp]');
  if(!form) return;
  var slug = form.getAttribute('data-inv-rsvp');

  // Los nombres pueden venir en la dirección, uno o varios separados por coma:
  //   ?invitado=Ana%20G%C3%B3mez,Carlos%20G%C3%B3mez
  var q = new URLSearchParams(location.search);
  var crudo = (q.get('invitado') || q.get('guest') || q.get('i') || '').slice(0, 400);
  var nombres = crudo.split(/[,;|]/).map(function(n){ return n.trim(); })
                     .filter(Boolean).slice(0, 12);

  var campoNombre = form.querySelector('[name="name"]');
  var saludo = form.querySelector('[data-inv-saludo]');
  var lista = form.querySelector('[data-inv-lista]');
  var casillas = [];

  /** "Ana, Carlos y Sofía" */
  function unir(xs){
    if (xs.length < 2) return xs[0] || '';
    return xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
  }

  /** Esconde el control y su etiqueta, ganándole al CSS del diseño. */
  function esconder(el){
    if (!el) return;
    var caja = el.closest('label') || el;
    caja.hidden = true;
    caja.style.setProperty('display', 'none', 'important');
  }

  // Los nombres del link mandan en toda la invitación, no sólo aquí: quien
  // abre su enlace tiene que verse nombrado también en la sección de
  // invitados, que es donde antes había una lista de nombres de ejemplo.
  // El hueco lo pone el render; si el diseño no tiene esa sección, no hay
  // hueco y no pasa nada.
  document.querySelectorAll('[data-inv-invitado]').forEach(function(caja){
    // En el editor se enseña con nombres de muestra para poder verlo.
    var demo = caja.getAttribute('data-inv-demo') || '';
    var quienes = nombres.length ? nombres
      : (demo ? demo.split(/[,;|]/).map(function(n){ return n.trim(); }).filter(Boolean) : []);
    if (!quienes.length) return;

    var plantilla = caja.getAttribute('data-inv-invitado') || '{nombre}';
    var partes = plantilla.split('{nombre}');
    var antes = caja.querySelector('.inv-inv-antes');
    var despues = caja.querySelector('.inv-inv-despues');
    var destino = caja.querySelector('.inv-inv-nombres');
    if (!destino) { caja.textContent = plantilla.replace('{nombre}', unir(quienes)); }
    else {
      if (antes) antes.textContent = (partes[0] || '').trim();
      if (despues) despues.textContent = (partes[1] || '').trim();
      // Palabra a palabra, para que entren una detrás de otra.
      destino.textContent = '';
      unir(quienes).split(' ').forEach(function(pal, i){
        var s = document.createElement('span');
        s.className = 'inv-inv-pal';
        s.style.setProperty('--i', String(i));
        s.textContent = (i ? ' ' : '') + pal;
        destino.appendChild(s);
      });
    }

    caja.hidden = false;
    caja.style.removeProperty('display');

    // La animación arranca cuando el bloque asoma, no al cargar: si no,
    // termina mucho antes de que nadie llegue a esa parte.
    var arranca = function(){ caja.classList.add('esta'); };
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      caja.classList.add('esta', 'sin-animacion');
    } else if (window.IntersectionObserver) {
      var obs = new IntersectionObserver(function(items){
        items.forEach(function(it){ if (it.isIntersecting) { arranca(); obs.disconnect(); } });
      }, { threshold: 0.35 });
      obs.observe(caja);
    } else {
      arranca();
    }
  });

  if (nombres.length && campoNombre) {
    campoNombre.value = unir(nombres);

    if (saludo) {
      saludo.textContent = saludo.getAttribute('data-inv-saludo').replace('{nombre}', unir(nombres));
      saludo.hidden = false;
      esconder(campoNombre);
      campoNombre.removeAttribute('required');
    }

    // Con varios invitados cada uno dice si viene. Sobran el contador de
    // acompañantes y el desplegable de sí/no: la cuenta sale de las casillas.
    if (nombres.length > 1 && lista) {
      lista.innerHTML = '';
      nombres.forEach(function(n){
        var l = document.createElement('label');
        l.className = 'inv-rsvp-quien';
        var c = document.createElement('input');
        c.type = 'checkbox';
        c.checked = true;
        c.value = n;
        var t = document.createElement('span');
        t.textContent = n;
        l.appendChild(c); l.appendChild(t);
        lista.appendChild(l);
        casillas.push(c);
      });
      lista.hidden = false;
      esconder(form.querySelector('[name="partySize"]'));
      esconder(form.querySelector('select[name="status"]'));
    }
  }

  // El botón que se pulsa decide si asiste o no.
  var respuesta = '';
  form.querySelectorAll('button[name="status"]').forEach(function(b){
    b.addEventListener('click', function(){ respuesta = b.value; });
  });

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var body = {};
    new FormData(form).forEach(function(v,k){ body[k] = v; });
    if (respuesta) body.status = respuesta;
    // El código del link personalizado, para que el panel de quien invita
    // sepa quién contestó sin tener que emparejar por nombre.
    var codigo = q.get('g') || '';
    if (codigo) body.code = codigo;
    if (casillas.length) {
      // Uno por persona: quien no está marcado va como que no asiste, y si se
      // pulsó "no podré ir" no asiste nadie.
      body.guests = casillas.map(function(c){
        return { name: c.value, status: (respuesta !== 'rechazado' && c.checked) ? 'confirmado' : 'rechazado' };
      });
    }
    if(slug === 'preview'){
      done('¡Nos vemos!', 'Así se verá el mensaje cuando alguien confirme.', VISTO);
      return;
    }
    form.querySelectorAll('button').forEach(function(b){ b.disabled = true; });
    fetch('/api/i/' + slug + '/rsvp', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
    }).then(function(r){ return r.json().then(function(j){ return {ok:r.ok, j:j}; }); })
      .then(function(res){
        if(!res.ok){
          form.querySelectorAll('button').forEach(function(b){ b.disabled = false; });
          alert(res.j.error || 'No se pudo enviar.');
          return;
        }
        if (res.j.status === 'rechazado') {
          done('Gracias por avisarnos',
               res.j.total > 1 ? 'Los vamos a extrañar.' : 'Te vamos a extrañar.',
               CORAZON);
        } else if (res.j.status === 'mixto') {
          done('¡Nos vemos!',
               'Quedaron ' + res.j.asisten + ' de ' + res.j.total + ' confirmados.',
               VISTO);
        } else if (res.j.actualizada) {
          // Ya había contestado. Decirlo evita que se pregunte si la anterior
          // contó o si acaba de apuntarse dos veces.
          done('¡Nos vemos!',
               res.j.total > 1
                 ? 'Actualizamos su respuesta. Quedaron ' + res.j.total + ' confirmados.'
                 : 'Actualizamos tu respuesta. Sigue quedando una sola confirmación.',
               VISTO);
        } else {
          done('¡Nos vemos!',
               res.j.total > 1
                 ? 'Quedaron ' + res.j.total + ' confirmados. Gracias por avisarnos.'
                 : 'Tu confirmación quedó registrada. Gracias por avisarnos.',
               VISTO);
        }
      })
      .catch(function(){
        form.querySelectorAll('button').forEach(function(b){ b.disabled = false; });
        alert('No se pudo enviar. Intenta de nuevo.');
      });
  });
  var VISTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.6l5.2 5.2L20 6.4"/></svg>';
  var CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 20.2S4.6 15.5 4.6 10.4A3.9 3.9 0 0 1 12 8.3a3.9 3.9 0 0 1 7.4 2.1c0 5.1-7.4 9.8-7.4 9.8z"/></svg>';

  function done(titulo, texto, icono){
    var caja = document.createElement('div');
    caja.className = 'inv-rsvp-msg';
    caja.setAttribute('role', 'status');

    var marca = document.createElement('span');
    marca.className = 'inv-rsvp-marca';
    marca.innerHTML = icono;

    var h = document.createElement('p');
    // La clase de los títulos del diseño: misma tipografía y mismo color.
    h.className = 'inv-rsvp-msg-titulo';
    h.textContent = titulo;

    var t = document.createElement('p');
    t.className = 'inv-rsvp-msg-texto';
    t.textContent = texto;

    caja.appendChild(marca); caja.appendChild(h); caja.appendChild(t);
    form.parentNode.replaceChild(caja, form);
    if (caja.scrollIntoView) caja.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
})();`;

const musicJs = (url: string) => `
(function(){
  var a = document.createElement('audio');
  a.src = ${JSON.stringify(url)}; a.loop = true; a.preload = 'none';
  document.body.appendChild(a);
  var btn = document.getElementById('music-btn');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'music-btn';
    btn.textContent = '\\u266a';
    btn.setAttribute('style','position:fixed;right:16px;bottom:16px;z-index:9998;width:44px;height:44px;'+
      'border-radius:50%;border:1px solid currentColor;background:rgba(255,255,255,.85);cursor:pointer;font-size:17px');
    document.body.appendChild(btn);
  }
  btn.onclick = function(){
    if(a.paused){ a.play().catch(function(){}); btn.style.opacity = 1; }
    else { a.pause(); btn.style.opacity = .5; }
  };
  document.addEventListener('click', function once(){ a.play().catch(function(){}); }, {once:true});
})();`;

const countdownJs = (iso: string) => `
(function(){
  var nodos = document.querySelectorAll('[data-cd]');
  if(!nodos.length) return;
  var meta = new Date(${JSON.stringify(iso)});
  function pintar(){
    var s = Math.floor(Math.max(0, meta - new Date()) / 1000);
    var v = { days: Math.floor(s/86400), hours: Math.floor(s/3600)%24, mins: Math.floor(s/60)%60, secs: s%60 };
    // Cuánto le queda a cada unidad dentro de su ciclo, para el aro.
    var ciclo = { days: Math.min(v.days, 365) / 365, hours: v.hours / 24, mins: v.mins / 60, secs: v.secs / 60 };
    for (var i = 0; i < nodos.length; i++) {
      var n = nodos[i];
      var u = n.getAttribute('data-cd');
      var aro = n.closest ? n.closest('[data-cd-ring]') : null;
      if (aro) aro.style.setProperty('--p', ciclo[u].toFixed(4));
      var t = String(v[u]).padStart(2, '0');
      if (n.textContent === t) continue;
      n.textContent = t;
      n.classList.remove('tick');
      void n.offsetWidth;
      n.classList.add('tick');
    }
  }
  pintar();
  setInterval(pintar, 1000);
})();`;

/**
 * Paralaje al desplazar.
 *
 * Nada de `background-attachment: fixed`: iOS lo ignora, y estas invitaciones
 * se abren casi siempre en el móvil. Aquí cada capa marcada se mueve por
 * `transform` una fracción de lo que se mueve su sección, que es lo que da la
 * sensación de fondo.
 *
 * Dos cuidados:
 *
 *  · La capa se agranda un poco y el desplazamiento se **limita** a ese
 *    sobrante, para que al moverse nunca asome el borde.
 *  · Sólo se recalculan las que están en pantalla, dentro de un
 *    `requestAnimationFrame`; si no, desplazarse en un móvil se vuelve una
 *    sucesión de tirones.
 *
 * Quien haya pedido menos movimiento en su sistema no ve nada de esto.
 */
const PARALLAX_JS = `
(function(){
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var capas = [].slice.call(document.querySelectorAll('[data-inv-px]'));
  if (!capas.length) return;

  var enPantalla = [];
  var pedido = false;

  function pintar(){
    pedido = false;
    var mitad = innerHeight / 2;
    for (var i = 0; i < enPantalla.length; i++) {
      var el = enPantalla[i];
      var caja = el.parentElement || el;
      var r = caja.getBoundingClientRect();
      var factor = parseFloat(el.getAttribute('data-inv-px')) || 0.2;
      var centro = r.top + r.height / 2 - mitad;
      var escala = parseFloat(el.getAttribute('data-inv-px-escala')) || 1;
      var tope = ((escala - 1) / 2) * (el.offsetHeight || r.height);
      var y = -centro * factor;
      if (y > tope) y = tope; else if (y < -tope) y = -tope;
      var fondo = el.getAttribute('data-inv-px-fondo');
      if (fondo) el.style.backgroundPosition = 'center calc(50% + ' + y.toFixed(1) + 'px)';
      else el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)' +
        (escala !== 1 ? ' scale(' + escala + ')' : '');
    }
  }

  function pedir(){ if (!pedido) { pedido = true; requestAnimationFrame(pintar); } }

  if (window.IntersectionObserver) {
    var obs = new IntersectionObserver(function(items){
      for (var i = 0; i < items.length; i++) {
        var el = items[i].target;
        var k = enPantalla.indexOf(el);
        if (items[i].isIntersecting) { if (k === -1) enPantalla.push(el); }
        else if (k > -1) enPantalla.splice(k, 1);
      }
      pedir();
    }, { rootMargin: '120px 0px' });
    for (var i = 0; i < capas.length; i++) obs.observe(capas[i]);
  } else {
    enPantalla = capas;
  }

  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);
  pedir();
})();`;

const HIDE_SPLASH_JS = `
(function(){
  var s = document.getElementById('splash') || document.querySelector('.splash');
  if(s) s.style.display = 'none';
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  var m = document.getElementById('main');
  if(m){ m.style.opacity = '1'; m.style.visibility = 'visible'; }
})();`;

/* ── medios ──────────────────────────────────────────────────── */

/**
 * Las fotos subidas se guardan como rutas relativas (`/api/media/…`). En el
 * editor la vista previa vive en un iframe con `srcdoc`, cuya URL base es
 * `about:srcdoc`, así que ahí las rutas relativas no resuelven: hay que
 * volverlas absolutas antes de renderizar.
 */
export function withAbsoluteMedia(data: InvitationData, origin: string): InvitationData {
  /*
   * Recorre a cualquier profundidad, y eso importa.
   *
   * Antes bajaba dos niveles —sección y, si era una lista, sus elementos— y
   * con eso bastaba mientras todo vivía en secciones planas. Los bloques
   * agregados guardan lo suyo en `layout.blocks[].data`, que son tres
   * niveles, así que la foto de un bloque de Foto y el archivo de un bloque
   * de Vídeo se quedaban relativos y no se veían en la vista previa: el
   * mismo fallo de las fotos que ya se arregló una vez, por otro camino.
   */
  const camina = (v: unknown): unknown => {
    if (typeof v === "string") {
      return v.startsWith("/api/media/") ? `${origin}${v}` : v;
    }
    if (Array.isArray(v)) return v.map(camina);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, camina(x)]));
    }
    return v;
  };

  return camina(data) as InvitationData;
}

/* ── render ──────────────────────────────────────────────────── */

/**
 * Un solo bloque, suelto, para la biblioteca de componentes.
 *
 * Se dibuja la invitación entera con la variante pedida —es la única forma de
 * que el bloque salga con la paleta, la letra y las clases del diseño— y
 * después se recorta: se conserva la cabecera del documento y en el cuerpo se
 * deja únicamente esa sección. Así el editor puede enseñar las diez opciones
 * una al lado de otra, cada una como se va a ver de verdad.
 */
export function renderBloque(
  opts: RenderOptions,
  tipo: string,
  varianteId: string,
  blockId: string
): string {
  const capa = JSON.parse(JSON.stringify(opts.data)) as InvitationData;
  if (tipo === "hero") {
    // La portada no tiene variante de bloque: su forma es un campo suyo.
    capa.hero = { ...(capa.hero || {}), disposicion: varianteId };
  } else {
    capa.layout = {
      blocks: readLayout(capa).map((b) =>
        b.id === blockId ? { ...b, variant: varianteId } : b
      ),
    };
  }

  const completo = renderInvitation({ ...opts, data: capa, preview: true });
  const { document } = parseHTML(completo);

  const spec = BLOCK_BY_TYPE[tipo];
  const clave = spec?.section || tipo;
  const seccion =
    document.querySelector(`#inv-${blockId}`) ||
    document.querySelector(`.inv-block-${tipo}`) ||
    pick(document as unknown as El, mapFor(opts.templateId).sections[clave] || []);
  if (!seccion) return "";

  // Los scripts se conservan —son los que mueven el reloj, también el del
  // propio diseño— pero envueltos: aquí falta casi toda la página, así que
  // cualquiera de ellos se va a topar con un elemento que ya no existe y no
  // debe por eso dejar de andar el resto.
  const scripts = Array.from(document.querySelectorAll("script"))
    .map((s) => `<script>try{${s.textContent || ""}}catch(e){}</script>`)
    .join("");
  const cuerpo = document.querySelector("body");
  const clases = cuerpo?.getAttribute("class") || "";
  const estilo = cuerpo?.getAttribute("style") || "";

  return (
    `<!DOCTYPE html><html lang="es"><head>${document.querySelector("head")?.innerHTML || ""}` +
    `<style>body{margin:0}.reveal{opacity:1!important;transform:none!important}</style>` +
    `</head><body class="${clases}" style="${estilo}">${(seccion as El).outerHTML}${scripts}</body></html>`
  );
}

export function renderInvitation(opts: RenderOptions): string {
  const { templateId, data, slug = "", preview = false } = opts;
  const map = mapFor(templateId);

  const iso = String(data.event?.date || "");
  const { document } = parseHTML(rewriteCountdown(opts.templateHtml, iso));

  const extraCss: string[] = [];
  const colorCss: string[] = [];
  const fontCss: string[] = [];
  const fontIds = new Set<string>();

  /** Junta las reglas de tipografía de una sección (o del ámbito global). */
  const collectFonts = (
    spec: (typeof SPEC)[number],
    scopeSel: string | undefined,
    root: El,
    section: InvitationData[string]
  ) => {
    const elegidas = (section?.fonts || {}) as Record<string, string>;
    for (const field of spec.fields) {
      const font = FONT_BY_ID[elegidas[field.key] || ""];
      if (!font) continue;
      const path = `${spec.key}.${field.key}`;
      const ops = map.fields[FONT_ALIAS[path] || path];
      if (!ops) continue;
      const reglas = fontRules(scopeSel, root, ops, font.css);
      if (reglas.length) {
        fontCss.push(...reglas);
        fontIds.add(font.id);
      }
    }

    // Campos de las listas repetibles. La regla sale del selector del campo,
    // que es el mismo en todas las fichas: la tipografía se comparte, que es
    // lo que se quiere (una letra por invitado no tendría sentido).
    const lb = spec.list ? map.lists[spec.key] : undefined;
    if (!lb) return;
    const container = pick(root, lb.container);
    const ficha = container ? pick(container, lb.item) : null;
    if (!ficha) return;
    const fichaSel = [scopeSel, pickWithSel(container!, lb.item)?.[1]]
      .filter(Boolean)
      .join(" ");

    for (const f of spec.list!.fields) {
      const font = FONT_BY_ID[elegidas[`items.${f.key}`] || ""];
      if (!font) continue;
      const reglas = fontRules(scopeSel, ficha, lb.fields[f.key] || [], font.css, fichaSel);
      if (reglas.length) {
        fontCss.push(...reglas);
        fontIds.add(font.id);
      }
    }
  };
  const ctx: Ctx = {
    name1: String(data.event?.name1 || "").trim(),
    name2: String(data.event?.name2 || "").trim(),
    css: extraCss,
    heroDisposicion: String(data.hero?.disposicion || ""),
    peso: pesoIconos(designOf(templateId)),
  };

  const deadline = String(data.confirm?.deadlineText || "").trim() || formatDateLong(iso);
  const confirmText = String(data.confirm?.text || "").trim();

  /** Valores compuestos que no salen tal cual del formulario. */
  const derived: Record<string, string> = {
    /* El botón de la portada no desaparece si se vacía su texto.
       La regla general —un campo vacío se borra para no dejar un hueco— es la
       correcta para un antetítulo, pero aquí deja la portada sin salida: es lo
       único que invita a bajar, y quien edita puede vaciarlo sin darse cuenta
       de que se lleva el botón. */
    "hero.cta": String(data.hero?.cta || "").trim() || "Ver la invitación",
    "event.names": coupleName(data),
    "event.dateLabel": resolvedDateLabel(data),
    "event.quote": String(data.event?.quote || ""),
    "footer.dateLine":
      String(data.footer?.dateLine || "").trim() ||
      [resolvedDateLabel(data), String(data.event?.city || "")].filter(Boolean).join(" · "),
    "confirm.text": confirmText
      ? deadline
        ? `${escapeHtml(confirmText)} <strong>${escapeHtml(deadline)}</strong>.`
        : escapeHtml(confirmText)
      : "",
  };

  const sectionOn = (key: string) => {
    const spec = SPEC.find((s) => s.key === key);
    if (!spec?.optional) return true;
    if (key === "splash" && preview) return false;
    return data[key]?.enabled !== false;
  };

  /* 1 · Quitar las secciones apagadas (y su ola decorativa) */
  for (const spec of SPEC) {
    if (!spec.optional || sectionOn(spec.key)) continue;
    for (const el of pickAll(document, map.sections[spec.key] || [])) {
      ocultar(divisorDe(el));
      ocultar(el);
    }
  }

  /* 2 · Campos globales, que viven en varias secciones a la vez */
  for (const key of ["event.names", "event.dateLabel", "event.quote"]) {
    for (const op of map.fields[key] || []) applyOp(document.body, op, derived[key] ?? "", ctx);
  }

  const eventSpec = SPEC.find((sp) => sp.key === "event");
  if (eventSpec) collectFonts(eventSpec, "body", document.body, data.event);

  /* 3 · Bloques: resolver, sintetizar los que usan variante propia, ordenar */

  // El splash, la portada y el pie son estructura: se editan igual que todo lo
  // demás pero no entran en el reordenamiento.
  const fijos: Resuelto[] = [];
  for (const key of ["splash", "hero", "footer"]) {
    if (!sectionOn(key) || !data[key]) continue;
    const found = pickWithSel(document, map.sections[key] || []);
    if (!found) continue;
    fijos.push({
      block: { id: key, type: key, variant: "" },
      el: found[0], sel: found[1], key, data: data[key], sintetizado: false,
    });
  }

  const hero = pick(document, map.sections.hero || []);
  const { padre, ancla } = flujo(document, hero);
  const usados = new Set<string>();
  const resueltos: Resuelto[] = [];
  let sintetizados = 0;

  for (const block of readLayout(data)) {
    const spec = BLOCK_BY_TYPE[block.type];
    if (!spec) continue;

    // De dónde salen los datos: de la sección del esquema para el primer
    // bloque de su tipo, del propio bloque para los que se agregaron después.
    const primero = !usados.has(block.type);
    usados.add(block.type);
    const sectionKey = spec.section || block.type;
    const blockData = (primero && spec.section ? data[sectionKey] : block.data) || {};
    if (blockData.enabled === false) continue;

    const variante = variantOf(spec, block.variant) || spec.variants[0];
    const propia = primero && !!spec.section && !variante.build;

    if (propia) {
      const found = pickWithSel(document, map.sections[sectionKey] || []);
      if (found) {
        resueltos.push({
          block, el: found[0], sel: found[1], key: sectionKey,
          data: blockData, sintetizado: false,
        });
        continue;
      }
      // El diseño no trae esta sección: en vez de saltarse el bloque se dibuja
      // con la primera variante propia, para que ninguno quede inutilizable
      // por el template que se haya elegido.
    }

    // Marcado nuestro, con las clases canónicas para que lo estilice el CSS
    // del template. Si el bloque sustituye a una sección que existe, la
    // original se quita.
    if (primero && spec.section) {
      const original = pick(document, map.sections[sectionKey] || []);
      if (original) { ocultar(divisorDe(original)); ocultar(original); }
    }
    const armar = variante.build || spec.variants.find((v) => v.build)?.build;
    if (!armar) continue;

    const seccion = document.createElement("section");
    seccion.setAttribute("id", `inv-${block.id}`);
    seccion.setAttribute(
      "class",
      `inv-block inv-block-${block.type} inv-v-${variante.id || "propia"} reveal`
    );
    // Las variantes a sangre no llevan el contenedor que limita el ancho.
    seccion.innerHTML = variante.bare ? armar() : `<div class="container">${armar()}</div>`;
    padre.appendChild(seccion);
    sintetizados += 1;
    resueltos.push({
      block, el: seccion, sel: `#inv-${block.id}`, key: sectionKey,
      data: blockData, sintetizado: true,
    });
  }

  /* Reordenar: cada sección se vuelve a colgar en el orden del layout,
     arrastrando consigo su divisor decorativo. La portada y el pie no se
     mueven, son la estructura.

     El tope es el pie; si el diseño no tiene (Vintage), el primer <script>
     del final. Sin eso las secciones quedaban DESPUÉS de los scripts y el
     del template no encontraba sus elementos al arrancar. */
  const pie = pick(document, map.sections.footer || []);
  const tope: El | null =
    pie && pie.parentNode === padre
      ? pie
      : (Array.from(padre.children) as El[]).find(
          (c) => c.tagName?.toLowerCase() === "script"
        ) || null;

  for (const r of resueltos) {
    const divisor = r.sintetizado ? null : divisorDe(r.el);
    if (divisor) padre.insertBefore(divisor, tope);
    padre.insertBefore(r.el, tope);
  }
  if (ancla && ancla.parentNode === padre) padre.insertBefore(ancla, padre.firstChild);

  /* 3 · bis · El botón de la portada apunta a la primera sección visible.
     El esqueleto lo deja en `#countdown`, y si esa sección está apagada el
     botón queda vivo pero no lleva a ningún sitio: para quien lo pulsa es lo
     mismo que si no estuviera. Aquí ya se sabe qué secciones quedaron y en
     qué orden, así que se apunta a la primera de verdad. */
  {
    const btn = hero?.querySelector?.(".hero-btn") as El | null;
    if (btn && (btn.getAttribute("href") || "").startsWith("#")) {
      const visible = resueltos.find((r) => {
        const id = r.el.getAttribute?.("id");
        return id && r.el.getAttribute?.("hidden") === null;
      });
      const destino =
        visible?.el.getAttribute("id") ||
        pick(document, map.sections.footer || [])?.getAttribute?.("id");
      /* Sin ninguna sección debajo —todas apagadas— el botón deja de ser un
         enlace y pasa a ser sólo texto: mejor eso que un enlace muerto. */
      if (destino) btn.setAttribute("href", `#${destino}`);
      else btn.removeAttribute("href");
    }
  }

  /* 3 · ter · El botón del mapa en el velo de bienvenida.
     Era un segundo "Confirmar asistencia" que sólo entraba a la invitación,
     como el primero. Ahora abre la ubicación en Google Maps, y sin link no
     tiene nada que abrir: se esconde en lugar de quedarse como un botón que
     no hace nada. */
  {
    const btn = document.querySelector(".splash-btn-mapa") as El | null;
    const link = String(data.splash?.mapUrl || "").trim();
    if (btn && !/^https?:\/\//i.test(link)) ocultar(btn);
  }

  /* 3a · Los adornos de la portada ya no se tocan.
     Aquí había un paso que, en los diseños de boda, escondía todo lo que
     pareciera decoración de la portada: ornamentos, iniciales, marcas de
     agua y cualquier svg suelto, con tres listas de clases y una regla para
     distinguir "el marco es la pieza" de "el marco es un adorno". Existía
     porque los diseños hechos a mano traían adornos que nadie había
     decidido y que estorbaban a la foto.

     Ahora la decoración de la portada la declara cada diseño en su `deco`,
     y si estorba se quita de ahí. Esconder a posteriori lo que el diseño
     acaba de dibujar era pelearse consigo mismo. */

  /* 3b · El hueco donde va el nombre de quien abre su link personalizado.
     Se deja escondido; lo llena y lo muestra el script del RSVP cuando la
     dirección trae `?invitado=`. En la sección de invitados, que es donde se
     espera leer el propio nombre. */
  {
    const seccion = [...fijos, ...resueltos].find((r) => r.key === "guests");
    const bruto = data.guests?.saludoInvitado;
    const plantilla =
      bruto === undefined ? "Con mucho cariño para {nombre}" : String(bruto).trim();
    if (seccion && plantilla) {
      const caja = (seccion.el.querySelector(".container") || seccion.el) as El;
      const bloque = document.createElement("div");
      bloque.setAttribute("class", "inv-invitados");
      bloque.setAttribute("data-inv-invitado", plantilla);
      bloque.setAttribute("hidden", "");
      // En el editor se enseña con nombres de muestra: si no, quien está
      // armando la invitación no vería nunca esta parte.
      if (preview) bloque.setAttribute("data-inv-demo", "Ana Gómez, Carlos Gómez");
      bloque.innerHTML =
        '<p class="inv-inv-antes"></p>' +
        '<p class="inv-inv-nombres"></p>' +
        '<p class="inv-inv-despues"></p>' +
        '<span class="inv-inv-filete"></span>';
      // Después del último encabezado de la sección, no del primero: casi
      // todos los diseños llevan antetítulo y título, y colarse entre los dos
      // deja un orden raro.
      const encabezados = (Array.from(
        caja.querySelectorAll(
          "h1, h2, h3, .section-label, .sec-label, .section-title, .sec-title, .guests-title"
        )
      ) as El[]).filter((e) => e.parentNode === caja);
      const ultimo = encabezados[encabezados.length - 1];
      if (ultimo) caja.insertBefore(bloque, ultimo.nextSibling);
      else caja.insertBefore(bloque, caja.firstChild);
    }
  }

  /* 3c · Los huecos de foto que trae el diseño dicen "Foto 1" y poco más.
     Se les pone una cámara dibujada delante, la misma que usan los bloques
     nuestros, para que se entienda de un vistazo que ahí va una foto. */
  for (const hueco of Array.from(document.querySelectorAll(".gallery-ph")) as El[]) {
    if (hueco.querySelector(".inv-ico")) continue;
    const texto = hueco.querySelector(".gallery-ph-text") || hueco;
    // Si ya tiene foto puesta no hace falta invitar a subir ninguna.
    if ((hueco.getAttribute("style") || "").includes("background-image")) continue;
    const etiqueta = (texto.textContent || "").trim();
    texto.innerHTML = `${iconoHtml("camara", ctx.peso)}<b>${etiqueta || "Tu foto"}</b>`;
  }

  /* 4 · Campos y listas de cada bloque */
  for (const r of [...fijos, ...resueltos]) {
    const spec = SECTION_BY_KEY[r.key];
    const blockSpec = BLOCK_BY_TYPE[r.block.type];
    const campos = spec?.fields || blockSpec?.fields || [];
    const sectionData = r.data;
    const root = r.el;
    const sectionSel = r.sel;
    ctx.sectionSel = sectionSel;

    // Color de letras de la sección. Va con !important porque varios diseños
    // usan selectores más específicos que cualquier regla que inyectemos
    // (`#guests .section-title`), y esto es una decisión explícita de quien
    // edita: tiene que ganarle al diseño. Botones, enlaces y campos de
    // formulario quedan fuera para no romper su contraste.
    const color = String(sectionData.textColor || "").trim();
    if (color && HEX.test(color)) {
      colorCss.push(
        `${sectionSel},${sectionSel} *:not(a):not(button):not(input):not(select):not(textarea)` +
          `{color:${color} !important}`
      );
    }

    // El fondo va detrás de todo y los adornos donde el organizador diga.
    ponerFondo(root, sectionData, sectionSel, ctx);
    ponerAdornos(root, sectionData, sectionSel, ctx);

    /* Un bloque de vídeo sin vídeo se esconde, y entonces no hay nada más
       que escribirle dentro. */
    if (r.block.type === "video" && !ponerVideo(root, sectionData)) continue;

    if (spec) collectFonts(spec, sectionSel, root, sectionData);

    const calculados = deriveSection(r.key, sectionData);

    for (const field of campos) {
      const path = `${r.key}.${field.key}`;
      const ops = map.fields[path];
      // Los calculados se aplican aparte, con su valor ya resuelto.
      if (!ops || field.key in calculados) continue;
      const value = derived[path] ?? String(sectionData[field.key] ?? "");
      for (const op of ops) applyOp(root, op, value, ctx);
    }

    for (const [clave, valor] of Object.entries(calculados)) {
      for (const op of map.fields[`${r.key}.${clave}`] || []) applyOp(root, op, valor, ctx);
    }

    const listBinding = map.lists[r.key];
    if (r.key === "guests" && listBinding) {
      // La rejilla de invitados de cada diseño viene con nombres de ejemplo.
      // Se vacía siempre: aquí el nombre es el de quien abre su enlace.
      applyList(root, r.key, listBinding, [], ctx);
    } else if ((spec?.list || blockSpec?.list) && listBinding) {
      applyList(root, r.key, listBinding, (sectionData.items as Record<string, string>[]) || [], ctx);
    }
  }

  /* La caja de "transferencia bancaria" sin número es un recuadro vacío:
     si no hay cuenta, se va con etiqueta y todo. */
  if (!String(data.gifts?.account || "").trim()) {
    const regalos = pick(document, map.sections.gifts || []);
    for (const caja of pickAll(regalos || document.body, [".gifts-account", ".gifts-accounts"])) {
      caja.remove();
    }
  }

  /* 5 · RSVP — sobre el bloque que quedó, sea el del diseño o el nuestro */
  const confirmSection = resueltos.find((r) => r.key === "confirm")?.el || null;
  if (confirmSection) wireRsvp(document, confirmSection, data, slug, preview);

  /* 5 · Título de la pestaña y vista previa al compartir */
  const nombres = coupleName(data) || "Invitación";
  const titleEl = document.querySelector("title");
  if (titleEl) titleEl.textContent = nombres;

  /* Una invitación se reparte por WhatsApp, y ahí un enlace sin Open Graph
     sale como texto pelado.

     Los tres datos que se ven en esa tarjeta —la foto, el título en negrita y
     la línea gris de debajo— son los tres que la sección "Al compartir" deja
     elegir. Lo que no se puede es poner texto **encima** de la foto: WhatsApp
     muestra una imagen estática, así que habría que componerla en el
     servidor, y `sharp` no dibuja texto en la imagen de producción porque
     `node:22-slim` no trae fuentes ni fontconfig (comprobado: el texto sale
     en blanco). La foto va tal cual se subió. */
  if (!preview && opts.origin) {
    const absoluta = (u: string) =>
      /^https?:/.test(u) ? u : `${opts.origin}${u.startsWith("/") ? "" : "/"}${u}`;

    const compartir = data.compartir || {};

    /* Cada campo cae en lo que se mostraba antes de que la sección existiera,
       así que una invitación que no la toque se comparte igual que siempre. */
    const elegida = String(compartir.imagen || "").trim();
    const portada = String(data.hero?.backgroundUrl || "").trim();
    const primeraFoto = ((data.gallery?.items as { url?: string }[]) || []).find(
      (i) => (i?.url || "").trim()
    )?.url;
    const imagen = elegida || portada || primeraFoto || "";

    const cuando = resolvedDateLabel(data);
    const donde = String(data.event?.city || "").trim();
    const descripcion =
      String(compartir.texto || "").trim() ||
      [cuando, donde].filter(Boolean).join(" · ") ||
      String(data.event?.quote || "").trim();

    const titulo = String(compartir.titulo || "").trim() || nombres;

    const meta: [string, string][] = [
      ["og:type", "website"],
      ["og:title", titulo],
      ["og:description", descripcion],
      ["og:locale", "es_ES"],
    ];
    if (slug) meta.push(["og:url", absoluta(`/${slug}`)]);
    if (imagen) {
      /* Tal cual se subió, sin `?w=`.
         Pedir un ancho la reconvierte —y como los rastreadores no mandan
         `Accept: image/webp`, sale JPEG: un PNG con transparencia acabaría
         con el fondo en negro justo en la imagen que representa la
         invitación. El navegador ya la reduce a 2000px al subirla, así que la
         original no es un archivo desmedido. */
      meta.push(["og:image", absoluta(imagen)]);
      meta.push(["og:image:alt", titulo]);
    }

    /* Los ángulos se quitan y no se escapan. linkedom escapa las comillas al
       serializar —así que nadie se sale del atributo— pero deja `<` y `>`
       crudos, y eso no es HTML estrictamente válido. Pre-escaparlos aquí
       haría que el `&` saliera doble (`&amp;amp;`), así que se quitan: en el
       nombre de una pareja no tienen sitio. */
    const limpio = (t: string) => t.replace(/[<>]/g, "").trim().slice(0, 300);

    for (const [prop, contenido] of meta) {
      const valor = limpio(contenido);
      if (!valor) continue;
      const m = document.createElement("meta");
      m.setAttribute("property", prop);
      m.setAttribute("content", valor);
      document.head.appendChild(m);
    }
    /* Twitter usa `name` en vez de `property` y no lee las de Open Graph. */
    const tarjeta = document.createElement("meta");
    tarjeta.setAttribute("name", "twitter:card");
    tarjeta.setAttribute("content", imagen ? "summary_large_image" : "summary");
    document.head.appendChild(tarjeta);
  }

  /* 5 bis · La marca de agua, encima de todo.
     Su razón de ser es que un borrador no se pueda repartir como si fuera el
     final, así que va sobre el contenido y no detrás: detrás la tapa la
     primera foto de portada a pantalla completa.

     Y hay que decirlo sin adornos: esto **no** es infalible. Es una página
     web, y quien abra el inspector la borra en diez segundos. Lo que evita es
     que un cliente mande el borrador por WhatsApp como si estuviera pagado, y
     deja claro de quién es el trabajo. Para lo otro no hay solución en el
     navegador. */
  {
    const m = data.marca || {};
    /* Al contrario que las demás secciones, ésta está apagada salvo que se
       diga que sí: una marca de agua que aparece por defecto sería un
       desastre en la invitación que alguien entrega. */
    const encendida = m.enabled === true;
    const imagen = String(m.imagen || "").trim();
    const texto = String(m.texto || "").trim();

    if (encendida && (imagen || texto)) {
      const disp = ["repetida", "centro", "esquina"].includes(String(m.disposicion))
        ? String(m.disposicion)
        : "repetida";
      const tamano = Math.min(400, Math.max(40, Number(m.tamano) || 120));
      const opacidad = Math.min(60, Math.max(3, Number(m.opacidad) || 12)) / 100;
      const color = HEX.test(String(m.color || "").trim())
        ? String(m.color).trim()
        : "var(--inv-ink, currentColor)";

      const capa = document.createElement("div");
      capa.setAttribute("class", "inv-marca");
      capa.setAttribute("data-disp", disp);
      capa.setAttribute("aria-hidden", "true");

      const pieza = () => {
        if (imagen) {
          const img = document.createElement("img");
          setImage(img, imagen, false, 800);
          img.setAttribute("alt", "");
          return img;
        }
        const sp = document.createElement("span");
        sp.textContent = texto;
        return sp;
      };

      if (disp === "repetida") {
        /* Un lienzo girado y más grande que la pantalla, con las copias
           dentro: girar un fondo repetido no se puede, girar la caja que lo
           contiene sí. Cuántas copias no se sabe aquí —el tamaño de la
           pantalla se conoce en el navegador— así que se emiten las que
           caben en la más grande razonable, y `overflow:hidden` recorta el
           resto. Son spans, no un SVG de fondo, para que use la tipografía
           del diseño: un SVG en `background-image` es un documento aislado y
           no ve las fuentes de la página. */
        const rejilla = document.createElement("div");
        rejilla.setAttribute("class", "inv-marca-rejilla");
        const cuantas = Math.min(240, Math.max(24, Math.ceil((2600 / tamano) * (2000 / tamano))));
        for (let i = 0; i < cuantas; i++) rejilla.appendChild(pieza());
        capa.appendChild(rejilla);
      } else {
        capa.appendChild(pieza());
      }

      document.body.appendChild(capa);

      ctx.css.push(
        /* Por encima del velo de bienvenida, que va en 9999: si no, la
           primera pantalla —la que más se comparte— saldría sin marca. */
        `.inv-marca{position:fixed;inset:0;z-index:10000;overflow:hidden;` +
          /* Sin esto la capa se come todos los clics de la invitación: los
             botones, el formulario de confirmación, los controles del vídeo. */
          `pointer-events:none;opacity:${opacidad};color:${color};` +
          `font-family:var(--inv-font-title,serif);text-transform:uppercase;` +
          `letter-spacing:.18em;line-height:1;white-space:nowrap}`,
        `.inv-marca img{display:block;width:${tamano}px;height:auto;max-width:none}`,
        `.inv-marca span{display:block;font-size:${Math.round(tamano / 5.5)}px}`,

        `.inv-marca[data-disp="repetida"] .inv-marca-rejilla{position:absolute;` +
          `top:-50%;left:-50%;width:200%;height:200%;transform:rotate(-30deg);` +
          `display:grid;grid-template-columns:repeat(auto-fill,minmax(${tamano}px,1fr));` +
          `align-content:start;gap:${Math.round(tamano * 0.55)}px ${Math.round(tamano * 0.5)}px;` +
          `place-items:center}`,

        `.inv-marca[data-disp="centro"]{display:grid;place-items:center}`,
        `.inv-marca[data-disp="centro"]>*{transform:rotate(-30deg) scale(2.2)}`,

        `.inv-marca[data-disp="esquina"]{display:grid;place-items:end;` +
          `padding:18px 20px}`
      );
    }
  }

  /* 6 · Estilos y scripts inyectados */
  // Aquí se inyectaban las variables `--inv-*` que alimentan los componentes
  // propios (la confirmación, los bloques con marcado nuestro), leídas de
  // `tokens.generated.ts` —1952 líneas que salían de abrir los 27 diseños en
  // Chromium y muestrear los estilos ya calculados de sus controles.
  //
  // Ahora las emite el propio CSS del diseño, con los valores que el tema
  // declara. Muestrear traía sus propios bugs: el acento de Blanco Oro salía
  // casi blanco y los números de la cuenta atrás desaparecían; la tinta sobre
  // el acento de Burdeos salía crema sobre oro. Había una guarda de contraste
  // para cada caso. Los pares se verifican ahora en `templates:build`.

  /* ── La paleta elegida ──
     El template se horneó con la paleta por defecto del diseño. Si la
     invitación pide otra, se reinyectan sus variables: todo el CSS del
     diseño se apoya en ellas (`var(--bg)`, `var(--brand)`…), así que una
     regla posterior en el mismo `<style>` las reemplaza sin regenerar nada.
     Es lo que evita que 42 diseños × 4 paletas sean 168 archivos. */
  const paletaCss = (() => {
    const d = designOf(templateId);
    /* Una invitación guardada como "globos-niño" no tiene campo de paleta:
       la elección estaba en el id del template. Se recupera de ahí, o se
       abriría en rosa. */
    const pedida =
      String(data.event?.paleta || "").trim() || PALETA_POR_ID_VIEJO[templateId] || "";
    if (!d || !pedida || pedida === d.palettes[0].id) return "";
    if (!d.palettes.some((p) => p.id === pedida)) return "";
    return variablesDePaleta(piel(d, pedida));
  })();

  const style = document.createElement("style");
  // El color elegido va después de todo, para poder ganarle al velo de la foto.
  style.textContent = [paletaCss, INJECTED_CSS, ...extraCss, ...fontCss, ...colorCss].join("\n");

  const href = googleHref([...fontIds]);
  if (href) {
    const link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", href);
    document.head.appendChild(link);
  }
  document.head.appendChild(style);

  const scripts: string[] = [];
  if (!sectionOn("splash")) scripts.push(HIDE_SPLASH_JS);
  const musicUrl = String(data.splash?.musicUrl || "");
  if (musicUrl && !preview) scripts.push(musicJs(musicUrl));
  if (confirmSection) scripts.push(RSVP_JS);
  // Cada template actualiza su cuenta atrás con sus propios ids; los bloques
  // con marcado nuestro necesitan el suyo, que busca por [data-cd].
  if (document.querySelector("[data-cd]")) scripts.push(countdownJs(iso));
  if (document.querySelector("[data-inv-px]")) scripts.push(PARALLAX_JS);
  if (scripts.length) {
    const s = document.createElement("script");
    s.textContent = scripts.join("\n");
    document.body.appendChild(s);
  }

  return `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
}
