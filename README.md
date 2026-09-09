# Invita

Elige uno de 42 diseños de invitación, súbele tus fotos, cámbiale la paleta,
y publícalo en la dirección que tú definas: `tudominio.com/invitacionjuan`.

```bash
npm install
npx prisma db push       # crea prisma/dev.db
npm run templates:build  # genera templates/ desde src/lib/design/
npm run dev              # http://localhost:3000
```

## Fotos de terceros: ninguna

Nada de lo decorativo pide un archivo a nadie: los adornos son SVG en línea y
las texturas son degradados. Los 14 diseños originales traían fotos de
`fixdate.io` —el sitio del que se sacó la referencia— y de Unsplash embebidas,
así que cada invitación publicada le pedía imágenes a un tercero y mostraba
fotos que no eran de quien la publicaba.

`npm run audit:browser` abre los 27 en Chromium y verifica que ninguno lance
errores de JavaScript, que ninguno pida imágenes a dominios externos, y que la
foto del organizador siga puesta después de que corran los scripts. Es la
auditoría que ejecuta el HTML; las otras dos lo leen.

## Cómo funciona

Un solo esqueleto, 27 pieles.

```
Esquema canónico (JSON)          Diseño (tema + slots + adornos)
        │                                    │
        │                                    ▼
        │                          skeleton.ts → templates/*.html
        │                                    │
        └──────► renderer (lee data-inv) ◄───┘
                          │
                          ▼
        Invitación renderizada ──► SQLite ──► /invitacionjuan
```

Los 27 archivos de `templates/` se **generan**. El marcado es el mismo en
todos y cada elemento editable declara qué campo del esquema es:

```html
<h2 class="section-title" data-inv="events.title">Cómo será el día</h2>
<div class="events-grid" data-inv-list="events">
  <article class="event-card" data-inv-item>
    <p class="event-type" data-inv="events.items.kind">Ceremonia</p>
```

Lo que cambia entre diseños es el **tema** (paleta, escala tipográfica, forma)
y los **slots de layout** (dónde se apoya la portada, cómo es la cabecera de
cada sección, si las tarjetas llevan sombra o filete). Todo eso es CSS sobre
el mismo DOM, así que el renderer, el reordenado de bloques y las variantes no
se enteran de con qué diseño están trabajando.

### Las piezas

| Archivo | Qué hace |
| --- | --- |
| `src/lib/schema.ts` | El esquema canónico: qué secciones y campos existen y qué traen por defecto. **Fuente única de verdad del contenido.** |
| `src/lib/design/theme.ts` | El tema de un diseño: paleta, tipografía, forma, ritmo. **Todo declarado.** Y los seis slots de layout. |
| `src/lib/design/css.ts` | La hoja compartida. Los tamaños salen de la escala, el aire de la densidad; los slots son bloques de CSS sobre el mismo marcado. |
| `src/lib/design/skeleton.ts` | El marcado, con sus `data-inv`. |
| `src/lib/design/designs/` | Los 18 diseños (27 con las versiones de niña y niño). |
| `src/lib/design/contraste.ts` | Verifica los pares de colores. Un diseño ilegible rompe el build. |
| `src/lib/bindings.ts` | De campo a elemento. Se **deriva del esquema**: el tipo del campo dice qué operación le toca. |
| `src/lib/render.ts` | Aplica el esquema sobre el HTML con linkedom: textos, listas, secciones apagadas, orden de bloques, RSVP. |

```bash
npm run templates:build    # genera los 27 y verifica el contraste
npm run iconos:build       # vendoriza el arte de Phosphor que declara la tabla
npm run audit:bindings     # el esquema y el marcado coinciden, en las dos direcciones
npm run audit:render       # renderiza los 27 con datos de prueba a .preview/
npm run audit:browser      # los abre en Chromium: errores JS, pedidos externos, fotos
npm run templates:shots    # capturas reales a .preview/shots/
```

`scripts/contactsheet.py` parte esas capturas (son de ~5000px de alto) en
columnas lado a lado para poder revisarlas de un vistazo.

### Lo que había antes, y por qué cambió

Durante un tiempo hubo **dos sistemas**: 13 diseños generados desde un
esqueleto compartido y 14 escritos a mano. Los de mano no se podían tocar, así
que para meterles contenido cada campo declaraba una lista de selectores CSS
candidatos y ganaba el primero que existiera en ese diseño, con un bloque de
`OVERRIDES` para los que se salían del patrón.

Funcionaba, y el coste estaba repartido por todas partes:

| | Antes | Ahora |
| --- | --- | --- |
| Campos sin mapear | **213** (todos en los de mano) | **0** |
| Overrides por diseño | 8 bloques | 0 |
| `bindings.ts` | 555 líneas de selectores | 296, derivadas del esquema |
| Tokens visuales | 1952 líneas muestreadas de Chromium | declarados en el tema |
| `support.ts` | parseaba cada HTML para saber qué esconder | declara el soporte |
| Contraste | guardas en tiempo de render | verificado en el build |

Los números de la izquierda no eran el problema en sí. El problema era que
**todo lo demás tenía que ser defensivo**: el renderer buscaba en el CSS crudo
si un bloque tenía fondo propio (linkedom no resuelve estilos), repintaba las
secciones que sintetizaba porque varios diseños pintaban por id, y corregía el
color muestreado cuando no contrastaba. Cada abstracción cargaba con la
incertidumbre de los 14.


## Los diseños

42 diseños, y **cada uno con cuatro paletas**: 168 combinaciones.

| Ocasión | Diseños |
| --- | --- |
| **Bodas** (12) | Vintage · Blanco Oro · Marsala · Aurum · Ivory Leaf · Editorial · Nocturno · Campestre · Capilla · Bruma · Jardín · Gala |
| **Quince años** (9) | Blanco · Burdeos · Amanecer · Hojas · Viaje · Corona · Confeti · Vals · Jardín |
| **Comunión y bautizo** (8) | Blanco · Vintage · Amanecer · Tropical · Paloma · Espiga · Vitral · Primera |
| **Primer añito** (6) | Globos · Osito · Circo · Pastelito · Cuento · Huellita |
| **Baby shower** (7) | Nube · Bosque · Acuarela · Cigüeña · Lunita · Canastilla · Semilla |

### La paleta se elige al editar, no al escoger diseño

Un diseño es su **estructura** —dónde se apoya la portada, cómo es la cabecera
de cada sección, si las tarjetas llevan sombra o filete— y el color es una
elección aparte. Antes iban juntos, y por eso los cinco de quince eran cinco
variaciones de blanco con dorado: cambiar el color obligaba a hacer otro
diseño.

La paleta son **variables CSS**, así que el renderer la sustituye sobre el
template ya generado:

| | Archivos | Peso |
| --- | --- | --- |
| Una paleta = un template | 168 | ~7 MB, y un selector de 168 tarjetas |
| **Una paleta = unas variables** | **42** | 1,8 MB |

El obstáculo eran 45 valores hex escritos a mano en los degradados de portada
de bodas, quince y comunión. Ya no hay ninguno: el color vive en la paleta y
la portada se deriva de ella.

**Niña y niño dejaron de ser dos templates.** Eran el mismo marcado y el mismo
CSS generados dos veces con otra paleta; ahora son dos de las cuatro opciones
de un diseño. Se fueron diez archivos duplicados y la elección pasó del
catálogo a la invitación, que es su sitio. Los diez ids viejos siguen
abriendo, y `PALETA_POR_ID_VIEJO` les conserva el color: sin eso, una
invitación guardada como «globos-niño» se abriría en rosa.

### Las paletas se construyen, no se escriben

Una paleta completa son trece colores que tienen que cumplir diecinueve pares
de contraste. Escribirlas a mano se hizo inviable en cuanto cada diseño quiso
cuatro: 168 paletas son 2.184 valores que afinar a ojo hasta que pase el
verificador.

`paleta()` recibe **cinco decisiones** —fondo, tinta, marca, acento y un
segundo color— y deriva el resto. Lo importante: **lo que lleva texto se
ajusta solo** hasta cumplir su razón mínima, probando las dos direcciones y
quedándose con la que llega.

```
marca #c9a84c → #7e6930     el oro de Blanco Oro, oscurecido para que se lea
marca #f2a3bd → #855a68     un rosa clarísimo, ídem
```

