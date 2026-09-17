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

### Bendición: la participación impresa, sin foto

Los otros doce de boda abren con una fotografía y los nombres encima. Éste
abre con lo que se imprime en una participación de papel: antetítulo, los
nombres en **caligrafía**, los nombres completos, la bendición, los padres de
cada lado en dos columnas y la línea de cierre. No es un diseño sin foto por
falta — es uno donde **el texto es la portada**, que es lo que pide quien
quiere la invitación de toda la vida y no una postal.

Blanco de verdad y no hueso: la paleta de salida es tinta sobre blanco puro,
que es el papel de una participación. Las otras tres —niebla, oro, humo—
cambian la tinta sin tocar el planteamiento. La foto de portada no desaparece:
quien suba una la verá, porque el campo sigue estando. Simplemente no hace
falta para que el diseño esté completo, que es lo contrario de los otros doce.

Trae tres cosas que el sistema no tenía:

**Un slot de portada nuevo, `acta`.** Es el único sin foto, así que no hay
panel, ni velo, ni marco: lo que sostiene la portada es el texto. Y es el
único que no ocupa una pantalla justa — se lee de arriba abajo como un
documento, y forzarlo a `100svh` dejaría los padres fuera en un móvil pequeño.

**Una pareja tipográfica con tres familias**, la única de las nueve. Una
caligrafía no puede ser la letra de los títulos: a tamaño de antetítulo y en
versalitas no se lee. Así que Great Vibes entra sólo donde tiene sentido —los
nombres, que se leen como una firma— y el resto sigue siendo la serifa de
siempre. En ese slot el ampersand deja de ser un renglón aparte y vuelve a la
línea de los nombres, porque en caligrafía es parte de la firma; con aire a
los lados, que pegado se lee «JuanEMaría».

**Siete campos nuevos en la portada**: nombres completos, bendición, el título
y los nombres de cada columna de padres, y la línea de cierre. Los saltos de
línea que se escriban se respetan —`white-space: pre-line`, sin pasar por
HTML—, así que dos nombres en dos renglones salen en dos renglones.

Están en los 50 diseños, porque el esqueleto es uno solo y el contrato dice
que todo campo del esquema tiene su `data-inv` en todos. En los otros 49 van
**vacíos**, y un campo vacío no deja hueco: el renderer borra su elemento. El
bloque de los padres se esconde solo cuando no le queda ningún párrafo dentro
—`:not(:has(p))`—, que si no quedarían dos columnas de nada con su filete en
medio.

Por eso el texto de muestra vive aparte y no en el contenido de la ocasión:
puesto ahí, **las trece portadas de boda saldrían con los padres encima**.
Sólo el slot que sabe dibujarlos lo pide, y tanto el build como la vista previa
lo miran antes de rellenar.

En papel las dos columnas caben en un renglón; en 390 px de móvil no. Entre
partir un nombre y apilar las columnas gana apretar: el filete del medio es lo
que dice «estos de un lado, estos del otro», y apilándolas se pierde justo eso.

### Grados

Siete, y con criterio propio: **un grado no es una boda con birrete**. Lo que se
celebra es un logro propio y el final de una etapa larga, no una unión ni una
bendición, así que piden menos filigrana y más peso — más tipografía y menos
flor. Las paletas son las de una institución: azules y verdes profundos,
borgoña, tinta, y el dorado del cordón. Nada pastel.

| Diseño | Qué lo distingue |
| --- | --- |
| Diploma | Enmarcado como un título colgado, centrado, sin una sola sombra |
| Tesis | El nombre enorme a bandera y los títulos a la izquierda |
| Cordón | Una banda cruzada sobre la foto, como la del birrete |
| Anuario | La foto a pantalla completa y el texto encima, sin caja |
| Pergamino | Papel envejecido, filo rasgado, galería en columna |
| Laurel | Foto arriba y texto abajo, muy aireado |
| **Ónix** | **Negro de verdad y oro**: panel sobre la foto, números de sección y mosaico |

### Ónix nace oscuro, no es un claro con letras negras

Los otros seis parten de un fondo claro y el negro, si acaso, es la tinta. En
Ónix el negro es el papel y el oro es la luz. Sus **cuatro paletas son
oscuras** —negro y oro, grafito y platino, vino profundo, verde profundo—, así
que es el único diseño de grado cuya tarjeta se ve negra en el catálogo: hasta
ahora había que elegir un diseño claro y cambiarle la paleta para llegar ahí.

La diferencia se nota sobre todo en el teléfono: el negro de verdad no
deslumbra al abrir la invitación en un auditorio a media luz.

No es `nocturno` con otro nombre —aquel es de bodas, enmarca el texto con un
trazo sobre la foto y éste lo apoya en un panel con hilo de oro—. Sobre negro,
además, un relleno sólido ensucia: las cajas van en hilo, y el divisor de la
portada es un filo recto y no una silueta recortada, que sobre negro se lee
como un error de carga.

### El birrete no existía

El icono del programa salía como un recuadro vacío: 🎓 no tenía equivalente en
el juego vendorizado y el emoji crudo no lo dibuja cualquier dispositivo —el
mismo motivo por el que la app tiene iconos propios y no emojis. Se añadieron
los cinco que pide un grado: birrete, diploma, entrada, avión y portátil. Son
38 iconos en dos pesos.

El contenido de muestra también es suyo: agradece a quien lo sostuvo en vez de
pedir una bendición, y trae un dato que casi ninguna plantilla contempla y es
lo primero que pregunta quien recibe una invitación de grado — **los cupos
limitados de la ceremonia**.

### Un fallo que destaparon: el marco no sabía convivir con una foto

Al poner foto de portada en el primero de los seis, el nombre no se leía. No
era del diseño nuevo: el slot `frame` deja el texto sin fondo —lo enmarca el
trazo— y sobre una foto cualquiera la tinta del diseño es ilegible. Lo
comprobé con `c-white`, que existe desde el principio: exactamente igual.

Eran **diez diseños** —vintage, aurum-wine, nocturno, 15-hojas, 15-corona,
c-white, g-diploma, 1-cuento, bs-bosque, bs-lunita— y cualquiera que les
subiera una portada se quedaba con un marco precioso y un nombre invisible.

Ahora `frame` hace lo mismo que `minimal` ya hacía: velo, tinta clara y el
propio marco en blanco, todo detrás de `.con-foto`, que el renderer pone
**sólo** cuando hay foto —sin esa guarda el texto saldría blanco sobre el
fondo claro del diseño, que es el mismo error por el otro lado.

El contraste de las 192 paletas se verifica en el build; una foto que sube el
organizador no se puede verificar, y por eso ahí se fuerza el blanco en lugar
de confiar en la paleta.

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

## Cada ficha con su propio fondo

Las tarjetas del **programa** y las de **información útil** pueden llevar cada
una su imagen detrás, con su velo. Es por ficha y no por sección: una con
fondo no se lo pega a sus vecinas, y hay una prueba que lo exige — es lo que
pasaría si esto se resolviera con una regla sobre la lista.

Imagen y no vídeo, a propósito. Un programa puede tener ocho fichas, y ocho
vídeos reproduciéndose a la vez en un teléfono no es una invitación bonita, es
un teléfono caliente. Donde sí cabe un vídeo es en el fondo de la sección
entera, que es uno.

El velo va en un `::before` y del color de la propia tarjeta, no de un gris:
sobre una foto cualquiera la tinta deja de leerse, y el texto es lo único que
la ficha tiene que decir. Los hijos se posicionan para pintarse por encima —
un elemento posicionado va después de un `::before` absoluto que lo precede en
el orden, así que no hace falta repartir `z-index`. Y `overflow: hidden`,
porque la tarjeta suele tener esquinas redondeadas y una foto a sangre se
saldría por ellas, que es de lo que más se nota.

## Un fondo para toda la invitación

Una sola imagen —o un vídeo— detrás de **todas** las secciones, sin cortarse
entre una y otra. La portada, las redes y el pie se quedan con el suyo.

Va en una capa **fija**, y eso resuelve tres cosas de una vez: la imagen no se
repite sección a sección, no hay que medir dónde empieza y acaba el bloque de
secciones que la lleva, y funciona en iOS — que es donde
`background-attachment: fixed` no. La invitación se desplaza por encima y la
imagen se ve entera y continua.

Trae un **velo** del color de fondo del diseño, y no es decoración: sobre una
fotografía cualquiera la tinta deja de leerse. El contraste de las paletas se
verifica en el build, pero una foto que sube quien edita no se puede
verificar, y aquí el problema aparecería en **todas** las secciones a la vez —
es el mismo que ya costó diez diseños en la portada.

### Por qué la lista de secciones no está escrita

Las que llevan el fondo se vuelven transparentes, y sus selectores salen de
las secciones que el renderer **resolvió de verdad**, no de una lista de ids.
Un bloque de párrafo que se agregue mañana sale como `#inv-<id>` y entra solo;
con ids fijos se habría quedado fuera. Por eso esto vive dentro de
`renderInvitation`, donde esa lista existe, y no en una función suelta.

