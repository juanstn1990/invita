/**
 * Tipografías que el organizador puede elegir por campo.
 *
 * Cada diseño trae las suyas; esta lista es para cuando alguien quiere cambiar
 * la letra de un texto concreto. El renderer inyecta el `<link>` de Google
 * Fonts sólo de las que se usen, así una invitación que no cambie nada no
 * carga ni un byte extra.
 */

export interface FontOption {
  id: string;
  name: string;
  /** Pila completa para `font-family`. */
  css: string;
  /** Parámetro `family=` de Google Fonts, con los pesos que hagan falta. */
  google: string;
  group: "serif" | "sans" | "caligrafica" | "redondeada";
}

export const FONTS: FontOption[] = [
  { id: "playfair", name: "Playfair Display", group: "serif", css: "'Playfair Display', Georgia, serif", google: "Playfair+Display:ital,wght@0,400;0,600;0,700;1,400" },
  { id: "cormorant", name: "Cormorant Garamond", group: "serif", css: "'Cormorant Garamond', Georgia, serif", google: "Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400" },
  { id: "lora", name: "Lora", group: "serif", css: "'Lora', Georgia, serif", google: "Lora:ital,wght@0,400;0,600;1,400" },
  { id: "fraunces", name: "Fraunces", group: "serif", css: "'Fraunces', Georgia, serif", google: "Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400" },
  { id: "dmserif", name: "DM Serif Display", group: "serif", css: "'DM Serif Display', Georgia, serif", google: "DM+Serif+Display:ital@0;1" },
  { id: "baskerville", name: "Libre Baskerville", group: "serif", css: "'Libre Baskerville', Georgia, serif", google: "Libre+Baskerville:ital,wght@0,400;0,700;1,400" },

  { id: "inter", name: "Inter", group: "sans", css: "'Inter', system-ui, sans-serif", google: "Inter:wght@300;400;600" },
  { id: "montserrat", name: "Montserrat", group: "sans", css: "'Montserrat', system-ui, sans-serif", google: "Montserrat:wght@300;400;600" },
  { id: "raleway", name: "Raleway", group: "sans", css: "'Raleway', system-ui, sans-serif", google: "Raleway:wght@300;400;600" },
  { id: "jost", name: "Jost", group: "sans", css: "'Jost', system-ui, sans-serif", google: "Jost:wght@300;400;600" },
  { id: "karla", name: "Karla", group: "sans", css: "'Karla', system-ui, sans-serif", google: "Karla:wght@300;400;600" },
  { id: "quicksand", name: "Quicksand", group: "sans", css: "'Quicksand', system-ui, sans-serif", google: "Quicksand:wght@400;600" },
  { id: "mulish", name: "Mulish", group: "sans", css: "'Mulish', system-ui, sans-serif", google: "Mulish:wght@300;400;600" },

  { id: "greatvibes", name: "Great Vibes", group: "caligrafica", css: "'Great Vibes', cursive", google: "Great+Vibes" },
  { id: "parisienne", name: "Parisienne", group: "caligrafica", css: "'Parisienne', cursive", google: "Parisienne" },
  { id: "dancing", name: "Dancing Script", group: "caligrafica", css: "'Dancing Script', cursive", google: "Dancing+Script:wght@400;600" },

  { id: "baloo", name: "Baloo 2", group: "redondeada", css: "'Baloo 2', system-ui, cursive", google: "Baloo+2:wght@400;600;800" },
];

export const FONT_BY_ID: Record<string, FontOption> = Object.fromEntries(
  FONTS.map((f) => [f.id, f])
);

export const GROUP_LABEL: Record<FontOption["group"], string> = {
  serif: "Con serifa",
  sans: "Sin serifa",
  caligrafica: "Caligráficas",
  redondeada: "Redondeadas",
};

/** `<link>` de Google Fonts para las tipografías que se usen. */
export function googleHref(ids: string[]): string | null {
  const familias = ids
    .map((id) => FONT_BY_ID[id]?.google)
    .filter((g): g is string => !!g);
  if (!familias.length) return null;
  return `https://fonts.googleapis.com/css2?${familias
    .map((g) => `family=${g}`)
    .join("&")}&display=swap`;
}

/** Versión liviana (un solo peso) para las muestras del editor. */
export function previewHref(): string {
  return `https://fonts.googleapis.com/css2?${FONTS.map(
    (f) => `family=${f.google.split(":")[0]}`
  ).join("&")}&display=swap`;
}
