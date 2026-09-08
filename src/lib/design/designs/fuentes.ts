/**
 * Las parejas tipográficas del catálogo. Ocho, no veintisiete.
 *
 * Cada diseño elegía su propia fuente y el resultado era que 27 invitaciones
 * usaban 19 familias distintas sin que ninguna decisión fuera deliberada.
 * Ocho parejas, cada una con un carácter claro, y los diseños eligen entre
 * ellas: es lo que hace que el catálogo se lea como un catálogo.
 *
 * Se piden **sólo los pesos que se usan**. Un peso de más son 30 kB que
 * alguien descarga en un móvil para ver una invitación.
 */

import { gfont } from "../theme";

export interface Pareja {
  display: string;
  body: string;
  url: string;
}

/** Serifa humanista de trazo fino. Clásica sin ser pesada. */
export const CORMORANT_JOST: Pareja = {
  display: "'Cormorant Garamond',Georgia,serif",
  body: "'Jost',system-ui,sans-serif",
  url: gfont("family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@300;400;500"),
};

/** La misma serifa con una sans neutra: más moderno, menos romántico. */
export const CORMORANT_INTER: Pareja = {
  display: "'Cormorant Garamond',Georgia,serif",
  body: "'Inter',system-ui,sans-serif",
  url: gfont("family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@300;400;500"),
};

/** Serifa de contraste alto. Tiene presencia en tamaños grandes. */
export const PLAYFAIR_KARLA: Pareja = {
  display: "'Playfair Display',Georgia,serif",
  body: "'Karla',system-ui,sans-serif",
  url: gfont("family=Playfair+Display:wght@400;500&family=Karla:wght@300;400;500"),
};

/** Sans sola, muy apretada en los títulos. El editorial. */
export const INTER_SOLO: Pareja = {
  display: "'Inter',system-ui,sans-serif",
  body: "'Inter',system-ui,sans-serif",
  url: gfont("family=Inter:wght@300;400;500;600"),
};

/** Serifa didona de titulares. Dramática y limpia. */
export const DMSERIF_DMSANS: Pareja = {
  display: "'DM Serif Display',Georgia,serif",
  body: "'DM Sans',system-ui,sans-serif",
  url: gfont("family=DM+Serif+Display&family=DM+Sans:wght@300;400;500"),
};

/** Serifa de eje variable, contemporánea. La menos "invitación" de todas. */
export const FRAUNCES_INTER: Pareja = {
  display: "'Fraunces',Georgia,serif",
  body: "'Inter',system-ui,sans-serif",
  url: gfont("family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Inter:wght@300;400;500"),
};

/** Romana de capitales, sin minúsculas de fantasía. Sobria y campestre. */
export const MARCELLUS_JOST: Pareja = {
  display: "'Marcellus',Georgia,serif",
  body: "'Jost',system-ui,sans-serif",
  url: gfont("family=Marcellus&family=Jost:wght@300;400;500"),
};

/** Redondeadas. Las dos únicas que usan los infantiles. */
export const BALOO_NUNITO: Pareja = {
  display: "'Baloo 2',system-ui,cursive",
  body: "'Nunito',system-ui,sans-serif",
  url: gfont("family=Baloo+2:wght@600;700&family=Nunito:wght@300;400;600"),
};

export const QUICKSAND: Pareja = {
  display: "'Quicksand',system-ui,sans-serif",
  body: "'Nunito Sans',system-ui,sans-serif",
  url: gfont("family=Quicksand:wght@500;600;700&family=Nunito+Sans:wght@300;400;600"),
};