Las tres excepciones ya tenían con qué taparla: la portada pinta `--hero-bg`
—que en los 50 es un degradado, así que va en `background-image` y deja el
color transparente—, el pie pinta `--footer-bg`, y la sección de redes es
`.alt` en los 50. Comprobado en los 50, no en uno.

## Partículas sobre toda la invitación

Una capa que cae, sube o flota sobre la página entera. Doce clases:

| Caen | Suben | Flotan |
| --- | --- | --- |
| Pétalos · Hojas · Nieve · Confeti · Corazones · Notas musicales | Burbujas · Globos | Mariposas · Luciérnagas · Destellos · Estrellas |

Con **cantidad**, **ritmo**, **tamaño**, **opacidad** y **color** — vacío toma
el color de marca del diseño, así encaja en los 50 sin elegir nada. Con una
basta: dos a la vez no es una invitación animada, es una pantalla inquieta.

### Por qué no tsParticles

Se evaluó. La conclusión es que **una librería de partículas trae el motor, no
las mariposas**: sus formas nativas son puntos, líneas y polígonos, y para
pétalos u hojas hay que darle las imágenes igual. Lo que se ahorraría es la
física — y aquí la física son dos `@keyframes`.

En contra pesan dos reglas del proyecto. Ninguna invitación publicada le pide
un archivo a un tercero, y hay una auditoría que falla si lo hace. Y el peso
importa hasta el punto de que las fuentes se piden peso por peso: el build
slim de tsParticles son ~25–30 kB comprimidos sobre una invitación que entera
pesa unos 45. Casi el doble, por decoración.

Así que las formas se dibujan aquí. Nueve salen del juego de iconos que ya
está vendorizado; las otras tres son geometría — un pétalo es una hoja con los
dos extremos en punta, una burbuja es un círculo con un brillo descentrado, y
una mariposa son dos pares de alas que baten.

### Tres cosas que no se ven en el resultado

**`pointer-events: none`.** No es un detalle de estilo: la capa cubre la
pantalla entera, y sin eso la invitación deja de responder — no se puede ni
entrar por el velo. Es exactamente el fallo que ya tuvo la marca de agua.

**El reparto es estable, no aleatorio.** El HTML se genera en el servidor y se
vuelve a generar en cada vista previa; con `Math.random` la misma invitación
saldría distinta cada vez, las capturas y las pruebas no podrían comparar
nada, y **cada tecla en el editor movería todos los pétalos de sitio**.
Esparcido, pero siempre el mismo esparcido — y hay una prueba que renderiza
dos veces el mismo dato y compara.

**Con menos movimiento no se quedan quietas: se quitan.** Una lluvia de
pétalos congelada a media pantalla no es una invitación más sobria, es una
invitación rota.

La mariposa bate agrupando cada lado —el ala de arriba y la de abajo juntas—,
porque batiendo por separado se lee como cuatro aletas. Y el par de arriba es
bastante mayor que el de abajo: es lo que distingue una mariposa de un brote
de dos hojas, que es exactamente en lo que se quedó el primer intento.

## Letra, color y alineación, texto por texto

La tipografía ya se elegía por campo. Ahora el **color** y la **alineación**
también: el antetítulo en dorado y centrado, el título en tinta y a la
izquierda, dentro de la misma sección.

Los dos van por el mismo camino —lo elegido vive en la sección, se busca el
binding del campo y se aplica sobre lo que encuentre—, y por eso comparten la
función que resuelve los selectores. Eso es lo que no había que duplicar: lo
difícil aquí nunca fue la propiedad, era **encontrar a quién se le aplica**,
porque un campo puede escribirse en varios sitios a la vez y sus selectores
dependen del diseño.

El color de sección sigue existiendo y pinta todo lo suyo; el de campo le
gana sin pelear por el orden, porque aquél apunta a `sel *` y éste al selector
concreto. Y se emite después, así que también gana en un empate. Hay una
prueba que exige exactamente eso: si no ganara, elegir el color de un título
no haría nada visible y nadie sabría por qué.

A diferencia del de sección, el de campo **no excluye botones ni enlaces**.
Allí la regla barre todo lo que hay dentro y había que proteger su contraste;
aquí se señaló *ese* campo, y si el campo es el texto de un botón, es que se
quería el texto de ese botón.

En las listas —las fichas del programa, los detalles— el color se comparte
entre las fichas, igual que la letra: un color por invitado no significaría
nada.

En el editor, el color es un cuadradito junto al de la tipografía, con una
cruz para volver al de la sección. La cruz no es un adorno: un `<input
type="color">` no se puede vaciar, así que sin ella elegir un color sería
irreversible. La alineación son cuatro botoncitos —izquierda, centro, derecha,
justificado—; se reconoce por el icono de un vistazo, y pulsar la que está
puesta la quita, que es la única forma de volver a la del diseño.

### El agujero que esto destapó

Los bloques agregados —Párrafo, Foto, Vídeo, Ubicación— **no tenían nada de
esto**, y no por la alineación: por la letra, desde que existe. No son
secciones del esquema, así que su `SectionSpec` no existe y el renderer
resolvía todo detrás de un `if (spec)` que se los saltaba entero. El editor
ofrecía elegirle la tipografía a un párrafo y no pasaba nada — un control que
no puede hacer nada, que es justo lo que este proyecto ya había retirado en
otro sitio por el mismo motivo.

Sus campos sí están en el mapa de bindings, bajo el tipo (`paragraph.text`).
Bastaba con armar un spec equivalente del bloque, y ahora la letra, el color,
la alineación y la animación llegan a los dos por el mismo camino. Hay una
prueba que lo exige en un párrafo, que además es el sitio más difícil: el
marcado sintetizado centra todo con `!important`.

## Animar un texto suelto

La aparición de cada sección entra **en bloque**. Esto es por campo: el
antetítulo puede fundirse mientras el título se escribe letra a letra.

Se elige con un selector bajo cada campo de texto, y se guarda en `anim` de la
sección — mismo sitio y misma forma que la tipografía, que ya se elegía por
campo. Trece opciones en tres familias:

| | |
| --- | --- |
| **De una pieza** | Se funde · Sube · Cae · Entra por la izquierda o la derecha · Crece · Entra girando |
| **Por partes** | Letra a letra · Palabra a palabra · Máquina de escribir |
| **En bucle** | Late · Flota · Brilla |

Las de bucle piden cuidado: tres cosas latiendo a la vez no es una invitación
animada, es una pantalla inquieta.

Cada texto se observa **por su cuenta** y no por su sección — uno abajo del
todo tiene que esperar a que se llegue a él, aunque su sección lleve rato en
pantalla—, y el observador vive en el renderer y no en el esqueleto: el del
esqueleto busca `.reveal` con una lista escrita dentro de cada uno de los 50
templates, así que sumarse a ella obligaría a regenerarlos todos y dejaría
fuera a los diseños que vengan.

Varios textos animados en una sección entran **uno detrás de otro**: cada uno
lleva su turno y el retardo sale de ahí. A la vez parecen un parpadeo;
escalonados parecen escritos.

### Repartir un texto en letras

Las tres de «por partes» envuelven cada trozo en un `<span>` con su índice, y
eso trae dos cosas que no se ven en el resultado.

La primera es **cuándo**. Repartir tiene que pasar *después* de escribir el
campo. Al principio lo puse junto a las tipografías, que es donde parecía que
tocaba, y estaba mal: se repartía el texto de ejemplo del diseño, y la
escritura posterior lo borraba junto con los trozos. Quedaba un marcado
perfectamente válido diciendo otra cosa. La letra sí se puede elegir antes,
porque es una regla CSS y no le importa qué diga el elemento. Por eso la
prueba compara contra **lo que se escribió** y no contra que haya trozos.

La segunda es **qué no se puede repartir**. Los nombres de la pareja traen
dentro el `<span>` del ampersand, y varios campos llevan un `<strong>` puesto
por el diseño; vaciar el elemento para rellenarlo de letras se llevaría ese
marcado por delante. Así que sólo se reparte lo que es texto y nada más, y lo
que no se puede cae a «se funde» — quien lo eligió quería movimiento, y
dejarlo quieto sería peor que darle otro.

Y el elemento se queda con la frase entera en `aria-label`, con cada trozo en
`aria-hidden`: sin eso un lector de pantalla leería la frase **letra por
letra**, que es exactamente lo contrario de lo que se quería.

Quien pidió menos movimiento lo ve todo puesto y quieto: ni entradas, ni
bucles, ni letras sueltas.

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

Cada sección acepta **un fondo** —una foto o un vídeo— y **hasta ocho
adornos**, y los pone quien edita, no el diseño. **La portada también**: estuvo
fuera mientras el argumento fue «ese sitio ya lo ocupa su foto», y dejó de
valer cuando el fondo pasó a aceptar vídeo — una portada con un clip detrás de
los nombres es justo lo que no se podía hacer. No hay dos fondos peleándose:
la capa del fondo va **antes que la foto** en el marcado, así que la foto manda
cuando la hay y el fondo se ve cuando no, y el texto queda sobre las dos porque
`.hero-content` va posicionado en `z-index: 3` desde siempre.