Se probó con casos imposibles a propósito —blanco sobre blanco, todo gris
medio, amarillo chillón sobre amarillo— y las diez pasan. Tres defectos reales
del constructor salieron de esas pruebas: el acento no garantizaba contraste
con su propia letra, el degradado de la portada no se medía contra el texto
que lleva encima, y el ajuste probaba una sola dirección (sobre un gris medio
empujaba hacia el blanco, donde nunca llega a 4,5:1).

`npm run templates:build` verifica **las 168**, no sólo las que se hornean:
cualquiera se puede elegir al editar.

### Los slots de layout

Lo que hace que dos diseños no se parezcan **de estructura** y no sólo de
color. Cada valor es un bloque de CSS sobre el mismo marcado.

| Slot | Valores |
| --- | --- |
| **Portada** | `panel` tarjeta translúcida · `editorial` bloque sólido abajo a la izquierda · `minimal` texto sobre la foto con velo · `band` banda de lado a lado · `split` foto arriba y nombres abajo · `frame` doble marco de hilos |
| **Cabecera de sección** | `center` · `left` con filete al lado del antetítulo · `rule` filete a los dos lados del título · `stacked` dos pisos de título |
| **Tarjetas** | `elevated` con sombra · `outline` sólo borde · `flat` relleno · `rule` sin caja, un filete arriba |
| **Cuenta atrás** | `tiles` · `circles` · `type` sin caja · `line` en un renglón |
| **Galería** | `grid` 3×2 · `mosaic` la primera de cada seis al doble · `stack` una columna ancha |
| **Filo** | `none` · `rule` · `wave` · `torn` · `arc` |

Ninguno de los 27 comparte las seis. Coincidir en dos es normal; coincidir en
las seis era el problema de la versión anterior, donde los cinco de quince
eran cinco variaciones de blanco con dorado.

### La escala tipográfica y el ritmo

No hay tamaños sueltos en el CSS. El tema declara una razón (`scale`) y un
tamaño de cuerpo, y de ahí salen todos: `paso(t, n) = base · scale^n`. Cambiar
la razón de un diseño mueve todos sus tamaños a la vez y en proporción. 1.24
es sobrio, 1.36 es dramático — es la diferencia entre Ivory Leaf y Editorial.

El aire entre secciones sale de `density` (`compact`, `normal`, `airy`), no de
un número por diseño.

### Contraste, verificado en el build

Cada tema declara su paleta y `npm run templates:build` comprueba catorce
pares antes de escribir nada. Si uno no llega, falla y dice cuál:

```
✗ c-tropical · unico  portada: el antetítulo: #f0c9b0 sobre #14685c
                      da 4.33:1, hace falta 4.5:1
```

Los mínimos no son 4.5 en todo a propósito: el texto de lectura va a 4.5, los
títulos y los números de la cuenta atrás a 3.0 (el umbral de WCAG para texto
grande, y miden 30px o más), y los filetes a 1.25, que no llevan texto encima.

Esto reemplaza tres guardas que vivían en el renderer y corregían a mano
colores que ya venían mal, porque se **muestreaban** de cada template abriéndolo
en Chromium: en Blanco Oro el acento salía casi blanco y los números de la
cuenta atrás desaparecían; en Burdeos la tinta sobre el acento salía crema
sobre oro; en Blanco Oro y Marsala el hashtag quedaba justo por debajo del
umbral y era el caso que quedó sin resolver.

El `heroBg` es un degradado, no un color, así que no se puede medir. El diseño
declara en `heroBase` su tramo **más adverso** —el más oscuro si el texto de
la portada es oscuro— y con eso los pares de la portada se verifican igual que
los demás. De ahí salió el fallo de Tropical de arriba: la marca del diseño es
verde selva y el fondo de su portada también.


### Las diez cuentas atrás

Comparten el marcado y se distinguen sólo por CSS, todo con los tokens del
diseño, así que se ven intencionales en los 27 en vez de heredar las cajas de
cada template:

| Variante | Cómo se ve |
| --- | --- |
| **Círculos** | Cuatro círculos con el contorno del color de acento |
| **Tarjetas** | Cuatro placas rellenas de acento, número en el color de contraste |
| **Anillos** | Un aro de progreso por unidad que se va vaciando con el tiempo |
| **Tipográfico** | Números grandes sin caja, separados por filetes |
| **Una línea** | Todo en un renglón, para cuando la sección debe pesar poco |
| **Cápsulas** | Píldoras rellenas, número y unidad en el mismo renglón |
| **Placas** | Como un reloj de tablero, con la ranura a media altura |
| **Reloj** | Los cuatro números seguidos, separados por dos puntos |
| **En columna** | Una fila por unidad, número a la izquierda; cómodo en móvil |
| **Medallón** | Los días en un círculo grande y el resto pequeño debajo |

El aro de "anillos" lo alimenta el mismo script que actualiza los números:
además del texto escribe una variable `--p` con lo que le queda a cada unidad
dentro de su ciclo, y un `conic-gradient` con máscara la dibuja.

## Animaciones y espacios de foto

Los diseños generados llevan, todos con su equivalente para
`prefers-reduced-motion`:

- **Aparición en cascada** — la sección entra con un fundido y las tarjetas de
  cada grilla la siguen en secuencia, no todas de golpe.
- **Parallax de la portada** — la foto se mueve al 22% de la velocidad del
  scroll. Junto con la barra de progreso, en un solo `requestAnimationFrame`.
- **Barra de progreso** de lectura, 2px arriba.
- **Latido de los segundos** en la cuenta atrás, sólo cuando el número cambia.
- **Fotos** con acercamiento suave al pasar el cursor (y una leve rotación en
  Campestre, como foto pegada).
- **Salida del splash** con escala, y elevación en botones y tarjetas.

Los espacios de foto son dos: la **portada** (`hero.backgroundUrl`) y la
**galería**. La portada trae además un control de **opacidad del contenedor**
(`hero.panelOpacity`): en 100% el bloque de los nombres es sólido, en 0% el
texto queda directo sobre la foto. Vacío significa "la que trae el diseño",
así que el control no cambia nada hasta que lo muevas.

El diseño define su panel en dos piezas —`--panel-rgb` y `--panel-alpha`— y el
renderer inyecta una regla que reescribe sólo el alfa, sin tocar el color. Por
eso el campo aparece en los 13 generados y en **Ivory Leaf**, el único hecho a
mano con un panel translúcido en la portada; en los otros 13 el texto va
directo sobre la foto y no hay contenedor que atenuar, así que el editor
esconde el campo. Esa decisión la toma `templateSupport` con el nuevo
`requires` de las operaciones: no basta con que exista el elemento, el CSS del
diseño tiene que colaborar. Los tres de boda usan la galería en **mosaico** — la primera foto
de cada grupo de seis ocupa el doble — en vez de la cuadrícula 3×2 de los
demás. Sin fotos, cada casilla conserva su marcador, así que la invitación
nunca se ve rota.

## Bloques: orden y variantes

La invitación es una **lista ordenada de bloques**. Cada bloque tiene un tipo
(cuenta atrás, programa, galería…) y una **variante**, que es su diseño:

- `variant: ""` — se usa el marcado que trae el template. Es el
  comportamiento original y conserva el diseño tal cual.
- Cualquier otra — el marcado lo construye `scripts`… no: lo construye
  `src/lib/blocks.ts`, **con las mismas clases canónicas** que usa el mapa de
  bindings (`.section-label`, `.event-card`, `.countdown-ring`…).

Ese segundo caso es la idea central: como esas clases son justo las que el CSS
de cada template ya estiliza, **una variante nuestra sale con la piel del
diseño elegido sin escribir una línea de CSS por diseño**. La cuenta atrás en
"tarjetas" se ve dorada y con serifa en Blanco Oro, y negra con oro en
Nocturno, sin saber nada de ninguno de los dos.

El CSS inyectado sólo resuelve la *disposición* de cada variante, con colores
heredados (`currentColor`) para que funcione igual en un diseño claro o uno
oscuro.

| Bloque | Variantes |
| --- | --- |
| Cuenta atrás | la del diseño · círculos · tarjetas · anillos · tipográfico · una línea · **cápsulas · placas · reloj · en columna · medallón** |
| Invitados | la del diseño · tarjetas · lista |
| Programa | la del diseño · tarjetas · línea de tiempo · lista compacta |
| Galería | la del diseño · cuadrícula · mosaico · tira deslizable · polaroid · **arco · círculos · paspartú · revista · escalera · apiladas** |
| Información útil | la del diseño · tarjetas · lista |
| **Párrafo** (nuevo) | simple · destacado · dividido |
| **Foto** (nuevo) | a sangre · con marco · arco |
| **Ubicación** (nuevo) | mapa y ficha · mapa a sangre · sólo la ficha |
| Confirmación | la del diseño · propia |
| Mesa de regalos | la del diseño · tarjetas · sólo el mensaje |
| Redes y hashtag | la del diseño · propia |

