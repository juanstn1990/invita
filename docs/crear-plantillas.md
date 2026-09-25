# Crear un diseño nuevo (plantilla de invitación)

Guía operativa para crear un diseño nuevo en este repo: qué archivos tocar, en
qué orden, qué comandos correr y qué errores evitar. Escrita para que un
agente (Kimi Code o cualquier otro) pueda seguirla sin haber visto el resto
del código primero.

Si algo de aquí no coincide con lo que encuentras en el repo, **manda el
código**: esto documenta cómo se hizo hasta ahora, no es la fuente de verdad.

---

## 0. Lo primero: entender qué es "un diseño" aquí

Una invitación = **un diseño** (paleta + tipografía + forma + CSS propio,
opcional) + **datos** (los textos, fotos y fechas que escribe quien organiza
el evento). El mismo diseño sirve para cientos de invitaciones distintas.

Hay **dos clases de diseño**, y la diferencia importa mucho para estimar el
esfuerzo:

- **Diseño de tokens** (la mayoría — unos 45 de 71 al momento de escribir
  esto): sólo declara paleta, tipografía, forma y qué "slot" de layout usa.
  **Cero CSS propio, cero arte.** Se escribe en 10-15 líneas dentro del
  archivo de su ocasión (`bodas.ts`, `quince.ts`, `grado.ts`…). El motor
  (`baseCss` en `src/lib/design/css.ts`) genera todo el CSS a partir de esos
  tokens. Estos diseños **nunca se rompen** al cambiar el motor.
- **Diseño de autor** (Boda Rosal, Grado Azul, Quince Rojo Carmesí…): tiene
  arte generado (PNG con Grok) y CSS propio en su propio archivo
  (`src/lib/design/designs/<slug>.ts`). Es más trabajo (medio día largo) pero
  es lo que se pide cuando el cliente trae una referencia visual concreta.

**Antes de crear nada, pregúntale al usuario si quiere un diseño de tokens
(rápido, "otro más de la familia X con esta paleta") o uno de autor (con
ilustraciones propias, como los que ya existen).** Si trae fotos de
referencia, es de autor.

Esta guía cubre principalmente el diseño de autor, porque es el que tiene
pasos y trampas. Al final hay una sección corta para el de tokens.

---

## 1. Antes de generar nada: mirar las referencias

Si el usuario adjunta fotos (de una decoración real, de Pinterest, de otra
invitación), analízalas para sacar:

1. **La paleta real** (2-4 colores, no inventados).
2. **2-4 piezas de arte concretas** que se repitan en las fotos (un arco, un
   ramo, una vela, una corona…). No más de 7-8 piezas en total para todo el
   diseño: cada una es una llamada a Grok y un recorte.
3. **La estructura**, si la referencia es una invitación de otro (no una
   decoración): qué secciones tiene, en qué orden, si mezcla ceremonia y
   fiesta en una sola ficha o en dos, etc.
4. **Un componente nuevo, si aplica**: ¿la referencia sugiere una apertura de
   velo que no existe todavía (velas, un jardín que se mece, un sobre con
   sello…)? Si sí, es la oportunidad de añadir un componente reusable en vez
   de algo pegado a este diseño — ver la sección 6.

**Importante — nunca copiar el arte ajeno.** Si la referencia es la página de
un competidor o una foto de stock, el arte se **genera de cero con Grok**
inspirado en el estilo, nunca se descarga ni se reusa el archivo original. Si
el usuario insiste en que "quede igual", acláraselo y procede con arte
propio en el mismo estilo — es lo que se ha hecho siempre en este proyecto.

---

## 2. Generar el arte con Grok

Script: `scripts/adornos-grok.py`. Necesita la clave de xAI en
`~/.config/xai/clave` (permisos 600) o en `$XAI_API_KEY`. **Nunca** se pone la
clave en el repo, en un commit ni en un comando que quede en el historial de
shell si se puede evitar; el script la lee solo.