La portada tiene además un **párrafo**. Antetítulo, subtítulo y frase son
renglones —sitios para una línea, no para contar algo—; esto es el hueco para
escribir de verdad, con sus saltos de línea respetados y, como cualquier
texto, con su propia letra y su propia animación.

| | |
| --- | --- |
| **Fondo** | Una foto o un **vídeo** (MP4 o WebM). Cubre la sección entera, detrás del texto. Se elige si **cubre** (recorta), **contiene** (entera) o se **repite** en mosaico —lo último, sólo una foto—, y con qué opacidad. |
| **Adorno** | Una imagen, un **GIF o WebP animado** o un **vídeo**, colocado en uno de **once sitios** —las nueve posiciones de una rejilla de 3×3, «a sangre», y **libre**—, con su **tamaño** en porcentaje del ancho, su **opacidad**, su **giro** y su **volteo**. |
| **Capa** | Cada adorno va **debajo** o **encima** del texto. Es lo que permite un marco floral que rodea los nombres y una guirnalda que pasa por delante. |
| **Volteo** | Horizontal, vertical o las dos. Así una sola esquina sirve para las cuatro sin subir cuatro archivos. |

### Libre: dos números, o arrastrarlo

Los nueve anclajes son la vía rápida para lo normal —una esquina, el centro—
pero no sirven para «un poco más a la izquierda». El sitio **libre** añade dos
coordenadas.

En **porcentaje de la sección y no en píxeles**, y eso no es una preferencia:
la sección mide distinto en un iPhone SE que en un escritorio, así que un
adorno colocado en píxeles sobre una pantalla aparece en otro sitio en la de
quien recibe la invitación. Marcan además el **centro** de la pieza y no su
esquina, que es como se piensa al colocar algo: «esto va en el medio del borde
de arriba» son 50 y 0, sin restar medio adorno de cabeza.

Y se puede **arrastrar sobre la vista previa**. Los dos deslizadores colocan a
ciegas —se mueve un número, se mira, se corrige—; arrastrar es lo mismo por el
otro extremo, y acaba escribiendo en **los mismos dos campos**, así que no hay
un segundo modelo de datos ni nada que sincronizar. Arrastrar un adorno
anclado lo pasa a libre en el sitio donde se soltó, que es lo que se espera al
mover algo con el dedo.

Tres detalles que no se adivinan:

- **El editor sólo se entera al soltar.** Avisarle mientras se mueve
  dispararía un render de la invitación entera por fotograma; durante el
  arrastre la pieza se mueve dentro del iframe con estilo en línea, que le
  gana a la regla del anclaje sin tener que quitar clases.
- **El área de agarre tiene un mínimo de 28 px**, en un pseudoelemento
  absoluto para que crezca sin que la caja cambie de tamaño. Un adorno ancho y
  fino —una filigrana de separación— mide seis píxeles de alto y es casi
  imposible de coger; y mientras su imagen carga mide cero.
- **Nada de esto viaja en lo publicado.** El atributo que identifica cada
  adorno y el guion de arrastre se emiten sólo en la vista previa: en una
  invitación repartida sería dejar mover la decoración a quien la recibe.

El adorno a sangre queda fuera: cubre la sección entera y no hay dónde
moverlo.

`npm run audit:adornos` comprueba el **viaje redondo**, que es lo único que
importa aquí: son dos códigos hablando del mismo sistema de coordenadas —el
guion mide píxeles dentro del iframe y reporta porcentajes, el renderer los
convierte en `left`/`top`— y si uno mide desde el centro y el otro desde la
esquina, el adorno salta al soltarlo. Eso no lo ve ninguna prueba de marcado,
porque el marcado es correcto en los dos casos. Se suelta en tres puntos, se
toma lo reportado, se vuelve a dibujar con eso y se mide dónde quedó.

El adorno se emite como un `<img>` y no como un `background-image`: así la
pieza toma su propia proporción sin que el renderer tenga que averiguar cuánto
mide el archivo, que es un dato que ahí no hay.

Un detalle que costó un fallo: la capa «debajo» va posicionada, y un elemento
posicionado se pinta **encima** de los hermanos que no lo están. En las
secciones con `.container` no se notaba —el contenedor ya está posicionado—
pero el pie no lo tenía y su nombre quedaba tapado por su propio adorno. Ahora
el pie lleva `.container` como el resto, y el renderer lo sube con `z-index`.

### El fondo también puede ser un vídeo

El mismo campo acepta las dos cosas y lo que decide es la **extensión** de la
URL: un `.mp4` o un `.webm` salen como `<video>`, todo lo demás sigue siendo un
`background-image`. Se decide así, y no por el `mime`, porque lo que guarda la
invitación es una cadena y el catálogo con el tipo real vive en otra tabla; no
es una pérdida, porque las URLs las emite el propio almacenamiento con la
extensión del tipo que aceptó.

Tiene que ser un elemento y no un `background`, sencillamente porque no existe
forma de meter un vídeo en un `background-image`. Del recorte y de la
atenuación sigue encargándose la capa, así que el vídeo sólo tiene que
llenarla, y va con `autoplay muted loop playsinline` —los cuatro juntos o
ninguno: sin `muted` el `autoplay` lo ignora todo navegador, y sin
`playsinline` iOS se lleva el clip a pantalla completa encima de la invitación
en cuanto arranca—. Sin `controls`, que es un fondo y no una pieza que se mire,
y sin `poster`: el elemento se deja transparente hasta el primer fotograma para
que mientras carga se vea el color de la sección y no el recuadro negro que
pinta Safari.

«Repetir en mosaico» no llega a pedirse con un vídeo: un mosaico de vídeo no
existe —`background-repeat` no alcanza a un elemento— y se atiende con lo que
más se le parece, que es llenar la sección.

**Quien pidió menos movimiento en su sistema lo ve quieto.** Es lo único del
sitio que se mueve sin parar y que el CSS no puede detener:
`prefers-reduced-motion` apaga animaciones y transiciones, pero un `<video>` en
bucle no es ni lo uno ni lo otro y seguiría corriendo detrás del texto. Un
script de cinco líneas —que sólo se emite si hay algún fondo de vídeo en la
página— le quita el `autoplay` y el `loop` y lo para. Parado en su primer
fotograma el fondo no desaparece: queda exactamente como la foto que habría
puesto quien no quiso vídeo. Por eso el elemento lleva `preload="metadata"`,
que con `autoplay` puesto no cambia nada y sin él es la diferencia entre un
primer fotograma y una capa vacía.

`npm run audit:browser` comprueba que el fondo se quede **detrás** del
contenido de su sección. No con `elementFromPoint`, que aquí no sirve: la capa
lleva `pointer-events: none` y el navegador la salta al buscar quién está en un
punto, así que el clic diría que todo va bien aunque el vídeo estuviera pintado
encima del texto. Lo que se mira es el apilamiento —que la sección esté
posicionada y que sus hijos suban por encima de la capa—, que es justo la regla
que una vez faltó en el pie de página.

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

## Imágenes, vídeo y música

Todo se sube con `POST /api/media` y se sirve por
`/api/media/{año}/{mes}/{id}.{ext}`: las fotos, el vídeo y **la música**.

### El vídeo se reduce antes de subir

Un teléfono graba a 1080p o a 4K, y una invitación se abre en 390 px de ancho.
El archivo que se sube pesa diez veces lo que hace falta, y quien la recibe
suele estar en datos móviles: ése es el número que decide si espera o cierra.

Se reduce **en el navegador**, igual que las fotos y por las mismas razones:
sin meter un transcodificador de 80 MB en la imagen de Docker, sin cola de
trabajos y sin CPU del servidor por cada subida. La máquina que ya tiene el
archivo lo reduce antes de mandarlo.

El método es reproducirlo sobre un lienzo más pequeño y grabar el lienzo: se
baja a **1280 px de lado mayor** y **1,5 Mbps**, que a 720p sigue siendo
calidad de sobra para un clip de ambiente detrás de unos nombres. El peso va
con el cuadrado del lado, así que ahí está casi toda la rebaja — **medido, un
1080p de 3,71 MB baja a 0,59: un 84% menos**.

Tiene una limitación que conviene decir de frente: **va en tiempo real**, así
que un clip de diez segundos tarda diez segundos. Por eso el campo enseña el
porcentaje mientras trabaja en vez de quedarse callado. Para lo que se sube
aquí —la cortina se corta a los cinco segundos— es un precio razonable.

Ante cualquier duda, el original: si el navegador no sabe grabar WebM
(Safari), si el archivo no se puede leer, o si lo recodificado sale **más
grande** que lo que entró, sube lo que entró. Un clip que ya venía ligero no
se toca, porque recodificarlo sólo quitaría calidad.

Dos cosas que sólo se supieron probándolo:

