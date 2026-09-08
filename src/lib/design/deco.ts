/**
 * Adornos: SVG en línea, sin imágenes externas.
 *
 * Nada de aquí pide un archivo a nadie. Los 14 diseños originales traían
 * fotos de `fixdate.io` y de Unsplash embebidas, así que cada invitación
 * publicada le pedía imágenes a un tercero y mostraba fotos que no eran de
 * quien la publicaba. Todo lo decorativo se dibuja.
 *
 * Hay dos clases de adorno y se hacen de maneras distintas a propósito:
 *
 * 1. **El adorno bajo el título de sección** — una pieza pequeña, y se
 *    repite nueve veces por invitación. El dibujo lo pone Phosphor Icons; lo
 *    de aquí es la composición (filetes a los lados, tamaño, aire).
 * 2. **La capa de fondo de la portada** — geometría: arcos, aros, rayos,
 *    manchas, marcos. Se compone con formas, no con dibujo.
 *
 * Aquí había además cinco ilustraciones —eucalipto, palmas, trigo, un osito y
 * nubes— escritas a mano con paths a pulso. Se fueron: dibujar es un oficio y
 * a 150px se veían como lo que eran. Lo que queda es lo que sí funcionaba —
 * los arcos de Osito y las manchas de Acuarela son pura geometría— y a los
 * diseños que se quedaron sin su ilustración se les dio la geometría que les
 * pega.
 */

import { ornamentoHtml } from "../iconos";
import { alpha, type Theme } from "./theme";

/* ────────────────────────────────────────────────────────────────
   El adorno bajo el título de sección
   ──────────────────────────────────────────────────────────────── */

/** El peso de la pieza: los diseños oscuros y finos piden `light`. */
const peso = (t: Theme) => (t.type.displayWeight >= 600 ? "duotone" : "light");

/**
 * Una pieza sola, centrada. Para los diseños que no quieren filetes.
 */
export const pieza = (nombre: string, tamano = 20) => (t: Theme) =>
  `<span class="orn-pieza" style="width:${tamano}px;height:${tamano}px">${
    ornamentoHtml(nombre, peso(t))
  }</span>`;

/**
 * Una pieza entre dos filetes. El clásico de invitación: el filete da el
 * ancho y la pieza el carácter.
 */
export const conFiletes =
  (nombre: string, tamano = 16) =>
  (t: Theme) =>
    `<span class="orn-filetes">` +
    `<i style="background:${t.palette.line}"></i>` +
    `<span class="orn-pieza" style="width:${tamano}px;height:${tamano}px">${
      ornamentoHtml(nombre, peso(t))
    }</span>` +
    `<i style="background:${t.palette.line}"></i>` +
    `</span>`;

/** Tres piezas seguidas, la del medio más grande. */
export const tres =
  (nombre: string) =>
  (t: Theme) =>
    `<span class="orn-tres">` +
    [13, 21, 13]
      .map(
        (s, i) =>
          `<span class="orn-pieza" style="width:${s}px;height:${s}px;opacity:${
            i === 1 ? 1 : 0.55
          }">${ornamentoHtml(nombre, peso(t))}</span>`
      )
      .join("") +
    `</span>`;

/** Un filete solo, muy fino y corto. Para los editoriales. */
export const filete = (t: Theme): string =>
  `<span class="orn-solo" style="background:${t.palette.brand}"></span>`;

/* ── Los que usan los diseños, por nombre ── */

export const hojas = conFiletes("hoja", 17);
export const rombo = conFiletes("rombo", 13);
export const anillo = conFiletes("flor", 16);
export const estrellas = tres("estrella");
export const lazo = pieza("mariposa", 22);
export const loto = conFiletes("loto", 18);
/* `moon-stars` es ancho: entre filetes se lee, repetido tres veces no. */
export const luna = conFiletes("luna", 21);

/* ────────────────────────────────────────────────────────────────
   La capa de fondo de la portada
   ──────────────────────────────────────────────────────────────── */

/** Un arco de hilos concéntricos, arriba de la portada. */
export const arcos = (t: Theme): string => `
<svg class="deco deco-arcos" viewBox="0 0 400 200" fill="none" aria-hidden="true" preserveAspectRatio="none">
  ${[0, 1, 2]
    .map(
      (i) =>
        `<path d="M${-40 + i * 26} 200a${240 - i * 26} ${170 - i * 20} 0 0 1 ${480 - i * 52} 0"` +
        ` stroke="${alpha(t.palette.brand, 0.3 - i * 0.08)}" stroke-width="1"/>`
    )
    .join("\n  ")}
</svg>`;

