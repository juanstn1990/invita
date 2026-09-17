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
  group: "serif" | "sans" | "caligrafica" | "manuscrita" | "titular" | "redondeada";
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

  /* ── Las que faltaban ──────────────────────────────────────────
     Diecisiete se quedaban cortas, y sobre todo en caligráficas: eran tres
     para la categoría que más se pide en una invitación: ahora son trece.
     Con éstas el selector pasa de 17 a 53.

     Se piden con los pesos justos, como las de arriba. Las caligráficas
     traen uno solo porque sólo tienen uno — y eso es parte de por qué son
     baratas: una firma caligráfica pesa menos que una serifa con tres pesos. */

  { id: "ebgaramond", name: "EB Garamond", group: "serif", css: "'EB Garamond', Georgia, serif", google: "EB+Garamond:ital,wght@0,400;0,600;1,400" },
  { id: "cinzel", name: "Cinzel", group: "serif", css: "'Cinzel', Georgia, serif", google: "Cinzel:wght@400;600" },
  { id: "marcellus", name: "Marcellus", group: "serif", css: "'Marcellus', Georgia, serif", google: "Marcellus" },
  { id: "prata", name: "Prata", group: "serif", css: "'Prata', Georgia, serif", google: "Prata" },
  { id: "bodoni", name: "Bodoni Moda", group: "serif", css: "'Bodoni Moda', Georgia, serif", google: "Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;1,6..96,400" },
  { id: "spectral", name: "Spectral", group: "serif", css: "'Spectral', Georgia, serif", google: "Spectral:ital,wght@0,300;0,400;0,600;1,400" },
  { id: "crimson", name: "Crimson Pro", group: "serif", css: "'Crimson Pro', Georgia, serif", google: "Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400" },
  { id: "gilda", name: "Gilda Display", group: "serif", css: "'Gilda Display', Georgia, serif", google: "Gilda+Display" },
  { id: "cormorantinfant", name: "Cormorant Infant", group: "serif", css: "'Cormorant Infant', Georgia, serif", google: "Cormorant+Infant:ital,wght@0,300;0,400;0,600;1,400" },

  { id: "poppins", name: "Poppins", group: "sans", css: "'Poppins', system-ui, sans-serif", google: "Poppins:wght@300;400;600" },
  { id: "lato", name: "Lato", group: "sans", css: "'Lato', system-ui, sans-serif", google: "Lato:wght@300;400;700" },
  { id: "worksans", name: "Work Sans", group: "sans", css: "'Work Sans', system-ui, sans-serif", google: "Work+Sans:wght@300;400;600" },
  { id: "outfit", name: "Outfit", group: "sans", css: "'Outfit', system-ui, sans-serif", google: "Outfit:wght@300;400;600" },
  { id: "josefin", name: "Josefin Sans", group: "sans", css: "'Josefin Sans', system-ui, sans-serif", google: "Josefin+Sans:wght@300;400;600" },

  { id: "alexbrush", name: "Alex Brush", group: "caligrafica", css: "'Alex Brush', cursive", google: "Alex+Brush" },
  { id: "pinyon", name: "Pinyon Script", group: "caligrafica", css: "'Pinyon Script', cursive", google: "Pinyon+Script" },
  { id: "tangerine", name: "Tangerine", group: "caligrafica", css: "'Tangerine', cursive", google: "Tangerine:wght@400;700" },
  { id: "sacramento", name: "Sacramento", group: "caligrafica", css: "'Sacramento', cursive", google: "Sacramento" },
  { id: "allura", name: "Allura", group: "caligrafica", css: "'Allura', cursive", google: "Allura" },
  { id: "italianno", name: "Italianno", group: "caligrafica", css: "'Italianno', cursive", google: "Italianno" },
  { id: "petitformal", name: "Petit Formal Script", group: "caligrafica", css: "'Petit Formal Script', cursive", google: "Petit+Formal+Script" },
  { id: "yellowtail", name: "Yellowtail", group: "caligrafica", css: "'Yellowtail', cursive", google: "Yellowtail" },
  { id: "cookie", name: "Cookie", group: "caligrafica", css: "'Cookie', cursive", google: "Cookie" },
  { id: "marck", name: "Marck Script", group: "caligrafica", css: "'Marck Script', cursive", google: "Marck+Script" },

  /* Manuscritas, que no es lo mismo que caligráficas: éstas imitan una mano
     corriente y no una pluma. Para unos quince o un cumpleaños dicen otra
     cosa, y en una boda formal desentonan — por eso van aparte. */
  { id: "caveat", name: "Caveat", group: "manuscrita", css: "'Caveat', cursive", google: "Caveat:wght@400;600" },
  { id: "shadows", name: "Shadows Into Light", group: "manuscrita", css: "'Shadows Into Light', cursive", google: "Shadows+Into+Light" },
  { id: "indie", name: "Indie Flower", group: "manuscrita", css: "'Indie Flower', cursive", google: "Indie+Flower" },
  { id: "amatic", name: "Amatic SC", group: "manuscrita", css: "'Amatic SC', cursive", google: "Amatic+SC:wght@400;700" },
  { id: "kalam", name: "Kalam", group: "manuscrita", css: "'Kalam', cursive", google: "Kalam:wght@300;400;700" },

  /* De titular: tienen mucha personalidad y ninguna paciencia para un
     párrafo. Se ofrecen aparte para que nadie ponga un texto largo en ellas
     sin darse cuenta. */
  { id: "abril", name: "Abril Fatface", group: "titular", css: "'Abril Fatface', Georgia, serif", google: "Abril+Fatface" },
  { id: "bebas", name: "Bebas Neue", group: "titular", css: "'Bebas Neue', system-ui, sans-serif", google: "Bebas+Neue" },
  { id: "cinzeldeco", name: "Cinzel Decorative", group: "titular", css: "'Cinzel Decorative', Georgia, serif", google: "Cinzel+Decorative:wght@400;700" },
  { id: "unifraktur", name: "UnifrakturMaguntia", group: "titular", css: "'UnifrakturMaguntia', Georgia, serif", google: "UnifrakturMaguntia" },

  { id: "nunito", name: "Nunito", group: "redondeada", css: "'Nunito', system-ui, sans-serif", google: "Nunito:wght@300;400;600" },
  { id: "comfortaa", name: "Comfortaa", group: "redondeada", css: "'Comfortaa', system-ui, cursive", google: "Comfortaa:wght@400;600" },
  { id: "fredoka", name: "Fredoka", group: "redondeada", css: "'Fredoka', system-ui, sans-serif", google: "Fredoka:wght@400;600" },
];

export const FONT_BY_ID: Record<string, FontOption> = Object.fromEntries(
  FONTS.map((f) => [f.id, f])
);

export const GROUP_LABEL: Record<FontOption["group"], string> = {
  serif: "Con serifa",
  sans: "Sin serifa",
  caligrafica: "Caligráficas",
  manuscrita: "Manuscritas",
  titular: "De titular",
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

/**
 * Versión liviana (un solo peso) para las muestras del editor.
 *
 * Se piden las cincuenta y tres familias de una vez, y eso sólo pasa la
 * primera vez que alguien abre un selector — no al entrar al editor. Sin el
 * peso, que es lo que multiplica: son cincuenta y tres regulares, no cincuenta
 * y tres × tres.
 */
export function previewHref(): string {
  return `https://fonts.googleapis.com/css2?${FONTS.map(
    (f) => `family=${f.google.split(":")[0]}`
  ).join("&")}&display=swap`;
}