**El audio sobrevive.** El vídeo se reproduce en silencio mientras se
comprime, porque si no sonaría en la oreja de quien está editando, y había que
comprobar que silenciar la reproducción no se lleva por delante la pista
capturada. No se la lleva — pero eso no se puede saber leyendo el código.

**Una duración desconocida no es motivo para no comprimir.** Un WebM grabado
por el propio navegador no trae la duración en la cabecera y llega como
`Infinity`; la primera versión lo tomaba por archivo ilegible y lo subía tal
cual, que es justo uno de los que más falta hace reducir. Sin duración se
pierde el porcentaje, no la rebaja: el final lo marca `ended` igual.

`npm run audit:comprimir` mide las cinco cosas con clips grabados en la propia
página, y transpila `upload.ts` con esbuild para meterlo en el navegador — así
lo que se prueba es el código que se publica y no una reimplementación.

### La música se sube, no se enlaza

El campo «Música de fondo» era una URL y eso obligaba a alojar el MP3 en otro
sitio — el único paso del proceso que sacaba de la app. Ahora se arrastra el
archivo como una foto.

**MP3 y M4A**, que son los dos que reproduce todo navegador sin excepciones.
OGG queda fuera porque Safari no lo toca y estas invitaciones se abren en
iPhone. WAV también, pero por otro motivo: se reproduce en todas partes y pesa
diez veces más, así que una canción de tres minutos serían 30 MB que alguien
descarga en datos móviles para oír un fondo. El techo son 12 MB — cuatro
minutos a 320 kbps son nueve, y es lo más pesado que tiene sentido.

Se sirve **por tramos**, por el mismo camino que el vídeo y por la misma razón
que se explica en «El archivo subido se sirve por tramos». La música sigue
arrancando con el primer toque en la pantalla, que es lo único que los
navegadores permiten.

El campo conserva la clave `musicUrl` y la opción de pegar un enlace: lo
guardado en las invitaciones de antes son direcciones y siguen valiendo.

### Que no se pierda

Los bytes viven donde apunte `UPLOADS_DIR`, y ahí no hay nada nuevo: el audio
hereda el mismo sitio y el mismo `npm run backup` que las fotos.

Lo que sí hacía falta arreglar es la vuelta. `npm run media:index` —el que
reconstruye el catálogo cuando se restaura un respaldo de archivos sin el de
la base— **sólo conocía imágenes**. Un vídeo o una canción restaurados
quedaban en disco y fuera de la biblioteca para siempre, saltados con un
«extensión que no servimos» que era falso. La invitación que ya los usaba
seguía funcionando, porque guarda la URL; lo que se perdía era poder volver a
elegirlos, que es para lo que existe la biblioteca. Ahora los cataloga y los
manda a su estante.

### El fallo silencioso que esto podía tener

Un formato que la subida acepta pero que la ruta pública no entrega se sube
bien, aparece en el editor, se guarda en la invitación — y da 404 el día que
alguien la abre. Son dos listas en sitios distintos y nada obligaba a que
coincidieran.

`npm run audit:medios` escribe un archivo de verdad por cada formato y lo pide
por el mismo camino que usa la ruta pública. Comprobado rompiéndolo a
propósito: quitando el audio del filtro de rutas, los tres tipos de audio
salen en rojo.

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
  Se aceptan JPG, PNG, WebP, GIF y AVIF hasta 8 MB, MP4 y WebM hasta 64, y
  MP3 y M4A hasta 12.
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

### Las fotos de los bloques en la vista previa

`withAbsoluteMedia` bajaba dos niveles —la sección y, si era una lista, sus
elementos—, que era todo lo que hacía falta mientras el contenido vivía en
secciones planas. Los bloques agregados guardan lo suyo en
`layout.blocks[].data`, que son tres, así que **la foto de un bloque de Foto y
el archivo de un bloque de Vídeo se quedaban relativos y no se veían en la
vista previa** — el mismo síntoma de las fotos que ya se arregló una vez, por
otro camino. Ahora recorre a cualquier profundidad.

## Vista previa al compartir

Una invitación se reparte por WhatsApp, y ahí un enlace sin Open Graph sale
como texto pelado. Lo que se ve en esa tarjeta son tres cosas —la foto, el
título en negrita y la línea gris de debajo— y las tres se eligen en la
sección **«Al compartir el enlace»**, al final del panel del editor.

Los tres campos caen en lo que se mostraba antes de que la sección existiera:
la foto de la portada, los nombres, y la fecha con la ciudad. Así una
invitación que no los toque se comparte igual que siempre, y las que ya
existían no cambian.

| Campo | Vacío significa |
| --- | --- |
| Foto de la vista previa | la de la portada; si no hay, la primera de la galería |
| Título | los nombres |
| Línea de debajo | la fecha y la ciudad; si no hay, la frase de la portada |

### La foto va tal cual se subió

Sin `?w=`. Pedir un ancho la reconvierte, y como los rastreadores no mandan
`Accept: image/webp` saldría JPEG: **un PNG con transparencia acabaría con el
fondo en negro** justo en la imagen que representa la invitación. El navegador
ya la reduce a 2000px al subirla, así que la original no es un archivo
desmedido.

La dirección es absoluta porque **WhatsApp y compañía no resuelven rutas
relativas**: con `/api/media/...` a secas, la tarjeta sale sin imagen. El
origen se lee de las cabeceras (`src/lib/origen.ts`) y no de
`new URL(request.url)`, que dentro de Docker devuelve el nombre del
contenedor.

### Lo que no se puede: texto encima de la foto

WhatsApp muestra una imagen estática, así que poner texto sobre ella
significaría **componer la imagen en el servidor**. Se probó: `sharp` puede
dibujar un SVG con texto, pero la imagen de producción es `node:22-slim`, que
no trae fuentes ni fontconfig —`Fontconfig error: Cannot load default config
file`— y el texto sale en blanco. Haría falta meter fuentes en la imagen para
algo que Open Graph ya resuelve con el título y la descripción.

### La caché de WhatsApp

Si cambias la foto o el texto **después** de haber compartido el enlace,
WhatsApp sigue mostrando la vista previa vieja: la guarda por dirección y no
la vuelve a pedir. No hay nada que hacer desde aquí. Lo práctico es dejar esta
sección como quieres antes de repartir el enlace; si ya se repartió,
publicarlo en otra dirección fuerza una tarjeta nueva.

### Comprobarlo

`npm run audit:render` verifica ocho casos: sin tocar nada sale como antes,
cada campo propio manda cuando está puesto, la foto elegida gana a la de la
portada, la dirección es absoluta, el `alt` sigue al título, y los ángulos de
un `<script>` pegado en el título no se cuelan en un atributo.

Un `og:` roto no se nota: no se ve en la invitación ni en el navegador, se ve
cuando alguien pega el enlace y ya se compartió mal.

### Un cuidado con los selectores de tipografía

La sección no se dibuja en la página, y eso destapó una regla equivocada:
`support.ts` ofrecía un selector de tipografía para **todo** campo de texto,
por su tipo. Pero la tipografía se aplica inyectando CSS sobre el selector del
binding, así que un campo sin binding que escriba texto ofrecía un control que
no podía hacer nada. Ahora la condición es que exista ese binding, y eso
retiró seis controles muertos: los dos de esta sección y cuatro que ya
estaban —los textos de los botones del RSVP y los dos saludos.

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

La extensión de esa expresión la dictan ahora los formatos que declara
`storage.ts`, y no un `[a-z]{3,4}` escrito a mano. El escrito a mano no
encontraba **ni un solo `.mp4`** —el `4` no es una letra—, así que los vídeos
en uso se contaban como material sin usar y uno que desapareciera del disco no
salía en el aviso de las invitaciones rotas. Con `.webm` no pasaba, que son
cuatro letras: es el tipo de fallo que sólo se ve en la mitad de los casos.

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

## El velo de bienvenida: «Cómo llegar», no un segundo «Confirmar»

El velo tenía dos botones y los dos hacían lo mismo: entrar a la invitación.
El primero decía «Abrir invitación» y el segundo «Confirmar asistencia», que
además prometía algo que no cumplía — no llevaba a confirmar nada, entraba
igual que el otro.

Ahora el segundo abre la ubicación en Google Maps, en otra pestaña, y hay un
campo para el link. Es la pregunta que de verdad se hace quien recibe una
invitación por WhatsApp antes de leerla entera.

**Sin link no aparece.** Un botón que no lleva a ningún sitio es peor que
ninguno: quien lo pulsa no sabe si la invitación está rota o si es él. Lo
mismo si el campo tiene algo que no es una dirección web.

Un detalle de implementación que cuesta ver: el botón pasó de `<button>` a
`<a>`, y un enlace no se parece a un botón por defecto —sale subrayado y con
el texto a la izquierda—. Las tres primeras declaraciones de `.splash-btn`
(`display:block`, `text-align:center`, `text-decoration:none`) son las que
hacen que los dos se vean idénticos. `npm run audit:render` comprueba que
aparezca y desaparezca cuando toca, y una prueba en navegador midió los dos
botones de los 42 velos para que ninguno quedara más alto o más ancho que el
otro.