### Las formas de la portada

La portada es lo más de autor de cada diseño —marcos, monogramas, marcas de
agua, flechas— y además no se reordena: vive en la lista de fijos junto al
splash y el pie. Así que sus variaciones **no rehacen su marcado**. Lo que
cambian es dónde va la foto y con qué recorte; todo lo demás sigue siendo del
template.

Hasta ahora la foto era siempre fondo a sangre, y en varios diseños el panel
de los nombres se planta justo encima: en Globos Niña tapaba la cara. Ahora hay
diez opciones —a sangre, círculo, arco, óvalo, con marco, tarjeta y banda, cada
forma encima o debajo de los nombres— y se guardan en `hero.disposicion`.

La pieza se inserta **en el flujo del bloque de los nombres**, no posicionada:
así la portada la centra y la separa como centra y separa lo suyo, y no hay que
pelearse con el posicionado de cada diseño, que es de donde vienen los sustos.
Cuando la foto no va de fondo tampoco se le pone el velo oscuro ni se fuerza el
texto en blanco, porque ya no hay nada que tapar.

Un detalle que costó: la regla de móvil que estrecha las formas recortadas
venía después y le pisaba el ancho a la banda, que es la única que sale a
sangre.

### Paralaje

Todas las fotos se mueven al desplazar, un poco más despacio que la página.

Nada de `background-attachment: fixed`: iOS lo ignora, y estas invitaciones se
abren casi siempre en el móvil. Lo hace un script propio que mueve cada capa
marcada con `transform`, una fracción de lo que se mueve su sección.

| Qué | Cuánto |
| --- | --- |
| La foto de portada a sangre | 0,22 |
| La foto de portada recortada (círculo, arco, óvalo, tarjeta, banda) | 0,10 |
| Una foto a sangre entre secciones | 0,16 |
| Las fotos de la galería | 0,07 |

La foto con marco no se mueve: ahí el borde blanco es parte de la pieza y
moverla lo delataría.

Tres cuidados, que son casi todo el trabajo:

- La capa se **agranda** un poco y el recorrido se **limita** a ese sobrante,
  así que al moverse nunca asoma el borde. Medido: con la portada a pantalla
  completa el recorrido se detiene en 93px, exactamente cuando el borde de la
  capa llega al de la portada.
- En las formas recortadas el redondeo vive en el envoltorio, que recorta, y
  la capa de dentro es la que viaja. Si el redondeo estuviera en la capa, el
  círculo se iría de sitio al moverse.
- Sólo se recalculan las capas visibles (`IntersectionObserver`) y dentro de
  un `requestAnimationFrame`; si no, desplazarse en un móvil es una sucesión
  de tirones.

Quien tenga puesto «reducir movimiento» en su sistema no ve nada de esto.

### Que la variante no rompa la paleta

Un bloque con marcado propio va dentro de una sección **nueva**. Ahora eso no
tiene nada de particular: el CSS del diseño estiliza `section`, `.container`,
`.section-title` y las clases de tarjetas con sus tokens, así que una sección
sintetizada sale con la piel del diseño por el mismo camino que las demás. Los
`--inv-*` que usan los componentes salen del mismo tema.

Aquí había un párrafo largo. Los diseños hechos a mano pintaban por id
—`#countdown{background:...}`— así que a una sección nuestra no le llegaba
nada: una franja crema en medio de una invitación granate. La solución era
`pintarComoElDiseno()`, que copiaba en cada sección sintetizada lo que de
verdad pintaba la original, muestreado con `npm run tokens`; más una guarda que
no copiaba la tinta tal cual, porque la que heredaba la sección era la del
cuerpo y sobre un fondo oscuro eso es granate sobre granate; más la misma
guarda para el acento y para la letra sobre el acento; más `!important` en el
centrado, porque algunos diseños alineaban a la izquierda desde un selector de
id que le gana a cualquier clase nuestra.

Nada de eso existe. Y con ello se fue el caso que había quedado sin resolver:
el hashtag de Blanco Oro y de Marsala, que medía justo por debajo del umbral
de contraste. La causa era el muestreo, y los pares se verifican ahora en el
build.

El adorno que cada diseño mete bajo el título sigue sin pintarse en los
bloques propios: queda bien en su maquetación original y descolocado en la
nuestra.

### La biblioteca

Un desplegable con nombres obliga a probar una por una para saber cuál queda
bien. Cada bloque —y la portada— abre en su lugar una **biblioteca**: todas sus formas a la
vez, dibujadas de verdad —con la paleta, la letra y los textos de esa
invitación— y se cambia con un clic.

`renderBloque()` dibuja la invitación entera con la variante pedida —es la
única forma de que el bloque salga con las clases y el CSS del diseño— y
después recorta: conserva la cabecera del documento y deja en el cuerpo esa
sección sola. `POST /api/biblioteca` devuelve una por variante y el editor las
mete en un iframe cada una.

Dos detalles que costaron:

- Los scripts se conservan —son los que mueven el reloj, también el del propio
  diseño— pero **envueltos en `try/catch`**: en el recorte falta casi toda la
  página y cualquiera de ellos se topa con un elemento que ya no existe.
- La columna de la rejilla es de ancho **fijo**. El marco se dibuja a 390px y
  se encoge con `transform`, que no reacciona al ancho del contenedor: si la
  columna crecía, quedaba una franja vacía a la derecha de cada tarjeta.

Dos arreglos que salieron de mirar las variantes en Comunión Tropical y que
afectaban también a las que ya existían:

- Varios diseños superponen su número sobre un svg subiendo `.ring-inner` con
  un margen superior negativo y alto fijo. Nuestro marcado no trae ese svg, así
  que **toda** cuenta atrás inyectada se subía encima del párrafo y se
  recortaba.
- El hueco de foto no se pintaba mientras no hubiera imagen, así que elegir
  entre una disposición y otra era elegir entre dos rectángulos vacíos.

**Reordenar** es arrastrando el asa de cada bloque (y con las flechas del
teclado, porque arrastrar solo no es accesible). Mueve las secciones de verdad
dentro del DOM del template, con su ola o filo decorativo a cuestas. Funciona en los 27 diseños, incluidos los
que meten las secciones dentro de un `#main` en vez de en el `body`. La
portada, el splash y el pie no se mueven: son la estructura.

**Ningún bloque queda inutilizable.** Todos tienen al menos una variante
propia, así que si el diseño elegido no trae esa sección el bloque se dibuja
igual con marcado nuestro: el interruptor siempre está y sólo hay que apagarlo
si no se quiere. Antes esos bloques aparecían con un "no está en este diseño"
y no se podían ni tocar.

**Ubicación** arma la dirección del mapa a partir de lo que se quiere buscar
—una dirección, un nombre de lugar o unas coordenadas— y lo incrusta con el
embed de Google Maps, que no necesita clave. El botón "cómo llegar" abre la
búsqueda, o el link propio si se pone uno. Sin nada que buscar, el mapa
desaparece y queda sólo la ficha.

**Agregar bloques**: Párrafo, Foto, Galería y Ubicación se pueden repetir. El primer bloque de
cada tipo edita la sección del esquema; los que se agregan después llevan sus
datos encima, en `block.data`.

Un detalle que costó un bug: al sustituir o apagar una sección **no se borra,
se oculta**. Varios templates buscan sus elementos por id cada segundo (la
cuenta atrás) y al borrarlos quedaban lanzando errores para siempre. Ocultas
siguen ahí para esos scripts, pero no se ven ni las lee un lector de pantalla.
Los bloques con marcado nuestro traen su propia cuenta atrás, que busca por
`[data-cd]` en vez de por ids fijos.

## El editor

`/editor/{id}` — formulario a la izquierda, la invitación real a la derecha en
un iframe que se actualiza mientras escribes (300 ms) y conserva el scroll.

- **Bloques**: se reordenan con ↑ ↓, se prenden y apagan con un interruptor,
  y cada uno elige su variante en un desplegable. Con "+ Agregar bloque" se
  suman párrafos y galerías extra.