/**
 * Aros concéntricos muy tenues, centrados abajo. Es lo que reemplazó al
 * eucalipto: da profundidad sin intentar dibujar una planta.
 */
export const aros = (t: Theme): string => `
<svg class="deco deco-aros" viewBox="0 0 400 400" fill="none" aria-hidden="true">
  ${[70, 118, 166, 214]
    .map(
      (r, i) =>
        `<circle cx="200" cy="230" r="${r}" stroke="${alpha(
          t.palette.brand,
          0.16 - i * 0.03
        )}" stroke-width="1"/>`
    )
    .join("\n  ")}
</svg>`;

/**
 * Un abanico de hilos desde una esquina. Art déco, y sirve igual para los
 * diseños oscuros y formales.
 */
export const rayos = (t: Theme): string => `
<svg class="deco deco-rayos" viewBox="0 0 200 200" fill="none" aria-hidden="true">
  ${Array.from({ length: 9 }, (_, i) => {
    const a = (i * Math.PI) / 16;
    return `<path d="M0 200 L${(Math.sin(a) * 300).toFixed(1)} ${(
      200 -
      Math.cos(a) * 300
    ).toFixed(1)}" stroke="${alpha(t.palette.brand, 0.12)}" stroke-width="1"/>`;
  }).join("\n  ")}
</svg>`;

/** Manchas de acuarela: tres capas que se solapan. */
export const acuarela = (t: Theme): string => `
<svg class="deco deco-acuarela" viewBox="0 0 400 400" fill="none" aria-hidden="true">
  <path d="M60 90c40-40 110-50 150-14s54 96 20 134-118 44-152 4-58-84-18-124z"
    fill="${alpha(t.palette.brand, 0.16)}"/>
  <path d="M240 200c34-26 92-24 116 12s10 88-30 106-96 6-114-32-6-60 28-86z"
    fill="${alpha(t.palette.brand2, 0.2)}"/>
  <path d="M150 260c26-16 66-8 78 20s-8 58-40 62-64-14-66-40 2-26 28-42z"
    fill="${alpha(t.palette.accent, 0.14)}"/>
</svg>`;

/**
 * Una franja de aguada abajo, con degradado. Reemplazó al trigo de Campestre
 * y a las palmas de Tropical: sugiere el ambiente sin dibujar nada.
 */
export const aguada = (t: Theme): string => `
<svg class="deco deco-aguada" viewBox="0 0 400 300" fill="none" aria-hidden="true" preserveAspectRatio="none">
  <defs>
    <linearGradient id="ag" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${alpha(t.palette.brand, 0.26)}"/>
      <stop offset="1" stop-color="${alpha(t.palette.brand, 0)}"/>
    </linearGradient>
  </defs>
  <path d="M0 300V196c58-26 104 12 158-4s126-52 242-16v124z" fill="url(#ag)"/>
  <path d="M0 300V232c72-20 118 16 176 2s134-40 224-8v74z"
    fill="${alpha(t.palette.brand2, 0.16)}"/>
</svg>`;

/** Un marco de hilos con las esquinas abiertas. */
export const marco = (t: Theme): string => `
<svg class="deco deco-marco" viewBox="0 0 100 100" fill="none" aria-hidden="true"
  preserveAspectRatio="none" stroke="${alpha(t.palette.brand, 0.55)}" stroke-width=".5">
  <path d="M4 14V4h10M86 4h10v10M96 86v10H86M14 96H4V86"/>