### Las invitaciones que ya existían

El texto por defecto del esquema cambió, pero eso sólo vale para las nuevas:
en las guardadas está escrito dentro de su JSON. Y dejarlo así no es
cosmético — en cuanto se le ponga el link, un botón que dice «Confirmar
asistencia» abriría un mapa.

```
npm run db:migrar-splash -- --seco     # dice qué cambiaría
npm run db:migrar-splash               # lo cambia
```

Sólo toca el texto exacto que ponía el esquema. Quien lo haya cambiado a mano
—«Ver los detalles», «Más información»— se queda con el suyo: eso es una
decisión de quien edita y no le corresponde a una migración.

### Se abre como un sobre, no se desvanece

Un fundido no es un gesto: es la ausencia de uno. Una invitación en papel se
abre, y eso era lo único que la de pantalla se había saltado — justo en el
momento en que quien la recibe decide qué opina, que son los tres primeros
segundos y no la galería que hay ocho secciones más abajo.

El campo **«Cómo se abre»** tiene dos opciones: la de siempre y el sobre. Por
defecto queda la de siempre.

Todo vive en la **salida**. El velo cerrado se ve exactamente igual con
apertura y sin ella, y eso no es una limitación: es lo que deja elegirla sin
rediseñarle la portada a nadie, y lo que hace que funcione en los 50 sin una
línea de CSS por diseño. Lo que se añade es una clase sobre `#splash`.

Gira la capa entera y no una pieza añadida. `#splash` ya es un fijo a pantalla
completa con la decoración del diseño dentro, así que al abrirse se lleva
consigo lo que el diseño dibujó, como la solapa de un sobre se lleva el papel
que tiene impreso. Pasa de la vertical y `backface-visibility` lo hace
desaparecer.

El orden es lo que separa «un sobre que se abre» de «algo que gira»: la
tarjeta sale primero y hacia arriba, y el velo empieza a girar cuando ella ya
va de salida. Y lo que sostiene todo es un detalle que no se adivina leyendo
el CSS: `visibility` con retardo y **sin** transición —`0s linear 1.06s`—,
porque la regla de siempre la apaga al instante y entonces no habría nada que
mirar girar.

### La cortina: un vídeo antes de la invitación

Un clip a pantalla completa entre el velo y la portada. Se pone en **«Vídeo de
apertura»**, se reproduce al pulsar el botón y da paso a la invitación.

**Se corta siempre a los cinco segundos**, dure lo que dure el archivo. No es
una red de seguridad, es la regla: una cortina es el rato que se tarda en
abrir un sobre, y pasado eso quien la abrió ya quiere leer. Así que lo que se
sube es el trozo que se quiere ver — lo que venga detrás no se llega a ver y
sólo pesa. De paso cubre el caso en que `ended` no llega nunca, que pasa con
archivos que traen mal escrita su duración.

El vídeo llena la pantalla —recortando lo que sobre— salvo que se elija
«entero», que le pone bandas y es lo que quiere un clip apaisado visto en un
móvil de pie.

Va **por debajo** del velo (9998 contra 9999) y no encima, que es lo que quita
el corte entre los dos: mientras el velo se abre, la cortina ya está detrás
reproduciendo, así que con la apertura de sobre la solapa se levanta y lo que
aparece es el vídeo.

**Puede sonar, y eso es la mitad de la gracia.** Ningún navegador deja que una
página empiece a sonar sola, pero pulsar el botón del velo es el gesto de
usuario que lo permite: la cortina es el único sitio de la invitación donde un
vídeo con audio se reproduce solo y con sonido. Una que arrancara al abrir el
enlace sería obligatoriamente muda. Si además hay música de fondo, la música
espera a que el vídeo termine — dos audios a la vez no es ambiente, es ruido.
Con la cortina en silencio no espera nada: suena encima, que es lo que se
quiere.

Se cuelga de `enterSite`, que los 50 diseños definen en su propio script y que
el botón llama por nombre. Envolverla —guardar la de antes y poner una nuestra
encima— es lo que deja añadir esto sin reconstruir un solo template.

#### Once maneras de dar paso

| | |
| --- | --- |
| **Fundido** | El vídeo se disuelve sobre la invitación |
| **Funde a negro** | Primero se va el vídeo y queda el fondo; después se va el fondo. Dos tiempos, que es el respiro de cine |
| **Destello blanco** | Una capa blanca sube de golpe y se va despacio: lo que se quema es el corte |
| **Se acerca** | El vídeo crece mientras se disuelve |
| **Se aleja** | Se encoge y deja ver lo que hay detrás |
| **Telón** | Sube entero y se lleva el vídeo con él |
| **Cae** | El mismo telón, hacia el otro lado |
| **Se abre en dos** | Dos mitades que se apartan |
| **Círculo** | Se cierra sobre el centro y la invitación entra por los bordes |
| **Barrido** | Un borde que cruza de izquierda a derecha |
| **Desenfoque** | Pierde el foco mientras se va |

Las once duran **dos segundos** y ese número sale de una sola variable CSS.
Las que van en dos tiempos —a negro, destello— reparten ese total en
fracciones, así que cambiarlo las mueve a todas a la vez y ninguna se queda
descolgada; el guion lee esa misma variable para saber cuándo retirar la capa,
de modo que no hay un segundo sitio que actualizar.

Cada una es una clase y un bloque de CSS que no sabe de las demás, así que la
doceava es escribir su regla y su nombre en el conjunto que las valida. Un
nombre que no esté en ese conjunto cae en el fundido: más vale la salida de
siempre que una cortina que no se sabe ir.

La base no dice **nada** de cómo se va, y por eso el fundido es una clase más
y no el caso por defecto escrito ahí: con un `opacity: 0` en la base, las
cuatro que revelan por geometría —telón, cortinas, círculo, barrido— tendrían
que pelearse con él para que el vídeo no se apagara mientras se mueve. Esas
cuatro no tocan la opacidad a propósito: el vídeo se ve entero hasta el último
momento, y lo que descubre la invitación es la forma que se abre.

«Se abre en dos» es la única que no sale de una propiedad sola. Son **dos
máscaras** sobre el mismo elemento —una anclada a la izquierda y otra a la
derecha— encogiendo cada una hacia su lado. Con un recorte no se puede: un
`clip-path` es una región continua, y estas son dos que se separan.

La capa se retira escuchando `transitionend` y no a los tantos milisegundos,
porque las once acaban en momentos distintos dentro de esos dos segundos y un
número fijo o corta a una o deja a otra esperando. El reloj queda de respaldo
—y sale de la misma variable—, por si el navegador no anima la propiedad y no
dispara nada.

Quien pidió menos movimiento no pide menos vídeo: el clip sigue estando. Lo
que se va es el movimiento, y las once se vuelven la misma — un fundido corto,
que es cambio de luz y no de sitio.

#### Lo que de verdad hay que probar aquí

No es que el vídeo se vea bonito: es que **nunca deje a nadie encerrado**. Una
cortina que se queda puesta no es un efecto que falla, es una invitación que
no se puede leer. Hay cuatro maneras de llegar ahí y las cuatro tienen salida:

| Qué pasa | Qué la saca |
| --- | --- |
| El archivo no carga | El evento `error` |
| El navegador se niega a reproducir | El rechazo de `play()` |
| `ended` no llega nunca | Dos relojes: cinco segundos para arrancar, y su duración más un margen una vez arrancó |
| Quien la abre no quiere verlo | El botón de saltar, que aparece solo al segundo y medio |

`npm run audit:cortina` abre las cinco situaciones en el navegador y pregunta
lo único que importa: quién ocupa el centro de la pantalla cuando debería
estar la portada. El clip de prueba lo graba el propio navegador al empezar,
para no dejar en el repo un binario que nadie sabe de dónde salió.

En su primera ejecución cazó un fallo que el marcado no delata: el botón de la
música es un fijo en la esquina inferior derecha con `z-index: 9998` —el mismo
que la cortina— y, al ir después en el DOM, se pintaba encima y **se comía el
clic del botón de saltar**, que estaba en esa misma esquina. Un vídeo que no
se podía saltar ni teniendo el botón puesto. Ahora la música va a 9990, por
debajo de la cortina, y saltar se fue a la esquina de arriba: dos controles en
la misma esquina es uno de los dos sin pulsar.

La cortina no se monta en la vista previa del editor —ahí se vuelve a
renderizar a cada tecla y taparía justo lo que se está escribiendo— ni cuando
el velo está apagado, porque sin botón no hay gesto y sin gesto no habría
forma de quitarla.

## Vídeo

Un bloque más, que se agrega donde se quiera y funciona en los 42 porque sale
del mismo vocabulario de clases que los demás. Dos fuentes:

- **De YouTube** — se pega el link tal cual esté en la barra del navegador.
- **Un archivo propio** — MP4 o WebM, hasta 64 MB.