- **Listas**: momentos del programa, invitados, tarjetas de información, fotos
  y opciones de regalo se agregan, quitan y reordenan. Al agregar, el renderer
  clona las tarjetas del diseño en ciclo para conservar sus variaciones.
- **Todos los campos, en los 27**: el formulario ya no esconde nada. Antes
  calculaba, abriendo el HTML de cada diseño, qué campos tenían dónde ir y
  ocultaba el resto —213 combinaciones campo/diseño—, y para algunos el
  renderer **creaba el elemento** que faltaba. El esqueleto trae todos, así
  que no hay nada que detectar ni que inventar. Queda una excepción, y es de
  sentido y no de marcado: la opacidad del panel de la portada sólo aparece en
  los diseños cuya portada apoya los nombres en un panel translúcido, porque
  en los demás no hay nada que atenuar.
- **Fotos**: la portada se sube arrastrando o haciendo clic; la galería es una
  cuadrícula donde se suben varias de una vez y se reordenan. También se puede
  pegar una URL externa.
- **Cambiar de diseño**: se conserva todo el contenido; antes de cambiar se
  avisa qué no va a caber en el nuevo.
- **Guardado automático** cada 900 ms.
- **Confirmaciones**: pestaña con la lista de RSVP y descarga a CSV.

## Fondos y adornos por sección

Cada sección acepta **una imagen de fondo** y **hasta ocho adornos**, y los
pone quien edita, no el diseño.

| | |
| --- | --- |
| **Imagen de fondo** | Cubre la sección entera, detrás del texto. Se elige si **cubre** (recorta), **contiene** (entera) o se **repite** en mosaico, y con qué opacidad. |
| **Adorno** | Una imagen colocada en uno de **diez sitios** —las nueve posiciones de una rejilla de 3×3, más «a sangre»—, con su **tamaño** en porcentaje del ancho, su **opacidad**, su **giro** y su **volteo**. |
| **Capa** | Cada adorno va **debajo** o **encima** del texto. Es lo que permite un marco floral que rodea los nombres y una guirnalda que pasa por delante. |
| **Volteo** | Horizontal, vertical o las dos. Así una sola esquina sirve para las cuatro sin subir cuatro archivos. |

El adorno se emite como un `<img>` y no como un `background-image`: así la
pieza toma su propia proporción sin que el renderer tenga que averiguar cuánto
mide el archivo, que es un dato que ahí no hay.

Un detalle que costó un fallo: la capa «debajo» va posicionada, y un elemento
posicionado se pinta **encima** de los hermanos que no lo están. En las
secciones con `.container` no se notaba —el contenedor ya está posicionado—
pero el pie no lo tenía y su nombre quedaba tapado por su propio adorno. Ahora
el pie lleva `.container` como el resto, y el renderer lo sube con `z-index`.

### La biblioteca

Todo lo que se sube queda anotado en la tabla `Media` y se puede volver a
elegir en la invitación siguiente: un marco floral o una guirnalda se usan en
varias, y antes había que buscar el archivo en el disco cada vez.

- `POST /api/media` guarda los bytes y anota nombre, medidas, peso y clase.
- `GET /api/media?kind=adorno` devuelve lo que hay, lo más nuevo primero.
- Los **adornos se catalogan aparte de las fotos**, así que la biblioteca
  ofrece marcos cuando se está poniendo un marco y fotos cuando es la galería.
- No hay relación con la invitación a propósito: la misma imagen puede estar
  en varias, y borrar una invitación no debe llevarse su decoración.

Las medidas las mide el navegador antes de subir, con `createImageBitmap`: en
el servidor no hay decodificador de imágenes y no vale la pena traer uno sólo
para eso.

### Dónde viven los archivos, y cómo no perderlos

Son **dos cosas** y las dos hacen falta: los **archivos** (los bytes de cada
imagen) y la **base** (el catálogo, más todas las invitaciones). Con los
archivos pero sin la base se recupera el catálogo con `npm run media:index`;
con la base pero sin los archivos no se recupera nada.

```bash
UPLOADS_DIR=/mnt/c/Users/Public/Invita/biblioteca   # los archivos
BACKUP_DIR=/mnt/c/Users/Public/Invita/respaldos     # a dónde va npm run backup
DATABASE_URL=file:./dev.db                          # la base
```

Por defecto los archivos van a `uploads/` dentro del proyecto, que es cómodo
para empezar y **frágil para conservar**: está en `.gitignore`, igual que
`dev.db`, así que ninguno de los dos está versionado. Un `git clean -xdf`, un
reclonado, o —en WSL— un `wsl --unregister` se lleva la biblioteca entera.
`UPLOADS_DIR` apuntando fuera de la VM es la diferencia entre tener copia y no
tenerla.

**La base se queda en el sistema de archivos de Linux, no en `/mnt/c`.** No es
un descuido: `/mnt/c` es un montaje 9p/drvfs y SQLite depende de bloqueos de
archivo que ahí no se comportan igual. Los archivos sueltos cruzan sin
problema —son lecturas y escrituras completas—, una base con transacciones no.
La base se protege con respaldos, no cambiándola de sitio.

```bash
npm run backup        # copia archivos + base, con fecha
npm run media:index   # cataloga lo que haya en disco y no esté en la base
```

`backup` saca la base con `VACUUM INTO` y no con `cp`: es la forma que trae
SQLite de hacer una copia consistente **con la aplicación corriendo**. Copiar
el archivo a pelo mientras hay una escritura a medias da una copia corrupta, y
es justo la clase de respaldo que se descubre roto el día que se necesita. Si
no encuentra el comando `sqlite3` copia a pelo y lo dice.

`media:index` existe porque los archivos y el catálogo se pueden desincronizar
en los dos sentidos. Pasó de verdad: 91 de las primeras 95 imágenes estaban en
disco desde antes de que la tabla `Media` existiera, o sea invisibles para la
biblioteca. Es idempotente, así que se puede correr siempre que haya dudas.

**En producción** con sistema de archivos efímero (Vercel, Netlify) esto no
alcanza: `uploads/` desaparece en cada deploy. Ahí hay que reimplementar
`saveImage` y `readImage` de `src/lib/storage.ts` contra R2, S3 o similar
—nada fuera de ese archivo sabe dónde están los bytes— y mover la base a un
Postgres gestionado.

## Imágenes

Las fotos se suben con `POST /api/media` y se sirven por `/api/media/{año}/{mes}/{id}.{ext}`.

Se guardan en `uploads/` — **fuera de `public/` a propósito**: Next no sirve
archivos que aparecen en `public/` después de compilar, así que en producción
las fotos subidas no se verían. Servirlas por un route handler funciona igual
en desarrollo y en producción.

- **Se reducen en el navegador antes de subir** (`upload.ts`): las cámaras de
  celular dan archivos de 5–12 MB que no aportan nada en una invitación. Se
  bajan a 2000 px de lado mayor y se recomprimen, respetando la orientación
  EXIF para que las verticales no salgan acostadas. Si comprimir no ayuda, se
  sube el original.
- **SVG no se acepta**: puede llevar scripts y lo serviríamos same-origin.
  Se aceptan JPG, PNG, WebP, GIF y AVIF, hasta 8 MB.
- **Rutas validadas** contra un patrón estricto, así que no hay forma de leer
  nada fuera de `uploads/`.
- **Para pasar a R2 o S3** sólo hay que reimplementar `saveImage` y `readImage`
  en `src/lib/storage.ts`; nada más en el proyecto sabe dónde están los bytes.

En el editor la vista previa vive en un iframe con `srcdoc`, cuya URL base es
`about:srcdoc`; por eso `/api/preview` vuelve absolutas las rutas de las fotos
antes de renderizar (`withAbsoluteMedia`). La invitación publicada las deja
relativas.

### En Docker

```bash
docker compose up -d --build       # http://localhost:3000
npm run docker:backup              # respalda la base a INVITA_DATA/respaldos
npm run docker:restore <archivo>   # la restaura
```

Los dos tipos de volumen no son intercambiables, y la diferencia es justo el
problema de conservar los datos:

| | Dónde vive | Sobrevive a |
| --- | --- | --- |
| **bind mount** (`/mnt/c/…:/data/biblioteca`) | La ruta del host que tú digas | Borrar el contenedor, la imagen, y un reset de Docker Desktop |
| **volumen con nombre** (`base:/data/base`) | La VM de datos de Docker — en Windows, otra distro de WSL | Borrar el contenedor y la imagen, **pero no** un «Reset to factory defaults» |

