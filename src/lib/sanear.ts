/**
 * Limpieza del HTML que escribe quien organiza.
 *
 * El campo de HTML existe para lo que el editor no cubre: incrustar un
 * reproductor, un mapa, una tabla, un trozo de maquetación propia. Pero lo que
 * se escribe ahí acaba **en una página que abren los invitados**, y en la vista
 * previa del editor acaba dentro de un iframe `srcdoc`, que comparte origen
 * con la aplicación. Un `<script>` ahí no es una decoración rara: es código
 * corriendo con la sesión de quien edita, capaz de llamar a `/api/...` en su
 * nombre. La cookie es `httpOnly` y no se puede leer, pero no hace falta
 * leerla para usarla.
 *
 * Por eso esto no pasa nada tal cual. Se recorre el árbol y sólo sobrevive lo
 * que está en la lista; el resto se quita en vez de escaparse, porque un
 * `<script>` escapado sería texto visible en medio de la invitación.
 *
 * La lista es de permitidos y no de prohibidos a propósito: una lista de
 * prohibidos se queda corta con la siguiente etiqueta que alguien invente, y
 * aquí equivocarse tiene consecuencias para quien abre la invitación, no para
 * quien la escribe.
 */

import { parseHTML } from "linkedom";

/** Lo que se puede escribir. Texto, estructura y tablas. */
const ETIQUETAS = new Set([
  "a", "abbr", "article", "aside", "b", "blockquote", "br", "caption", "cite",
  "code", "col", "colgroup", "dd", "del", "details", "div", "dl", "dt", "em",
  "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i",
  "iframe", "img", "ins", "kbd", "li", "mark", "ol", "p", "picture", "pre",
  "q", "s", "section", "small", "source", "span", "strong", "sub", "summary",
  "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "u",
  "ul", "video", "audio",
]);

/**
 * Los atributos que sobreviven.
 *
 * `style` entra porque sin él no se puede maquetar nada, y su riesgo real es
 * otro —`url(javascript:…)` ya no lo ejecuta ningún navegador—, pero se le
 * quitan igual las expresiones raras más abajo.
 */
const ATRIBUTOS = new Set([
  "alt", "class", "colspan", "controls", "datetime", "height", "href", "id",
  "lang", "loop", "muted", "playsinline", "poster", "rel", "rowspan",
  "sizes", "span", "src", "srcset", "style", "target", "title", "type",
  "width", "loading", "allow", "allowfullscreen", "frameborder", "open",
]);

/**
 * De dónde se acepta un `<iframe>`.
 *
 * Incrustar es el motivo por el que este campo existe, así que prohibirlos
 * enteros lo dejaría sin sentido. Pero un iframe a una dirección cualquiera
 * es una página ajena dentro de la invitación, con lo que eso trae; una lista
 * de sitios conocidos deja pasar lo que la gente quiere incrustar de verdad y
 * nada más.
 */
const EMBEBIBLES = [
  "www.youtube.com", "www.youtube-nocookie.com", "youtube.com",
  "player.vimeo.com", "open.spotify.com", "w.soundcloud.com",
  "www.google.com", "maps.google.com", "www.instagram.com",
  "embed.music.apple.com", "drive.google.com", "calendar.google.com",
];