Tres formas: apaisado (16:9), vertical (9:16, para lo grabado con el celular
de pie) y a sangre, de borde a borde.

Un vídeo también puede ir de **fondo de una sección**, detrás del texto y sin
ser un bloque: eso se cuenta en «[El fondo también puede ser un
vídeo](#el-fondo-también-puede-ser-un-vídeo)».

### El link de YouTube: cualquiera de sus formas

Nadie copia el link canónico; se copia lo que haya en la barra. Así que se
aceptan `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/live/`, con el `?si=`
que agrega la app al compartir, con el `&list=` de una lista, y con la hora a
la que iba el vídeo (`t=90`, `t=1m30s`), que se respeta como minuto de
inicio. También el identificador pelado.

Un link que **no** sea de YouTube —un Vimeo, un Drive— devuelve `null` y el
bloque se esconde. Es a propósito: un reproductor que no puede cargar nada es
un rectángulo negro en medio de la invitación, y quien la abre no lo distingue
de algo roto.

El reproductor es `youtube-nocookie.com`: el mismo, sin la cookie de
seguimiento hasta que se le da al play. Una invitación de boda no tiene por
qué dejar que YouTube marque a los invitados.

### Los dos reproductores, y por qué el marcado trae los dos

El bloque se construye con un `<iframe>` **y** un `<video>` dentro, y el
render borra el que no toca. La razón es que `build()` no recibe datos: el
marcado de un bloque se arma sin saber qué eligió quien edita. La alternativa
era una variante por fuente, y entonces pasar de YouTube a un archivo subido
obligaría a cambiar también de variante y perder la forma elegida.

Si se quedaran los dos, la invitación mostraría el vídeo dos veces; si se
borraran los dos, un recuadro negro. `npm run audit:render` comprueba las
ocho combinaciones —cada forma de link, el archivo, la fuente equivocada, el
link que no es de YouTube y el bloque vacío— en los 42 diseños.

### El archivo subido se sirve por tramos

Esto no es una optimización, es la diferencia entre que se vea y que no:

- **Safari, y iOS entero, no reproduce un vídeo si el servidor no responde
  `206 Partial Content`.** Pide los primeros bytes con `Range` para leer la
  cabecera del MP4 y, si recibe un `200` con el archivo completo, abandona y
  deja un recuadro negro. Y las invitaciones se abren en el móvil.
- **Adelantar** el vídeo depende de lo mismo: sin tramos, el navegador
  tendría que bajarlo entero para saltar al minuto dos.
- **Memoria.** Las imágenes se leen enteras y se devuelven; un MP4 de 60 MB
  leído entero por petición, con varias personas abriendo la invitación a la
  vez, tumba el contenedor. El vídeo va como stream desde el disco.

Así que `/api/media/{...}` se bifurca antes de todo lo demás: si el archivo es
vídeo, `videoPorTramos()`. Anuncia `Accept-Ranges: bytes`, responde `206` con
su `Content-Range`, entiende `bytes=-500` (los últimos 500) y devuelve `416`
a un tramo más allá del final, que es lo que el reproductor espera para dejar
de insistir.

Verificado de punta a punta en Chromium, sin `ffmpeg`: el propio navegador
graba un WebM con `MediaRecorder` sobre un canvas, se sube por la API real, se
sirve, y se comprueba que decodifica (`readyState 4`, `videoWidth` > 0), que
avanza al reproducirlo y que se puede adelantar.

### MP4 y WebM, nada más

Son los dos que reproducen todos los navegadores sin plugins. Un MOV de
iPhone o un AVI se rechazan **con su nombre** —«"iphone.MOV" no es un formato
que los navegadores reproduzcan»— porque casi siempre es uno entre varios
archivos y sin el nombre no se sabe cuál quitar. MKV queda fuera aunque el
contenedor pueda llevar H.264 dentro: ninguno lo reproduce de forma fiable.

Un vídeo se cataloga siempre en el estante de vídeo de la biblioteca, aunque
se suba desde el campo de una foto, y no se reduce en el navegador como las
imágenes: recodificarlo serían minutos de CPU y una pérdida de calidad que
nadie pidió.

### La reproducción automática es en silencio, o no es

La opción «sola, en silencio y en bucle» pone `muted autoplay loop
playsinline`, y el `muted` no es un detalle: sin él el `autoplay` se ignora y
queda un vídeo parado. Ningún navegador deja que una página empiece a sonar
sola. Para un clip corto de ambiente sirve; para un vídeo con voz, controles.

En YouTube es lo mismo por otra vía: `autoplay=1&mute=1&controls=0`, más
`playlist=<id>` — el bucle de YouTube sólo funciona con una lista, y una lista
de un solo vídeo es el propio vídeo.

### Lo que tapaba el play

En la forma a sangre, el divisor de cada diseño —una ola, un arco— se monta
sobre el final de la sección anterior con un margen negativo y `z-index: 4`.
Sobre un vídeo eso caía **justo en la barra de controles**: el vídeo se veía
perfectamente y no se podía reproducir. Con una foto a sangre el mismo divisor
es decoración bonita; con un vídeo es un botón que no se puede pulsar.

No lo ve ninguna auditoría de marcado ni de errores de JavaScript, así que
`npm run audit:browser` ahora hace una prueba de impacto: pone el vídeo a la
vista y pregunta al navegador **quién está encima** del punto donde vive la
barra de controles. Si no es el vídeo, falla y dice qué lo tapa.

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

### Un diseño retirado se dice arriba y una vez

Las invitaciones hechas con un diseño que ya no está en el catálogo
—`boda-clasica`, `blanco`, `quince-noche`— no se rompen de golpe: se rompen a
pedazos. El autoguardado responde 400 «Diseño desconocido», la biblioteca de
formas de un bloque responde 400 «Bloque o diseño desconocido», y cada fallo
salía por su lado sin que nada dijera que la causa era una sola.

El inicio no las lista, pero por la dirección directa el editor sí las abre, y
entonces todo parece funcionar a medias sin motivo.

Ahora el editor lo dice arriba, una vez, con el botón para cambiar de diseño
al lado: «Este diseño ya no existe… elige otro y no pierdes nada de lo
escrito».

Y la biblioteca de formas dejó de tragarse el motivo: decía «No se pudieron
dibujar las opciones» cuando el servidor había dicho exactamente qué pasaba.

### Un guardado que falla se dice fuerte

Un fallo de guardado silencioso es lo peor que puede hacer un editor: se
sigue escribiendo media hora creyendo que quedó. Antes sólo salía «No se pudo
guardar» en letra gris de 12px, en la barra, junto a otras cuatro cosas.

Ahora sale un aviso a lo ancho con **el motivo que dé la API** —«Diseño
desconocido», o el código si no da ninguno—, dice que lo que hay en pantalla
no está en el servidor y que no cierre la pestaña, y trae un botón de
reintentar.

Se destapó buscando por qué unos metadatos recién escritos «no cambiaban»: la
invitación usaba un `templateId` de los viejos, el autoguardado manda el
`templateId` en cada envío, y la API responde 400. Nada se guardaba, y el
único aviso era ese texto gris. Las invitaciones con diseño retirado no se
listan en el inicio, pero por la dirección directa el editor sí las abre.

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

### Una respuesta por persona

Una confirmación era siempre una fila nueva. Quien recargaba la página y
volvía a confirmar aparecía dos veces; quien confirmaba «por si acaso» dos
días después, otra vez. Y eso no se queda en una lista fea: el panel de quien
invita **suma `partySize`** para dar el número de cabezas, que es el número
con el que se encarga la comida.

Ahora cada respuesta lleva una `clave` que dice quién contestó, y volver a
contestar **reemplaza** en lugar de añadir.

**Quién es «la misma persona»** es una decisión, no un detalle:

- **El nombre normalizado** — sin acentos, en minúsculas, con los espacios
  colapsados. «Ana Gómez», «ana gomez» y «  Ana  Gómez » son la misma persona
  escribiendo con prisa en un teléfono.
- **Más el link por el que entró**, si entró por uno. Dos familias pueden
  tener cada una su Ana, y cada link es una casa distinta. Sin esto, la Ana de
  una familia borraría la respuesta de la otra — y perder una respuesta es un
  daño peor que mostrar dos filas.

**Gana la última.** Si alguien puso «no puedo» y después «sí voy», la que
vale es la segunda; con la primera se quedaría fuera de la boda alguien que sí
va. Y al actualizar no se toca el `guestLinkId`: si contestó por su link y
luego entró por la dirección pelada, su casa tiene que seguir apareciendo como
respondida en el panel.

Lo que **no** cubre: la misma persona escribiendo «Ana» una vez y «Ana
García» la otra son, para cualquier programa, dos personas. Los links
personalizados lo evitan, porque ahí el nombre lo pone quien invita.

### La restricción está en la base, no sólo en el código

`@@unique([invitationId, clave])`. Comprobar antes de escribir deja una
rendija de milisegundos entre la lectura y la escritura, y **un doble clic cae
justo ahí**. Por eso es un `upsert` contra una restricción real y no un
`findFirst` seguido de un `create`.

Y si la restricción salta de todos modos —dos peticiones exactamente
simultáneas—, la ruta lo captura (`P2002`), actualiza y responde bien. Al
invitado no se le puede decir «no se pudo enviar» cuando su respuesta sí
quedó: reintentaría, o pensaría que la invitación está rota.

Cuando ya había contestado, el mensaje lo dice: «Actualizamos tu respuesta».
Fingir que es la primera vez lo deja preguntándose si acaba de apuntarse dos
veces.

### Las que ya estaban repetidas

```
npm run rsvp:limpiar -- --seco     # dice qué colapsaría
npm run rsvp:limpiar
```

Agrupa por invitación y persona con **la misma función que usa la ruta** —a
propósito, y no una copia en SQL: si las dos normalizaciones se separaran, la
limpieza uniría filas que la app volvería a separar y nadie se daría cuenta—,
se queda con la más reciente y marca su clave. Es idempotente.

Desplegar no exige correrlo primero: las filas viejas quedan con `clave` NULL,
y Postgres trata los NULL como distintos en un índice único, así que el
`db push` del arranque las deja pasar. Probado sembrando tres filas repetidas
con clave NULL: el push entra y no se pierde ninguna.

### Comprobarlo

```
npm run audit:rsvp
```

A diferencia de las demás, esta auditoría **necesita el servidor corriendo y
la base**: lo que se comprueba es el comportamiento de la ruta contra una
restricción de la base, y ninguna mitad sirve sola. Crea una invitación de
prueba, le manda de todo —el mismo nombre dos veces, escrito distinto, un
cambio de idea, tres envíos simultáneos, dos familias con una Ana cada una, un
link con dos nombres reenviado— y la borra al final.

## Galerías

Trece formas. A las diez que había —cuadrícula, mosaico, tira deslizable,
polaroid, arco, círculos, paspartú, revista, escalera, apiladas— se sumaron
tres que la búsqueda de referencias señalaba y que no estaban:

**Mampostería.** Alturas distintas que encajan entre sí, sin los huecos de una
cuadrícula. Se hace con `columns` de CSS y no con grid: `grid-template-rows:
masonry` sigue sin estar en los navegadores que importan.

Dos detalles que la tenían rota y no se veían leyendo el CSS. `display:block`
no es decoración: `.gallery-grid` llega en `display:grid` desde el diseño, y
`columns` no hace nada dentro de un contenedor de grid — salían tres columnas
de 109px en vez de dos anchas, lo contrario de una mampostería. Y `width:100%`
tampoco: varios diseños le dan a `.gallery-item` un ancho propio, y sin eso las
fotos dejaban calles de aire dentro de su columna.

**Cinta continua.** Se desplazan solas, sin arrastrar ni pulsar nada — que en
una invitación que se abre de pie en el bus es la diferencia entre que se vean
las fotos y que no. Se detiene al pasar el dedo por encima.

El renderer **duplica las fotos una vez** y la tira se mueve media anchura: al
llegar al final, la segunda copia está exactamente donde estaba la primera y
el salto no se ve. Las copias van con `aria-hidden`, porque oírlas dos veces
sería ruido. Con una sola foto no hay cinta que valga y se queda quieta. Y se
anima `transform`, no `scroll`: lo segundo obliga a JavaScript en cada
fotograma.

**Collage.** Superpuestas y ladeadas, como fotos sueltas sobre una mesa. El
solape va con márgenes negativos y no con posición absoluta, así la caja sigue
creciendo con las fotos que haya y con tres o con siete no se descuadra.

### El fallo que apareció al probarlas

Ninguna galería alterna mostraba las fotos del organizador. **Las diez que ya
existían tampoco.** Sólo funcionaba «la del diseño».

El marcado de una variante lo construimos nosotros y no lleva
`data-inv-list` —ese atributo sólo existe en el esqueleto—, así que
`applyList` no encontraba el contenedor y salía sin escribir nada: la galería
quedaba con los huecos de ejemplo. Lo mismo el programa, los detalles y los
regalos en cuanto se les cambiaba la forma: 19 variantes en total.

El arreglo es el mismo patrón que ya usaban los campos: `CLASES_LISTA` da el
contenedor y el elemento por clase, como respaldo del atributo.

No lo veía ninguna auditoría porque todas renderizaban con la variante del
propio diseño, que sí trae los atributos. Ahora `npm run audit:render` prueba
**todas** las variantes de todos los bloques con lista y exige que lo escrito
aparezca. Una variante puede no dibujar la lista a propósito —«Sólo el
mensaje» de la mesa de regalos es texto y un botón— y a ésa no se le exige
nada: se comprueba el marcado que sí la dibuja.

El guardia tenía a su vez un agujero, y también se tapó: sin `preview`, la
foto de la galería aparecía igual en `og:image` —que cae en la primera foto de
la galería cuando no hay portada— y la comprobación pasaba con la galería
vacía. Con el fallo puesto a propósito, ahora caza las 19.

## Plantillas propias

El catálogo de los 42 sale del código (`src/lib/design/designs/`), así que no
puede recibir uno nuevo sin desplegar. Esto es el otro catálogo: el que hace
el organizador con su propio trabajo.

En el editor, **«Guardar como plantilla»** guarda la invitación como punto de
partida. Aparece en «Elige un diseño», arriba de los 42 —quien guardó una es
porque quiere empezar desde ahí, y ponerla debajo de cuarenta y dos tarjetas
sería esconderla— con su vista previa real, no un icono.

### Se guarda una copia, no una referencia

Si mañana se edita la invitación de la que salió, la plantilla se queda como
estaba. Es deliberado: una plantilla que se moviera sola bajo los pies
dejaría de servir para lo único que sirve, que es empezar igual dos veces.

Y al revés: borrar la plantilla no toca las invitaciones hechas con ella.

### Qué se lleva y qué no

Se lleva **todo lo que vive en `data`**: el diseño, la paleta, el orden y las
variantes de los bloques, los colores y tipografías por sección, los fondos,
los adornos con sus efectos, la marca de agua, los metadatos de compartir, y
también los textos y las fotos.

No se lleva nada de fuera de `data` —el slug, si estaba publicada, las
confirmaciones, los enlaces de invitado, las aperturas— porque eso es de esa
invitación concreta y no del punto de partida. La nueva nace sin publicar y
con su propio slug.

### El nombre de la ruta

`/api/mis-plantillas`, y no `/api/plantillas`, porque `/api/plantilla/[id]` ya
existe y renderiza uno de los 42 con contenido de ejemplo. Son dos cosas
distintas, y confundirlas en la dirección sería confundirlas en la cabeza de
quien lea esto en seis meses.

## Efectos de los adornos

Cada adorno puede aparecer con un efecto y moverse con otro. Son dos campos
independientes y se combinan.

**Cómo aparece** — se dispara cuando el adorno **entra en pantalla**, no al
cargar: se desvanece, sube, crece, entra girando, o entra desde su borde. Lo
último deduce la dirección del sitio donde está puesto —uno anclado arriba a
la izquierda viene de arriba y de la izquierda— en vez de pedir un campo más
para decir lo que el sitio ya dice.

Varios adornos en una misma sección entran **escalonados**, 120 ms uno tras
otro. A la vez parecen un parpadeo; escalonados parecen puestos a mano. No
hay campo para eso: el orden de la lista basta.

**Movimiento** — en bucle, lento y largo a propósito, porque un adorno que se
mueve rápido deja de ser adorno y pasa a ser lo primero que se mira: flota,
se balancea, late, respira (aparece y se atenúa), o lo recorre un destello de
luz.

### El destello sigue la silueta, no el rectángulo

La luz se recorta con una máscara que es **la propia imagen del adorno**, así
que una filigrana dorada brilla por sus trazos y no por la caja que la
contiene. Es lo que separa esto de un flash barato.

Medido, no supuesto: entre fotogramas cambia el 1,3 % de los píxeles de la
caja —y como el adorno de prueba sólo ocupa el 6 % de ella, eso es una quinta
parte del adorno iluminándose— mientras que **el 0,00 % del vacío cambia**: la
luz no se sale.

Y lo que se anima es el `transform` de una barra dentro de la máscara, no la
posición del degradado: lo segundo repinta en cada fotograma, y con ocho
adornos por sección eso se siente en un teléfono.

### Tres capas, porque las tres quieren el mismo `transform`

```
.inv-adorno     la entrada, que corre una vez
  .inv-ad-mov   el movimiento, que corre en bucle
    .inv-ad-pieza  el giro y el volteo, que son fijos
      img + .inv-ad-luz
```

El giro iba antes en la `<img>`. Se movió a su propia capa para dejarle sitio
a las otras dos —si compartieran elemento, la última en escribir `transform`
borraría a las otras— y para que el destello quede alineado con la pieza ya
girada.

### La entrada no lleva JavaScript nuevo

El adorno con efecto de entrada lleva la clase `.inv-ad-entra` y el
observador que ya revelaba las secciones lo recoge: `querySelectorAll('.reveal,
.inv-ad-entra')`. Se observa **cada adorno por separado** y no su sección,
porque uno abajo del todo tiene que esperar a que se llegue a él aunque la
sección lleve rato en pantalla.

### El detalle que lo tenía roto

El adorno entraba ya visible. La regla que lo deja invisible hasta que se
asoma nunca llegaba a aplicarse porque **la opacidad elegida se escribía en el
atributo `style`, y un estilo en línea le gana a cualquier regla de la hoja**.

Ahora, cuando hay efecto de entrada, la opacidad no va en línea: va en
`--inv-ad-op` y la manda el CSS, y las animaciones terminan en esa variable y
no en 1. Sin JavaScript no llega el `.in`, así que la base es la opacidad
elegida y sólo bajo `.js` se parte de cero — si no, el adorno se quedaría
invisible para siempre.

## Marca de agua

Tu firma encima de toda la invitación, para que un borrador no se pueda
repartir como si fuera el final. Se prende para mandar la muestra y se apaga
al entregar — está **apagada por defecto**, porque una marca de agua que
aparece sola en la invitación que alguien entrega sería un desastre.

Un texto (`MUESTRA`, el nombre del estudio) o un logo, y tres formas de
colocarla:

| Disposición | Para qué |
| --- | --- |
| Repetida en diagonal | Por todas partes. La que de verdad estorba copiarla. |
| Una sola, cruzada en el centro | El sello clásico de «borrador». |
| Fija en una esquina | Discreta, para firmar el trabajo. |

Con tamaño, opacidad y color. El color vacío toma el de las letras del
diseño, así encaja en los 42 sin elegir nada.

### Lo primero, y sin adornos: no es infalible

Es una página web. Quien abra el inspector la borra en diez segundos. Lo que
esto evita es que un cliente mande el borrador por WhatsApp como si estuviera
pagado, y deja claro de quién es el trabajo. Para lo otro no hay solución en
el navegador, y prometerla sería mentir.

### Encima, no detrás

Va sobre el contenido y no debajo. Detrás la tapa la primera foto de portada a
pantalla completa, que es justo la pantalla que más se comparte.

Y va **por encima del velo de bienvenida**, que vive en `z-index: 9999`: sin
eso, la primera pantalla —la única que muchos ven antes de decidir si siguen—
saldría limpia.

### `pointer-events: none`, o la invitación se rompe entera

Es una capa fija sobre toda la página. Sin esa línea **se come todos los
clics**: no se puede entrar por el velo, ni confirmar, ni darle al play a un
vídeo. Y no lo ve ninguna captura, porque la marca se vería perfecta.

Por eso `npm run audit:browser` la enciende en los 42 diseños y hace una
prueba de impacto sobre el botón del velo: pregunta al navegador **quién está
en ese punto** y falla si no es el botón. Comprueba además que la capa
declare `pointer-events: none` y que su `z-index` gane al del velo.

### Copias en vez de un fondo repetido

La versión repetida es un lienzo girado, más grande que la pantalla, con las
copias dentro: girar un fondo repetido no se puede en CSS, girar la caja que
lo contiene sí.

Son elementos de texto y no un SVG en `background-image` para que usen **la
tipografía del diseño**: un SVG metido en `background-image` es un documento
aislado y no ve las fuentes de la página, así que el nombre del estudio
saldría en una fuente genérica distinta en cada diseño.

Cuántas copias hacen falta no se sabe al renderizar —el tamaño de la pantalla
se conoce en el navegador—, así que se emiten las que caben en la más grande
razonable y `overflow: hidden` recorta el resto.

## ¿Ya la vieron?

Es la primera pregunta de quien reparte invitaciones, y por enlace de invitado
es donde sirve: dice a qué familia hay que insistirle.

El panel lo muestra en dos sitios. Arriba, la cuenta que se usa para decidir:

```
3 enlaces · 3 personas invitadas · 2 confirmadas
2 sin responder · 1 la vieron y no han contestado · 1 sin abrir
```

Y por familia, junto a su estado: **«Vista hace 3 días»** o **«Sin abrir»**.
La distinción importa porque piden cosas distintas — a quien la vio y calla se
le insiste; a quien no la ha abierto hay que volverle a mandar el enlace,
porque quizá nunca le llegó.

En el editor, junto a las confirmaciones, va el total: cuántas personas la
abrieron, cuántas aperturas en total y cuándo fue la última.

### Ya había un contador, y era mejor que no se mostrara

La columna `views` subía en cada petición y no se leía en ningún sitio.
Contaba tres cosas que no son una persona abriendo la invitación:

1. **Los rastreadores.** WhatsApp pide la página **en el momento en que se
   pega el enlace**, para armar la tarjeta de vista previa. Contando eso, toda
   invitación aparece «vista» justo al compartirla — el dato miente
   exactamente donde importa.
2. **Las recargas.** La misma persona entrando cuatro veces no son cuatro
   personas.
3. **El organizador**, que abre la suya veinte veces para revisarla.

La medida de la diferencia, del propio `audit:vistas`: `views=8` frente a
`3 personas`.

`views` se queda como estaba —el total crudo, documentado como tal— y lo que
se muestra sale de la tabla `Apertura`.

### La regla que separa personas de rastreadores

Casi todo lo hace una sola observación: **un navegador de verdad manda un
`User-Agent` que empieza por `Mozilla/`**. `WhatsApp/2.23.20.0 i`,
`facebookexternalhit/1.1`, `TelegramBot`, `curl/8.5`, `python-requests` —
ninguno lo hace.

Y eso resuelve la trampa que parecía obligar a elegir: **en Android, tocar un
enlace dentro de WhatsApp lo abre en su navegador incrustado, cuyo UA sí
empieza por `Mozilla/5.0`**. Filtrar por la palabra «whatsapp» dejaría fuera a
personas de verdad, que son la mayoría de quienes abren una invitación
repartida por ahí. Filtrando por la forma del UA, el rastreador se va y la
persona se queda.

Después se aplica una lista para los que sí se disfrazan de navegador —
Googlebot lo hace, y `HeadlessChrome`, que es lo que usan las auditorías de
aquí y tampoco es una persona.

### Personas, no visitas

Una fila por visitante y por enlace, con un contador, en lugar de una fila por
visita: la tabla no crece con las recargas y sigue respondiendo las tres
preguntas —si abrió, cuándo fue la última vez y cuántas veces volvió.

El identificador del visitante es **un número aleatorio en una cookie y nada
más**: no sale de la IP, ni del navegador, ni de nada de la persona. Sólo
sirve para no contar cuatro veces a quien recarga cuatro veces. Si el
navegador no acepta cookies, cada visita trae uno nuevo y cuenta como otra
persona — se prefiere contar de más a inventar una identidad a partir de datos
personales.

La clave es `guestLinkId|visitante`, compuesta por lo mismo que en las
confirmaciones: en Postgres dos NULL no chocan en un índice único, y sin
enlace no habría unicidad ninguna.

Y el código del enlace se valida contra la invitación antes de colgarle la
apertura: viaja en la dirección y podría venir cambiado.

### Comprobarlo

```
npm run audit:aperturas    # lógica pura: 16 rastreadores fuera, 9 personas dentro
npm run audit:vistas       # necesita el servidor y la base
```

El primero clasifica user-agents reales, incluido el par delicado: el
rastreador de WhatsApp fuera, la persona en su navegador incrustado dentro.

El segundo hace peticiones de verdad y comprueba lo que sólo existe en una:
que WhatsApp y Facebook al compartir no cuenten, que recargar no multiplique
personas pero sí sume aperturas, que cada familia quede en su enlace, que el
organizador no se cuente a sí mismo, y que un código de otra invitación no se
cuelgue de ésta.

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
src/app/api/mis-plantillas/             las plantillas propias: guardar, listar, borrar, ver
src/app/api/biblioteca/                 una variante por tarjeta, para elegir de un vistazo
src/app/api/i/[slug]/rsvp/              confirmaciones
src/app/g/[token]/                      panel de invitados que se comparte
src/app/api/g/[token]/                  crear y borrar enlaces de invitado
src/lib/invitados.ts                    códigos, nombres y estado de cada enlace
src/lib/rsvp.ts                         quién es "la misma persona" al confirmar
src/lib/aperturas.ts                    quién cuenta como persona al abrirla
src/app/api/media/                      subir y servir fotos
uploads/                                fotos subidas (fuera del repo)
scripts/build-templates.ts              genera los 27 y verifica el contraste
scripts/audit-auth.ts                   ninguna ruta sin cerradura por descuido
scripts/audit-rsvp.ts                   que nadie pueda confirmar dos veces
scripts/audit-aperturas.ts              rastreadores fuera, personas dentro
scripts/audit-vistas.ts                 el contador de aperturas, contra el servidor
scripts/rsvp-deduplicar.ts              colapsa las repetidas que ya estaban
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