Las **imágenes** van al bind mount porque son irreemplazables y sólo se leen y
escriben enteras, que es lo que un montaje 9p hace bien. La **base** va al
volumen con nombre porque necesita bloqueos de archivo, y esos un 9p a Windows
no los da bien — es el mismo motivo por el que fuera de Docker la base se
queda en el sistema de archivos de Linux.

Dónde está todo lo decide una variable:

```bash
INVITA_DATA=/mnt/d/Invita docker compose up -d    # por defecto: /mnt/c/Users/Public/Invita
```

**Un volumen con nombre no se respalda con `cp`**: no tiene ruta accesible
desde el host. Se monta en un contenedor de paso y se saca desde dentro, que
es lo que hace `docker:backup` —con `VACUUM INTO`, para que la copia sea
consistente con la app escribiendo— y lo que verifica con
`PRAGMA integrity_check`.

Dos detalles del Dockerfile que no son evidentes:

- **`templates/` se copia a mano.** Next traza qué archivos hace falta llevar
  a la salida autónoma, pero los diseños se leen con una ruta armada en tiempo
  de ejecución (`path.join(process.cwd(), "templates")`), así que el trazado no
  los ve. Sin esa línea la imagen construye bien y toda invitación da error.
- **Prisma se invoca con `node` y la ruta completa**, no con `npx prisma`: la
  salida autónoma no trae `node_modules/.bin`, así que el nombre no está en el
  PATH. El primer intento fallaba con `sh: 1: prisma: not found` en bucle.
- **`binaryTargets` incluye `debian-openssl-3.0.x`** en el esquema. Sin eso el
  contenedor arranca, sirve `/nueva` y las imágenes tan campante, y cualquier
  página que toque la base devuelve 500 con *"could not locate the Query
  Engine"*. Es el fallo más fácil de dar por bueno: el arranque no se queja.

### Subirlo a EasyPanel

EasyPanel es Docker por dentro, así que el `Dockerfile` de aquí es lo que
despliega. Lo único que cambia respecto a local es de dónde salen los datos.

**Antes de nada: esto tiene que ser un repositorio.** El proyecto no lo es
todavía, y las fuentes *GitHub* y *Git* de EasyPanel necesitan uno:

```bash
git init && git add -A && git commit -m "Invita"
git remote add origin git@github.com:tu-usuario/invita.git && git push -u origin main
```

(Si no quieres repo, la fuente *Upload* acepta un ZIP; el resto es igual.)

**1 · El servicio de base de datos.** Añade un servicio Postgres en el mismo
proyecto. EasyPanel le da un **host interno** con la forma
`proyecto_servicio`, que es el que va en la URL — no `localhost`, y no hace
falta exponerlo a internet.

**2 · El servicio de la aplicación.** Fuente *GitHub* (o *Git*), builder
**Dockerfile**, y **target port `3000`** — es donde escucha el proceso dentro
del contenedor.

**3 · Los volúmenes.** En la pestaña de almacenamiento, un **Volume** (no un
Bind, salvo que quieras una ruta concreta del servidor):

| Tipo | Montar en | Para qué |
| --- | --- | --- |
| Volume | `/data/biblioteca` | Las imágenes subidas |

Sólo uno: la base ya vive en su propio servicio. Sin este volumen, la
biblioteca se borra en cada despliegue — el sistema de archivos de un
contenedor no sobrevive a que lo recreen. *Los cambios de almacenamiento piden
un despliegue nuevo.*

**4 · Las variables de entorno:**

```
UPLOADS_DIR=/data/biblioteca
DATABASE_URL=postgres://usuario:clave@proyecto_servicio:5432/invita?sslmode=disable
```

`sslmode=disable` está bien porque el tráfico no sale del servidor. La clave va
**en la interfaz de EasyPanel, no en el repositorio** — `.env` está en
`.gitignore` a propósito.

**5 · Despliega.** El `docker-entrypoint.sh` aplica el esquema con
`prisma db push` en cada arranque, así que la primera vez crea las tablas solo
y las siguientes no hace nada. No hay que correr migraciones a mano.

**6 · Llevarte los datos que ya tienes.** El esquema se crea vacío; las
invitaciones y la biblioteca hay que subirlas:

```bash
# Las imágenes: al volumen, por el gestor de archivos de EasyPanel o con scp
scp -r /mnt/c/Users/Public/Invita/biblioteca/* servidor:/ruta/del/volumen/

# La base: volcar la de local y restaurar en el Postgres del servidor
docker compose exec -T db pg_dump -U invita -d invita --data-only > datos.sql
psql "postgres://usuario:clave@servidor:5432/invita" < datos.sql

# Si sólo llegaron las imágenes y no la base, el catálogo se reconstruye:
npm run media:index
```

Ese último comando es la red de seguridad: los archivos y el catálogo son dos
cosas, y `media:index` reconstruye el segundo a partir del primero.

## Peso de las imágenes

Las fotos se sirven **al tamaño que hace falta**, no al que se subieron:

```
/api/media/2026/09/abc.jpg          el original
/api/media/2026/09/abc.jpg?w=400    reducida a 400px, en WebP
```

| Ancho | Formato | Peso |
| --- | --- | --- |
| original | JPEG | 286 kB |
| 1600 | WebP | 135 kB |
| 800 | WebP | 61 kB |
| **400** | **WebP** | **21 kB** |

Antes se servía siempre el original. Las fotos ya se reducen a 2000px en el
navegador antes de subir, pero **una casilla de galería de 120px descargaba
los 2000**: con 465 kB de media por imagen, una galería de seis más la portada
eran 3,2 MB en el móvil de quien abre la invitación. Que una invitación tarde
en abrir no es un problema de infraestructura, es el producto.

- El formato se **negocia**: WebP si el navegador lo acepta, y si no el
  original. Un navegador sin WebP recibe el de 400 en 23 kB de JPEG.
- Los `<img>` llevan `srcset` y `sizes`; los fondos, `image-set()`, que es su
  equivalente donde `srcset` no existe.
- El ancho lo decide **dónde va la imagen**: 1600 una portada a sangre, 800
  una foto recortada o un adorno, 400 una casilla de galería.
- **Sólo se sirven tres anchos.** Un `?w=137` devuelve el original: aceptar
  cualquier número convertiría el servidor en un redimensionador gratuito para
  quien quiera.
- Un GIF se sirve tal cual, porque puede estar animado y redimensionarlo se
  quedaría con el primer fotograma.

La caché sigue siendo `immutable` a un año —el nombre del archivo es aleatorio
y nunca cambia— y el ancho va en la URL, así que cada tamaño tiene su entrada.
`Vary: Accept` porque el formato depende del navegador.

## Vista previa al compartir

Una invitación se reparte por WhatsApp, y ahí un enlace sin Open Graph sale
como texto pelado. La invitación publicada emite `og:title` con los nombres,
`og:description` con la fecha y la ciudad, `og:url`, y `og:image` con la
**portada que ya subió el organizador** (o la primera foto de la galería).

No se genera una tarjeta aparte a propósito: su portada es exactamente lo que
quiere mostrar, y una imagen compuesta sería otra pieza que mantener.

Sólo en la publicada: en el editor no se comparte nada. Las URLs son absolutas
porque los rastreadores no resuelven rutas relativas, y el origen sale de las
cabeceras —no de `request.url`, que en un contenedor da el hostname interno de
Docker.

Un detalle que salió al probarlo con nombres raros: linkedom escapa las
comillas al serializar, así que nadie se sale del atributo, pero deja `<` y
`>` crudos. Se quitan en vez de escaparlos, porque pre-escaparlos haría que el
`&` saliera doble.

## Cuadrar los archivos con el catálogo

```bash
npm run media:limpiar              # sólo informa
npm run media:limpiar -- --borrar  # actúa
```

Los archivos y el catálogo son dos cosas y se desincronizan en las dos
direcciones. Los tres descuadres, de menos a más grave:

| | |
| --- | --- |
| Archivo sin fila | Está en disco pero la biblioteca no lo ve. Lo arregla `media:index` |
| Fila sin archivo | La biblioteca lo ofrece y al elegirlo sale roto |
| **En una invitación pero sin archivo** | Una invitación publicada con huecos |