```bash
mkdir -p /tmp/<scratch>/<slug-diseno>
cd /tmp/<scratch>/<slug-diseno>
python3 /ruta/al/repo/scripts/adornos-grok.py generar <nombre> "<prompt en inglés>" --fondo <claro|negro|solido|oscuro> --aspecto <relación>
```

- `--fondo claro`: para todo lo pintado en acuarela (flores, ramos, diplomas,
  libros, esquinas decorativas). El prompt debe terminar en algo como:
  `isolated on plain white paper, no shadow, no text, lots of margin`.
- `--fondo negro`: para lo que brilla (velas, farolillos, destellos, soles).
  El halo se conserva como resplandor. Prompt:
  `isolated on pure black background, no text`.
- `--fondo solido`: como `negro` pero para objetos opacos (una corona, un
  sello, una medalla) que no deben quedar translúcidos.
- `--fondo oscuro`: cuando `negro`/`solido` salieron con un fondo gris o con
  textura en vez de negro puro (pasa mucho con piezas doradas). Mide el
  fondo real en el borde de la imagen y lo quita.
- `--aspecto`: valores válidos: `1:1, 3:4, 4:3, 9:16, 16:9, 2:3, 3:2, 9:19.5,
  19.5:9, 9:20, 20:9, 21:9, 5:2, auto`. **No admite `3:1` ni proporciones
  fuera de esta lista** — si hace falta algo muy apaisado (un divisor
  horizontal delgado), usa `5:2` y recorta después, o genera cuadrado y
  recorta.

Para la **portada** (una ilustración de fondo, no un adorno recortable), usa
`--fondo claro` con un aspecto vertical (`3:4`) y deja mucho espacio vacío en
la mitad inferior — ahí es donde va el velo con el nombre. Ejemplo de prompt
real que funcionó bien:

```
elegant watercolor graduation scene: a bright university hall with tall
arched windows and soft warm light, a graduation cap and rolled diploma tied
with a gold ribbon resting on a white marble ledge, cream and gold palette
with soft white, airy and luminous, vertical composition with clean empty
space in the lower half
```

### Revisar antes de instalar

Después de generar, **mira cada pieza** (con el visor de imágenes) antes de
recortarla e instalarla. Fallos típicos:

- **El recorte "a mano" con detección de tinta arruina piezas oscuras**
  (rosas rojas, por ejemplo salen con manchas plateadas). Si el objeto es
  oscuro y el prompt pedía `--fondo claro`, y el recorte sale mal, regenera
  con `--fondo solido` sobre negro en vez de intentar arreglarlo con
  filtros.
- Si una pieza sale con una caja/sombra de fondo residual, no la instales:
  ajusta el prompt (agrega `no shadow, no paper, no card`) y repite.

### Instalar en `public/`

```python
from PIL import Image
import numpy as np, pathlib
src = pathlib.Path("/tmp/<scratch>/<slug-diseno>/adornos-grok")
dst = pathlib.Path("public/disenos/<slug-diseno>")
dst.mkdir(parents=True, exist_ok=True)

# La portada: JPG, sin recortar (es un fondo, no una pieza suelta).
p = Image.open(src / "portada.jpg").convert("RGB")
p.thumbnail((900, 1400)); p.save(dst / "portada.jpg", quality=86, optimize=True, progressive=True)

# Cada adorno: recortar al contenido real y reducir a 256 colores.
for n, w in (("pieza1", 440), ("pieza2", 360), ...):
    im = Image.open(src / (n + ".png")).convert("RGBA")
    a = np.array(im)[..., 3] > 26
    f = np.where(a.sum(1) > 2)[0]; c = np.where(a.sum(0) > 2)[0]
    im = im.crop((c.min(), f.min(), c.max() + 1, f.max() + 1))
    im.thumbnail((w, w * 3))
    im.quantize(256, method=Image.Quantize.FASTOCTREE).save(dst / (n + ".png"), optimize=True)
```