</svg>`;

/**
 * Confeti con posiciones fijas: nada de aleatorio en tiempo de build, o cada
 * `templates:build` daría un archivo distinto sin que nada haya cambiado.
 */
const CONFETI: [number, number, number, number][] = [
  [6, 12, 8, -18], [17, 34, 6, 24], [29, 8, 10, 12], [41, 52, 7, -30],
  [55, 18, 9, 40], [68, 44, 6, -12], [79, 10, 11, 22], [88, 38, 7, -25],
  [12, 68, 8, 15], [34, 82, 6, -20], [62, 74, 9, 30], [84, 66, 7, -10],
];

export const confeti = (t: Theme): string =>
  `<div class="confetti" aria-hidden="true">${CONFETI.map(
    ([x, y, s, r], i) =>
      `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s * 1.6}px;` +
      `transform:rotate(${r}deg);background:${
        [t.palette.brand, t.palette.accent, t.palette.brand2, t.palette.line][i % 4]
      };animation-delay:${(i % 6) * 0.4}s"></i>`
  ).join("")}</div>`;

/** Globos subiendo por los lados: elipses y un hilo, pura geometría. */
export const globos = (t: Theme): string => {
  const uno = (x: number, borde: string, retraso: number, fill: string, size: number) =>
    `<svg class="balloon" style="left:${x}%;${borde};animation-delay:${retraso}s"
      width="${size}" height="${size * 1.7}" viewBox="0 0 60 102" fill="none" aria-hidden="true">
      <ellipse cx="30" cy="34" rx="27" ry="33" fill="${fill}"/>
      <ellipse cx="21" cy="24" rx="7" ry="10" fill="#fff" opacity=".32"/>
      <path d="M30 67l-5 7h10l-5-7z" fill="${fill}"/>
      <path d="M30 74c6 9-6 15 0 27" stroke="${fill}" stroke-width="1.4" fill="none" opacity=".6"/>
    </svg>`;
  return [
    uno(4, "top:8%", 0, t.palette.brand, 46),
    uno(88, "top:14%", 1.4, t.palette.brand2, 38),
    uno(14, "bottom:6%", 2.2, t.palette.accent, 30),
    uno(78, "bottom:12%", 0.8, t.palette.brand, 34),
  ].join("\n");
};

/**
 * Círculos blandos flotando, de tamaños distintos. Es lo que quedó en lugar
 * de las nubes dibujadas: un círculo es una nube si se comporta como una.
 */
export const flotantes = (t: Theme): string => `
<svg class="deco deco-flotantes" viewBox="0 0 400 400" fill="none" aria-hidden="true">
  ${[
    [72, 88, 46, 0.16],
    [318, 62, 30, 0.12],
    [136, 246, 62, 0.1],
    [300, 300, 38, 0.14],
    [40, 330, 22, 0.12],
  ]
    .map(
      ([x, y, r, o]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${alpha(t.palette.brand2, o)}"/>`
    )
    .join("\n  ")}
</svg>`;

/* ────────────────────────────────────────────────────────────────
   El CSS que coloca todo esto
   ──────────────────────────────────────────────────────────────── */

/**
 * Las capas decorativas van absolutas, detrás del contenido y sin capturar el
 * ratón. Se declara una vez aquí en vez de en cada diseño.
 */
export const DECO_CSS = `
.deco{position:absolute;pointer-events:none;z-index:1}
.deco-arcos{top:0;left:0;width:100%;height:44%}
.deco-aros{top:0;left:0;width:100%;height:100%}
.deco-rayos{bottom:0;left:0;width:min(56%,420px);aspect-ratio:1}
.deco-acuarela{top:-6%;left:-6%;width:112%;height:112%}
.deco-aguada{bottom:0;left:0;width:100%;height:52%}
.deco-flotantes{top:0;left:0;width:100%;height:100%}
.deco-marco{inset:14px;width:auto;height:auto}

/* El adorno bajo el título de sección. El envoltorio necesita ser un bloque
   en línea: sobre un <span> normal el ancho y el alto en línea no aplican, y
   la pieza sale del tamaño natural del svg, que son 256px. */
.orn-pieza{display:inline-block;line-height:0;color:var(--brand)}
.orn-pieza svg{width:100%;height:100%;display:block}
.orn-filetes{display:inline-flex;align-items:center;gap:14px}
.orn-filetes i{display:block;width:min(52px,11vw);height:var(--border)}
.orn-tres{display:inline-flex;align-items:center;gap:9px}
.orn-solo{display:block;width:44px;height:var(--border)}

/* Confeti: cae despacio y en bucle. */
.confetti{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.confetti i{position:absolute;display:block;border-radius:2px;opacity:.7;
  animation:cae 9s linear infinite}
@keyframes cae{
  0%{transform:translateY(-12px) rotate(0)}
  100%{transform:translateY(26px) rotate(180deg)}
}

/* Globos: suben y bajan un poco. */
.balloon{position:absolute;z-index:1;pointer-events:none;opacity:.9;
  animation:flota 7s ease-in-out infinite}
@keyframes flota{
  0%,100%{transform:translateY(0) rotate(-2deg)}
  50%{transform:translateY(-18px) rotate(2deg)}
}

@media (prefers-reduced-motion:reduce){
  .confetti i,.balloon{animation:none}
}`;