Lo que **no** es un descuadre: una imagen de la biblioteca que ninguna
invitación usa. Ése es el punto de tener biblioteca — material para el próximo
proyecto. Borrarla sería tirar lo que se guardó a propósito.

Las URLs en uso se buscan con una expresión sobre el JSON en crudo y no campo
por campo. Los sitios donde puede haber una imagen ya son seis —portada,
galería, fondo de sección, adornos, bloques de foto, la biblioteca— y una
lista escrita a mano se queda corta en el próximo campo que se añada. Aquí un
falso positivo es inofensivo; un falso negativo borraría una foto en uso.

### El botón de la portada, siempre y siempre vivo

Es lo único que invita a bajar: si falta, la portada es una pantalla completa
sin salida y quien la abre no sabe que hay algo más. Estaba en los 42
esqueletos, y aun así fallaba de dos maneras distintas:

- **Al vaciar su texto desaparecía.** La regla general del render —un campo
  vacío se borra, para no dejar un hueco— es la correcta para un antetítulo,
  pero aquí se llevaba el botón entero, y quien edita vacía ese campo sin
  imaginar que va a perderlo. Ahora `hero.cta` tiene un valor derivado: si
  queda en blanco, dice «Ver la invitación».
- **Con la cuenta atrás apagada el botón quedaba muerto.** El esqueleto lo
  apunta a `#countdown`, así que apagar esa sección lo dejaba visible y
  pulsable pero sin destino: para quien lo pulsa, idéntico a que no
  estuviera. Ahora, ya sabiendo qué secciones quedaron y en qué orden, apunta
  a la primera visible; si no hay ninguna debajo, deja de ser enlace y se
  queda como texto, que es mejor que un enlace roto.

Ninguno de los dos se ve mirando una captura: el botón está ahí, con su color
y su borde. Sólo se notan al pulsarlo. Así que `npm run audit:render` los
comprueba en los 42 × 3 casos, y además se verificó **pulsándolo de verdad**
en Chromium a 390×844 —entrando primero por el splash, como quien la abre— en
los 42 diseños × 4 combinaciones de datos: por defecto, sin cuenta atrás, sin
texto en el botón, y con todo apagado menos portada y confirmación. Los 168
desplazan la página al pulsar.

```
✓ botón de portada · texto vacío
✓ botón de portada · cuenta atrás apagada
✓ botón de portada · las dos cosas
```

## Quién puede entrar

Hasta ahora la app no pedía nada: quien abriera la dirección veía todas las
invitaciones y podía editarlas o borrarlas. En una máquina local eso da igual;
publicada en un servidor, significa que cualquiera con la dirección puede
borrar el trabajo de meses de otro.

La frontera se dibuja en un sitio concreto: **el editor es privado, lo
publicado es público.** No hay registro ni «invita a tu equipo»; hay una
cuenta, la del organizador.

### Lo que queda abierto, a propósito

| Ruta | Por qué |
| --- | --- |
| `/{slug}` | la invitación se manda por WhatsApp a gente que no tiene cuenta aquí |
| `/api/i/{slug}/rsvp` | confirma un invitado, no el organizador |
| `/api/media/{...}` | las fotos de una invitación publicada se piden desde el navegador de cualquiera |
| `/g/{token}` y `/api/g/{token}` | el token del enlace **es** la llave; pedir además contraseña rompería el panel que se comparte |
| `/entrar` | la puerta |

Todo lo demás —`/`, `/nueva`, `/editor/{id}`, y las APIs de crear, guardar,
publicar, borrar, previsualizar y la biblioteca— exige sesión.

Y para que eso no se degrade con el tiempo, la regla está invertida en
`scripts/audit-auth.ts`: recorre `src/app`, y **todo handler está protegido
salvo lo que aparezca en la lista `ABIERTAS`, que obliga a escribir la razón**.
Un `route.ts` nuevo sin guardia rompe `npm run audit:auth`. Una lista de lo
protegido se olvida; una lista de lo abierto se defiende.

```
npm run audit:auth
Todas las rutas cerradas; 7 abiertas a propósito
```

### La primera cuenta se crea al entrar

No hay pantalla de registro porque no hay a quién registrar: la primera vez
que se abre `/entrar` y no existe ningún usuario, el correo y la contraseña que
se escriban quedan como los del organizador. En cuanto hay una cuenta, esa
puerta se cierra y un correo desconocido responde lo mismo que una contraseña
equivocada — «correo o contraseña incorrectos», sin decir cuál de los dos
falló.

Es deliberado que no haya `ADMIN_PASSWORD` en el entorno: una contraseña en una
variable de EasyPanel se queda escrita en la configuración del servicio, se ve
en los logs de despliegue y no se puede cambiar sin redesplegar.

### Contraseñas y sesiones

- **`scrypt`**, el de `node:crypto` — sin `bcrypt` ni `argon2`, que serían
  dependencias nuevas con binarios que compilar en la imagen. Parámetros
  interactivos de OWASP (N=2¹⁷, r=8, p=1); se guarda `sal:derivada`.
- La comparación va con **`timingSafeEqual`**: con `===`, cuánto tarda en
  responder delata cuántos bytes iniciales acertó quien está probando.
- **Las sesiones viven en la base, no en una cookie firmada.** Con una cookie
  autofirmada, revocar el acceso de alguien obliga a rotar el secreto y echar a
  todos a la vez; con una fila, se borra la fila. En la cookie viaja un token
  aleatorio de 32 bytes; en la base sólo su SHA-256, así que **un volcado de la
  base no sirve para entrar**. Duran 30 días y las caducadas se barren al
  iniciar sesión, no en una tarea aparte.
- Cookie `httpOnly`, `sameSite=lax`, y `secure` sólo en producción: marcarla
  `secure` en local la haría invisible para el navegador, que ahí habla HTTP.

### El middleware es el pomo, no la cerradura

`src/middleware.ts` corre en el runtime Edge, donde no hay `node:crypto` ni
base de datos. Lo único que puede ver es **si la cookie está**, y eso sólo
sirve para que quien no ha entrado aterrice en `/entrar?volver=…` en lugar de
en una página en blanco. La comprobación de verdad —que la sesión exista y no
haya caducado— la hacen las páginas con `requiereSesion()` y las APIs con
`noAutorizado()`. Una cookie vieja pasa el middleware y muere en la página.

Por eso el nombre de la cookie vive en `src/lib/sesion.ts` y no en
`src/lib/auth.ts`: importarlo de `auth.ts` metía Prisma y `node:crypto` en el
bundle del middleware y el build fallaba con
`UnhandledSchemeError: Reading from "node:crypto"`.

### Si la sesión caduca mientras se edita

El caso donde esto podía costar una tarde de trabajo. Con la sesión cerrada
por detrás, el guardado automático respondía 401 y la barra decía «no se pudo
guardar» —un texto gris, sin decir por qué ni qué hacer— y la vista previa se
llenaba con el `{"error":…}` de la API.

Ahora un 401 no es «no se pudo guardar», que suena a fallo sin arreglo: sale
un aviso que dice que **no se ha perdido nada** y abre `/entrar` en otra
pestaña. La vista previa se queda en la última buena en lugar de volcar el
JSON. Y `dirty` no se toca, así que en cuanto vuelve a haber sesión el
siguiente cambio guarda todo lo escrito mientras no la había.

Verificado en Chromium borrando la fila de la sesión a media escritura: el
aviso sale, lo escrito sigue en pantalla, la base conserva la versión
anterior, y al volver a entrar se guarda lo pendiente.

### Al desplegar

No hay nada que configurar. Tras el primer despliegue se abre la dirección, se
crea la cuenta y ya. Si se olvida la contraseña, se borra la fila y la puerta
vuelve a ofrecer crearla:

```
docker compose exec bbdd psql -U invita -d invita -c 'delete from "User"'
```

## Publicar

El diálogo de publicar pide la dirección (`invitacionjuan`), la normaliza,
valida que no choque con las rutas de la app ni con otra invitación, y la
sirve en `/{slug}`.

Es un route handler y no una página de Next: el HTML del diseño es un
documento completo con su propio `<head>`, fuentes y scripts, y se sirve tal
cual, sin el layout de la app alrededor.

## Invitados: un enlace por familia

Los nombres van en la dirección — `?invitado=Ana Gómez,Carlos Gómez` — y esa
sigue siendo toda la idea: quien recibe la invitación no se registra ni entra a
ningún sitio. Lo que se añadió es **el otro lado**: un panel para quien invita.