**Techo de peso**: el conjunto de arte de un diseño no debería pasar de
~900 kb (lo audita `audit:disenos`, ver sección 5). Con 6-8 piezas
recortadas a 256 colores, normalmente queda entre 350-450 kb.

---

## 3. Escribir el archivo del diseño

Archivo nuevo: `src/lib/design/designs/<slug>.ts`. Copia la estructura de un
diseño de autor existente (por ejemplo `gazul.ts` o `xvrojo.ts`, son los más
recientes y los más limpios) en vez de empezar de cero.

### 3.1 Paletas

```ts
import { paleta } from "../paleta";

const MI_PALETA = paleta({
  id: "mi-id-unico", nombre: "Nombre para el selector",
  base: "#fdf8f1",   // fondo de la página — decide si es clara u oscura
  tinta: "#2c2312",  // texto principal
  marca: "#8a6a2f",  // antetítulos, números, ornamentos (lleva texto encima)
  acento: "#a9803c", // botones rellenos (opcional; por defecto = marca)
  segundo: "#d9c194",// decorativo, degradados (nunca lleva texto)
});
```

`paleta()` (en `src/lib/design/paleta.ts`) **ajusta automáticamente el
contraste** de `tinta`, `marca` y `acento` contra los tres fondos posibles
(página, sección alterna, tarjeta) hasta que cumplen WCAG. No hace falta
calcular contraste a mano; sí hace falta elegir colores de partida que se
parezcan a lo que quieres, porque el ajuste puede desplazarlos si el
original no contrasta.

Cada diseño trae **4 paletas** (una por defecto + 3 variantes). Es la
convención: revisa cualquier diseño existente para ver el patrón (una más
oscura/nocturna, una con otro tono de acento, etc).

### 3.2 El `id` de `slug`

- Bodas: sin prefijo (`rosal`, `rosalila`).
- Quince años: prefijo `15-` (`15-rojo` → pero el campo `slug` del `Design`
  es sin el prefijo del template; revisa `templateId()` en
  `src/lib/design/designs/index.ts` — es `invitacion-${slug}`, y las
  quinceañeras llevan el `15-` **dentro** del propio `slug`, ej.
  `slug: "15-rojo"`).
- Grado: prefijo `g-` (`g-azul`, `g-dorado-gala`).
- Revisa el archivo de la ocasión correspondiente (`bodas.ts`, `quince.ts`,
  `grado.ts`, `comunion.ts`, `infantiles.ts`) para copiar la convención
  exacta antes de inventar una.

### 3.3 CSS propio: sólo lo que el motor no sabe decir

**No reescribas tokens que el sistema base ya cubre.** El motor
(`src/lib/design/css.ts` + `Layout` en `theme.ts`) ya genera: el reset, la
tipografía de los slots según `type`, el ritmo de secciones según
`density`/`shape`, las tarjetas según `layout.cards`, los botones, el velo
de portada según `layout.hero`. Escribir esas mismas reglas a mano en el
`css` del diseño es exactamente el problema que se viene arreglando esta
semana (ver sección 7 — "por qué esto importa").

Lo que sí va en `css: (t) => \`...\`` de un diseño de autor:

- Variables propias (`--xr-tit`, `--xr-hilo`…) para no repetir valores.
- El fondo/velo específico de la portada si usa una foto propia (gradiente
  de aclarado, posición).
