/**
 * Renderer: template HTML estático + datos canónicos → HTML final.
 *
 * No reescribimos los templates: los parseamos con linkedom y aplicamos
 * las operaciones declaradas en `bindings.ts` (poner texto, repartir la
 * fecha entre spans, clonar/recortar listas, quitar secciones apagadas,
 * cablear el RSVP y la cuenta atrás).
 */

import { parseHTML } from "linkedom";
import {
  ABANICO_JS, AGENDAR_JS, ANILLOS_JS, CAPITULOS_JS, CARRUSEL_JS, CIELO_JS, COMPONENTES_CSS, CONFETI_JS,
  CONSTELACION_JS, DESEO_JS, FUGAZ_JS, LIBRO_JS, NUBES_JS, POLVO_JS, RASCA_JS, SENDERO_JS, SOBRE_JS, TELON_JS, VIAJE_JS, VENTANA_JS, CLAQUETA_JS, LLEGAN_JS, MARIPOSA_JS, ESCARCHA_JS, NAIPE_JS,
  VOLTEA_JS,
} from "./componentes";
import { sanearHtml } from "./sanear";
import { mapFor, type ListBinding, type Op } from "./bindings";
import { BLOCK_BY_TYPE, readLayout, variantOf, type Block } from "./blocks";
import { FONT_BY_ID, googleHref } from "./fonts";
import { pesoIconos } from "./design/designs";
import { ANCHOS } from "./storage";
import { variablesDePaleta } from "./design/css";
import { adornosDeclarados, alpha } from "./design/theme";
import { piel } from "./design/theme";
import { iconoHtml, type Peso } from "./iconos";
import { FONT_ALIAS, fontableOp } from "./support";
import { PALETA_POR_ID_VIEJO, TEMPLATE_BY_ID, designOf } from "./templates";
import {
  HERO_POR_ID,
  SECTION_BY_KEY,
  SITIOS,
  SECTIONS as SPEC,
  ANIMACIONES,
  ANIM_FICHAS_VALIDAS,
  ENTRADAS_SECCION_VALIDAS,
  RADIO_BOTON,
  ANIM_POR_PARTES,
  CSS_ALINEACION,
  PARTICULA_POR_TIPO,
  coupleName,
  esVideoUrl,
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
  /**
   * Cuántas personas caben en el enlace por el que se entró: los «pases».
   *
   * Viene del link personalizado (`&g=`), no de la dirección: el número lo
   * pone quien invita y el invitado no puede subirlo escribiendo en la barra.
   * Sin link, o con un link sin límite, es `null` y la confirmación se
   * comporta como siempre.
   */
  pases?: number | null;
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
/**
 * Las reglas de un campo, con la declaración que se le pase.
 *
 * Empezó resolviendo sólo tipografías y ahora sirve también para el color:
 * lo difícil aquí nunca fue la propiedad, era **encontrar a quién se le
 * aplica** — un campo puede escribirse en varios sitios a la vez y sus
 * selectores dependen del diseño. Eso es lo que no había que duplicar.
 */
function fontRules(
  scopeSel: string | undefined,
  root: El,
  ops: Op[],
  /** La declaración completa, sin llaves: `font-family:X` o `color:Y`. */
  declaracion: string,
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

    if (sels.length) out.push(`${sels.join(",")}{${declaracion} !important}`);
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

/* ── partículas sobre toda la invitación ─────────────────────── */

/**
 * El dibujo de cada clase de partícula.
 *
 * Se dibujan aquí y no se piden a una librería, por dos razones que son del
 * proyecto y no del gusto: nada en una invitación publicada le pide un
 * archivo a un tercero —hay una auditoría que falla si lo hace— y el peso
 * importa hasta el punto de que las fuentes se piden peso por peso. Una
 * librería de partículas trae el motor, no las mariposas: las formas hay que
 * dárselas igual, así que lo que se ahorraría es la física, y aquí la física
 * son dos `@keyframes`.
 *
 * Nueve salen del juego de iconos que ya está vendorizado. Las otras tres
 * —pétalo, mariposa y burbuja— son geometría: un pétalo es una hoja con los
 * dos extremos en punta, una mariposa son dos alas que baten, y una burbuja
 * es un círculo con un brillo descentrado.
 */
const FORMA_PARTICULA: Record<string, (color: string, peso: Peso) => string> = {
  petalos: (c) =>
    `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">` +
    `<path d="M12 2c5 4 7 8 7 11a7 7 0 0 1-14 0c0-3 2-7 7-11z" fill="${c}"/>` +
    `<path d="M12 5c0 6 0 10 0 15" stroke="rgba(255,255,255,.35)" stroke-width="1"/></svg>`,
  /* Dos pares de alas que baten. El aleteo lo pone el CSS sobre cada mitad —
     es la única parte de todo esto que una librería tampoco resolvería, porque
     lo que falta ahí es el dibujo, no la física.

     Cada lado va agrupado con su ala de arriba y la de abajo: batiendo por
     separado se leería como cuatro aletas y no como una mariposa. Y el par de
     arriba es bastante mayor que el de abajo, que es lo que distingue una
     mariposa de un brote de dos hojas. */
  mariposas: (c) =>
    `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">` +
    `<g class="inv-pt-ala inv-pt-ala-i" fill="${c}">` +
      `<path d="M11.4 11.2C8.6 2.9 1.2 2.2 1.2 7.6c0 4.2 5 6.4 10.2 4.6z"/>` +
      `<path d="M11.4 13C9 19.9 3.3 21 3.3 16.7c0-3 3.9-4.6 8.1-4z" opacity=".78"/>` +
    `</g>` +
    `<g class="inv-pt-ala inv-pt-ala-d" fill="${c}">` +
      `<path d="M12.6 11.2C15.4 2.9 22.8 2.2 22.8 7.6c0 4.2-5 6.4-10.2 4.6z"/>` +
      `<path d="M12.6 13C15 19.9 20.7 21 20.7 16.7c0-3-3.9-4.6-8.1-4z" opacity=".78"/>` +
    `</g>` +
    `<path d="M12 7.6v9" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<path d="M12 7.6c-.6-1.5-1.8-2.4-3-2.8M12 7.6c.6-1.5 1.8-2.4 3-2.8" ` +
      `stroke="${c}" stroke-width=".9" stroke-linecap="round"/></svg>`,
  burbujas: (c) =>
    `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">` +
    `<circle cx="12" cy="12" r="9" fill="${c}" opacity=".28"/>` +
    `<circle cx="12" cy="12" r="9" stroke="${c}" stroke-width="1.1"/>` +
    `<circle cx="8.5" cy="8.5" r="2.2" fill="#fff" opacity=".55"/></svg>`,
  nieve: (c) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="${c}"/></svg>`,
  confeti: (c) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true">` +
    `<rect x="8" y="3" width="8" height="18" rx="2" fill="${c}"/></svg>`,
  luciernagas: (c) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true">` +
    `<circle cx="12" cy="12" r="4" fill="${c}"/>` +
    `<circle cx="12" cy="12" r="9" fill="${c}" opacity=".22"/></svg>`,
  /* Los iconos se pintan con `currentColor`, así que el color se lo pone la
     pieza que los envuelve y no hace falta pasárselo. */
  hojas: (_c, p) => iconoHtml("hoja", p),
  corazones: (_c, p) => iconoHtml("corazon", p),
  estrellas: (_c, p) => iconoHtml("estrella", p),
  destellos: (_c, p) => iconoHtml("brillo", p),
  globos: (_c, p) => iconoHtml("globo", p),
  notas: (_c, p) => iconoHtml("musica", p),
};

/**
 * Un número estable entre 0 y 1 a partir de dos enteros.
 *
 * Estable y no aleatorio a propósito: el HTML se genera en el servidor y se
 * vuelve a generar en cada vista previa, así que con `Math.random` la misma
 * invitación saldría distinta cada vez — las capturas y las pruebas de
 * marcado no podrían comparar nada, y cada tecla en el editor movería todos
 * los pétalos de sitio. Esparcido, pero siempre el mismo esparcido.
 */
function disperso(i: number, sal: number): number {
  const n = Math.sin(i * 12.9898 + sal * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * La capa de partículas, fija sobre toda la invitación.
 *
 * `pointer-events:none` no es un detalle de estilo: es una capa que cubre la
 * pantalla entera, y sin eso la invitación deja de responder — no se puede
 * ni entrar por el velo. Es exactamente el fallo que la marca de agua ya tuvo
 * y que su auditoría vigila desde entonces.
 */
function ponerParticulas(document: Doc, data: InvitationData) {
  const d = data.particulas || {};
  if (d.enabled === false) return;

  const tipo = String(d.tipo || "").trim();
  /* El polvo de oro no son piezas de CSS: es un canvas que dibuja el
     script, porque tiene que reaccionar al dedo. */
  if (tipo === "polvo" || tipo === "cielo") {
    /* Un <div> y no un <canvas>: el <canvas> de linkedom quiere el paquete
       «canvas» de Node, que no está en el contenedor, y tumbaba el render
       entero con «createCanvas is not a function». El lienzo lo crea el
       script, que corre en el navegador y ahí sí hay canvas de verdad. */
    const lienzo = document.createElement("div");
    lienzo.setAttribute("class", tipo === "cielo" ? "inv-cielo" : "inv-polvo");
    lienzo.setAttribute("aria-hidden", "true");
    /* El cielo lleva muchas más estrellas que motas el polvo: con 60
       estrellas no es un cielo, son unos puntos. */
    const factor = tipo === "cielo" ? 8 : 3;
    lienzo.setAttribute("data-n", String(Math.min(tipo === "cielo" ? 260 : 120,
      Math.max(10, (Number(d.cantidad) || 18) * factor))));
    lienzo.setAttribute("data-op", String(Math.min(100, Math.max(10, Number(d.opacidad ?? 70))) / 100));
    lienzo.setAttribute("data-tam", String(Math.min(96, Math.max(8, Number(d.tamano) || 20))));
    if (HEX.test(String(d.color || "").trim())) lienzo.setAttribute("data-color", String(d.color).trim());
    if (["lento", "rapido"].includes(String(d.velocidad))) lienzo.setAttribute("data-ritmo", String(d.velocidad));
    document.body.appendChild(lienzo);
    return;
  }
  const spec = PARTICULA_POR_TIPO[tipo];
  /* La imagen propia no tiene dibujo: es la que se subió. Sin ella no hay
     nada que soltar, y una capa vacía sólo costaría batería. */
  const imagen = tipo === "imagen" ? String(d.pieza || "").trim() : "";
  const forma = tipo === "imagen" ? (imagen ? () => "" : undefined) : FORMA_PARTICULA[tipo];
  if (!forma || !spec) return;
  const rumbo = ["sube", "cae", "flota", "revolotea"].includes(String(d.rumbo))
    ? String(d.rumbo)
    : spec.movimiento;
  const movimiento = tipo === "imagen" ? rumbo : spec.movimiento;

  const cuantas = Math.min(60, Math.max(6, Number(d.cantidad) || 18));
  const tamano = Math.min(96, Math.max(8, Number(d.tamano) || 20));
  const opacidad = Math.min(100, Math.max(10, Number(d.opacidad ?? 70))) / 100;
  const color = HEX.test(String(d.color || "").trim())
    ? String(d.color).trim()
    : "var(--brand, currentColor)";
  const ritmo = ["lento", "rapido"].includes(String(d.velocidad))
    ? String(d.velocidad)
    : "";

  const capa = document.createElement("div");
  capa.setAttribute("class", `inv-particulas inv-pt-${movimiento}`);
  capa.setAttribute("data-tipo", tipo);
  capa.setAttribute("aria-hidden", "true");
  capa.setAttribute("style", `--inv-pt-op:${opacidad}`);
  if (ritmo) capa.setAttribute("data-ritmo", ritmo);

  const bordes = String(d.zona) === "bordes";
  const piezas: string[] = [];
  for (let i = 0; i < cuantas; i++) {
    /* Cuatro números por pieza: dónde empieza, cuánto tarda, cuándo arranca y
       cuánto mide. Sin el desfase, las sesenta caerían en formación. */
    /* Por los bordes: la franja de la izquierda o la de la derecha, alternas,
       dejando libre el centro, que es donde va el texto. Angosta y medio
       fuera de la pantalla: en un móvil el texto empieza a 24 px del borde,
       y una franja más ancha lo volvía a pisar. */
    const x = (bordes
      ? (i % 2 ? 90 : -8) + disperso(i, 1) * 10
      : disperso(i, 1) * 100
    ).toFixed(1);
    const dur = (7 + disperso(i, 2) * 9).toFixed(1);
    const espera = (disperso(i, 3) * -16).toFixed(1);
    const escala = (0.62 + disperso(i, 4) * 0.76).toFixed(2);
    /* Una imagen propia apenas se ladea: un farolillo que da vueltas se ve
       como una bola, y casi todo lo que se sube (farolillos, globos, flores
       de frente) tiene un derecho. Lo dibujado sí gira: un pétalo cae así. */
    const giro = imagen
      ? Math.round(disperso(i, 5) * 16 - 8)
      : Math.round(disperso(i, 5) * 360);
    const deriva = (disperso(i, 6) * 60 - 30).toFixed(0);
    piezas.push(
      `<i style="left:${x}%;width:${tamano}px;height:${tamano}px;color:${color};` +
        `animation-duration:${dur}s;animation-delay:${espera}s;` +
        `--inv-pt-escala:${escala};--inv-pt-giro:${giro}deg;` +
        `--inv-pt-deriva:${deriva}px;--inv-pt-y:${(disperso(i, 7) * 100).toFixed(1)}%">` +
        (imagen
          ? `<img src="${(propia(imagen) ? conAncho(imagen, 400) : imagen).replace(/"/g, "%22").replace(/</g, "%3C")}" alt="" decoding="async">`
          : forma(color, "light")) +
        `</i>`
    );
  }
  capa.innerHTML = piezas.join("");
  document.body.appendChild(capa);
}

/* ── animación de un texto suelto ────────────────────────────── */

/** Lo que el esquema declara. Un valor que no esté aquí no se aplica. */
const ANIM_VALIDA = new Set(ANIMACIONES.map((a) => a.value).filter(Boolean));

/**
 * Reparte un texto en letras o en palabras, cada trozo con su turno.
 *
 * Devuelve `false` si el elemento no se puede repartir, y eso pasa más de lo
 * que parece: los nombres de la pareja traen dentro el `<span>` del
 * ampersand, y varios campos llevan un `<strong>` o un `<br>` puestos por el
 * diseño. Vaciar el elemento para rellenarlo de letras se llevaría por
 * delante ese marcado, así que sólo se reparte lo que es texto y nada más.
 *
 * El elemento se queda con el texto entero en `aria-label` y cada trozo va
 * con `aria-hidden`: sin eso, un lector de pantalla leería la frase letra por
 * letra, que es exactamente lo contrario de lo que se quería.
 */
function repartirTexto(el: El, modo: string): boolean {
  if (el.children?.length) return false;
  const texto = String(el.textContent || "");
  if (!texto.trim()) return false;

  const doc = el.ownerDocument;
  el.setAttribute("aria-label", texto);
  el.textContent = "";

  /* Por palabras se parte conservando los espacios, que van fuera de los
     trozos: metidos dentro, un espacio animado hace saltar la línea. */
  const trozos =
    modo === "palabras" ? texto.split(/(\s+)/) : Array.from(texto);

  let i = 0;
  for (const t of trozos) {
    if (!t) continue;
    if (/^\s+$/.test(t)) {
      el.appendChild(doc.createTextNode(t));
      continue;
    }
    const span = doc.createElement("span");
    span.setAttribute("class", "inv-anim-parte");
    span.setAttribute("aria-hidden", "true");
    span.setAttribute("style", `--inv-anim-i:${i++}`);
    span.textContent = t;
    el.appendChild(span);
  }
  return true;
}

/**
 * Marca un texto para que se anime al asomarse.
 *
 * El turno es lo que hace que varios textos animados en la misma sección
 * entren uno detrás de otro en vez de todos a la vez.
 */
function animarTexto(el: El, valor: string, turno: number): boolean {
  if (!el || el.getAttribute("data-inv-anim")) return false;
  if (ANIM_POR_PARTES.has(valor) && !repartirTexto(el, valor)) {
    /* No se pudo repartir —lleva marcado dentro—: en vez de no animar nada,
       se cae a la entrada más parecida, que es que el bloque entero aparezca.
       Quien lo eligió quería movimiento; dejarlo quieto sería peor. */
    valor = "aparece";
  }
  el.setAttribute("data-inv-anim", valor);
  if (turno) el.setAttribute("style", `${el.getAttribute("style") || ""};--inv-anim-turno:${turno}`.replace(/^;/, ""));
  return true;
}

/**
 * Marca las fichas de una lista para que entren al asomarse.
 *
 * Se apoya en la misma maquinaria que los textos —el atributo, el
 * observador, las mismas curvas— porque el problema es el mismo y tener dos
 * motores de entrada sería tener dos sitios donde se rompe. Lo único suyo es
 * la alternancia y la distancia, que en una tarjeta tiene que ser mayor que
 * en un renglón para que se lea como que entra de un lado.
 *
 * El turno va en ciclo de tres y no `i` a secas. El observador dispara cada
 * ficha cuando **ella** entra en pantalla, así que un turno creciente haría
 * que la séptima esperase casi un segundo ya estando a la vista, que se lee
 * como que la página se trabó. En ciclo, dos fichas que entren juntas —una
 * rejilla de dos columnas— salen escalonadas, y una que entre sola no espera
 * a nadie.
 */
function animarFichas(root: El, binding: ListBinding, valor: string) {
  if (!valor || !ANIM_FICHAS_VALIDAS.has(valor)) return;
  const container = pick(root, binding.container);
  if (!container) return;

  pickAll(container, binding.item).forEach((el, i) => {
    /* Una ficha que ya lleve animación la conserva: lo de la sección no pisa
       una elección más concreta. */
    if (el.getAttribute("data-inv-anim")) return;
    const dir = valor === "alterna" ? (i % 2 ? "izquierda" : "derecha") : valor;
    el.setAttribute("data-inv-anim", dir);
    el.setAttribute("class", `${el.getAttribute("class") || ""} inv-ficha-anim`.trim());
    const turno = i % 3;
    if (turno) {
      el.setAttribute(
        "style",
        `${el.getAttribute("style") || ""};--inv-anim-turno:${turno}`.replace(/^;/, "")
      );
    }
  });
}

/**
 * Cómo entra la sección al asomarse.
 *
 * El mecanismo ya estaba: `.reveal` empieza corrida y el observador le pone
 * `.in` cuando la sección aparece. Aquí sólo se elige desde dónde llega, con
 * una clase; el CSS hace el resto, así que no hay un script más por sección.
 *
 * Una sección que el diseño no marcó como `.reveal` —un pie, por ejemplo— la
 * recibe ahora: sin ella la clase de dirección no haría nada, y quien la
 * eligió vería que no pasa nada, que es peor que no ofrecerla.
 */
function ponerEntrada(seccion: El, valor: string) {
  if (!valor || !ENTRADAS_SECCION_VALIDAS.has(valor) || !seccion?.setAttribute) return;
  const clases = seccion.getAttribute("class") || "";
  const conReveal = valor === "ninguna" || /\breveal\b/.test(clases);
  seccion.setAttribute(
    "class",
    `${clases}${conReveal ? "" : " reveal"} inv-ent-${valor}`.trim()
  );
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
      /* Vacío no borra: deja lo que ya escribió quien pasó antes.

         Y cuando hay valor se sustituye **todo** el contenido, no sólo el
         nodo de texto: lo que había antes eran los nombres de la pareja con
         el `<span>` del ampersand dentro, y escribir por encima con `setText`
         dejaba el "&" colgando al final. Quien escribe un nombre propio
         escribe el nombre entero, separador incluido. */
      case "textoOpcional":
        if (value.trim()) el.textContent = value;
        break;
      case "html":
        if (!value) el.remove();
        else el.innerHTML = value;
        break;
      /* Lo escribe quien organiza, así que pasa por el filtro. Si no queda
         nada después de limpiar, el bloque se esconde: un hueco vacío en
         medio de la invitación es peor que no tenerlo. */
      case "htmlSeguro": {
        const limpio = value ? sanearHtml(value).html : "";
        /* Se esconde el bloque entero y no sólo el hueco: con el hueco a
           secas quedarían el antetítulo y el título anunciando algo que no
           está, que es como se ve un bloque roto. */
        if (!limpio.trim()) ocultar(el.closest?.(".inv-block") || el);
        else el.innerHTML = limpio;
        break;
      }
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
 * El fondo cuando lo que se subió es un vídeo.
 *
 * Tiene que ser un `<video>`: no existe forma de meter un vídeo en un
 * `background-image`. Del recorte y la atenuación sigue encargándose la capa,
 * así que aquí sólo hay que llenarla.
 *
 * Los cuatro atributos van juntos porque por separado no sirven: `autoplay`
 * sin `muted` lo ignora todo navegador —ninguno deja que una página empiece a
 * sonar sola— y sin `playsinline` iOS abre el reproductor a pantalla completa
 * encima de la invitación en cuanto arranca. `loop` porque un fondo congelado
 * en el último fotograma es una foto mal elegida.
 *
 * Sin `controls`, que es un fondo y no una pieza que se mire, y sin `poster`:
 * el elemento se deja transparente hasta el primer fotograma para que
 * mientras carga se vea el color de la sección y no el recuadro negro que
 * pinta Safari.
 */
function fondoVideo(doc: Doc, url: string, modo: string): El {
  const v = doc.createElement("video");
  v.setAttribute("class", "inv-fondo-video");
  /* Tal cual: el redimensionador de `/api/media` no toca el vídeo, y pedirle
     un `?w=` sólo añadiría una URL que no cachea igual. */
  v.setAttribute("src", url);
  v.setAttribute("autoplay", "");
  v.setAttribute("muted", "");
  v.setAttribute("loop", "");
  v.setAttribute("playsinline", "");
  /* Con `autoplay` puesto el navegador descarga lo que necesite y esto da
     igual; importa para quien pidió menos movimiento, a quien `FONDO_VIDEO_JS`
     le para el vídeo: sin metadatos cargados no habría ni primer fotograma
     que dejar quieto, y la capa quedaría vacía. */
  v.setAttribute("preload", "metadata");
  /* Un mosaico de vídeo no existe —`background-repeat` no alcanza a un
     elemento—, así que "repetir" se atiende con lo que más se le parece, que
     es llenar la sección. */
  if (modo === "contener") v.setAttribute("style", "object-fit:contain");
  return v;
}

/**
 * El fondo de una sección: una foto o un vídeo.
 *
 * Va en una capa propia y no en el `background` de la sección para poder
 * atenuarla: `opacity` sobre la sección se llevaría también el texto. La capa
 * se mete como primer hijo y el contenido se sube por encima.
 */
function ponerFondo(seccion: El, d: InvitationData[string], sel: string, ctx: Ctx) {
  const url = String(d.fondoUrl || "").trim();
  const color = String(d.fondoColor || "").trim();
  if (!url && !HEX.test(color)) return;
  const modo = String(d.fondoAjuste || "");
  const opacidad = Math.min(100, Math.max(0, Number(d.fondoOpacidad ?? 100))) / 100;

  const capa = seccion.ownerDocument.createElement("div");
  capa.setAttribute("class", "inv-fondo");
  capa.setAttribute("aria-hidden", "true");

  /* Sólo color: la capa entera se pinta de él y ya. Es lo más barato que
     puede pedirse —cero bytes— y lo que más se pide. */
  if (!url) {
    capa.setAttribute("style", `background:${color};opacity:${opacidad}`);
    seccion.insertBefore(capa, seccion.firstChild);
    ctx.css.push(
      `${sel}{position:relative}`,
      `${sel}>.container{position:relative;z-index:1}`
    );
    return;
  }

  /* Con imagen, el color va **debajo**: es el papel sobre el que se apoya una
     foto con transparencia o una que no llega a cubrir. Va en la capa y la
     imagen encima, en su propio hijo, para que la opacidad las atenúe a las
     dos juntas y no se vea el color a través de la foto. */
  if (HEX.test(color)) capa.setAttribute("data-color", color);

  const base = HEX.test(color) ? `background-color:${color};` : "";
  if (esVideoUrl(url)) {
    /* El recorte lo hace el `object-fit` del vídeo, no la capa: aquí sólo
       queda la atenuación. */
    capa.setAttribute("style", `${base}opacity:${opacidad}`);
    capa.appendChild(fondoVideo(seccion.ownerDocument, url, modo));
  } else {
    const ajuste = AJUSTE[modo] ?? AJUSTE[""];
    /* El fondo cubre la sección entera, así que va al ancho grande — salvo en
       mosaico, donde se repite en pequeño. */
    const anchoFondo = modo === "repetir" ? 800 : 1600;
    capa.setAttribute(
      "style",
      `${base}${fondoImagen(url, anchoFondo)}${ajuste};opacity:${opacidad}`
    );
  }

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
/** Los efectos de entrada que se aceptan. El resto se ignora. */
const ENTRADAS = new Set(["aparece", "sube", "crece", "gira", "desliza"]);
/** Los de movimiento continuo. */
const MOVIMIENTOS = new Set(["flota", "balancea", "late", "respira", "destello", "gira"]);

/**
 * De qué borde entra un adorno que "entra desde su borde".
 *
 * Se deduce de dónde está puesto: uno anclado arriba a la izquierda entra
 * desde arriba y desde la izquierda, y así queda como si viniera de fuera de
 * la sección. Preguntarlo aparte sería un campo más para decir lo que el
 * sitio ya dice.
 */
function desdeDonde(sitio: string, cx = 50, cy = 50): string {
  /* Un adorno libre no tiene un anclaje del que deducirlo, así que el borde
     sale de dónde está puesto: lo que queda en el tercio de arriba entra
     desde arriba, y lo mismo a los lados. Es la misma idea que con los
     anclajes —el sitio ya lo dice— aplicada a un número en vez de a un
     nombre. */
  const y = sitio === "libre"
    ? (cy < 34 ? -1 : cy > 66 ? 1 : 0)
    : sitio.startsWith("arriba") ? -1 : sitio.startsWith("abajo") ? 1 : 0;
  const x = sitio === "libre"
    ? (cx < 34 ? -1 : cx > 66 ? 1 : 0)
    : sitio.endsWith("izq") ? -1 : sitio.endsWith("der") ? 1 : 0;
  /* En el centro no hay borde del que venir: se cae a subir. */
  if (!x && !y) return "translateY(24px)";
  return `translate(${x * 30}px, ${y * 30}px)`;
}

function ponerAdornos(
  seccion: El,
  d: InvitationData[string],
  sel: string,
  ctx: Ctx,
  clave = "",
  filigranaEnLosDatos = false,
  declarados: Record<string, string>[] = []
) {
  /* La lista de la invitación manda; si no la trae, se dibuja la que declara
     el diseño.

     Las invitaciones creadas antes de que los adornos existieran no tienen
     lista, y su arte ya no está en el CSS: sin esta línea, publicar una
     versión nueva las dejaría sin corona, sin ramo y sin esquinas. Con ella
     se ven exactamente igual que siempre, y en cuanto alguien toca los
     adornos de esa sección pasa a mandar lo que guardó. */
  const items = (d.adornos as Record<string, string>[]) || declarados;
  /* La filigrana que el template trae horneada se quita en cuanto la
     invitación la lleva en sus datos, **aunque la lista esté vacía**: si sólo
     se quitara cuando hay un adorno puesto, borrar el adorno haría reaparecer
     la del diseño y parecería que no se puede quitar. Que es justo lo que
     pasaba.

     Las invitaciones de antes no traen la lista, así que no entran aquí y
     conservan su filigrana tal cual. */
  if (filigranaEnLosDatos && (Array.isArray(d.adornos) || declarados.length)) {
    const cuerpo = (seccion.querySelector(".container") as El | null) || seccion;
    cuerpo.querySelector(".ornament")?.remove();
  }
  if (!Array.isArray(items) || !items.length) return;

  let puestos = 0;
  for (const [i, it] of items.entries()) {
    const url = String(it?.url || "").trim();
    if (!url) continue;

    const sitio = SITIO_VALIDO.has(String(it.sitio)) ? String(it.sitio) : "arriba-izq";
    const tamano = Math.min(100, Math.max(5, Number(it.tamano) || 40));
    const opacidad = Math.min(100, Math.max(5, Number(it.opacidad ?? 100))) / 100;
    const giro = Math.min(180, Math.max(-180, Number(it.giro) || 0));
    /* Sólo significan algo en el sitio libre; en los anclados se ignoran. */
    const cx = Math.min(100, Math.max(0, Number(it.x ?? 50)));
    const cy = Math.min(100, Math.max(0, Number(it.y ?? 50)));
    const encima = String(it.capa || "") === "encima";
    const espejo = String(it.espejo || "");
    const entrada = ENTRADAS.has(String(it.entrada)) ? String(it.entrada) : "";
    const movimiento = MOVIMIENTOS.has(String(it.movimiento)) ? String(it.movimiento) : "";

    const doc = seccion.ownerDocument;
    const caja = doc.createElement("div");
    caja.setAttribute(
      "class",
      `inv-adorno inv-ad-${sitio}` + (entrada ? ` inv-ad-entra inv-ad-e-${entrada}` : "")
    );
    caja.setAttribute("aria-hidden", "true");
    /* Sólo en el editor, y con el índice del array y no el de los puestos:
       un adorno sin imagen se salta al dibujar pero sigue ocupando su sitio
       en la lista, y el editor escribe por esa posición. Sin esta marca el
       guion de arrastre no sabría a cuál de los ocho está moviendo. */
    if (ctx.preview && clave && sitio !== "sangre") {
      caja.setAttribute("data-inv-adorno", `${clave}:${i}`);
    }
    caja.setAttribute(
      "style",
      /* El ancho: en % de la sección para los anclados, y en % de la
         pantalla para los del flujo. Dentro del contenedor —que mide 520 px
         como mucho— un 50 % no es el mismo 50 % que ve quien lo elige, y la
         pieza salía bastante más pequeña de lo declarado. */
      (sitio === "sangre"
        ? ""
        : sitio === "titulo" || sitio === "cabecera"
          ? `width:min(${tamano}vw,100%);`
          : `width:${tamano}%;`) +
        (sitio === "libre" ? `--inv-ad-x:${cx}%;--inv-ad-y:${cy}%;` : "") +
        /* La opacidad elegida va en una variable porque la animación de
           entrada tiene que terminar justo en ella, no en 1.

           Y con entrada **no** se escribe `opacity` en línea: un estilo en
           línea le gana a cualquier regla de la hoja, así que la regla que
           deja el adorno invisible hasta que se asoma no llegaba a aplicarse
           y entraba ya visible. Con entrada, la opacidad la manda el CSS. */
        `--inv-ad-op:${opacidad};` +
        (entrada ? "" : `opacity:${opacidad};`) +
        `z-index:${encima ? 4 : 0}` +
        /* Varios adornos en una sección entran uno detrás de otro: a la vez
           parecen un parpadeo, escalonados parecen puestos a mano. */
        (entrada && puestos ? `;--inv-ad-espera:${puestos * 120}ms` : "") +
        (entrada === "desliza" ? `;--inv-ad-desde:${desdeDonde(sitio, cx, cy)}` : "")
    );

    /* Tres capas, y cada una con su trabajo, porque las tres quieren escribir
       `transform` y la última en hacerlo gana:
         .inv-adorno   la entrada, que corre una vez
         .inv-ad-mov   el movimiento, que corre en bucle
         .inv-ad-pieza el giro y el volteo, que son fijos
       Antes el giro iba en la <img>; se movió aquí para dejarle sitio a lo
       demás y para que el destello quede alineado con la pieza girada. */
    const mov = doc.createElement("div");
    mov.setAttribute("class", `inv-ad-mov${movimiento ? ` inv-ad-m-${movimiento}` : ""}`);

    const pieza = doc.createElement("div");
    pieza.setAttribute("class", "inv-ad-pieza");
    const t = [
      giro ? `rotate(${giro}deg)` : "",
      espejo.includes("h") ? "scaleX(-1)" : "",
      espejo.includes("v") ? "scaleY(-1)" : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (t) pieza.setAttribute("style", `transform:${t}`);

    /* El adorno mide lo que se declaró, en % del ancho de la sección. Un
       tamaño 40 sobre un contenedor de ~780px son ~310px, y el doble en
       retina: 800 es el escalón que le toca. */
    const ancho = tamano >= 70 || sitio === "sangre" ? 1600 : 800;
    const esVideo = esVideoUrl(url);

    if (esVideo) {
      /* Un adorno puede ser un clip: una llama que arde en una esquina, unos
         pétalos cayendo en un rincón. Va mudo, en bucle y sin controles —es
         decoración, no una pieza que se mire—, y con los mismos cuatro
         atributos que el fondo de vídeo, por las mismas razones: sin `muted`
         ningún navegador lo arranca y sin `playsinline` iOS se lo lleva a
         pantalla completa.

         `preload="metadata"` y no más: puede haber ocho por sección, y
         descargarlos todos de golpe sería peor que no tenerlos. */
      const v = doc.createElement("video");
      v.setAttribute("src", url);
      v.setAttribute("autoplay", "");
      v.setAttribute("muted", "");
      v.setAttribute("loop", "");
      v.setAttribute("playsinline", "");
      v.setAttribute("preload", "metadata");
      v.setAttribute("aria-hidden", "true");
      pieza.appendChild(v);
    } else {
      const img = doc.createElement("img");
      setImage(img, url, false, ancho);
      img.setAttribute("alt", "");
      // La portada se ve al abrir; el resto puede esperar a que se llegue.
      img.setAttribute("loading", "lazy");
      img.setAttribute("decoding", "async");
      pieza.appendChild(img);
    }

    /* El destello se recorta con la silueta del adorno, y una silueta es una
       máscara CSS: un vídeo no puede serla. Con uno, el efecto se salta en vez
       de dibujar una barra de luz sobre un rectángulo, que es lo que saldría
       y es justo el flash barato que este efecto existe para evitar. */
    if (movimiento === "destello" && !esVideo) {
      /* La luz se recorta con la silueta del propio adorno: una filigrana
         dorada brilla por sus trazos y no por el rectángulo que la contiene,
         que es lo que separa esto de un flash barato. */
      const luz = doc.createElement("span");
      luz.setAttribute("class", "inv-ad-luz");
      const m = propia(url) ? conAncho(url, ancho) : url;
      luz.setAttribute("style", `--inv-ad-mask:url("${m.replace(/"/g, "%22")}")`);
      /* La barra que cruza. Va aparte para animar `transform` y no
         `background-position`: lo segundo repinta en cada fotograma, y con
         ocho adornos por sección eso se nota en un teléfono. */
      luz.appendChild(doc.createElement("i"));
      pieza.appendChild(luz);
    }

    mov.appendChild(pieza);
    caja.appendChild(mov);
    /* Dos sitios no van encima de la sección sino dentro, en el flujo:
         · «bajo el título», donde los diseños ponen su filigrana;
         · «cabecera», arriba del todo, que es donde va la corona, el ramo o
           el sello que preside la sección.
       El cuerpo donde meterse no siempre es el .container: la portada
       escribe en .hero-content y el velo en .splash-modal, y colgar el
       adorno de la sección lo dejaría detrás de la foto. */
    if (sitio === "titulo" || sitio === "cabecera") {
      const cuerpo =
        (seccion.querySelector(".container") as El | null) ||
        (seccion.querySelector(".hero-content") as El | null) ||
        (seccion.querySelector(".splash-modal") as El | null) ||
        seccion;
      const titulo = cuerpo.querySelector(".section-title") as El | null;
      if (sitio === "titulo" && titulo?.parentNode) {
        titulo.parentNode.insertBefore(caja, titulo.nextSibling);
      } else {
        cuerpo.insertBefore(caja, cuerpo.firstChild);
      }
    } else {
      seccion.appendChild(caja);
    }
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

/**
 * Duplica las fotos de una cinta continua para que el bucle no se note.
 *
 * Las copias van con `aria-hidden`: para un lector de pantalla la galería
 * tiene las fotos que tiene, y oírlas dos veces sería ruido.
 */
function duplicarCinta(root: El) {
  const tira = root.querySelector?.(".inv-ga-cinta") as El | null;
  if (!tira) return;
  const fotos = Array.from(tira.children || []) as El[];
  /* Con una sola foto no hay cinta que valga: se deja quieta, que es mejor
     que verla cruzar la pantalla sola. */
  if (fotos.length < 2) {
    tira.setAttribute("class", `${tira.getAttribute("class") || ""} inv-ga-cinta-quieta`.trim());
    return;
  }
  for (const f of fotos) {
    const copia = f.cloneNode(true) as El;
    copia.setAttribute("aria-hidden", "true");
    tira.appendChild(copia);
  }
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
  /** En el editor. Es lo único que enciende el arrastre de adornos. */
  preview?: boolean;
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
    ponerFondoFicha(el, items[i]);
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

/**
 * El fondo propio de una ficha.
 *
 * Va sobre la tarjeta ya clonada y no con una operación del mapa, porque no
 * escribe texto en ningún sitio: pinta la caja. El velo es un pseudoelemento
 * —no se puede poner en línea— así que la imagen y su opacidad viajan en dos
 * variables y la regla vive en el CSS inyectado.
 *
 * `overflow:hidden` porque la tarjeta suele tener esquinas redondeadas y una
 * foto a sangre se saldría por ellas, que es de lo que más se nota.
 */
function ponerFondoFicha(ficha: El, datos?: Record<string, string>) {
  if (!ficha?.setAttribute) return;
  const url = String(datos?.fondo || "").trim();
  const color = String(datos?.fondoColor || "").trim();
  const conColor = HEX.test(color);
  if (!url && !conColor) return;

  const velo = Math.min(90, Math.max(0, Number(datos?.fondoVelo ?? 45))) / 100;
  const opacidad = Math.min(100, Math.max(5, Number(datos?.fondoOpacidad ?? 100))) / 100;

  ficha.setAttribute(
    "class",
    `${ficha.getAttribute("class") || ""} inv-ficha-fondo`.trim()
  );

  const previo = ficha.getAttribute("style") || "";
  const sep = previo && !previo.trim().endsWith(";") ? ";" : "";
  const partes: string[] = [];
  if (url) {
    partes.push(`--inv-ff-img:url('${conAncho(url, 800).replace(/'/g, "%27")}')`);
    partes.push(`--inv-ff-velo:${velo}`);
    /* Entera o recortada. Una ilustración vertical recortada para cubrir
       pierde justo lo que se quería enseñar. */
    if (String(datos?.fondoAjuste || "") === "entera") {
      partes.push("--inv-ff-size:contain");
    }
    const alto = Math.min(360, Math.max(0, Number(datos?.fondoAlto ?? 0)));
    if (alto) partes.push(`--inv-ff-alto:${alto}px`);
  } else {
    /* Sin imagen no hay nada que velar: el velo se apaga para que el color
       elegido se vea tal cual y no mezclado con el de la tarjeta. */
    partes.push("--inv-ff-velo:0");
  }
  /* La transparencia va dentro del color y no en un `opacity`: sobre la caja
     se llevaría también el texto, y en un pseudoelemento quedaría encima de
     la imagen en vez de debajo. */
  if (conColor) partes.push(`--inv-ff-color:${alpha(color, opacidad)}`);
  ficha.setAttribute("style", `${previo}${sep}${partes.join(";")}`);
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
  '<div class="inv-rsvp-pases" data-inv-pases-texto hidden>' +
  '<b class="inv-rsvp-pases-n"></b><span class="inv-rsvp-pases-t"></span></div>' +
  '<div class="inv-rsvp-lista" data-inv-lista hidden></div>';

function wireRsvp(
  doc: Doc,
  section: El,
  data: InvitationData,
  slug: string,
  preview: boolean,
  pases: number | null
) {
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

  /* La canción que no puede faltar: un campo más, sólo si quien invita
     escribió qué quiere preguntar. Nació en la boda «Eterna», donde la
     fiesta se arma con lo que pide cada invitado, pero no tiene nada de
     boda: sirve igual en unos quince. Lo que contesten viaja pegado al
     mensaje —una sola respuesta por invitado, y el panel no cambia—. */
  const cancion = String(c.cancion || "").trim();
  const pideCancion = cancion
    ? `<label class="inv-rsvp-lab">${escapeHtml(cancion)}` +
      '<span class="inv-rsvp-cancion"><i aria-hidden="true">\u266a</i>' +
      `<input class="${claseInput}" name="cancion" placeholder="Artista — título" maxlength="120">` +
      "</span></label>"
    : "";

  form.innerHTML =
    andamio(String(c.greeting || "Hola, {nombre}")) +
    `<input class="${claseInput}" name="name" placeholder="Tu nombre" required data-inv-nombre>` +
    `<input class="${claseInput}" name="phone" type="tel" placeholder="Teléfono (opcional)">` +
    /* Con pases no se pregunta «¿cuántas personas van?»: el número ya lo
       puso quien invita y preguntarlo otra vez es pedirle al invitado que
       repita lo que la tarjeta acaba de decirle. Va en un campo escondido, y
       el servidor lo vuelve a comprobar de todos modos. */
    (pases
      ? `<input type="hidden" name="partySize" value="${pases}">`
      : '<label class="inv-rsvp-lab" data-inv-cuantos>¿Cuántas personas van?' +
        `<input class="${claseInput}" name="partySize" type="number" min="1" max="20" value="1">` +
        "</label>") +
    pideCancion +
    `<textarea class="${claseInput}" name="note" rows="2" placeholder="Mensaje (opcional)"></textarea>` +
    '<div class="inv-rsvp-acciones">' +
    `<button class="${claseBtn}" type="submit" value="confirmado" name="status">${escapeHtml(buttonText)}</button>` +
    `<button class="${claseBtn} inv-rsvp-no" type="submit" value="rechazado" name="status">${escapeHtml(noText)}</button>` +
    "</div>";

  /* Los pases viajan en el marcado para que el script los diga con palabras
     («Hemos reservado 4 pases para ti») sin tener que preguntar al servidor. */
  if (pases) form.setAttribute("data-inv-pases", String(pases));

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
/* La canción: la nota entra en la caja, no al lado. */
.inv-rsvp-cancion{display:flex;align-items:center;gap:8px;margin-top:5px;padding-left:14px;
  background:var(--inv-field-bg);border:1px solid var(--inv-field-border);
  border-radius:var(--inv-radius)}
.inv-rsvp-cancion i{flex:none;font-style:normal;font-size:17px;color:var(--inv-accent);opacity:.85}
.inv-rsvp-cancion .inv-rsvp-input{margin-top:0;background:none;border:0;padding-left:0}
.inv-rsvp-cancion:focus-within{border-color:var(--inv-accent);box-shadow:0 0 0 3px var(--inv-focus)}
.inv-rsvp-cancion .inv-rsvp-input:focus{box-shadow:none}

.inv-rsvp-hola{margin:0 0 2px;font-family:var(--inv-font-title);
  font-size:clamp(18px,4.8vw,22px);line-height:1.3;color:var(--inv-ink)}
/* La tarjeta de los pases: el número grande es lo que el invitado necesita
   saber —cuántos caben— y por eso ocupa el sitio del contador que antes
   había que rellenar. */
.inv-rsvp-pases{display:flex;flex-direction:column;align-items:center;gap:2px;
  margin:0 auto;padding:12px 22px;border-radius:var(--inv-radius);
  background:var(--inv-field-bg);border:1px solid var(--inv-accent);text-align:center}
/* La regla de arriba pone display:flex y eso gana sobre el hidden del
   navegador: sin esta línea, quien entra sin enlace personalizado ve la
   tarjeta vacía. (Nada de comillas invertidas aquí dentro: esto es una
   plantilla de TypeScript y una sola cierra la cadena.) */
.inv-rsvp-pases[hidden]{display:none}
.inv-rsvp-pases-n{font-family:var(--inv-font-title);font-size:34px;line-height:1;
  color:var(--inv-accent)}
.inv-rsvp-pases-t{font-family:var(--inv-font-ui);font-size:11.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--inv-ink);opacity:.75}
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
/* En modo WhatsApp el botón es un enlace suelto, sin la fila que reparte los
   dos del formulario: sin esto salía subrayado y pegado a la izquierda. */
a.inv-rsvp-btn{display:flex;width:max-content;max-width:100%;margin:28px auto 0;
  padding:15px 30px;text-decoration:none}

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

/* ── La apertura del velo ──────────────────────────────────────
   El velo se iba con un fundido, y un fundido no es un gesto: es la ausencia
   de uno. Una invitación en papel se abre, y eso es lo único que la de
   pantalla se había saltado.

   Todo vive en la **salida**. El velo cerrado se ve exactamente igual con
   apertura y sin ella, que es lo que deja elegirla sin rediseñar la portada
   de nadie — y lo que hace que funcione en los 49 sin una línea por diseño.

   Gira la capa entera y no una pieza añadida: #splash ya es un fijo a
   pantalla completa con la decoración del diseño dentro, así que al abrirse
   se lleva consigo lo que el diseño dibujó, como la solapa de un sobre se
   lleva el papel que tiene impreso.

   El orden importa y es lo que separa "un sobre que se abre" de "algo que
   gira": la tarjeta sale primero y hacia arriba, y el velo empieza a girar
   cuando ella ya va de salida. Al revés se ve una sola cosa dando vueltas.

   visibility con retardo y sin transición —0s linear— es lo que sostiene
   todo: la regla de siempre la apaga al instante, y entonces no habría nada
   que mirar girar. */
#splash.inv-velo-sobre{transform-origin:50% 0;backface-visibility:hidden;
  transition:transform .92s cubic-bezier(.5,.02,.3,1) .14s,
    opacity .3s ease .76s,
    visibility 0s linear 1.06s}
#splash.inv-velo-sobre.hidden{transform:perspective(1600px) rotateX(-104deg);
  opacity:0}
#splash.inv-velo-sobre.hidden .splash-modal{transform:translateY(-46px) scale(.975);
  opacity:0;transition:transform .5s cubic-bezier(.32,.78,.3,1),opacity .44s ease .06s}

/* Quien pidió menos movimiento no ve girar nada: el velo se va como se iba,
   con el fundido de siempre. */
@media (prefers-reduced-motion:reduce){
  #splash.inv-velo-sobre{transition:opacity .7s ease,visibility .7s ease}
  #splash.inv-velo-sobre.hidden{transform:none}
  #splash.inv-velo-sobre.hidden .splash-modal{transform:none;transition:opacity .4s ease}
}

/* ── Un bloque de HTML propio ──────────────────────────────────
   Lo que se escribe ahí puede ser cualquier cosa, así que el sitio donde cae
   no puede dar nada por hecho: se limita el ancho de lo que se meta y se
   recortan los desbordes, para que una tabla ancha o un iframe con medidas
   propias no rompan la maquetación de la invitación entera. */
.inv-html{max-width:100%;overflow-x:auto}
.inv-html :is(img,video,iframe,table){max-width:100%}
.inv-html iframe{width:100%;border:0;aspect-ratio:16/9}
.inv-html table{width:100%;border-collapse:collapse}
.inv-html :is(td,th){padding:8px 10px;border:1px solid var(--inv-field-border,currentColor)}
.inv-html-ancho{width:min(1040px,100%);margin-inline:auto}
.inv-html-completa{width:100%}

/* ── El fondo propio de una ficha ──────────────────────────────
   Una tarjeta del programa o de información con su propia imagen detrás.

   El velo va en un ::before y no en un filtro sobre la imagen: así es del
   color de la propia tarjeta —no un gris genérico— y sube o baja sin tocar
   la foto. Y los hijos se posicionan para que se pinten por encima: un
   elemento posicionado se pinta después de un ::before absoluto que va antes
   en el orden, que es justo lo que hace falta y sin repartir z-index. */
/* La clase se repite para pesar más que la regla del diseño.

   Doce de los cincuenta pintan sus tarjetas con «background» a secas —una
   propiedad abreviada— y eso **borra la imagen de fondo**: no la tapa, la
   quita. Son los doce que usan el estilo de tarjeta «flat», y en ellos el
   fondo de ficha se guardaba, no daba ningún error y no se veía nada.

   Por eso van las propiedades separadas y no la abreviada: así conviven con
   lo que ponga cada diseño en vez de borrarle el color de la tarjeta.

   Y van marcadas como prioritarias porque subir la especificidad no bastaba:
   los diseños planos pintan las secciones alternas con un selector de tres
   clases (section.alt .feature-card) y siempre habría una puja más alta. Es
   una decisión explícita de quien edita —puso una imagen en esa ficha— y
   tiene que ganarle al diseño, igual que el color de letra por sección. */
.inv-ficha-fondo.inv-ficha-fondo{position:relative;overflow:hidden;
  background-color:var(--inv-ff-color,transparent) !important;
  background-image:var(--inv-ff-img) !important;
  background-size:var(--inv-ff-size,cover) !important;
  min-height:var(--inv-ff-alto,0);
  background-position:center !important;background-repeat:no-repeat !important}
/* El color sólido va en el background-color de la tarjeta, con su
   transparencia metida dentro del propio color. Un pseudoelemento no vale:
   los dos pseudos se pintan **encima** del background-image, así que el color
   taparía la imagen en vez de quedar debajo. Y bajar el opacity de la caja se
   llevaría también el texto. */
.inv-ficha-fondo::before{content:"";position:absolute;inset:0;
  background:var(--card);opacity:var(--inv-ff-velo,.45);pointer-events:none}
.inv-ficha-fondo > *{position:relative}

/* ── El fondo de toda la invitación ────────────────────────────
   Una capa fija detrás del contenido. z-index -1 y no 0: así queda por
   encima del fondo del body —que sigue ahí de respaldo mientras la imagen
   carga— y por debajo de todo lo que se lee, sin entrar en la pelea de
   capas del velo, la cortina y las partículas.

   Fija y no del alto de la página: no hay que medir dónde empieza y acaba el
   bloque de secciones que la lleva, la imagen no se repite entre una y otra,
   y en iOS funciona — que es donde background-attachment: fixed no. */
.inv-fondo-global{position:fixed;inset:0;z-index:-1;pointer-events:none;
  overflow:hidden}
.inv-fg-medio{position:absolute;inset:0}
.inv-fg-medio video{position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;background:transparent}
/* El velo es del color de fondo del diseño, no un gris: sobre una foto que
   sube quien edita, la tinta del diseño deja de leerse, y el contraste de las
   paletas se verifica en el build pero una fotografía cualquiera no. */
.inv-fg-velo{position:absolute;inset:0;background:var(--bg)}

/* ── Partículas sobre toda la invitación ───────────────────────
   Una capa fija sobre la página entera: lo que se quiere es que los pétalos
   caigan sobre la invitación, no que empiecen de cero en cada sección.

   pointer-events:none no es un detalle de estilo. Es una capa que cubre la
   pantalla completa, y sin eso la invitación deja de responder — no se puede
   ni entrar por el velo. Es exactamente el fallo que ya tuvo la marca de
   agua, y la razón de que su auditoría lo vigile desde entonces.

   Tres movimientos y no doce: lo que cae, lo que sube y lo que flota. La
   diferencia entre un pétalo y un copo no está en la animación, está en el
   dibujo — y eso ya lo resuelve el SVG de cada uno. */
.inv-particulas{position:fixed;inset:0;z-index:9997;pointer-events:none;
  overflow:hidden;opacity:var(--inv-pt-op,.7)}
.inv-particulas i{position:absolute;display:block;line-height:0;
  animation-iteration-count:infinite;animation-timing-function:linear;
  transform:scale(var(--inv-pt-escala,1))}
.inv-particulas i svg{width:100%;height:100%;display:block}
/* La imagen propia conserva su proporción: un farolillo es más alto que
   ancho, y estirarlo a un cuadrado lo vuelve un barril. */
.inv-particulas i img{width:100%;height:auto;display:block}

/* Sin JavaScript no hay nada que esperar: las partículas son CSS y corren
   solas. Pero sí hay algo que evitar — que arranquen todas a la vez —, y de
   eso se encarga el retardo negativo de cada pieza: empiezan con la
   animación ya empezada, en un punto distinto cada una. */
.inv-pt-cae i{top:0;animation-name:invPtCae}
.inv-pt-sube i{bottom:0;animation-name:invPtSube}
/* Lo que flota no recorre la pantalla: se queda donde nace y se mueve poco.
   Por eso necesita su propia coordenada vertical, que el renderer reparte. */
.inv-pt-flota i{top:var(--inv-pt-y,50%);animation-name:invPtFlota;
  animation-timing-function:ease-in-out}

@keyframes invPtCae{
  0%{transform:translate3d(0,-12vh,0) rotate(0) scale(var(--inv-pt-escala,1))}
  100%{transform:translate3d(var(--inv-pt-deriva,0),112vh,0)
    rotate(var(--inv-pt-giro,180deg)) scale(var(--inv-pt-escala,1))}}
@keyframes invPtSube{
  0%{transform:translate3d(0,12vh,0) rotate(0) scale(var(--inv-pt-escala,1))}
  100%{transform:translate3d(var(--inv-pt-deriva,0),-112vh,0)
    rotate(var(--inv-pt-giro,180deg)) scale(var(--inv-pt-escala,1))}}
/* Revolotea: se queda en su franja de pantalla y va de un lado a otro, y
   la imagen bate las alas —se encoge sobre su eje, como el aleteo de las
   mariposas dibujadas—. Pensado para una mariposa subida como imagen, que
   cayendo como un pétalo parecía muerta. */
.inv-pt-revolotea i{top:var(--inv-pt-y,50%);animation-name:invPtRevolotea;animation-timing-function:ease-in-out}
.inv-pt-revolotea i img{animation:invPtAletea .55s ease-in-out infinite}
.inv-pt-revolotea i:nth-child(2n) img{animation-duration:.47s}
.inv-pt-revolotea i:nth-child(3n) img{animation-duration:.63s}
@keyframes invPtRevolotea{
  0%,100%{transform:translate3d(0,0,0) rotate(-8deg) scale(var(--inv-pt-escala,1))}
  25%{transform:translate3d(calc(var(--inv-pt-deriva,0px) * 2.4),-9vh,0) rotate(10deg) scale(var(--inv-pt-escala,1))}
  50%{transform:translate3d(calc(var(--inv-pt-deriva,0px) * -1.8),-16vh,0) rotate(-4deg) scale(var(--inv-pt-escala,1))}
  75%{transform:translate3d(calc(var(--inv-pt-deriva,0px) * 1.2),-6vh,0) rotate(7deg) scale(var(--inv-pt-escala,1))}}
@keyframes invPtAletea{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.3)}}
@keyframes invPtFlota{
  0%,100%{transform:translate3d(0,0,0) scale(var(--inv-pt-escala,1));opacity:.55}
  50%{transform:translate3d(var(--inv-pt-deriva,0),-26px,0)
    scale(calc(var(--inv-pt-escala,1) * 1.12));opacity:1}}

/* El ritmo multiplica lo que ya trae cada pieza, así que la dispersión se
   conserva: lento no es "todas a la misma velocidad, despacio". */
.inv-particulas[data-ritmo="lento"] i{animation-duration:22s!important}
.inv-particulas[data-ritmo="rapido"] i{animation-duration:5s!important}

/* El aleteo de la mariposa. Es lo único que no sale de mover la pieza entera:
   cada ala se encoge sobre el eje del cuerpo, que es lo que lee el ojo como
   un batir y no como un balanceo. */
.inv-pt-ala{transform-origin:12px 12px;animation:invPtAla .42s ease-in-out infinite}
.inv-pt-ala-d{animation-delay:.02s}
@keyframes invPtAla{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.42)}}

/* Quien pidió menos movimiento no ve caer nada. No se quedan quietas: se
   quitan. Una lluvia de pétalos congelada a media pantalla no es una
   invitación más sobria, es una invitación rota. */
@media (prefers-reduced-motion:reduce){
  .inv-particulas{display:none}
}

/* ── Animación de un texto suelto ──────────────────────────────
   Distinto de la aparición de la sección, que entra en bloque: esto es por
   campo, así que el antetítulo puede fundirse mientras el título se escribe
   letra a letra.

   Todo cuelga de .js y de .in, igual que el resto del movimiento del sitio:
   sin JavaScript no llega el .in, así que el estado de partida —invisible,
   desplazado— vive bajo .js y sin él el texto sale puesto y ya. Es la misma
   guarda que ya salvó la invitación una vez, cuando un fallo de guion la
   dejaba en blanco.

   El turno lo pone el renderer y hace que varios textos animados en una
   sección entren uno detrás de otro; el índice de cada letra lo pone también
   él, y los dos se suman en el retardo. */
[data-inv-anim]{--inv-anim-turno:0;--inv-anim-dist:26px}
/* Una tarjeta necesita recorrer más que un renglón para que se lea como que
   entra de un lado; a 26px parece que tiembla. No hay riesgo de barra
   horizontal: el body lleva overflow-x oculto y cada section recorta. */
.inv-ficha-anim{--inv-anim-dist:64px}
.js [data-inv-anim]{animation-fill-mode:both}

/* Las que entran de una pieza.

   El reposo se escribe, no se deduce de la animación.

   Antes la animación estaba puesta desde el principio y sólo pausada, y el
   sitio de partida lo ponía el relleno hacia atrás. Funcionaba mientras el
   retardo fuera cero. Con retardo —que es justo lo que hace que varias
   entren escalonadas— la que espera su turno se dibujaba **en su sitio
   final**: aparecía sin moverse, mientras sus vecinas sí se movían. Se ve en
   cuanto hay tres fichas alternando y no se ve nunca con un texto suelto,
   que es por lo que sobrevivió tanto.

   Así que las entradas se montan al llegar la clase "in", como ya hacían las de
   bucle y las de letra a letra, y hasta entonces el elemento está quieto en
   su posición de partida porque lo dice una regla, no un relleno. */
.js :is([data-inv-anim="aparece"],[data-inv-anim="sube"],[data-inv-anim="baja"],
  [data-inv-anim="izquierda"],[data-inv-anim="derecha"],[data-inv-anim="crece"],
  [data-inv-anim="gira"]):not(.in){opacity:0}
.js [data-inv-anim="sube"]:not(.in){transform:translateY(22px)}
.js [data-inv-anim="baja"]:not(.in){transform:translateY(-22px)}
.js [data-inv-anim="izquierda"]:not(.in){transform:translateX(calc(var(--inv-anim-dist) * -1))}
.js [data-inv-anim="derecha"]:not(.in){transform:translateX(var(--inv-anim-dist))}
.js [data-inv-anim="crece"]:not(.in){transform:scale(.82)}
.js [data-inv-anim="gira"]:not(.in){transform:rotate(-8deg) scale(.88)}

.js [data-inv-anim="aparece"].in{animation:invTxAparece .9s ease
  calc(var(--inv-anim-turno) * 140ms)}
.js [data-inv-anim="sube"].in{animation:invTxSube .9s cubic-bezier(.2,.7,.3,1)
  calc(var(--inv-anim-turno) * 140ms)}
.js [data-inv-anim="baja"].in{animation:invTxBaja .9s cubic-bezier(.2,.7,.3,1)
  calc(var(--inv-anim-turno) * 140ms)}
.js [data-inv-anim="izquierda"].in{animation:invTxIzq .9s cubic-bezier(.2,.7,.3,1)
  calc(var(--inv-anim-turno) * 140ms)}
.js [data-inv-anim="derecha"].in{animation:invTxDer .9s cubic-bezier(.2,.7,.3,1)
  calc(var(--inv-anim-turno) * 140ms)}
.js [data-inv-anim="crece"].in{animation:invTxCrece .85s cubic-bezier(.2,.8,.3,1)
  calc(var(--inv-anim-turno) * 140ms)}
.js [data-inv-anim="gira"].in{animation:invTxGira .95s cubic-bezier(.2,.8,.3,1)
  calc(var(--inv-anim-turno) * 140ms)}

@keyframes invTxAparece{from{opacity:0}to{opacity:1}}
@keyframes invTxSube{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes invTxBaja{from{opacity:0;transform:translateY(-22px)}to{opacity:1;transform:none}}
@keyframes invTxIzq{from{opacity:0;transform:translateX(calc(var(--inv-anim-dist) * -1))}
  to{opacity:1;transform:none}}
@keyframes invTxDer{from{opacity:0;transform:translateX(var(--inv-anim-dist))}
  to{opacity:1;transform:none}}
@keyframes invTxCrece{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:none}}
@keyframes invTxGira{from{opacity:0;transform:rotate(-8deg) scale(.88)}
  to{opacity:1;transform:none}}

/* Las que entran por partes.
   El contenedor no se anima —si no, animaría dos veces— y cada trozo sale a
   su ritmo. inline-block es imprescindible: un transform no le hace nada
   a un elemento en línea, así que sin esto las letras subirían cero. */
.inv-anim-parte{display:inline-block}
.js [data-inv-anim="letras"],.js [data-inv-anim="palabras"],
.js [data-inv-anim="maquina"]{animation:none}
.js :is([data-inv-anim="letras"],[data-inv-anim="palabras"]) .inv-anim-parte{
  opacity:0;transform:translateY(14px)}
.js :is([data-inv-anim="letras"],[data-inv-anim="palabras"]).in .inv-anim-parte{
  animation:invTxParte .55s cubic-bezier(.2,.7,.3,1) both;
  animation-delay:calc(var(--inv-anim-turno) * 140ms + var(--inv-anim-i) * 45ms)}
@keyframes invTxParte{from{opacity:0;transform:translateY(14px)}
  to{opacity:1;transform:none}}

/* La máquina de escribir es lo mismo con el trozo apareciendo de golpe: sin
   fundido ni desplazamiento, que es lo que hace que se lea como tecleado. Y
   más lento entre letra y letra, porque escribir lleva su tiempo. */
.js [data-inv-anim="maquina"] .inv-anim-parte{opacity:0}
.js [data-inv-anim="maquina"].in .inv-anim-parte{
  animation:invTxTecla .01s steps(1,end) both;
  animation-delay:calc(var(--inv-anim-turno) * 140ms + var(--inv-anim-i) * 62ms)}
@keyframes invTxTecla{to{opacity:1}}

/* Las de bucle. No esperan al turno: lo que hacen es no parar. */
.js [data-inv-anim="late"].in{animation:invTxLate 2.4s ease-in-out infinite}
.js [data-inv-anim="flota"].in{animation:invTxFlota 4s ease-in-out infinite}
.js [data-inv-anim="brilla"].in{animation:invTxBrilla 3.2s ease-in-out infinite}
@keyframes invTxLate{0%,100%{transform:scale(1)}48%{transform:scale(1.045)}}
@keyframes invTxFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes invTxBrilla{0%,100%{opacity:1}50%{opacity:.62}}

/* Quien pidió menos movimiento lo ve todo puesto y quieto: ni entradas, ni
   bucles, ni letras sueltas. Con !important porque tiene que ganarle a trece
   reglas que no se conocen entre ellas. */
@media (prefers-reduced-motion:reduce){
  .js [data-inv-anim],.js [data-inv-anim] .inv-anim-parte{
    animation:none!important;opacity:1!important;transform:none!important}
}

/* ── La cortina de apertura ────────────────────────────────────
   Un vídeo a pantalla completa entre el velo y la invitación. Fondo negro
   porque es lo que hace de banda cuando el vídeo no llena la pantalla, y
   porque es el color del que se sale en casi todas las salidas.

   Va por debajo del velo y no encima: mientras el velo se abre, la cortina
   ya está detrás reproduciendo. Entre las dos no hay corte.

   La base no dice **nada** de cómo se va. Eso lo pone entera cada salida, y
   por eso el fundido de siempre es una clase más y no el caso por defecto
   escrito aquí: con un opacity:0 en la base, las salidas que revelan por
   geometría —el telón que sube, el círculo que se abre— tendrían que pelearse
   con él para que el vídeo no se apagara mientras se mueve. */
.inv-cortina{position:fixed;inset:0;z-index:9998;background:#000}
.inv-cortina[hidden]{display:none}
.inv-cortina.fuera{pointer-events:none}
.inv-cortina-video{position:absolute;inset:0;width:100%;height:100%;
  object-fit:cover;background:#000}
.inv-cortina-contener .inv-cortina-video{object-fit:contain}

/* Arriba y no abajo: abajo a la derecha vive el botón de la música, y dos
   controles en la misma esquina es uno de los dos sin pulsar. */
.inv-cortina-saltar{position:absolute;right:16px;top:18px;z-index:3;
  padding:9px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.55);
  background:rgba(0,0,0,.35);color:#fff;font:inherit;font-size:13px;
  letter-spacing:.06em;cursor:pointer;opacity:0;
  transition:opacity .45s ease}
.inv-cortina.lista .inv-cortina-saltar{opacity:.85}
.inv-cortina-saltar:hover{opacity:1}

/* ── Las once salidas ──────────────────────────────────────────
   Cada una declara su transición y su estado final, y ninguna sabe de las
   otras. Las que revelan por geometría —telón, cortinas, círculo, barrido—
   no tocan la opacidad a propósito: el vídeo se ve entero hasta el último
   momento, y lo que descubre la invitación es la forma que se abre, no que
   el vídeo se apague.

   Todas duran lo mismo, y lo que dura sale de una sola variable. Las que van
   en dos tiempos —a negro, destello— reparten ese total en fracciones, así
   que cambiar el número de arriba las mueve a todas a la vez y ninguna se
   queda descolgada. El guion lee esa misma variable para saber cuándo
   retirar la capa: si se toca aquí, no hay un segundo sitio que actualizar. */
.inv-cortina{--inv-cortina-dur:2s}

/* 1 · Fundido. El vídeo se disuelve sobre la invitación. */
.inv-cortina-s-fundido{transition:opacity var(--inv-cortina-dur) ease}
.inv-cortina-s-fundido.fuera{opacity:0}

/* 2 · A negro. Primero se va el vídeo y queda el fondo; después se va el
   fondo. Son dos tiempos y no uno, que es lo que da el respiro de cine. */
.inv-cortina-s-negro{transition:opacity calc(var(--inv-cortina-dur) * .45) ease
  calc(var(--inv-cortina-dur) * .55)}
.inv-cortina-s-negro .inv-cortina-video{
  transition:opacity calc(var(--inv-cortina-dur) * .5) ease}
.inv-cortina-s-negro.fuera{opacity:0}
.inv-cortina-s-negro.fuera .inv-cortina-video{opacity:0}

/* 3 · Destello. Una capa blanca sube de golpe y se va despacio: lo que se
   quema es el corte, y la invitación aparece desde el blanco. */
.inv-cortina-s-destello::after{content:"";position:absolute;inset:0;z-index:2;
  background:#fff;opacity:0;pointer-events:none;
  transition:opacity calc(var(--inv-cortina-dur) * .18) ease}
.inv-cortina-s-destello{transition:opacity calc(var(--inv-cortina-dur) * .75) ease
  calc(var(--inv-cortina-dur) * .25)}
.inv-cortina-s-destello.fuera::after{opacity:1}
.inv-cortina-s-destello.fuera{opacity:0}

/* 4 · Se acerca. El vídeo crece mientras se disuelve. */
.inv-cortina-s-acerca{transition:
  opacity calc(var(--inv-cortina-dur) * .85) ease calc(var(--inv-cortina-dur) * .15),
  transform var(--inv-cortina-dur) cubic-bezier(.36,0,.2,1)}
.inv-cortina-s-acerca.fuera{opacity:0;transform:scale(1.2)}

/* 5 · Se aleja. Al revés: se encoge y deja ver lo que hay detrás. */
.inv-cortina-s-aleja{transition:
  opacity calc(var(--inv-cortina-dur) * .85) ease calc(var(--inv-cortina-dur) * .15),
  transform var(--inv-cortina-dur) cubic-bezier(.36,0,.2,1)}
.inv-cortina-s-aleja.fuera{opacity:0;transform:scale(.86)}

/* 6 · Telón. Sube entero y se lleva el vídeo con él. */
.inv-cortina-s-sube{transition:transform var(--inv-cortina-dur) cubic-bezier(.66,0,.28,1)}
.inv-cortina-s-sube.fuera{transform:translateY(-100%)}

/* 7 · Cae. El mismo telón, hacia el otro lado. */
.inv-cortina-s-baja{transition:transform var(--inv-cortina-dur) cubic-bezier(.66,0,.28,1)}
.inv-cortina-s-baja.fuera{transform:translateY(100%)}

/* 8 · Cortinas. Dos mitades que se apartan.
   Son dos máscaras sobre el mismo elemento —una anclada a la izquierda y otra
   a la derecha— encogiendo cada una hacia su lado. Con una sola capa no se
   puede: un recorte es una región continua y estas son dos que se separan. */
.inv-cortina-s-cortinas{
  -webkit-mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000);
  mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000);
  -webkit-mask-repeat:no-repeat,no-repeat;mask-repeat:no-repeat,no-repeat;
  -webkit-mask-position:left center,right center;mask-position:left center,right center;
  -webkit-mask-size:50.5% 100%,50.5% 100%;mask-size:50.5% 100%,50.5% 100%;
  transition:-webkit-mask-size var(--inv-cortina-dur) cubic-bezier(.66,0,.28,1),
    mask-size var(--inv-cortina-dur) cubic-bezier(.66,0,.28,1)}
.inv-cortina-s-cortinas.fuera{-webkit-mask-size:0% 100%,0% 100%;mask-size:0% 100%,0% 100%}

/* 9 · Círculo. Se cierra sobre el centro y la invitación entra por los bordes.
   El 140% de partida es para que el círculo cubra las esquinas: un 100% deja
   fuera las puntas de la pantalla y se verían cuatro triángulos. */
.inv-cortina-s-circulo{clip-path:circle(140% at 50% 50%);
  transition:clip-path var(--inv-cortina-dur) cubic-bezier(.6,0,.28,1)}
.inv-cortina-s-circulo.fuera{clip-path:circle(0% at 50% 50%)}

/* 10 · Barrido. Un borde que cruza de izquierda a derecha. */
.inv-cortina-s-barrido{clip-path:inset(0 0 0 0);
  transition:clip-path var(--inv-cortina-dur) cubic-bezier(.66,0,.28,1)}
.inv-cortina-s-barrido.fuera{clip-path:inset(0 0 0 100%)}

/* 11 · Desenfoque. Pierde el foco mientras se va, como si la vista pasara
   del vídeo a lo que hay detrás. */
.inv-cortina-s-desenfoque{transition:opacity var(--inv-cortina-dur) ease,
  filter var(--inv-cortina-dur) ease}
.inv-cortina-s-desenfoque.fuera{opacity:0;filter:blur(24px)}

/* Quien pidió menos movimiento no pide menos vídeo: lo que puso quien invita
   sigue estando. Lo que se va es el movimiento — nada de telones, giros,
   recortes ni desenfoques—, y las once salidas se vuelven la misma: un
   fundido corto, que es cambio de luz y no de sitio.

   Con !important porque tiene que ganarle a once reglas que no se conocen
   entre ellas, y es exactamente el caso para el que existe. */
@media (prefers-reduced-motion:reduce){
  .inv-cortina{transition:opacity .4s ease!important}
  .inv-cortina.fuera{opacity:0!important;transform:none!important;
    filter:none!important;clip-path:none!important;
    -webkit-mask-image:none!important;mask-image:none!important}
  .inv-cortina.fuera .inv-cortina-video{opacity:0}
  .inv-cortina-s-destello.fuera::after{opacity:0}
}

/* ── Fondo y adornos por sección ───────────────────────────────
   El fondo cubre la sección entera y va detrás; un adorno es una pieza que
   se coloca en uno de nueve sitios, con su tamaño, su giro y su capa.

   La capa se decide con z-index y no con el orden en el DOM: los adornos se
   añaden al final de la sección, así que sin z-index todos taparían el texto.
   "Debajo" es 0 y "encima" es 4, con el contenido en 1. */
.inv-fondo{position:absolute;inset:0;z-index:0;pointer-events:none}
/* Un fondo de vídeo llena su capa igual que lo haría un background-size:cover.
   Transparente y no negro: Safari pinta de negro un <video> sin poster, y
   detrás del texto eso es un rectángulo negro donde debía estar el color de
   la sección hasta que llega el primer fotograma. */
.inv-fondo-video{display:block;width:100%;height:100%;object-fit:cover;
  background:transparent}
.inv-adorno{position:absolute;line-height:0;pointer-events:none}
.inv-ad-mov,.inv-ad-pieza{display:block;line-height:0}
.inv-adorno img,.inv-adorno video{display:block;width:100%;height:auto}

/* ── Efectos de los adornos ────────────────────────────────────
   Tres capas anidadas y cada una escribe su propio transform, porque las
   tres lo quieren y la ultima gana: la caja hace la entrada (una vez), la de
   dentro el movimiento (en bucle) y la ultima el giro y el volteo (fijos).

   La entrada la dispara el mismo observador de scroll que las secciones: el
   adorno lleva .inv-ad-entra y recibe .in al asomarse. Se observa cada
   adorno por separado y no su seccion, porque uno abajo del todo tiene que
   esperar a que se llegue a el.

   Sin JavaScript no hay .in y nunca llegaria: por eso el estado de partida
   vive bajo .js, igual que el resto del movimiento del sitio. Sin JS el
   adorno sale puesto y ya. */
/* Sin JS no hay observador, no llega el .in y el adorno se quedaria
   invisible para siempre: por eso la base es la opacidad elegida y solo
   bajo .js se parte de cero. */
.inv-ad-entra{opacity:var(--inv-ad-op,1)}
.js .inv-ad-entra{opacity:0}
.js .inv-ad-entra.in{
  animation:var(--inv-ad-anim) .85s cubic-bezier(.2,.7,.3,1) both;
  animation-delay:var(--inv-ad-espera,0ms)}
.inv-ad-e-aparece{--inv-ad-anim:invAdAparece}
.inv-ad-e-sube{--inv-ad-anim:invAdSube}
.inv-ad-e-crece{--inv-ad-anim:invAdCrece}
.inv-ad-e-gira{--inv-ad-anim:invAdGira}
.inv-ad-e-desliza{--inv-ad-anim:invAdDesliza}

/* Todas terminan en la opacidad que se eligio, no en 1. */
@keyframes invAdAparece{from{opacity:0}to{opacity:var(--inv-ad-op,1)}}
@keyframes invAdSube{from{opacity:0;transform:translateY(26px)}
  to{opacity:var(--inv-ad-op,1);transform:none}}
@keyframes invAdCrece{from{opacity:0;transform:scale(.72)}
  to{opacity:var(--inv-ad-op,1);transform:none}}
@keyframes invAdGira{from{opacity:0;transform:rotate(-14deg) scale(.82)}
  to{opacity:var(--inv-ad-op,1);transform:none}}
@keyframes invAdDesliza{from{opacity:0;transform:var(--inv-ad-desde,translateY(24px))}
  to{opacity:var(--inv-ad-op,1);transform:none}}

/* Lentos y largos a proposito: un adorno que se mueve rapido deja de ser
   adorno y se vuelve lo primero que se mira. */
.inv-ad-m-flota{animation:invAdFlota 6s ease-in-out infinite}
.inv-ad-m-balancea{animation:invAdBalancea 7s ease-in-out infinite;
  transform-origin:50% 12%}
.inv-ad-m-late{animation:invAdLate 5s ease-in-out infinite}
.inv-ad-m-respira{animation:invAdRespira 5.5s ease-in-out infinite}
/* Una vuelta por minuto: se nota que gira si se mira, y no se nota si no.
   Para soles, mandalas y coronas, que son redondos y giran sin cambiar de
   silueta. */
.inv-ad-m-gira{animation:invAdGiraLento 60s linear infinite}

@keyframes invAdFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes invAdBalancea{0%,100%{transform:rotate(-2.2deg)}50%{transform:rotate(2.2deg)}}
@keyframes invAdLate{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
@keyframes invAdRespira{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes invAdGiraLento{to{transform:rotate(360deg)}}

/* El destello: una barra de luz que cruza, recortada con la silueta del
   propio adorno. La mascara es la misma imagen, asi que la luz sigue los
   trazos de una filigrana en vez de barrer su rectangulo.

   Se anima transform de la barra y no la posicion del degradado: lo
   segundo repinta en cada fotograma, y con ocho adornos por seccion eso se
   siente en un telefono. */
.inv-ad-luz{position:absolute;inset:0;overflow:hidden;pointer-events:none;
  -webkit-mask-image:var(--inv-ad-mask);mask-image:var(--inv-ad-mask);
  -webkit-mask-size:100% 100%;mask-size:100% 100%;
  -webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
  mix-blend-mode:overlay}
.inv-ad-luz i{position:absolute;top:-25%;bottom:-25%;left:0;width:55%;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.95),transparent);
  animation:invAdDestello 4.2s ease-in-out infinite}
@keyframes invAdDestello{
  0%{transform:translateX(-160%)}
  55%,100%{transform:translateX(320%)}}

@media (prefers-reduced-motion:reduce){
  .js .inv-ad-entra{opacity:var(--inv-ad-op,1)}
  .js .inv-ad-entra.in{animation:none}
  .inv-ad-m-flota,.inv-ad-m-balancea,.inv-ad-m-late,.inv-ad-m-respira,.inv-ad-m-gira,
  .inv-ad-luz i{animation:none}
  .inv-ad-luz{display:none}
}

/* En el flujo, centrados y empujando lo que viene debajo: el de bajo el
   título y el que preside la sección desde arriba. */
.inv-adorno.inv-ad-titulo{position:static;margin:2px auto 18px}
.inv-adorno.inv-ad-cabecera{position:static;margin:0 auto 14px}
.inv-ad-arriba-izq{top:0;left:0}
.inv-ad-arriba{top:0;left:50%;translate:-50% 0}
.inv-ad-arriba-der{top:0;right:0}
.inv-ad-izq{top:50%;left:0;translate:0 -50%}
.inv-ad-centro{top:50%;left:50%;translate:-50% -50%}
.inv-ad-der{top:50%;right:0;translate:0 -50%}
.inv-ad-abajo-izq{bottom:0;left:0}
.inv-ad-abajo{bottom:0;left:50%;translate:-50% 0}
.inv-ad-abajo-der{bottom:0;right:0}
/* Libre: las dos coordenadas marcan el centro de la pieza, no su esquina.
   Por eso el translate del 50%: es lo que hace que "50 y 0" sea el adorno
   centrado sobre el borde de arriba y no colgando a su derecha. */
.inv-ad-libre{left:var(--inv-ad-x,50%);top:var(--inv-ad-y,50%);translate:-50% -50%}
/* A sangre: cubre la sección y recorta lo que sobre. */
.inv-ad-sangre{inset:0}
.inv-ad-sangre img,.inv-ad-sangre video{width:100%;height:100%;object-fit:cover}

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

/* El relleno y el centrado son de la sección **suelta**: la que nace al lado
   porque el diseño no tiene esa sección o porque se agregó una de más. Un
   bloque que entra dentro de una sección del diseño no los quiere —ahí manda
   la maquetación del diseño, que puede ir alineada a la izquierda—. */
.inv-block-suelto{position:relative;padding:64px 22px;text-align:center}
/* Centrado siempre: algunos diseños alinean a la izquierda desde un selector
   de id, que gana a cualquier clase nuestra. */
.inv-block-suelto :is(p,h1,h2,h3,h4,h5,li,span,div,figcaption,label,time){text-align:center !important}
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

/* Programa · Itinerario — medallón, hilo y texto a la derecha.

   Tres columnas invisibles: el medallón, el hilo con su punto, y el texto.
   Se montan con posicionado y no con una rejilla porque el hilo tiene que
   correr por detrás de todas las fichas, y una rejilla lo cortaría en cada
   una.

   El orden del texto se reordena con CSS y no se toca el marcado: la ficha
   viene con tipo, título, hora, lugar, nota y botón en ese orden, y de esas
   clases cuelgan los bindings. Aquí manda título, luego la nota como
   descripción y luego la hora, que es como se lee un itinerario: qué pasa,
   qué es, y a qué hora. */
.inv-ev-itinerario{position:relative;display:flex;flex-direction:column;
  gap:30px;margin-top:32px;padding-left:86px;text-align:left}
.inv-ev-itinerario::before{content:"";position:absolute;left:70px;top:30px;bottom:30px;
  width:2px;background:currentColor;opacity:.16}

/* La ficha pierde su caja: aquí el fondo lo pone el hilo, no un recuadro. */
.inv-ev-itinerario .event-card{position:relative;display:flex;flex-direction:column;
  align-items:flex-start;gap:3px;padding:0;background:none;border:0;box-shadow:none;
  text-align:left;min-height:62px;justify-content:center}

.inv-ev-itinerario .event-icon{position:absolute;left:-86px;top:50%;
  transform:translateY(-50%);display:flex;align-items:center;justify-content:center;
  width:60px;height:60px;margin:0;border-radius:50%;
  background:var(--inv-accent);color:var(--inv-on-accent);
  font-size:26px;line-height:1}
.inv-ev-itinerario .event-icon svg{width:28px;height:28px}
/* Un momento sin icono no deja un disco de color vacío, que se lee como que
   algo no cargó. El hilo y su punto se quedan: la línea del itinerario no
   depende de que cada momento tenga dibujo. */
.inv-ev-itinerario .event-icon:empty{display:none}

/* El punto sobre el hilo, alineado con el medallón. */
.inv-ev-itinerario .event-card::before{content:"";position:absolute;left:-19px;top:50%;
  width:8px;height:8px;margin-top:-4px;border-radius:50%;background:currentColor;opacity:.55}

.inv-ev-itinerario .event-title{order:1;margin:0;font-size:var(--fs-h3)}
.inv-ev-itinerario .event-note{order:2;margin:0;opacity:.78;font-style:normal}
.inv-ev-itinerario .event-time{order:3;margin:0;font-variant-numeric:tabular-nums}
.inv-ev-itinerario .event-type{order:0;margin:0}
.inv-ev-itinerario .event-place{order:4;margin:2px 0 0;font-size:.9em;opacity:.72}
.inv-ev-itinerario .event-map-btn{order:5;margin-top:8px}

/* En pantallas muy estrechas el medallón se come el texto. */
@media (max-width:380px){
  .inv-ev-itinerario{padding-left:66px}
  .inv-ev-itinerario::before{left:52px}
  .inv-ev-itinerario .event-icon{left:-66px;width:46px;height:46px;font-size:20px}
  .inv-ev-itinerario .event-icon svg{width:22px;height:22px}
  .inv-ev-itinerario .event-card::before{left:-17px}
}

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

/* ── Cómo entra cada sección ──
   El mecanismo es el de siempre: la sección empieza corrida y el observador
   le pone la clase de llegada cuando se asoma. Aquí sólo se cambia desde
   dónde llega. Las dos reglas de cada dirección van juntas —la de partida y
   la de llegada— porque la de llegada del diseño se escribe antes que esto
   y, a igual especificidad, gana la última. */
.js .reveal.inv-ent-derecha{opacity:0;transform:translateX(44px)}
.js .reveal.inv-ent-izquierda{opacity:0;transform:translateX(-44px)}
.js .reveal.inv-ent-sube{opacity:0;transform:translateY(34px)}
.js .reveal.inv-ent-baja{opacity:0;transform:translateY(-34px)}
.js .reveal.inv-ent-aparece{opacity:0;transform:none}
.js .reveal.inv-ent-crece{opacity:0;transform:scale(.9)}
.js .reveal.inv-ent-gira{opacity:0;transform:rotate(-2.5deg) scale(.96)}
.js .reveal:is(.inv-ent-derecha,.inv-ent-izquierda,.inv-ent-sube,.inv-ent-baja,
  .inv-ent-aparece,.inv-ent-crece,.inv-ent-gira).in{opacity:1;transform:none}
/* «Ninguna» es lo contrario: la sección ya está puesta y no espera a nada. */
.js .reveal.inv-ent-ninguna{opacity:1;transform:none;transition:none}

/* Portada «sólo la foto»: la tapa y la flecha, y nada encima.
   Lleva !important porque cada diseño coloca .hero-content con su propia
   regla y varias son más específicas que ésta: es la excepción donde gana
   el ajuste de la invitación sobre el diseño. */
#hero.hero-limpia .hero-content,#hero.hero-limpia .hero-foto{display:none !important}
#hero.hero-limpia::before,#hero.hero-limpia::after{opacity:.35}

/* Galería · Tres y dos
   La rejilla de un álbum de boda: tres verticales arriba, dos apaisadas
   debajo y vuelta a empezar. Seis columnas y no tres, que es lo que deja
   repartir la fila de dos en mitades exactas alineadas con la de tres. */
.inv-ga-tresydos{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:26px}
.inv-ga-tresydos .gallery-item{grid-column:span 2;aspect-ratio:2/3;border-radius:2px;overflow:hidden}
.inv-ga-tresydos .gallery-item:nth-child(5n+4),
.inv-ga-tresydos .gallery-item:nth-child(5n+5){grid-column:span 3;aspect-ratio:3/2}
/* Una sola foto en la fila de abajo ocupa el ancho entero, que si no queda
   media fila vacía; y si sólo hay una o dos en total, mandan ellas. */
.inv-ga-tresydos .gallery-item:nth-child(5n+4):last-child{grid-column:span 6;aspect-ratio:16/10}
.inv-ga-tresydos .gallery-ph{width:100%;height:100%}

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

/* Galería · Mampostería
   Alturas distintas que encajan entre si, sin los huecos de una cuadricula.
   Se hace con columnas de CSS y no con grid: grid-template-rows: masonry
   sigue sin estar en los navegadores que importan, y columns lo resuelve
   hoy en todos.

   Lo que da la altura variable es un ciclo de proporciones por posicion. Las
   fotos que sube el organizador tienen cualquier forma, pero aqui se recortan
   igual que en las demas galerias, asi que la variedad hay que declararla. */
/* display:block no es decoracion: .gallery-grid viene en grid desde el CSS
   del diseño, y columns no hace nada en un contenedor de grid. Con grid
   activo salian tres columnas de 109px en vez de dos anchas, que es
   justamente lo contrario de una mamposteria. */
.inv-ga-mamposteria{display:block;columns:2;column-gap:10px;margin-top:26px}
/* width:100% no sobra: varios diseños le dan a .gallery-item un ancho o un
   flex-basis propio, y sin esto las fotos salian a 109px dentro de una
   columna de 168 y la mamposteria quedaba con calles de aire. */
.inv-ga-mamposteria .gallery-item{width:100%;break-inside:avoid;margin:0 0 10px;
  border-radius:var(--inv-radius);overflow:hidden}
.inv-ga-mamposteria .gallery-ph{width:100%;height:100%}
.inv-ga-mamposteria .gallery-item:nth-child(5n+1){aspect-ratio:3/4}
.inv-ga-mamposteria .gallery-item:nth-child(5n+2){aspect-ratio:1}
.inv-ga-mamposteria .gallery-item:nth-child(5n+3){aspect-ratio:4/5}
.inv-ga-mamposteria .gallery-item:nth-child(5n+4){aspect-ratio:1}
.inv-ga-mamposteria .gallery-item:nth-child(5n+5){aspect-ratio:2/3}
@media (min-width:720px){ .inv-ga-mamposteria{columns:3} }

/* Galería · Cinta continua
   Se desplazan solas: no hay que arrastrar ni pulsar nada, que en una
   invitacion que se abre de pie en el bus es la diferencia entre que se vean
   las fotos y que no.

   El renderer duplica las fotos una vez (ver duplicarCinta) y la tira se
   mueve media anchura: al llegar, la segunda copia esta exactamente donde
   estaba la primera y el salto no se ve. Sin duplicar, el bucle pegaria un
   tiron cada vuelta.

   Se anima transform y no scroll: lo segundo obliga a JavaScript en cada
   fotograma. */
.inv-ga-cinta-marco{margin-top:26px;overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.inv-ga-cinta{display:flex;gap:12px;width:max-content;
  animation:invGaCinta 42s linear infinite}
.inv-ga-cinta .gallery-item{flex:0 0 46vw;max-width:260px;aspect-ratio:4/5;
  border-radius:var(--inv-radius);overflow:hidden}
.inv-ga-cinta .gallery-ph{width:100%;height:100%}
@keyframes invGaCinta{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.inv-ga-cinta-quieta{animation:none;justify-content:center;width:100%}
/* Al pasar el dedo o el raton se detiene, para poder mirar una. */
.inv-ga-cinta-marco:hover .inv-ga-cinta,
.inv-ga-cinta-marco:active .inv-ga-cinta{animation-play-state:paused}

/* Galería · Collage
   Superpuestas y ladeadas, como fotos sueltas sobre una mesa. El solape va
   con margenes negativos y no con posicion absoluta: asi la caja sigue
   creciendo con las fotos que haya, y con tres o con siete no se descuadra. */
.inv-ga-collage{display:flex;flex-wrap:wrap;justify-content:center;
  align-items:flex-start;margin-top:30px;padding:0 6px}
.inv-ga-collage .gallery-item{flex:0 0 44%;max-width:210px;aspect-ratio:4/5;
  border-radius:3px;overflow:hidden;background:var(--inv-surface);
  border:5px solid var(--inv-surface);
  box-shadow:0 6px 18px rgba(0,0,0,.16)}
.inv-ga-collage .gallery-ph{width:100%;height:100%}
.inv-ga-collage .gallery-item:nth-child(3n+1){transform:rotate(-3deg);z-index:1}
.inv-ga-collage .gallery-item:nth-child(3n+2){transform:rotate(2.4deg);z-index:3;
  margin-left:-22px;margin-top:26px}
.inv-ga-collage .gallery-item:nth-child(3n+3){transform:rotate(-1.4deg);z-index:2;
  margin-left:-14px;margin-top:-10px}
.inv-ga-collage .gallery-item:nth-child(n+4){margin-top:-26px}

@media (prefers-reduced-motion:reduce){
  /* Sin movimiento la cinta no se veria entera: pasa a poderse arrastrar. */
  .inv-ga-cinta{animation:none}
  .inv-ga-cinta-marco{overflow-x:auto;-webkit-overflow-scrolling:touch}
}

.inv-fe-tarjetas{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:28px}
.inv-fe-lista{display:flex;flex-direction:column;gap:10px;margin-top:28px}
.inv-fe-lista .feature-card{display:grid;grid-template-columns:auto 1fr;column-gap:16px;text-align:center;padding:18px 20px}
.inv-fe-lista .feature-icon{grid-column:1;grid-row:1 / span 3;align-self:center;font-size:26px}
.inv-fe-lista .feature-card>:not(.feature-icon){grid-column:2;margin:0}

.inv-foto{margin:0}
.inv-foto-pie{margin-top:10px;text-align:center;font-size:12.5px;opacity:.68}
.inv-foto .gallery-item{overflow:hidden}
.inv-block-suelto.inv-v-completa{padding:0}
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

.inv-block-suelto.inv-v-ancho{padding:0}
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

  // Los pases del enlace: lo que quien invita reservó para esta familia.
  var pases = parseInt(form.getAttribute('data-inv-pases') || '', 10);
  var lineaPases = form.querySelector('[data-inv-pases-texto]');
  var numPases = lineaPases && lineaPases.querySelector('.inv-rsvp-pases-n');
  var txtPases = lineaPases && lineaPases.querySelector('.inv-rsvp-pases-t');
  if (pases > 0 && lineaPases) {
    if (numPases) numPases.textContent = String(pases);
    if (txtPases) txtPases.textContent = pases === 1 ? 'pase reservado' : 'pases reservados';
    lineaPases.hidden = false;
  }

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
      /* Con pases, sólo se pueden marcar tantos como pases haya: al marcar
         uno de más se desmarca solo y se avisa en la línea de arriba. */
      if (pases > 0 && casillas.length > pases) {
        casillas.forEach(function(c, i){ if (i >= pases) c.checked = false; });
        casillas.forEach(function(c){
          c.addEventListener('change', function(){
            var marcadas = casillas.filter(function(x){ return x.checked; }).length;
            if (marcadas > pases) {
              c.checked = false;
              if (txtPases) txtPases.textContent = 'sólo hay ' + pases + ' pases';
            }
          });
        });
      }
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
    // La canción va pegada al mensaje: la respuesta sigue siendo una sola y
    // quien invita la lee en el tablero sin ninguna columna nueva.
    if (body.cancion) {
      var pedido = String(body.cancion).trim();
      delete body.cancion;
      if (pedido) body.note = (body.note ? String(body.note).trim() + ' · ' : '') + '\u266a ' + pedido;
    } else { delete body.cancion; }
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
  a.id = 'inv-musica';
  a.src = ${JSON.stringify(url)}; a.loop = true; a.preload = 'none';
  document.body.appendChild(a);
  var btn = document.getElementById('music-btn');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'music-btn';
    btn.textContent = '\\u266a';
    /* 9990 y no 9998: por encima de la invitación, por debajo del velo y de
       la cortina de apertura. Con 9998 el botón se montaba sobre la cortina
       y se comía el clic del botón de saltar, que estaba en su misma esquina:
       un vídeo que no se podía saltar ni con el botón puesto. */
    btn.setAttribute('style','position:fixed;right:16px;bottom:16px;z-index:9990;width:44px;height:44px;'+
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

/**
 * Un fondo de vídeo, para quien pidió menos movimiento.
 *
 * Es lo único del sitio que se mueve sin parar y que el CSS no puede detener:
 * `prefers-reduced-motion` apaga animaciones y transiciones, pero un `<video>`
 * en bucle no es ni lo uno ni lo otro y sigue corriendo detrás del texto.
 *
 * Parado en su primer fotograma el fondo no desaparece: se queda exactamente
 * como la foto que habría puesto quien no quiso vídeo.
 */
const FONDO_VIDEO_JS = `
(function(){
  if (!window.matchMedia || !matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var v = document.querySelectorAll('.inv-fondo-video');
  for (var i = 0; i < v.length; i++) {
    /* Quitarlos además de parar: sin esto, un vídeo al que todavía no le
       había llegado el turno de reproducirse arranca después del pause. */
    v[i].removeAttribute('autoplay');
    v[i].removeAttribute('loop');
    v[i].pause();
  }
})();`;

/**
 * Las aperturas del velo que se aceptan. Lo que no esté aquí se ignora.
 *
 * Cada una es una clase `inv-velo-…` sobre `#splash` y una regla en el CSS
 * inyectado; no hay marcado nuevo, así que funcionan igual en los 49 diseños
 * y en los que vengan.
 */
const APERTURAS = new Set(["sobre", "sello", "deseo", "libro", "abanico", "nubes", "telon", "anillos", "ventana", "claqueta", "mariposa", "escarcha", "naipe", "jardin"]);

/**
 * Cómo la cortina da paso a la invitación.
 *
 * Cada una es una clase y un bloque de CSS que no sabe de las demás, así que
 * añadir la doceava es escribir su regla y su nombre aquí. El fundido es una
 * más y no el caso por defecto del CSS: ver el comentario de la base.
 */
const SALIDAS = new Set([
  "fundido", "negro", "destello", "acerca", "aleja",
  "sube", "baja", "cortinas", "circulo", "barrido", "desenfoque",
]);

/**
 * La cortina de apertura: un vídeo a pantalla completa al entrar.
 *
 * Se cuelga de `enterSite`, que definen los 49 diseños en su propio script y
 * que el botón del velo llama por nombre. Envolverla —guardar la de antes y
 * poner una nuestra encima— es lo que deja añadir esto sin reconstruir un
 * solo template.
 *
 * El pulsar del botón es lo que hace posible todo lo demás: es el gesto del
 * usuario que los navegadores exigen para dejar sonar un vídeo. Una cortina
 * que se reprodujera sola al abrir el enlace sería obligatoriamente muda.
 *
 * Lo que más importa aquí no es el efecto, es no dejar a nadie encerrado. Una
 * cortina que se queda puesta es una invitación que no se puede leer, y hay
 * cuatro maneras de que eso pase: que el vídeo no cargue, que el navegador se
 * niegue a reproducirlo, que `ended` no llegue nunca —pasa con archivos de
 * duración mal escrita— o que quien la abre sencillamente no quiera verlo.
 * Las cuatro tienen salida: `error`, el rechazo de `play()`, dos relojes y el
 * botón de saltar. Ante la duda, la cortina se va.
 */
const CORTINA_JS = `
(function(){
  var c = document.querySelector('.inv-cortina');
  if (!c) return;
  var v = c.querySelector('.inv-cortina-video');
  /* Sin vídeo dentro no es esta cortina: se sale sin tocar nada. Sin esta
     línea, cualquier otra cosa que se llamara igual tumbaba el resto de los
     scripts, que van todos en el mismo bloque. */
  if (!v) return;
  var saltar = c.querySelector('.inv-cortina-saltar');
  var velo = document.getElementById('splash');
  /* Con sonido, la música de fondo espera: dos audios a la vez no es
     ambiente, es ruido. Muda la cortina, que suene la música encima. */
  var musica = v.hasAttribute('muted') ? null : document.getElementById('inv-musica');

  /* Lo que se ve de la cortina, como mucho. Ver el comentario de abajo. */
  var TOPE = 5000;
  /* Cuánto se espera a que el vídeo tenga imagen antes de renunciar a él.
     Cuatro segundos es mucho para una espera y poco para una descarga mala:
     pasado eso vale más entrar a la invitación sin cortina que seguir
     mirando el velo. */
  var ESPERA_MAX = 4000;

  var fuera = false, abierto = false, reloj = null, relojEspera = null;

  function callar(){ if (musica && !fuera) musica.pause(); }
  function soltarMusica(){
    if (!musica) return;
    musica.removeEventListener('play', callar);
    musica.play().catch(function(){});
  }

  /* Entrar a la invitación. Se llama una sola vez, con cortina o sin ella. */
  function abrir(){
    if (abierto) return;
    abierto = true;
    clearTimeout(relojEspera);
    if (velo) velo.classList.remove('inv-velo-esperando');
    if (typeof previo === 'function') previo();
  }

  /* Renunciar al vídeo: se entra igual, sin cortina. Más vale una invitación
     sin cortina que una cortina en negro. */
  function renunciar(){
    if (fuera) return;
    fuera = true;
    clearTimeout(reloj);
    try { v.pause(); } catch (e) {}
    c.setAttribute('hidden', '');
    abrir();
    document.body.style.overflow = '';
    soltarMusica();
  }

  function irse(){
    if (fuera) return;
    fuera = true;
    clearTimeout(reloj);
    c.classList.add('fuera');
    document.body.style.overflow = '';
    try { v.pause(); } catch (e) {}
    /* Se esconde del todo al terminar: una capa a opacidad cero sigue
       estando, y con ella encima no se puede tocar nada. Se espera al
       'transitionend' y no a un número fijo porque las once salidas duran
       cosas distintas, y un número fijo o corta la más larga o deja la más
       corta esperando. El reloj es el respaldo: una transición sobre una
       propiedad que el navegador no anime no dispara nada. */
    var quitar = function(e){ if (!e || e.target === c) c.setAttribute('hidden', ''); };
    c.addEventListener('transitionend', quitar);
    /* El respaldo sale de la misma variable que usa el CSS, no de un número
       escrito aquí: así cambiar lo que dura el efecto es tocar un sitio y no
       dos. */
    var dur = parseFloat(getComputedStyle(c).getPropertyValue('--inv-cortina-dur')) || 2;
    setTimeout(quitar, dur * 1000 + 700);
    soltarMusica();
  }

  /* El vídeo ya tiene imagen: ahora sí se enseña todo a la vez.
     Éste es el arreglo de fondo. Antes la cortina se destapaba en el mismo
     clic y el vídeo empezaba cuando podía, así que con la descarga a medias
     se veía un rectángulo negro — medido, un segundo entero en una conexión
     mala. Ahora lo que destapa la cortina es el propio vídeo al arrancar, no
     el clic, así que no hay forma de verla antes de que haya imagen. */
  function mostrar(){
    if (fuera || c.hasAttribute('hidden') === false) return;
    clearTimeout(relojEspera);
    c.removeAttribute('hidden');
    c.classList.add('lista');
    /* El scroll se bloquea **aquí** y no en el clic: si al final no hay
       cortina, nunca llegó a bloquearse y no hay nada que devolver. */
    document.body.style.overflow = 'hidden';
    abrir();
    reloj = setTimeout(irse, TOPE);
  }

  var previo = window.enterSite;
  window.enterSite = function(){
    /* La música arranca con el primer clic de la página, que es justo éste, y
       lo hace después de este manejador: por eso no basta con pararla ahora,
       hay que volver a pararla cuando lo intente. */
    if (musica) { musica.pause(); musica.addEventListener('play', callar); }

    /* play() va dentro del clic aunque el vídeo todavía no tenga datos, y
       eso no es un descuido: es lo único que conserva el gesto del usuario.
       Pedirlo más tarde, cuando ya esté cargado, sería una reproducción sin
       gesto — y un vídeo con sonido no arrancaría. Lo que se aplaza es
       enseñarlo, no pedirlo. */
    var p = v.play();
    if (p && p.catch) p.catch(renunciar);

    v.addEventListener('playing', mostrar, { once: true });
    /* Si ya venía reproduciéndose, el evento no volverá a llegar. */
    if (!v.paused && v.readyState >= 3) mostrar();

    if (!abierto) {
      /* Mientras se espera, el velo se queda: mirar el velo es mejor que
         mirar un rectángulo negro. Se marca para que el botón pueda decir
         que está trabajando. */
      if (velo) velo.classList.add('inv-velo-esperando');
      relojEspera = setTimeout(renunciar, ESPERA_MAX);
    }
  };

  v.addEventListener('ended', irse);
  v.addEventListener('error', renunciar);
  saltar.addEventListener('click', irse);
})();`;

/**
 * Arrastrar un adorno sobre la vista previa.
 *
 * Los dos deslizadores de «libre» colocan a ciegas: se mueve un número, se
 * mira, se corrige. Esto es lo mismo por el otro extremo — se agarra la pieza
 * y se suelta donde va— y acaba escribiendo **en los mismos dos campos**, así
 * que ni hay un segundo modelo de datos ni hay nada que sincronizar.
 *
 * Arrastrar un adorno anclado lo pasa a libre en el sitio donde se soltó: es
 * lo que se espera al mover algo con el dedo, y es lo que evita explicar la
 * diferencia entre las dos cosas.
 *
 * El editor sólo se entera **al soltar**. Avisarle mientras se mueve
 * dispararía un render de la invitación entera por fotograma; durante el
 * arrastre la pieza se mueve aquí, con estilo en línea, que le gana a la
 * regla del anclaje sin tener que quitar clases.
 *
 * Va únicamente en la vista previa: en una invitación publicada esto sería un
 * guion que deja mover la decoración a quien la recibe.
 */
const ADORNO_ARRASTRE_JS = `
(function(){
  var cajas = document.querySelectorAll('[data-inv-adorno]');
  if (!cajas.length) return;

  /* Se anuncia lo que se puede agarrar: sin esto, que un adorno se mueva es
     un secreto. El contorno va en :hover para no ensuciar la vista previa. */
  var css = document.createElement('style');
  css.textContent =
    '[data-inv-adorno]{pointer-events:auto;cursor:grab;touch-action:none}' +
    '[data-inv-adorno]:hover{outline:1px dashed rgba(59,130,246,.9);outline-offset:3px}' +
    '[data-inv-adorno].inv-ad-agarrado{cursor:grabbing;outline:1px solid rgba(59,130,246,1)}' +
    /* Una franja mínima para agarrar. Un adorno ancho y fino —una filigrana
       de separación— mide seis píxeles de alto y es casi imposible de coger;
       y mientras su imagen carga mide cero. Va en un pseudoelemento absoluto
       a propósito: así el área de agarre crece sin que la caja cambie de
       tamaño, que movería la pieza respecto a donde de verdad está. */
    '[data-inv-adorno]::before{content:"";position:absolute;left:0;right:0;' +
      'top:50%;height:28px;translate:0 -50%}';
  document.head.appendChild(css);

  for (var i = 0; i < cajas.length; i++) preparar(cajas[i]);

  function preparar(caja){
    caja.addEventListener('pointerdown', function(e){
      /* La sección es quien define el sistema de coordenadas: el renderer le
         pone position:relative justo para esto. */
      var sec = caja.offsetParent;
      if (!sec) return;
      e.preventDefault();
      e.stopPropagation();

      var r = sec.getBoundingClientRect();
      if (!r.width || !r.height) return;
      caja.setPointerCapture(e.pointerId);
      caja.classList.add('inv-ad-agarrado');
      var x = 50, y = 50;

      function mover(ev){
        x = Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100));
        y = Math.max(0, Math.min(100, ((ev.clientY - r.top) / r.height) * 100));
        /* En línea para ganarle al anclaje sin tocar las clases, y se anulan
           right/bottom porque un adorno anclado a la derecha los tiene
           puestos y pelearían con el left nuevo. */
        caja.style.left = x.toFixed(1) + '%';
        caja.style.top = y.toFixed(1) + '%';
        caja.style.right = 'auto';
        caja.style.bottom = 'auto';
        caja.style.translate = '-50% -50%';
      }

      function soltar(ev){
        caja.releasePointerCapture(e.pointerId);
        caja.classList.remove('inv-ad-agarrado');
        caja.removeEventListener('pointermove', mover);
        caja.removeEventListener('pointerup', soltar);
        caja.removeEventListener('pointercancel', soltar);
        var partes = String(caja.getAttribute('data-inv-adorno')).split(':');
        parent.postMessage({
          inv: 'adorno', seccion: partes[0], i: Number(partes[1]),
          x: Math.round(x), y: Math.round(y)
        }, '*');
      }

      mover(e);
      caja.addEventListener('pointermove', mover);
      caja.addEventListener('pointerup', soltar);
      caja.addEventListener('pointercancel', soltar);
    });
  }
})();`;

/**
 * Dispara la animación de cada texto cuando se asoma.
 *
 * Observador propio y no el del esqueleto: aquél busca `.reveal` y
 * `.inv-ad-entra` con una lista escrita dentro de cada uno de los 50
 * templates, así que sumarse a ella obligaría a regenerarlos todos y dejaría
 * fuera a los diseños que vengan. Éste vive en el renderer y llega a todos
 * por igual.
 *
 * Cada texto se observa por su cuenta y no por su sección: uno abajo del todo
 * tiene que esperar a que se llegue a él, aunque su sección lleve rato en
 * pantalla. Es la misma razón por la que los adornos se observan sueltos.
 *
 * Sin `IntersectionObserver` se pone todo de una: más vale la invitación
 * entera visible que un texto que nunca aparece.
 */
const TEXTO_ANIM_JS = `
(function(){
  var textos = [].slice.call(document.querySelectorAll('[data-inv-anim]'));
  if (!textos.length) return;

  if (!window.IntersectionObserver) {
    for (var i = 0; i < textos.length; i++) textos[i].classList.add('in');
    return;
  }

  var obs = new IntersectionObserver(function(items){
    for (var i = 0; i < items.length; i++) {
      if (!items[i].isIntersecting) continue;
      items[i].target.classList.add('in');
      /* Una entrada corre una vez; las de bucle ya no necesitan al
         observador tampoco, porque la clase se queda puesta. */
      obs.unobserve(items[i].target);
    }
  }, { threshold: .18 });

  for (var j = 0; j < textos.length; j++) obs.observe(textos[j]);
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
      const reglas = fontRules(scopeSel, root, ops, `font-family:${font.css}`);
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
      const reglas = fontRules(
        scopeSel, ficha, lb.fields[f.key] || [], `font-family:${font.css}`, fichaSel
      );
      if (reglas.length) {
        fontCss.push(...reglas);
        fontIds.add(font.id);
      }
    }
  };
  /**
   * El color y la alineación de cada texto, por campo.
   *
   * La sección ya tenía uno —`textColor`, que pinta todo lo suyo— y esto es
   * el mismo mecanismo un escalón más abajo: el antetítulo en dorado y el
   * título en tinta, dentro de la misma sección.
   *
   * Gana al de la sección sin pelear por el orden: aquél apunta a
   * `${sel} *`, éste al selector concreto del campo, que es más específico.
   * Y se emite después, así que también gana en un empate.
   *
   * No excluye botones ni enlaces como hace el de la sección: allí la regla
   * barre todo lo que hay dentro y había que proteger su contraste; aquí se
   * señaló **este** campo, y si el campo es el texto de un botón, es que se
   * quería el texto de ese botón.
   *
   * Las dos en la misma pasada porque las dos son lo mismo visto de lejos:
   * una declaración CSS sobre los selectores de un campo. Separarlas serían
   * dos funciones idénticas salvo por una línea.
   */
  const collectColors = (
    spec: (typeof SPEC)[number],
    scopeSel: string | undefined,
    root: El,
    section: InvitationData[string]
  ) => {
    const colores = (section?.colors || {}) as Record<string, string>;
    const alineaciones = (section?.align || {}) as Record<string, string>;
    const tamanos = (section?.size || {}) as Record<string, string>;

    /** Lo que hay que escribir para un campo: puede ser ninguna o las dos. */
    const declara = (clave: string): string[] => {
      const out: string[] = [];
      const color = String(colores[clave] || "").trim();
      if (HEX.test(color)) out.push(`color:${color}`);
      const al = CSS_ALINEACION[String(alineaciones[clave] || "").trim()];
      if (al) out.push(`text-align:${al}`);

      /*
       * El tamaño, como porcentaje de lo que el diseño le dio.
       *
       * Con `font-size` no se puede: lo que haría falta es "un 30% más que
       * ahora", y en CSS no hay forma de referirse al tamaño propio de un
       * elemento — `1em` dentro de un `font-size` mide contra el **padre**,
       * así que un título de 48px sobre un cuerpo de 16 se encogería a 19 en
       * vez de crecer. La otra salida sería redeclarar el tamaño con el token
       * de la escala que use cada elemento, y eso obliga a saber qué token
       * usa cada clase en cada uno de los 50 diseños.
       *
       * `zoom` escala lo que haya salido, sin saber qué era, y a diferencia
       * de `transform: scale` mueve la caja: el texto crecido empuja lo de
       * abajo en vez de montarse encima.
       */
      const pct = Number(tamanos[clave]);
      if (isFinite(pct) && pct > 0 && pct !== 100) {
        out.push(`zoom:${Math.min(300, Math.max(50, pct)) / 100}`);
      }
      return out;
    };

    for (const field of spec.fields) {
      const decls = declara(field.key);
      if (!decls.length) continue;
      const path = `${spec.key}.${field.key}`;
      const ops = map.fields[FONT_ALIAS[path] || path];
      if (!ops) continue;
      for (const d of decls) colorCss.push(...fontRules(scopeSel, root, ops, d));
    }

    /* Los campos de las listas: se comparten entre las fichas, igual que la
       tipografía. Un color por invitado no significaría nada. */
    const lb = spec.list ? map.lists[spec.key] : undefined;
    if (!lb) return;
    const container = pick(root, lb.container);
    const ficha = container ? pick(container, lb.item) : null;
    if (!ficha) return;
    const fichaSel = [scopeSel, pickWithSel(container!, lb.item)?.[1]]
      .filter(Boolean)
      .join(" ");

    for (const f of spec.list!.fields) {
      for (const d of declara(`items.${f.key}`)) {
        colorCss.push(...fontRules(scopeSel, ficha, lb.fields[f.key] || [], d, fichaSel));
      }
    }
  };

  /**
   * La animación de cada texto.
   *
   * Va por el mismo camino que la tipografía —lo elegido vive en la sección,
   * se busca el binding del campo y se aplica sobre lo que encuentre— pero
   * acaba en atributos del elemento y no en reglas CSS, porque dos de las
   * familias necesitan tocar el contenido: repartir el texto en letras o en
   * palabras no se puede pedir con un selector.
   *
   * Los que se animan llevan además un turno, así que varios textos animados
   * en una sección entran **uno detrás de otro**. A la vez parecen un
   * parpadeo; escalonados parecen escritos.
   */
  const collectAnims = (
    spec: (typeof SPEC)[number],
    root: El,
    section: InvitationData[string]
  ) => {
    const elegidas = (section?.anim || {}) as Record<string, string>;
    let turno = 0;
    for (const field of spec.fields) {
      const valor = String(elegidas[field.key] || "");
      if (!valor || !ANIM_VALIDA.has(valor)) continue;
      /* Sólo texto: animar un campo de color o un deslizador no significa
         nada, y su binding ni siquiera escribe texto. */
      if (field.type !== "text" && field.type !== "textarea") continue;

      const path = `${spec.key}.${field.key}`;
      const ops = map.fields[FONT_ALIAS[path] || path];
      if (!ops) continue;

      for (const op of ops) {
        if (!fontableOp(op)) continue;
        for (const el of op.all ? pickEveryOutermost(root, op.sel) : pickAll(root, op.sel)) {
          if (animarTexto(el, valor, turno)) turno++;
        }
      }
    }
  };

  const ctx: Ctx = {
    name1: String(data.event?.name1 || "").trim(),
    name2: String(data.event?.name2 || "").trim(),
    css: extraCss,
    heroDisposicion: String(data.hero?.disposicion || ""),
    peso: pesoIconos(designOf(templateId)),
    preview,
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

  /* Los datos del evento —los nombres, la fecha, la frase— no tienen sección
     propia: se escriben en la portada, el velo y el pie a la vez, así que su
     ámbito es el documento entero.

     La tipografía ya se recogía aquí; el color y la alineación no, y por eso
     elegirle un color a la frase no hacía nada mientras que cambiarle la
     letra sí. Un control que funciona a medias es peor que uno que no está,
     porque nadie sabe cuál de las dos mitades falló. */
  const eventSpec = SPEC.find((sp) => sp.key === "event");
  if (eventSpec) {
    collectFonts(eventSpec, "body", document.body, data.event);
    collectColors(eventSpec, "body", document.body, data.event);
    collectAnims(eventSpec, document.body, data.event);
  }

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

    /* La variante: la que eligió quien edita, y si no eligió ninguna, la que
       el diseño declara como suya. Sin esto, un diseño cuya forma es la
       variante —las órbitas de «Noche Estrellada»— salía con el marcado
       genérico hasta que alguien la elegía a mano, y no se parecía a lo
       que se ve en el catálogo. */
    const porDefecto = designOf(templateId)?.variantes?.[block.type] || "";
    /* Vacío no es «la del diseño elegida a mano»: es «no se eligió». La
       variante vacía existe en la lista —es el marcado del template— y por
       eso `variantOf(spec, "")` devuelve algo, que era lo que impedía llegar
       nunca a la que declara el diseño. */
    const variante =
      (block.variant ? variantOf(spec, block.variant) : undefined) ||
      (!block.variant && porDefecto ? variantOf(spec, porDefecto) : undefined) ||
      spec.variants[0];
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

    const armar = variante.build || spec.variants.find((v) => v.build)?.build;
    if (!armar) continue;

    /* Marcado nuestro, con las clases canónicas para que lo estilice el CSS
       del template.

       Y si el bloque sustituye a una sección que el diseño trae, se escribe
       **dentro de ella**, no en otra sección al lado: así conserva su id, su
       sitio en el documento, su divisor y —lo que de verdad importa— todo el
       CSS que el diseño le tiene escrito por `#id`. Antes se escondía la
       original y el bloque nacía como `.inv-block-events`: 18 de los 25
       diseños estilan sus secciones por id, así que elegir otra variante
       hacía desaparecer el arte de esa sección —la capilla de la ficha, el
       fondo de la galería— y no había manera de recuperarlo. */
    const anfitrion =
      primero && spec.section ? pickWithSel(document, map.sections[sectionKey] || []) : null;

    let seccion: El;
    let sel: string;
    if (anfitrion) {
      [seccion, sel] = anfitrion;
      const caja = seccion.querySelector(".container") as El | null;
      /* La filigrana que el diseño pone bajo el título se guarda antes de
         reescribir y se devuelve después: el marcado de los bloques no la
         trae —en una sección suelta quedaba descolocada— pero aquí la
         maquetación es la del propio diseño, que es donde encaja. Se clona
         del marcado horneado, así que no hace falta el tema. */
      const filigrana = seccion.querySelector(".ornament")?.cloneNode(true) as El | undefined;
      // Las variantes a sangre se comen el contenedor que limita el ancho.
      if (variante.bare || !caja) seccion.innerHTML = armar();
      else caja.innerHTML = armar();
      const titulo = (caja || seccion).querySelector(".section-title") as El | null;
      if (filigrana && titulo?.parentNode) {
        titulo.parentNode.insertBefore(filigrana, titulo.nextSibling);
      }
      seccion.setAttribute(
        "class",
        `${seccion.getAttribute("class") || ""} inv-block inv-block-${block.type} inv-v-${
          variante.id || "propia"
        }`.trim()
      );
    } else {
      seccion = document.createElement("section");
      seccion.setAttribute("id", `inv-${block.id}`);
      seccion.setAttribute(
        "class",
        `inv-block inv-block-suelto inv-block-${block.type} inv-v-${
          variante.id || "propia"
        } reveal`
      );
      seccion.innerHTML = variante.bare ? armar() : `<div class="container">${armar()}</div>`;
      padre.appendChild(seccion);
      sel = `#inv-${block.id}`;
      sintetizados += 1;
    }
    resueltos.push({
      block, el: seccion, sel, key: sectionKey,
      data: blockData, sintetizado: !anfitrion,
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

  /* 3 · bis · El botón de «Agendar» de cada ubicación.
     Sin texto no hay botón: es opcional y las ubicaciones de antes no lo
     traían. Con texto lleva la fecha de la invitación, el título y el
     lugar, que es lo que el script mete en el .ics. */
  for (const r of resueltos) {
    const boton = r.el.querySelector?.("[data-inv-agendar]") as El | null;
    if (!boton) continue;
    const texto = String((r.data as Record<string, unknown>)?.calendarText || "").trim();
    if (!texto || !iso) { boton.remove(); continue; }
    boton.textContent = texto;
    boton.setAttribute("data-inicio", iso);
    /* «Mis XV años · Valentina»: el antetítulo del velo dice qué se
       celebra, y en un calendario un nombre suelto no dice nada. */
    const que = String(data.splash?.label || data.hero?.label || "").trim();
    const quien = coupleName(data) || "";
    boton.setAttribute("data-titulo", [que, quien].filter(Boolean).join(" · ") || "Invitación");
    const rd = (r.data || {}) as Record<string, unknown>;
    boton.setAttribute(
      "data-lugar",
      [rd.place, rd.address].map((x) => String(x || "").trim()).filter(Boolean).join(", ")
    );
  }

  /* 3 · ter · El botón de la portada apunta a la primera sección visible.
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

  /* 3 · quater · Cómo se abre el velo.
     Es una clase sobre `#splash` y nada más: toda la animación vive en el
     CSS inyectado, que llega a los 49 diseños por igual. El velo **cerrado**
     no cambia, y eso es a propósito — lo que se elige aquí es la salida, no
     una portada distinta. */
  {
    const velo = document.querySelector("#splash") as El | null;
    const apertura = String(data.splash?.apertura || "").trim();
    if (velo && APERTURAS.has(apertura)) {
      velo.setAttribute(
        "class",
        `${velo.getAttribute("class") || ""} inv-velo-${apertura}`.trim()
      );
    }
    /* El sobre con sello: el velo se vuelve un sobre cerrado, con el nombre
       en la carta de dentro. El panel del velo sigue ahí, escondido, porque
       su botón es el que el sobre pulsa al abrirse. */
    if (velo && apertura === "deseo") {
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-deseo-pista">Toca y pide un deseo</p>`);
    }
    if (velo && apertura === "telon") {
      velo.insertAdjacentHTML?.(
        "afterbegin",
        `<i class="inv-telon inv-telon-izq" aria-hidden="true"></i>` +
          `<i class="inv-telon inv-telon-der" aria-hidden="true"></i>` +
          `<i class="inv-telon-galon" aria-hidden="true"></i>`
      );
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-sobre-pista">Toca para abrir el telón</p>`);
    }
    if (velo && apertura === "ventana") {
      velo.insertAdjacentHTML?.(
        "afterbegin",
        `<i class="inv-postigo inv-postigo-izq" aria-hidden="true"></i>` +
          `<i class="inv-postigo inv-postigo-der" aria-hidden="true"></i>`
      );
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-sobre-pista">Toca para abrir la ventana</p>`);
    }
    if (velo && apertura === "claqueta") {
      velo.insertAdjacentHTML?.(
        "afterbegin",
        `<div class="inv-claqueta" aria-hidden="true">` +
          `<i class="inv-claqueta-palo"></i><i class="inv-claqueta-tabla"></i></div>`
      );
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-sobre-pista">Toca para la primera toma</p>`);
    }
    if (velo && apertura === "mariposa") {
      velo.insertAdjacentHTML?.(
        "afterbegin",
        `<div class="inv-mariposa" aria-hidden="true">` +
          `<i class="inv-ala inv-ala-izq"></i><i class="inv-ala inv-ala-der"></i></div>`
      );
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-sobre-pista">Toca la mariposa</p>`);
    }
    /* El jardín: dos matas de follaje que se mecen y la misma mariposa. El
       velo se disuelve encima de la portada, así que la foto aparece por
       debajo mientras la mariposa todavía vuela. */
    if (velo && apertura === "jardin") {
      velo.insertAdjacentHTML?.(
        "afterbegin",
        `<i class="inv-jardin inv-jardin-izq" aria-hidden="true"></i>` +
          `<i class="inv-jardin inv-jardin-der" aria-hidden="true"></i>` +
          `<div class="inv-mariposa" aria-hidden="true">` +
          `<i class="inv-ala inv-ala-izq"></i><i class="inv-ala inv-ala-der"></i></div>`
      );
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-sobre-pista">Toca la mariposa</p>`);
    }
    if (velo && apertura === "escarcha") {
      velo.insertAdjacentHTML?.("beforeend",
        `<i class="inv-escarcha" aria-hidden="true"></i><p class="inv-sobre-pista">Toca el hielo</p>`);
    }
    if (velo && apertura === "naipe") {
      /* Los palos van como caracteres y no como <svg>: en el servidor de
         producción, un <svg> dentro de este <i> insertado con
         insertAdjacentHTML salía sin su cierre, y la esquina de abajo
         quedaba anidada dentro de la de arriba —las dos arriba a la
         izquierda—. En local no se reproducía. */
      const modal = velo.querySelector(".splash-modal") as El | null;
      modal?.insertAdjacentHTML?.("afterbegin",
        `<i class="inv-naipe-esq inv-naipe-arriba" aria-hidden="true">A<span>\u2665</span></i>` +
        `<i class="inv-naipe-esq inv-naipe-abajo" aria-hidden="true">A<span>\u2660</span></i>` +
        `<i class="inv-naipe-dorso" aria-hidden="true"></i>`);
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-sobre-pista">Toca la carta</p>`);
    }
    if (velo && apertura === "anillos") {
      velo.insertAdjacentHTML?.(
        "afterbegin",
        `<div class="inv-aros" aria-hidden="true">` +
          `<i class="inv-aro-izq"></i><i class="inv-aro-der"></i></div>`
      );
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-sobre-pista">Toca para unirlos</p>`);
    }
    if (velo && apertura === "nubes") {
      velo.insertAdjacentHTML?.(
        "afterbegin",
        `<i class="inv-nube inv-nube-izq" aria-hidden="true"></i>` +
          `<i class="inv-nube inv-nube-der" aria-hidden="true"></i>`
      );
      velo.insertAdjacentHTML?.("beforeend", `<p class="inv-sobre-pista">Toca para abrir el cielo</p>`);
    }
    if (velo && apertura === "abanico") {
      const nombre = coupleName(data) || "";
      const ante = String(data.splash?.label || "").trim();
      const img = String(data.splash?.sello || "").trim();
      const url = img ? (propia(img) ? conAncho(img, 800) : img) : "";
      /* Con imagen propia manda ésa; si no, la del diseño, que la pone en
         --inv-abanico-img. Sin ninguna de las dos no se dibuja la hoja. */
      const estilo = url
        ? ` style="--inv-abanico-img:url(&quot;${escapeHtml(url).replace(/"/g, "%22")}&quot;)"`
        : "";
      velo.insertAdjacentHTML?.(
        "beforeend",
        `<div class="inv-abanico" data-inv-abanico data-con-imagen role="button" tabindex="0" ` +
          `aria-label="Abrir la invitación"><div class="inv-abanico-hoja"${estilo}></div>` +
          `<div class="inv-abanico-texto">${ante ? `<p class="inv-abanico-ante">${escapeHtml(ante)}</p>` : ""}` +
          `<p class="inv-abanico-nombre">${escapeHtml(nombre)}</p></div>` +
          `</div><p class="inv-sobre-pista">Abre el abanico</p>`
      );
    }
    /* El libro: la tapa lleva la imagen elegida, y dentro la página con el
       nombre y la fecha, que es lo que se ve al abrirlo. */
    if (velo && apertura === "libro") {
      const nombre = coupleName(data) || "";
      const ante = String(data.splash?.label || "").trim();
      const fecha = String(data.event?.dateLabel || "").trim();
      const img = String(data.splash?.sello || "").trim();
      const url = img ? (propia(img) ? conAncho(img, 800) : img) : "";
      velo.insertAdjacentHTML?.(
        "beforeend",
        `<div class="inv-libro" data-inv-libro role="button" tabindex="0" aria-label="Abrir la invitación">` +
          `<div class="inv-libro-pagina">${ante ? `<p class="inv-libro-ante">${escapeHtml(ante)}</p>` : ""}` +
          `<p class="inv-libro-nombre">${escapeHtml(nombre)}</p>` +
          `${fecha ? `<p class="inv-libro-ante">${escapeHtml(fecha)}</p>` : ""}</div>` +
          `<div class="inv-libro-tapa"${url ? ` style="--inv-libro-img:url(&quot;${escapeHtml(url).replace(/"/g, "%22")}&quot;)"` : ""}></div>` +
          `<div class="inv-libro-lomo"></div>` +
          `</div><p class="inv-sobre-pista">Abre el libro</p>`
      );
    }
    if (velo && apertura === "sello") {
      const nombre = coupleName(data) || "";
      const ante = String(data.splash?.label || "").trim();
      const img = String(data.splash?.sello || "").trim();
      const inicial = (String(data.event?.name1 || nombre).trim().charAt(0) || "✦").toUpperCase();
      const url = img ? (propia(img) ? conAncho(img, 400) : img) : "";
      const sello = url
        ? `<div class="inv-sobre-sello con-imagen" style="--inv-sello-img:url(&quot;${escapeHtml(url).replace(/"/g, "%22")}&quot;)"></div>`
        : `<div class="inv-sobre-sello">${escapeHtml(inicial)}</div>`;
      velo.insertAdjacentHTML?.(
        "beforeend",
        `<div class="inv-sobre" data-inv-sobre role="button" tabindex="0" aria-label="Abrir la invitación">` +
          `<div class="inv-sobre-cuerpo"></div>` +
          `<div class="inv-sobre-carta">${ante ? `<p class="inv-sobre-ante">${escapeHtml(ante)}</p>` : ""}` +
          `<p class="inv-sobre-nombre">${escapeHtml(nombre)}</p></div>` +
          `<div class="inv-sobre-bolsillo"></div><div class="inv-sobre-solapa"></div>${sello}` +
          `</div><p class="inv-sobre-pista">Toca el sello</p>`
      );
    }
  }

  /* 3 · quinquies · La cortina de apertura.
     Va antes que nada en el cuerpo y por debajo del velo (9998 contra 9999),
     así que mientras el velo se abre la cortina ya está detrás reproduciendo:
     con la apertura de sobre, la solapa se levanta y lo que aparece es el
     vídeo, no un salto de una cosa a otra.

     No se monta en la vista previa del editor: ahí se vuelve a renderizar a
     cada tecla, y una cortina que arranca de cero cada 900 ms tapa justo lo
     que se está editando. */
  {
    const url = String(data.splash?.introUrl || "").trim();
    if (url && !preview && sectionOn("splash")) {
      const cortina = document.createElement("div");
      const contener = String(data.splash?.introAjuste || "") === "contener";
      /* Vacío es el fundido, y un nombre que no conocemos también: más vale
         la salida de siempre que una cortina que no se sabe ir. */
      const pedida = String(data.splash?.introSalida || "").trim();
      const salida = SALIDAS.has(pedida) ? pedida : "fundido";
      cortina.setAttribute(
        "class",
        `inv-cortina inv-cortina-s-${salida}${contener ? " inv-cortina-contener" : ""}`
      );
      cortina.setAttribute("hidden", "");

      const v = document.createElement("video");
      v.setAttribute("class", "inv-cortina-video");
      v.setAttribute("src", url);
      v.setAttribute("playsinline", "");
      /* Se descarga mientras se mira el velo, que es el único rato que hay:
         al pulsar el botón ya tiene que estar listo para arrancar. */
      v.setAttribute("preload", "auto");
      /* Sin sonido elegido va callado, y callado puede sonar la música de
         fondo encima sin que se peleen. */
      if (String(data.splash?.introSonido || "") !== "con") v.setAttribute("muted", "");
      cortina.appendChild(v);

      /* Saltar no es una opción de diseño, es la salida de emergencia: un
         vídeo de veinte segundos que no se puede saltar es una puerta
         cerrada. Aparece sola al segundo y medio para no competir con el
         primer plano. */
      const saltar = document.createElement("button");
      saltar.setAttribute("class", "inv-cortina-saltar");
      saltar.setAttribute("type", "button");
      saltar.textContent = "Saltar";
      cortina.appendChild(saltar);

      document.body.insertBefore(cortina, document.body.firstChild);
    }
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

    /* La capa detrás del texto.
       Se aplica al contenedor y no a un elemento suelto: lo que hay que
       separar del fondo es el bloque de texto entero —antetítulo, título y
       párrafo—, no cada renglón por su cuenta, que se vería como tres
       subrayados en vez de como un panel. */
    {
      const panel = String(sectionData.panelColor || "").trim();
      if (HEX.test(panel)) {
        const op = Math.min(100, Math.max(5, Number(sectionData.panelOpacidad ?? 60))) / 100;
        /* Casi todas las secciones envuelven su texto en `.container`, pero
           el velo y la portada no: son pantallas completas con su propia
           caja. Con un `.container` a secas la capa no habría aparecido
           justo en las dos que más falta hace —son las que llevan foto de
           fondo—, y sin dar ningún error: la regla se escribe igual y no
           encuentra a nadie.

           Se busca el primero que exista en vez de escribir los tres en el
           selector: con los tres, un diseño que tuviera dos se llevaría dos
           capas, una dentro de otra. */
        const donde = [".container", ".splash-modal", ".hero-content"]
          .find((sel) => root.querySelector(sel));
        if (donde) {
          extraCss.push(
            `${sectionSel} ${donde}{background:${alpha(panel, op)};` +
              /* Sin aire alrededor la capa se pega a las letras y se lee como
                 un subrayado. El radio sale del diseño, para que no parezca
                 pegada de otro sitio. */
              `padding:clamp(20px,5vw,34px);border-radius:var(--radius);` +
              `backdrop-filter:blur(1.5px)}`
          );
        }
      }
    }

    // El fondo va detrás de todo y los adornos donde el organizador diga.
    ponerFondo(root, sectionData, sectionSel, ctx);
    const declarados = adornosDeclarados(designOf(templateId), r.key);
    ponerAdornos(
      root, sectionData, sectionSel, ctx, r.key,
      declarados.some((a) => a.sitio === "titulo"),
      declarados.map((a) => {
        const { seccion, ...campos } = a;
        return Object.fromEntries(
          Object.entries(campos).map(([k, v]) => [k, String(v)])
        ) as Record<string, string>;
      })
    );
    ponerEntrada(root, String(sectionData.entrada || ""));

    /* Un bloque de vídeo sin vídeo se esconde, y entonces no hay nada más
       que escribirle dentro. */
    if (r.block.type === "video" && !ponerVideo(root, sectionData)) continue;

    /* La letra, el color y la alineación de cada campo.

       Los bloques agregados —Párrafo, Foto, Vídeo, Ubicación— no tienen
       `SectionSpec`: su vocabulario de campos lo declara el bloque, y sus
       bindings viven en el mapa bajo el tipo (`paragraph.text`). Con un
       `if (spec)` se los saltaba enteros, así que el editor ofrecía elegirle
       la letra a un párrafo y no pasaba nada. Armando un spec equivalente del
       bloque, llegan a los dos por el mismo camino. */
    const estilable = (spec ||
      (blockSpec
        ? { key: r.key, fields: blockSpec.fields, list: blockSpec.list }
        : undefined)) as typeof spec | undefined;

    if (estilable) {
      collectFonts(estilable, sectionSel, root, sectionData);
      collectColors(estilable, sectionSel, root, sectionData);
    }
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
      /* Después de escribirlas, no antes: `applyList` clona el prototipo del
         diseño para llegar al número de fichas, y marcar antes marcaría el
         prototipo y el clon se llevaría el atributo copiado —todas con el
         turno de la primera y todas por el mismo lado. */
      animarFichas(root, listBinding, String(sectionData.animFichas || ""));
    }

    /* La animación de cada texto, **después** de escribirlos.
       Antes iba junto a las tipografías, que es donde parecía que tocaba, y
       estaba mal por una razón que sólo se ve probándolo: dos de las familias
       reparten el texto en letras, y repartir antes de escribir reparte el
       texto de ejemplo del diseño — que además la escritura posterior borra
       junto con los trozos. La letra sí se puede elegir antes, porque es una
       regla CSS y no le importa qué diga el elemento. */
    if (estilable) collectAnims(estilable, root, sectionData);

    /* La cinta continua necesita las fotos dos veces.
       La tira se mueve media anchura y vuelve a empezar; con una sola copia,
       al llegar al final no hay nada detrás y el bucle pega un tirón. Con la
       copia, la segunda mitad queda exactamente donde estaba la primera y el
       salto no se ve.

       Va aquí y no en el marcado del bloque porque las fotos las pone
       `applyList` a partir de las que haya: duplicar la plantilla daría seis
       huecos aunque el organizador subiera tres. */
    if (r.block.variant === "cinta") duplicarCinta(root);
  }

  /* La caja de "transferencia bancaria" sin número es un recuadro vacío:
     si no hay cuenta, se va con etiqueta y todo. */
  if (!String(data.gifts?.account || "").trim()) {
    const regalos = pick(document, map.sections.gifts || []);
    for (const caja of pickAll(regalos || document.body, [".gifts-account", ".gifts-accounts"])) {
      caja.remove();
    }
  }

  /* 4 · bis · La portada sin texto: una tapa, y nada más.
     Se esconde el bloque entero en vez de vaciar campo por campo, porque lo
     que sobra no es el texto sino su sitio: el panel, el velo que lo hacía
     legible y el botón. La flecha de bajar se queda, que es lo único que
     dice que hay más abajo. */
  if (String(data.hero?.contenido || "") === "limpia") {
    const hero = document.querySelector("#hero") as El | null;
    if (hero) hero.setAttribute("class", `${hero.getAttribute("class") || ""} hero-limpia`.trim());
  }

  /* 4 · bis · Los padres, donde el diseño los quiere. Se mueve el nodo ya
     lleno, así que lo que se escribió en la portada es lo que se ve aquí. */
  if (designOf(templateId)?.padresEn === "guests") {
    const invitados = resueltos.find((r) => r.key === "guests")?.el || null;
    const padres = document.querySelector("#hero .hero-padres") as El | null;
    if (invitados && padres && padres.querySelector("p")) {
      const caja = (invitados.querySelector(".container") as El | null) || invitados;
      const cierre = caja.querySelector(".guests-cierre, [data-inv='guests.textSecondary']") as El | null;
      padres.setAttribute("class", "hero-padres inv-padres-invitados");
      if (cierre?.parentNode === caja) caja.insertBefore(padres, cierre.nextSibling);
      else caja.appendChild(padres);
    }
  }

  /* 5 · RSVP — sobre el bloque que quedó, sea el del diseño o el nuestro */
  const confirmSection = resueltos.find((r) => r.key === "confirm")?.el || null;
  if (confirmSection) wireRsvp(document, confirmSection, data, slug, preview, opts.pases ?? null);

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

  /* 5 previo · El fondo de toda la invitación.
     Una sola imagen detrás de todas las secciones, que no se corta entre una
     y otra. Va en una capa **fija**: así no se repite sección a sección ni
     hay que medir dónde empieza y acaba el bloque de secciones que la lleva —
     la invitación se desplaza por encima y la imagen se ve entera y continua.

     Las secciones que la llevan se vuelven transparentes, y ahí está el
     motivo de que esto viva aquí y no en una función suelta: los selectores
     salen de las secciones **realmente resueltas**, no de una lista de ids
     escrita a mano. Un bloque de párrafo que alguien agregue mañana sale como
     `#inv-<id>` y entra solo; con ids fijos se habría quedado fuera, que es
     justo lo que se pidió que no pasara.

     Fuera quedan la portada, las redes y el pie —cada una tiene lo suyo— y el
     velo, que va encima de todo y con su propio fondo. */
  {
    const g = data.fondoGlobal || {};
    const url = String(g.url || "").trim();

    if (g.enabled !== false && url) {
      const SIN_FONDO_GLOBAL = new Set(["splash", "hero", "social", "footer"]);
      const llevan = [...fijos, ...resueltos]
        .filter((r) => !SIN_FONDO_GLOBAL.has(r.key) && r.sel)
        .map((r) => r.sel);

      if (llevan.length) {
        /* Sin esto, la mitad de las secciones alterna su color de fondo y
           tapa la imagen justo en una de cada dos. */
        extraCss.push(`${llevan.join(",")}{background:transparent}`);
      }

      const modo = String(g.ajuste || "");
      const opacidad = Math.min(100, Math.max(5, Number(g.opacidad ?? 100))) / 100;
      const velo = Math.min(90, Math.max(0, Number(g.velo ?? 45))) / 100;

      const capa = document.createElement("div");
      capa.setAttribute("class", "inv-fondo-global");
      capa.setAttribute("aria-hidden", "true");

      const medio = document.createElement("div");
      medio.setAttribute("class", "inv-fg-medio");
      medio.setAttribute("style", `opacity:${opacidad}`);
      if (esVideoUrl(url)) {
        const v = document.createElement("video");
        v.setAttribute("src", url);
        v.setAttribute("autoplay", "");
        v.setAttribute("muted", "");
        v.setAttribute("loop", "");
        v.setAttribute("playsinline", "");
        v.setAttribute("preload", "metadata");
        if (modo === "contener") v.setAttribute("style", "object-fit:contain");
        medio.appendChild(v);
      } else {
        const ajuste = AJUSTE[modo] ?? AJUSTE[""];
        medio.setAttribute(
          "style",
          `${fondoImagen(url, modo === "repetir" ? 800 : 1600)}${ajuste};opacity:${opacidad}`
        );
      }
      capa.appendChild(medio);

      /* El velo va **en la capa** y no como un filtro sobre la imagen: así es
         del color de fondo del diseño y no un gris genérico, y sube o baja
         sin tocar la opacidad de la foto. */
      if (velo > 0) {
        const v = document.createElement("i");
        v.setAttribute("class", "inv-fg-velo");
        v.setAttribute("style", `opacity:${velo}`);
        capa.appendChild(v);
      }

      document.body.appendChild(capa);
    }
  }

  /* 5 ante · Las partículas, sobre toda la invitación.
     Una capa fija y no una por sección: lo que se quiere es que los pétalos
     caigan **sobre la página**, no que empiecen de cero en cada bloque. */
  ponerParticulas(document, data);

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
  /* El color de los botones, si se eligió.
     Reescribe las dos variables de las que salen todos —el de la portada, el
     de confirmar, el del mapa, los del velo— en vez de perseguir sus clases
     una a una. Va después de la paleta, que es quien las define, y antes del
     resto: así se puede seguir apuntando a un botón concreto por su campo. */
  const botonCss = (() => {
    const fondo = String(data.event?.btnColor || "").trim();
    const tinta = String(data.event?.btnInk || "").trim();
    /* La forma va por el mismo camino y por la misma razón: los seis botones
       ya leían `--btn-radius`, así que reescribirla los alcanza a todos sin
       perseguir una sola clase — y alcanza también al botón que se añada
       mañana, que es la mitad del valor de hacerlo así. */
    const forma = RADIO_BOTON[String(data.event?.btnForma || "").trim()] || "";
    const decls = [
      HEX.test(fondo) ? `--accent:${fondo};--hero-accent:${fondo};--inv-accent:${fondo}` : "",
      HEX.test(tinta)
        ? `--on-accent:${tinta};--hero-on-accent:${tinta};--inv-on-accent:${tinta}`
        : "",
      /* Las **dos** variables. Los componentes que inyecta el renderer —los
         botones del RSVP, los del formulario— leen `--inv-btn-radius`, que
         es un espejo de `--btn-radius` para no depender del nombre que use
         cada diseño. Escribiendo sólo una, el botón de confirmar se quedaba
         cuadrado entre cinco redondos: peor que no tener el control, porque
         parece un fallo del diseño y no una casilla sin marcar. */
      forma ? `--btn-radius:${forma};--inv-btn-radius:${forma}` : "",
    ].filter(Boolean);
    return decls.length ? `:root{${decls.join(";")}}` : "";
  })();

  /* Un color de botón propio no es sólo un color: los diseños que visten el
     botón de metal —el oro de Eterna— lo hacen con un degradado que sobre un
     verde elegido a mano se lee como plástico. La clase deja que cada diseño
     se aplane cuando el color ya no es el suyo, sin tener que adivinarlo. */
  if (HEX.test(String(data.event?.btnColor || "").trim())) {
    document.body.setAttribute(
      "class",
      `${document.body.getAttribute("class") || ""} inv-btn-propio`.trim()
    );
  }

  style.textContent = [paletaCss, botonCss, INJECTED_CSS, COMPONENTES_CSS, ...extraCss, ...fontCss, ...colorCss]
    .filter(Boolean)
    .join("\n");

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
  if (document.querySelector(".inv-fondo-video")) scripts.push(FONDO_VIDEO_JS);
  if (document.querySelector("[data-inv-anim]")) scripts.push(TEXTO_ANIM_JS);
  /* Después de la música: la cortina la busca por su id para hacerla esperar,
     y para encontrarla tiene que estar ya creada. */
  if (document.querySelector(".inv-cortina")) scripts.push(CORTINA_JS);
  /* Los componentes interactivos, cada uno sólo si la página lo usa. */
  if (document.querySelector("[data-inv-sobre],[data-inv-libro],[data-inv-abanico],[data-inv-agendar],[data-inv-wa],.inv-velo-deseo,.inv-velo-nubes,.inv-velo-telon,.inv-velo-anillos,.inv-velo-claqueta,.inv-velo-mariposa,.inv-velo-jardin,.inv-velo-escarcha,.inv-velo-naipe,.inv-cielo,.inv-rasca-capa")) {
    scripts.push(CONFETI_JS);
  }
  if (document.querySelector(".inv-velo-deseo,.inv-cielo")) scripts.push(FUGAZ_JS);
  if (document.querySelector(".inv-velo-deseo")) scripts.push(DESEO_JS);
  if (document.querySelector(".inv-cielo")) scripts.push(CIELO_JS);
  if (document.querySelector(".inv-ev-constelacion")) scripts.push(CONSTELACION_JS);
  if (document.querySelector(".inv-ev-sendero")) scripts.push(SENDERO_JS);
  if (document.querySelector(".inv-ev-viaje")) scripts.push(VIAJE_JS);
  if (document.querySelector(".inv-velo-ventana")) scripts.push(VENTANA_JS);
  if (document.querySelector(".inv-velo-claqueta")) scripts.push(CLAQUETA_JS);
  if (document.querySelector(".inv-velo-mariposa,.inv-velo-jardin")) scripts.push(MARIPOSA_JS);
  if (document.querySelector(".inv-velo-escarcha")) scripts.push(ESCARCHA_JS);
  if (document.querySelector(".inv-velo-naipe")) scripts.push(NAIPE_JS);
  if (document.querySelector(".inv-ev-cinta,.inv-ev-postales,.inv-ev-naipes")) scripts.push(LLEGAN_JS);
  if (document.querySelector(".inv-rasca-capa")) scripts.push(RASCA_JS);
  if (document.querySelector("[data-inv-sobre]")) scripts.push(SOBRE_JS);
  if (document.querySelector("[data-inv-libro]")) scripts.push(LIBRO_JS);
  if (document.querySelector("[data-inv-abanico]")) scripts.push(ABANICO_JS);
  if (document.querySelector(".inv-velo-nubes")) scripts.push(NUBES_JS);
  if (document.querySelector(".inv-velo-telon")) scripts.push(TELON_JS);
  if (document.querySelector(".inv-velo-anillos")) scripts.push(ANILLOS_JS);
  if (document.querySelector(".inv-ev-capitulos")) scripts.push(CAPITULOS_JS);
  if (document.querySelector(".inv-ga-carrusel")) scripts.push(CARRUSEL_JS);
  if (document.querySelector(".inv-fe-voltea")) scripts.push(VOLTEA_JS);
  if (document.querySelector("[data-inv-agendar]")) scripts.push(AGENDAR_JS);
  if (document.querySelector(".inv-polvo")) scripts.push(POLVO_JS);
  /* Sólo en el editor: en lo publicado sería dejar mover la decoración a
     quien recibe la invitación. */
  if (preview && document.querySelector("[data-inv-adorno]")) {
    scripts.push(ADORNO_ARRASTRE_JS);
  }
  if (scripts.length) {
    const s = document.createElement("script");
    s.textContent = scripts.join("\n");
    document.body.appendChild(s);
  }

  return `<!DOCTYPE html>\n${document.documentElement.outerHTML}`;
}