Cada invitación tiene un enlace propio, `/g/<token>`, que aparece en el editor
junto a las confirmaciones. El organizador se lo pasa a quien va a invitar y
esa persona, sin cuenta ni contraseña:

- escribe los nombres de quienes van juntos y obtiene su enlace,
- lo copia y lo manda por donde quiera,
- ve la lista con el estado de cada uno: sin respuesta · confirmado · no asiste
  · vienen algunos, con cuántas personas suman.

A la dirección se le añade un código corto, `&g=`. Sirve **sólo** para saber de
qué enlace vino la respuesta: emparejar por nombre fallaría a la primera tilde
de más o de menos. Quien entre sin código —porque copió el enlace a medias o
llegó por su cuenta— confirma igual, sin enlace asociado.

Y los nombres del enlace se ven **en dos sitios**, no sólo al confirmar:

| Dónde | Qué sale |
| --- | --- |
| Sección de invitados | El nombre en grande, con la letra y el acento del diseño, entrando palabra a palabra. El texto que lo acompaña se edita en *Saludo para quien abre su link*; vacío, no sale nada. |
| Confirmación | El saludo de siempre y una casilla por persona, para que cada una diga si viene. |

**Esa sección ya no lleva lista de nombres.** Cada diseño traía una rejilla de
invitados de ejemplo —Abuelos Pérez, Tía Sara— que salía igual en todas las
invitaciones. Se vacía siempre, tenga o no datos guardados, y su sitio lo ocupa
el nombre de quien abre su enlace.

El hueco lo pone el render, escondido, y lo llena el mismo script que ya leía
la dirección: parte el texto por `{nombre}`, reparte los nombres en palabras y
las suelta una detrás de otra con un filete que se abre debajo. La animación
arranca cuando el bloque asoma —con `IntersectionObserver`— y no al cargar, que
para entonces nadie ha llegado a esa parte. Con «reducir movimiento» puesto
sale todo de una.

En el editor se enseña con nombres de muestra: si no, quien está armando la
invitación no vería nunca esa parte. Si el diseño no trae sección de invitados
—o está apagada— no hay hueco y no pasa nada.

**La llave es el propio token de la dirección**: quien lo tenga puede
administrar. Es lo que se quiere —se comparte y ya está— pero por eso toda
consulta va filtrada por él, y borrar un enlace comprueba además que sea de esa
invitación.

Un detalle que salió usándolo: una invitación en borrador da 404, y con el
mensaje genérico quien había repartido enlaces no entendía qué pasaba. Ahora
una invitación que existe pero no está publicada dice exactamente eso, y el
panel avisa en grande y marca los botones mientras siga en borrador.

## Iconos: Phosphor, no emojis