- El look de las fichas si es distinto del genérico (bordes, sombra propia).
- Reglas muy puntuales de una sección (ej. "la banda del brindis, a
  sangre, con degradado desde abajo").
- **Nunca** el arte en sí (`background: url(...)`) para algo que debería ser
  un adorno — ver sección 4.

### 3.4 `layout`, `type`, `shape`

```ts
layout: { hero: "minimal", head: "center", cards: "flat", countdown: "tiles", gallery: "mosaic", divider: "none" },
type: {
  display: "'Prata', Georgia, serif",   // obligatorio
  body: "'Cormorant Garamond', Georgia, serif", // obligatorio
  displayWeight: 400, base: 17.5, scale: 1.26,
  displayTracking: "0.01em", tracking: "0.28em",
},
shape: { radius: 3, radiusSm: 3, btnRadius: "pill", shadow: "none" },
```

Mira `export interface Layout` en `src/lib/design/theme.ts` para los valores
válidos de cada slot (`hero`: `panel | editorial | minimal | band | split |
frame | acta`; etc — están comentados ahí mismo). No inventes un valor que no
esté en el tipo: TypeScript lo rechaza en el build.

### 3.5 `fontUrl`

```ts
fontUrl: gfont("family=Prata&family=Jost:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400"),
```

Sólo los pesos que de verdad se usan — cada peso de más es una descarga.

### 3.6 `padresEn`

Si el `layout.hero` es `minimal` (portada a sangre, sin sitio para los
nombres de los padres), añade `padresEn: "guests"` para que el renderer los
baje automáticamente a la sección de invitados.

---

## 4. Los adornos: TODO el arte declarado como datos, no como CSS

**Esta es la regla más importante de todo el documento y la que más se ha
tenido que corregir en diseños ya hechos.** Ningún PNG del diseño debería
estar pegado con `background: url(...)` en el CSS si es una pieza que
"decora" una sección (una corona sobre un título, un ramo, una esquina). Va
declarado en `adornos`, en el propio `Design`:

```ts
export const miDiseno: Design = {
  // ...
  adornos: [
    { seccion: "hero",      url: `${A}/esquina.png`, sitio: "arriba-der", tamano: 38, espejo: "h" },
    { seccion: "countdown", url: `${A}/birrete.png`, sitio: "cabecera",  tamano: 34 },
    { seccion: "guests",    url: `${A}/laurel.png`,  sitio: "cabecera",  tamano: 40 },
    { seccion: "*",         url: `${A}/divisor.png`, sitio: "titulo",    tamano: 60 }, // "*" = todas las secciones con título
  ],
};
```

### 4.1 Por qué

Cuando el arte vive en el CSS, quien organiza la invitación **no puede
moverlo, encogerlo ni quitarlo** — el editor no sabe que existe. Declarado
como adorno, **nace ya en los datos de la invitación** (se copia al crearla)
y aparece en el editor con su propio control de sitio/tamaño/opacidad/giro,
como cualquier adorno que alguien agregaría a mano.

### 4.2 Los campos de `AdornoDeDiseno`

Interfaz completa en `src/lib/design/theme.ts`:

```ts
interface AdornoDeDiseno {
  seccion: string;   // clave de sección: "splash" | "hero" | "countdown" | "guests" |
                      // "events" | "gallery" | "features" | "gifts" | "social" |
                      // "confirm" | "footer", o "*" (ver más abajo)
  url: string;       // ruta bajo /disenos/<slug>/...
  sitio?: string;    // ver los 12 valores válidos abajo
  x?: number; y?: number;   // sólo con sitio "libre" — centro en % de la sección
  tamano?: number;   // ancho, en % — de la sección para los anclados, de la
                      // pantalla para "titulo"/"cabecera"
  capa?: "" | "encima";     // por defecto detrás del texto
  opacidad?: number; // 0-100
  giro?: number;     // grados
  espejo?: "" | "h" | "v" | "hv";
  entrada?: string;  // animación al asomarse
  movimiento?: string; // animación en bucle
}
```

### 4.3 Los 12 valores de `sitio` (`SITIOS` en `src/lib/schema.ts`)

| valor | qué hace |
|---|---|
| `arriba-izq`, `arriba`, `arriba-der` | anclado, posición absoluta |
| `izq`, `centro`, `der` | anclado, centro vertical |
| `abajo-izq`, `abajo`, `abajo-der` | anclado, abajo |
| `sangre` | cubre la sección entera |
| `libre` | posición libre con `x`/`y` (0-100, % de la sección) |
| `titulo` | **en el flujo**, justo debajo del título, empujando el texto de abajo. Es el sitio de la filigrana que casi todos los diseños ponen bajo cada encabezado. Con `seccion: "*"` se reparte automáticamente a `SECCIONES_CON_TITULO` = `countdown, guests, events, gallery, features, gifts, social, confirm` (`footer` y `hero`/`splash` NO tienen título de sección, así que el comodín no les llega — para esas dos, declara el adorno explícitamente con su propia sección). |
| `cabecera` | **en el flujo**, arriba del todo, **antes del antetítulo**. Es el sitio de la corona/ramo/sello que preside una sección entera. |

Los sitios anclados (`arriba-izq`…`abajo-der`, `sangre`, `libre`) van
**encima** de la sección con `position: absolute`. Los dos últimos
(`titulo`, `cabecera`) van **dentro del flujo del documento** — no hay que
elegir uno arbitrariamente: si la pieza tiene que "presidir" (verse arriba de
todo, empujando el resto) es `cabecera`; si va "debajo del título como
filete decorativo" es `titulo`.

### 4.4 Trampa real que ya pasó dos veces: el comodín pisa lo que ya está ahí

Si declaras `{ seccion: "*", url: ramita, sitio: "titulo" }` y **además**
alguna sección de ese mismo diseño ya tiene un dibujo puesto en el hueco del
`.ornament` vía CSS (algo como `#features .ornament{background:url(...)}`),
el comodín va a **reemplazar** ese hueco con la ramita genérica y el dibujo
específico desaparece sin avisar. Pasó con "los novios" de Rosal. La
solución: declara esa sección **explícitamente**, con su propia pieza, en
vez de dejar que la agarre el comodín:

```ts
adornos: [
  { seccion: "countdown", url: `${A}/ramita.png`, sitio: "titulo", tamano: 47 },
  { seccion: "guests",    url: `${A}/ramita.png`, sitio: "titulo", tamano: 47 },
  { seccion: "features",  url: `${A}/novios.png`, sitio: "titulo", tamano: 44 }, // NO "*", tiene su propia pieza
  // ... una línea por cada sección, sin comodín
],
```

`npm run audit:disenos` (sección 5) detecta el caso general de "hay CSS que
pinta sobre `.ornament` y el diseño también declara filigrana ahí" y avisa.
Aun así, revísalo a ojo: es fácil de repetir.

### 4.5 Lo que NO va como adorno (queda en CSS, y está bien)

- La **ilustración de portada** (`hero-bg`): es un fondo, no una pieza
  suelta que se mueva.
- El **lacre del sobre** (`.inv-sobre-sello`): es parte del componente del
  sobre, no algo que se pueda separar de él.
- Los **iconos dentro de fichas individuales** (la capilla en la tarjeta de
  ceremonia, las copas en la de recepción): son del marcado de esa ficha
  específica, no un adorno de la sección entera.
- El **escudo/marco del bloque de ubicación**: ese bloque se agrega aparte
  y sus datos no llegan a la semilla de adornos del diseño (limitación
  conocida, no arreglada todavía).

---

## 5. Componentes de apertura, cuenta atrás y programa: reusar antes de inventar

Antes de escribir CSS/JS específico para "cómo se abre el velo" o "cómo se
ve la cuenta atrás", revisa qué ya existe:

- **Aperturas** (`APERTURAS` en `src/lib/render.ts`): `sobre, sello, deseo,
  libro, abanico, nubes, telon, anillos, ventana, claqueta, mariposa,
  escarcha, naipe, jardin, velas`. Se eligen desde `splash.apertura` en el
  esquema (`src/lib/schema.ts`, busca `key: "apertura"`).
- **Cuentas atrás**: variantes del bloque `countdown` en `src/lib/blocks.ts`
  — `circulos, tarjetas, anillos, tipografico, linea, capsulas, placas,
  reloj, vertical, orbitas, paletas, luciernagas, marquesina, alas,
  cristales, bolsillo, medallon`.
- **Programas**: variantes del bloque `events` — `tarjetas, timeline,
  itinerario, constelacion, capitulos, sendero, viaje, cinta, postales,
  naipes, lista`.
- **Galerías**: variantes del bloque `gallery` — `cuadricula, mosaico, tira,
  carrusel, tresydos, rasgada, polaroid, arco, circulos, marco, revista,
  escalera, apilada, mamposteria, cinta, collage`.

Si nada de eso encaja con lo que pide la referencia (por ejemplo, "velas
encendidas que se avivan al tocar" no existía y se creó para Quince Rojo
Carmesí), créalo como **componente nuevo en `src/lib/componentes.ts`** — CSS
y JS ahí — más su registro en `render.ts` (`APERTURAS`, el bloque de marcado
en `wireSplash`/donde corresponda, y la lista de scripts al final del
archivo). Así **cualquier diseño futuro** puede usarlo, no sólo el que lo
motivó. Sigue el patrón de la apertura "velas" como ejemplo completo
(búscala en `componentes.ts` y en `render.ts`, tiene comentarios extensos
explicando cada decisión).

**Regla dura, sin excepción, de `componentes.ts`**: dentro de las plantillas
de texto de TypeScript (los strings con backtick de CSS/JS) **no puede
aparecer ni una sola comilla invertida**, ni siquiera dentro de un
comentario. Rompe el build de forma poco clara (el error de TypeScript no
señala el backtick perdido, señala cualquier cosa después de él). Esto ha
pasado tres veces en esta sesión. Si necesitas comillas dentro de un
comentario en ese archivo, usa comillas normales o tipográficas (`«»`, `""`),
nunca `` ` ``.

---

## 6. Registrar el diseño

En el archivo de la ocasión (`src/lib/design/designs/bodas.ts`, `quince.ts`,
`grado.ts`, …):

```ts
import { miDiseno } from "./mi-slug";
// ...
export const BODAS: Design[] = [ /* ...existentes... */, miDiseno ];
```

---

## 7. Construir, auditar, verificar visualmente

Orden exacto, siempre en este orden:

```bash
npx tsc --noEmit                    # errores de tipos primero — más rápido que el build completo
npm run templates:build             # hornea el HTML de las 70+ plantillas; verifica contraste
npm run audit:disenos               # el lint de diseños (ver 7.1)
npx tsx scripts/smoke-render.ts     # renderiza todos los diseños con datos de muestra
npx tsx scripts/audit-bindings.ts   # cada campo del esquema tiene su marcado, y viceversa
npx tsx scripts/audit-mcp.ts        # el servidor MCP sigue respondiendo bien
```

Si cualquiera de estos falla, **para y arregla antes de seguir** — no se
acumulan fallos para el final.

### 7.1 `npm run audit:disenos` — qué revisa

Script: `scripts/audit-disenos.ts`. Es estático (no arranca nada, 2
segundos) y comprueba, sobre el código fuente de cada diseño:

1. **CSS muerto**: reglas que apuntan a una sección (`#events`, `#gifts`…)
   que esa plantilla horneada no tiene.
2. **Variantes inventadas**: clases `.inv-v-algo` que no corresponden a
   ninguna variante real de ningún bloque.
3. **Arte que no existe**: una URL en el CSS que no está en `public/`.
4. **Adornos sin archivo**: un adorno declarado apuntando a un PNG
   inexistente.
5. **Ornamento pisado**: CSS que pinta sobre `.ornament` en una sección que
   también declara filigrana ahí (ver 4.4).
6. **Arte demasiado pesado**: más de 900 kb en `public/disenos/<slug>/`.

### 7.2 Línea base visual — `npm run audit:visual`

Compara una "huella" (una rejilla 16×256 en escala de grises, no la imagen
completa) de cada diseño contra una guardada en `scripts/visual.base.json`.
Sirve para detectar que un cambio en el **motor compartido** (no en tu
diseño nuevo) movió algo en los diseños existentes sin que nadie lo pidiera.

```bash
npx tsx scripts/audit-visual.ts invitacion-<tu-slug>   # comparar sólo el nuevo
npx tsx scripts/audit-visual.ts invitacion-<tu-slug> -- --aceptar   # guardar su línea base la primera vez
```

Para un diseño **nuevo** siempre hay que `--aceptar` una vez (no existe
línea base previa). Para diseños **existentes** que tocaste sin querer,
mira antes la captura en `.preview/shots/` y decide si el cambio era
intencional antes de aceptar.

Corre los 71 diseños en ~5 minutos; no hace falta correrlo completo por cada
cambio pequeño, pero sí antes de cualquier despliegue.

### 7.3 Verificación visual manual — HTML autocontenido, SIEMPRE antes de dar por bueno un diseño

**No se considera terminado un diseño hasta que el usuario lo ha visto
renderizado con sus propios ojos**, con datos de ejemplo razonables (nombre
de dos personas, fecha creíble, dirección real o inventada del mismo
estilo). El flujo:

1. Render con `presetFor()` + un parche de datos de ejemplo (nombre, fecha,
   textos de cada sección).
2. Reemplazar cada `/disenos/...` en el HTML resultante por un `data:` URI
   en base64 del archivo correspondiente en `public/`, para que el HTML sea
   un único archivo que abre sin servidor.
3. Guardarlo, mandarlo al usuario (herramienta de archivos / adjunto) y
   copiarlo también a su escritorio si el flujo de trabajo lo pide.
4. **Esperar su aprobación antes de tocar la app en producción o hacer
   commit del diseño como definitivo.**

No se salta este paso aunque las auditorías automáticas pasen: las
auditorías comprueban que el código no está roto, no que el diseño se vea
bien o que combine con lo que el cliente pidió.

---

## 8. Commit y despliegue

- Un commit por diseño (o por cambio de motor), mensaje explicando el
  **qué** y sobre todo el **por qué** de las decisiones no obvias (por
  ejemplo: "las columnas de rosas van a media opacidad porque el texto
  queda encima pero rosa oscura sobre tinta oscura no se lee").
- El despliegue a producción **es manual** (EasyPanel, redeploy a mano) —
  no asumas que un `git push` lo publica solo. Avisa al usuario que hace
  falta redesplegar cuando termines.
- Hay una ruta `/api/version` que devuelve `{ arrancado, disenos,
  plantillas, disenosConAdornos, adornosDeclarados }` — útil para confirmar
  si producción ya tiene los cambios sin adivinar.
- Localmente hay un `docker-compose` con Postgres; reconstruir la imagen
  local (`docker compose build app && docker compose up -d app`) sirve para
  probar el flujo completo (crear invitación real vía MCP, ver el editor)
  antes de pedir el despliegue de producción.

---

## 9. Checklist rápido (resumen ejecutable)

```
[ ] ¿El usuario quiere tokens o autor? Si trae fotos → autor.
[ ] Analizar referencias → paleta real + 4-8 piezas de arte + estructura
[ ] Generar arte con Grok (scripts/adornos-grok.py), revisar cada pieza a ojo
[ ] Instalar en public/disenos/<slug>/ (recortado, cuantizado, <900kb total)
[ ] Escribir src/lib/design/designs/<slug>.ts
    [ ] paletas con paleta()
    [ ] layout/type/shape (sin inventar valores fuera de los tipos)
    [ ] css: sólo lo que el motor no cubre
    [ ] adornos: TODO el arte decorativo, nunca como background: url() suelto
    [ ] revisar el comodín "*" no pisa piezas específicas de otras secciones
[ ] Si hace falta un componente nuevo (apertura/cuenta atrás/programa):
    escribirlo en componentes.ts + render.ts, SIN backticks en los strings
[ ] Registrar en el archivo de la ocasión (bodas.ts / quince.ts / grado.ts…)
[ ] npx tsc --noEmit
[ ] npm run templates:build
[ ] npm run audit:disenos
[ ] npx tsx scripts/smoke-render.ts
[ ] npx tsx scripts/audit-bindings.ts
[ ] npx tsx scripts/audit-mcp.ts
[ ] npx tsx scripts/audit-visual.ts invitacion-<slug> -- --aceptar
[ ] Generar HTML autocontenido de muestra y ESPERAR aprobación del usuario
[ ] Commit con mensaje explicando decisiones no obvias
[ ] Avisar que falta redesplegar a producción
```

---

## 10. Diseño de tokens (el camino corto)

Si NO hace falta arte propio (el usuario pide "otro de bodas pero en verde
esmeralda", por ejemplo), casi todo el proceso de arriba sobra:

```ts
// dentro de bodas.ts, por ejemplo
const ESMERALDA = paleta({
  id: "esmeralda", nombre: "Verde esmeralda",
  base: "#f6f9f7", tinta: "#1c2e24", marca: "#1f5c3f", acento: "#2a7a52", segundo: "#a8c9b6",
});

const esmeralda: Design = {
  slug: "esmeralda",
  name: "Boda Esmeralda",
  occasion: "boda",
  mood: "Una línea describiendo el estilo, para el selector",
  fontUrl: gfont("family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400"),
  layout: { hero: "panel", head: "center", cards: "outline", countdown: "circles", gallery: "grid", divider: "rule" },
  type: { display: "'Cormorant Garamond', Georgia, serif", body: "'Cormorant Garamond', Georgia, serif" },
  shape: { radius: 8, radiusSm: 6, btnRadius: 4, shadow: "soft" },
  palettes: [ESMERALDA, /* ...3 variantes más... */],
};
```

Sin `css`, sin `adornos`, sin arte. Regístralo, corre
`npx tsc --noEmit && npm run templates:build && npm run audit:disenos &&
npx tsx scripts/smoke-render.ts`, genera el HTML de muestra igual que en el
paso 7.3, y listo — esto no debería tardar más de 15-20 minutos en total.

---

## Por qué existe este documento (contexto para quien lo lea después)

Esta semana se migraron ~150 imágenes que estaban pegadas en el CSS de 20
diseños de autor hacia el sistema de adornos, porque no había manera de
tocarlas desde el editor. Al hacerlo se descubrieron y arreglaron varios
fallos reales que ya estaban en producción desde hacía tiempo:

- Elegir otra variante de un bloque (por ejemplo, otro estilo de "Programa")
  hacía **desaparecer** el arte de esa sección en 18 de 25 diseños, porque el
  bloque nacía como una sección nueva al lado en vez de escribirse dentro de
  la sección del diseño.
- Las capturas de prueba (`scripts/shots.ts`) **nunca servían las
  imágenes** — sólo el HTML —, así que meses de comparaciones visuales
  fueron ciegas sin que nadie lo notara (un `background-image` que no carga
  no rompe el layout si el elemento ya tiene su alto reservado).
- Sacar el arte del CSS sin sembrarlo también en los datos de las
  invitaciones **ya publicadas** las habría dejado sin corona, sin ramo, sin
  esquinas al desplegar — se detectó y se arregló antes de salir a
  producción, pero fue por poco.

De ahí salieron `audit:disenos` y `audit:visual`: no existían, y su ausencia
es la razón de que estos fallos tardaran semanas en notarse. Si vas a tocar
el motor compartido (`css.ts`, `theme.ts`, `blocks.ts`, `render.ts`) y no
sólo un diseño individual, corre las dos auditorías completas (los 71
diseños, no sólo el tuyo) antes de dar el cambio por terminado.