/** Sólo protocolos que no ejecutan nada. */
const ESQUEMA_OK = /^(https?:|mailto:|tel:|#|\/)/i;

/** Lo que se le quita a un `style` por si acaso. */
const ESTILO_PELIGROSO = /(expression|javascript:|behavior\s*:|@import|<)/i;

function seguroEnlace(valor: string): boolean {
  const v = valor.trim();
  if (!v) return false;
  /* Una imagen en `data:` es corriente y no ejecuta nada; cualquier otro
     `data:` puede ser un documento con guion dentro. */
  if (/^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(v)) return true;
  return ESQUEMA_OK.test(v);
}

function iframePermitido(src: string): boolean {
  try {
    const u = new URL(src, "https://invitacion.local");
    return u.protocol === "https:" && EMBEBIBLES.includes(u.hostname);
  } catch {
    return false;
  }
}

export interface Limpieza {
  html: string;
  /** Qué se quitó, para poder decírselo a quien lo escribió. */
  quitado: string[];
}

export function sanearHtml(entrada: string): Limpieza {
  const crudo = String(entrada || "").trim();
  if (!crudo) return { html: "", quitado: [] };

  /* El documento entero y no un fragmento: linkedom deja el `<body>` vacío si
     lo que se le pasa no viene envuelto en `<html>`, y el filtro se quedaba
     sin nada que recorrer — devolvía cadena vacía para **todo**, así que las
     pruebas de lo peligroso pasaban por no haber salida que revisar. Lo cazó
     el caso legítimo de al lado, que esperaba ver algo. */
  const { document } = parseHTML(`<html><body>${crudo}</body></html>`);
  const quitado = new Set<string>();

  const limpiar = (nodo: any) => {
    for (const hijo of Array.from(nodo.childNodes || []) as any[]) {
      /* Comentarios fuera: no aportan y pueden esconder marcado. */
      if (hijo.nodeType === 8) { hijo.remove(); continue; }
      if (hijo.nodeType !== 1) continue;

      /* Primero lo de dentro y después esto.
         
         Al revés tenía un agujero: una etiqueta prohibida se desenvuelve —se
         cambia por sus hijos para no perder el texto— y esos hijos aparecían
         en el árbol **después** de que el recorrido hubiera hecho su lista, así
         que nadie volvía a mirarlos. Un `<form>` con un `<input>` dentro
         perdía el formulario y conservaba el campo. Limpiando de dentro hacia
         fuera, lo que se promueve ya viene limpio. */
      limpiar(hijo);

      const etiqueta = String(hijo.tagName || "").toLowerCase();
      if (!ETIQUETAS.has(etiqueta)) {
        quitado.add(`<${etiqueta}>`);
        /* Un `<script>` se quita entero, contenido incluido; para lo demás se
           conserva lo de dentro, que suele ser el texto que se quería. */
        if (etiqueta === "script" || etiqueta === "style") hijo.remove();
        else hijo.replaceWith(...Array.from(hijo.childNodes || []));
        continue;
      }

      for (const attr of Array.from(hijo.attributes || []) as any[]) {
        const nombre = String(attr.name || "").toLowerCase();
        const valor = String(attr.value || "");

        /* Cualquier `on*` es un manejador de eventos: es la vía directa. */
        if (nombre.startsWith("on") || !ATRIBUTOS.has(nombre)) {
          quitado.add(nombre.startsWith("on") ? "manejadores de eventos" : nombre);
          hijo.removeAttribute(attr.name);
          continue;
        }
        if ((nombre === "href" || nombre === "src" || nombre === "poster") && !seguroEnlace(valor)) {
          quitado.add(`${nombre} no permitido`);
          hijo.removeAttribute(attr.name);
          continue;
        }
        if (nombre === "style" && ESTILO_PELIGROSO.test(valor)) {
          quitado.add("estilos raros");
          hijo.removeAttribute(attr.name);
        }
      }

      if (etiqueta === "iframe") {
        const src = hijo.getAttribute("src") || "";
        if (!iframePermitido(src)) {
          quitado.add("iframe de un sitio no permitido");
          hijo.remove();
          continue;
        }
        /* Lo que se incrusta se queda en su sitio: no a pantalla completa por
           su cuenta, no navegando la página de arriba. */
        hijo.setAttribute("loading", "lazy");
        hijo.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        hijo.setAttribute(
          "sandbox",
          "allow-scripts allow-same-origin allow-popups allow-presentation"
        );
      }

      /* Un enlace que sale de la invitación no debe poder tocarla desde la
         pestaña nueva. */
      if (etiqueta === "a" && String(hijo.getAttribute("target") || "") === "_blank") {
        hijo.setAttribute("rel", "noopener noreferrer");
      }
    }
  };

  limpiar(document.body);
  return { html: document.body.innerHTML, quitado: [...quitado] };
}