Un emoji lo pinta el sistema operativo: cambia de un teléfono a otro, no se
puede teñir del color del diseño y en varios desentona —un 🎂 de colores
planos en medio de una invitación en oro y negro—. Los iconos los dibuja
[Phosphor Icons](https://phosphoricons.com) (MIT), en dos pesos:

| | |
| --- | --- |
| **light** | Bodas, quince y comunión. Fino, va con las serifas. |
| **duotone** | Los infantiles. La misma forma con una capa de relleno al 20%. |
| Color | `currentColor`, así que cada diseño los tiñe con lo suyo. |
| Movimiento | Cuatro animaciones, declaradas en la tabla: late, brilla, flota, ondea. |

Antes eran 29 dibujos escritos a mano, path por path, y se notaba: la cámara
soltaba rayos raros, la flor parecía una piruleta y el osito parecía un cerdo.
Dibujar iconos es un oficio y no era el nuestro.

`npm run iconos:build` copia a `src/lib/iconos.arte.ts` los 33 que la tabla
declara, en los dos pesos: 44 kB, contra los 3 MB que serían los 1512×6. Se
vendoriza en vez de leerlos de `node_modules` al renderizar porque el renderer
corre en un route handler y no debe depender del sistema de archivos — y así
el arte queda versionado y actualizar Phosphor es ver un diff.

**Cuatro no tienen equivalente exacto** y llevan un sustituto: los anillos de
boda son `infinity`, el lazo es `confetti`, el biberón un cochecito y el osito
un conejo. Son opciones del selector; cambiar uno es una línea en
`iconos.datos.ts`.

Lo guardado sigue siendo emojis, así que cada icono declara cuál sustituye y
las invitaciones de antes se dibujan solas; hay además una tabla de parecidos
(🥂 → brindis, 📷 → cámara, 💍 → anillos). Lo que no se reconoce se devuelve
escapado: más vale un emoji suelto que un hueco, y nunca entra marcado ajeno.

El movimiento va en el `<svg>` entero y no en las piezas de dentro. Antes eran
veinte clases (`.i-late`, `.i-alea`, `.i-traza`…) que vivían dentro de cada
dibujo; el arte de Phosphor son formas rellenas y no trazos, así que no hay
piezas sueltas que animar ni trazo que dibujar progresivamente.

**Una guarda que salió de un fallo real**: al reorganizar el CSS se perdieron
las reglas de `.orn-pieza`, el envoltorio dejó de ser un bloque en línea y el
adorno bajo cada título pasó a medir los 256px naturales del svg en los 27
diseños. Las otras auditorías no lo vieron porque miran el marcado y los
errores de JavaScript, no los tamaños. `audit:browser` mide ahora los adornos
y los iconos y falla si alguno se desborda.

## Confirmaciones (RSVP)

**El mismo componente en los 27 diseños.** Antes se reutilizaba el formulario
de cada template y la confirmación cambiaba de forma según el diseño; ahora se
construye siempre igual —saludo, casillas, nombre, teléfono, acompañantes,
mensaje y dos botones— y lo que cambia es su piel.

Se elige entre dos maneras:

- **Formulario en la invitación** — el componente. Con `?invitado=` en la
  dirección se personaliza (ver abajo).
- **WhatsApp** — el botón abre un chat con el mensaje escrito.

Los nombres se pasan por la dirección y **funcionan en los dos primeros
modos**. Uno solo, o varios separados por coma:

```
tudominio.com/invitacionjuan?invitado=Familia%20García
tudominio.com/invitacionjuan?invitado=Ana%20Gómez,Carlos%20Gómez,Sofía%20Gómez
```

También valen `?guest=` y `?i=`, y como separador `,` `;` o `|`. Hasta 12
nombres por link.

- **Un nombre** — saludo, el campo se esconde, y queda el contador de
  acompañantes por si trae a alguien más.
- **Varios** — el saludo los une bien ("Ana, Carlos y Sofía") y aparece una
  casilla por persona, todas marcadas. Se desmarca quien no va y **se guarda
  una respuesta por cada uno**, con su propio sí o no; el contador de
  acompañantes desaparece porque la cuenta sale de las casillas. Si se pulsa
  "no podré ir", ninguno asiste.
- **Sin configurar nada**: el saludo y las casillas están siempre en el
  componente, ocultos, y aparecen solos cuando la dirección trae nombres.
- **Sin nombre** —alguien reenvió el link al grupo— el campo vuelve a
  aparecer, así la invitación nunca se queda sin manera de confirmar.

`POST /api/i/{slug}/rsvp` acepta `{name, status, …}` o `{guests: [{name,
status}, …]}` y crea una fila por persona, así el listado del organizador
dice quién viene y quién no en vez de un número.

Cada diseño resuelve la confirmación a su manera — unos traen un `<form>`,
otros sólo un enlace a WhatsApp, otros un botón suelto. El renderer normaliza
las tres:

- **Modo formulario** — si el diseño trae campos, se les asignan roles por
  heurística (`nombre`, `teléfono`, `acompañantes`, estado, nota) y se cablean
  a `POST /api/i/{slug}/rsvp`. Si no trae ninguno, se inyecta un formulario
  neutro que hereda los colores de la sección (`transparent` + `currentColor`).
- **Modo WhatsApp** — el botón se vuelve un `wa.me` con el mensaje prellenado.

Después de responder, el formulario se reemplaza por una **tarjeta centrada**
con una marca que se dibuja sola —un visto al confirmar, un corazón al
declinar— y el título en la tipografía del propio diseño, porque toma la clase
de sus títulos (`.section-title`).

Los componentes llevan **CSS propio parametrizado con los tokens de cada
diseño** (ver abajo). El par de botones es siempre el mismo: exactamente del
mismo tamaño, el de confirmar relleno y el de "no podré ir" en contorno, cada
uno con el acento de su template.

La caja de "transferencia bancaria" se quita entera cuando no hay número de
cuenta: sin él era un recuadro vacío con una etiqueta suelta.

Al sustituir el formulario del diseño hay que reemplazar **el `<form>` entero**,
no el botón: anidar formularios es HTML inválido y el navegador descarta el de
adentro, y con él se iba el `data-inv-rsvp` del que cuelga toda la
confirmación.

## Estructura

```
src/lib/design/
  theme.ts        el tema (paleta, tipografía, forma, ritmo) y los slots de layout
  css.ts          la hoja compartida: base + un bloque de CSS por slot
  skeleton.ts     el marcado, con sus data-inv
  deco.ts         los adornos, SVG en línea
  contraste.ts    verifica los pares de colores
  content.ts      el contenido de muestra, por ocasión y versión
  designs/        los 18 diseños + las parejas tipográficas
templates/*.html                        los 27, generados
src/lib/{schema,blocks,bindings,render,support,templates,presets,fonts,slug,storage}.ts
src/lib/auth.ts                         contraseñas, sesiones y los dos guardias
src/lib/sesion.ts                       el nombre de la cookie, aparte para el Edge
src/middleware.ts                       redirige a /entrar; no es la cerradura
src/app/entrar/                          la puerta (y la primera cuenta)
src/app/api/salir/                       cerrar sesión
src/lib/iconos.ts                       la API; iconos.datos.ts la tabla, iconos.arte.ts el arte
src/app/page.tsx                        mis invitaciones
src/app/nueva/                          selector de diseño (vista previa real en iframe)
src/app/editor/[id]/                    editor
src/app/[slug]/route.ts                 la invitación publicada
src/app/api/invitations/                crear · guardar · publicar · borrar
src/app/api/preview/                    render en vivo para el editor
src/app/api/plantilla/[id]/             vista previa de un diseño con datos de ejemplo
src/app/api/biblioteca/                 una variante por tarjeta, para elegir de un vistazo
src/app/api/i/[slug]/rsvp/              confirmaciones
src/app/g/[token]/                      panel de invitados que se comparte
src/app/api/g/[token]/                  crear y borrar enlaces de invitado
src/lib/invitados.ts                    códigos, nombres y estado de cada enlace
src/app/api/media/                      subir y servir fotos
uploads/                                fotos subidas (fuera del repo)
scripts/build-templates.ts              genera los 27 y verifica el contraste
scripts/audit-auth.ts                   ninguna ruta sin cerradura por descuido
scripts/audit-*.ts, shots.ts            las auditorías y las capturas
```

## La foto de portada

Los 27 traen su capa `.hero-bg`, así que ponerla es poner la imagen y marcar
la capa para el paralaje. Se acabó el caso especial.

Antes había que inyectar una capa propia con su velo degradado y subir el
bloque de texto por encima, porque la mayoría de los diseños hechos a mano no
tenían dónde ponerla: en unos el texto quedaba ilegible encima de la foto y en
otros los hijos opacos la tapaban del todo. Y había que buscar en el CSS crudo
si el bloque de los nombres tenía fondo propio, para no pintar de blanco un
texto que ya se leía.

Ahora cada diseño declara en su slot de portada cómo sostiene el texto sobre
la foto: `minimal` pone su velo, `panel` su tarjeta, `split` no superpone nada.

Un detalle que salió en las capturas: el slot `minimal` aclaraba el texto
siempre, y **sin foto** eso es blanco sobre el fondo claro del diseño, es
decir invisible hasta que alguien sube una imagen. El velo y la tinta clara
van detrás de una clase `.con-foto` que pone el renderer sólo cuando hay foto.
Para los diseños cuya portada es oscura de por sí —Marsala, Burdeos, Viaje,
Tropical— el tema declara `heroInk: "light"`, y el verificador lo comprueba.


## Tokens: los componentes genéricos se adaptan

Los componentes que inyecta el renderer —la confirmación, la tarjeta de
gracias, los bloques con variante propia— no toman prestadas las clases de
cada diseño. Se probó así y salió mal: el resultado dependía de lo que cada
uno hubiera definido por casualidad, y hubo que ir parcheando caso por caso
(texto verde sobre verde en Quince Hojas, texto transparente en Vintage,
botones de distinto tamaño según si el diseño le ponía borde).

Usan CSS propio con variables `--inv-*`, y esas variables las emite el propio
CSS del diseño con los valores que su tema declara. Son los mismos que usa el
diseño para lo suyo, así que la confirmación no puede desafinar respecto a la
invitación que la rodea.

Antes salían de `npm run tokens`, que abría los 27 en Chromium y muestreaba
los estilos ya calculados de sus controles. Ese script ya no existe: no hay
nada que muestrear cuando los valores están escritos.


## Tipografía por campo

Delante de cada campo de texto hay un cuadrito **Aa**: abre una lista de 17
tipografías de Google Fonts agrupadas por familia (con serifa, sin serifa,
caligráficas, redondeadas), cada una escrita en su propia letra. Vacío = la
del diseño.

- **El selector CSS sale del propio binding**: el que acertó al escribir el
  texto es el mismo al que hay que cambiarle la letra. Cero mapa nuevo.
- Los campos globales (los nombres, la fecha) se escriben en varios lugares a
  la vez, así que la regla cubre todos: portada, splash y pie a la vez.
- Los campos con `nth` —los que comparten selector con otro campo, como el
  mensaje de cierre de Invitados— no ofrecen el control: la regla afectaría a
  los dos. `fontableOp()` los descarta.
- En las listas repetibles (invitados, momentos) la letra se **comparte entre
  todas las fichas**: el selector es el mismo, y una tipografía por invitado
  no tendría sentido. El control lo dice en su tooltip.
- **Sólo se piden a Google las tipografías que se usen.** Una invitación que
  no cambie ninguna no carga un byte extra; el editor las carga la primera vez
  que abres un selector, no al entrar.

## Color de las letras por sección

Cada sección tiene un campo de color con su cuadrito y el selector del
sistema. Vacío = el color del diseño.

La regla que se inyecta lleva `!important`, y es a propósito: varios diseños
usan selectores más específicos que cualquier cosa que inyectemos
(`#guests .section-title`), y esto es una decisión explícita de quien edita —
tiene que ganarle al diseño. Botones, enlaces y campos de formulario quedan
fuera para no arruinar su contraste. Si eliges color para la portada, el
aclarado automático sobre la foto se desactiva: manda tu color.

## Nota sobre las animaciones

Las secciones aparecen con un fundido al hacer scroll. En los diseños
generados eso se activa sólo si hay JavaScript: un script en el `<head>` pone
`.js` en el `<html>` y el CSS oculta con `.js .reveal`. Sin esa guarda, un
fallo de JS dejaría la invitación en blanco — que es exactamente lo que pasó
la primera vez que tomé capturas.

## Lo que falta

- **Cuentas de usuario**: cualquiera que abra la app ve y edita todas las
  invitaciones.
- **Almacenamiento en la nube**: las fotos van a disco local. Con
  `UPLOADS_DIR` ya pueden vivir fuera del proyecto y `npm run backup` las
  copia, pero en un host con sistema de archivos efímero (Vercel, Netlify)
  hace falta R2 o S3. El cambio está aislado en `src/lib/storage.ts`.
- **Música**: el campo existe y funciona con una URL de `.mp3`; falta subirla.
- **Fotos de los invitados**: el álbum colaborativo del MVP anterior no se
  migró — la galería de hoy es curada por el organizador.
- **El esqueleto en JSX**: `skeleton.ts` es un componente escrito con
  plantillas de string. Pasarlo a React y renderizar con
  `renderToStaticMarkup` haría que la vista previa fuese el mismo árbol que la
  invitación publicada, y la biblioteca dejaría de necesitar su truco actual
  —dibujar el documento entero y recortar una sección— que es de donde vienen
  sus dos rarezas: los scripts envueltos en `try/catch` porque en el recorte
  falta casi toda la página, y la columna de ancho fijo. Es el siguiente paso
  natural y no hace falta para nada de lo de arriba.
- **Nueve invitaciones sin contenido**: las del constructor visual retirado.
  Su contenido vivía en la columna `tree`, que ya no se lee; `/[slug]` les
  devuelve un 404 honesto. Si se quisieran recuperar, habría que escribir un
  migrador de `tree` al esquema.
