/**
 * Componentes interactivos que sirven a cualquier diseño.
 *
 * Nacieron con «Quince Dorado», «Noche estrellada» y «Rosa encantada», pero ninguno es de un diseño: todos salen
 * de las variables de la paleta (--inv-accent, --inv-ink, --inv-surface…)
 * y se eligen desde el editor en cualquiera de los 58.
 *
 * · Apertura «sobre con sello»: el velo es un sobre cerrado; se toca el
 *   sello, la solapa se abre, la carta sube y la invitación entra.
 * · Cuenta atrás «paletas»: cada número gira como un reloj de aeropuerto.
 * · Fichas «se voltean»: por delante el ícono y el título, por detrás el
 *   texto. Se toca para darles la vuelta.
 * · Ubicación con «Agendar»: descarga el evento al calendario del teléfono.
 * · Partícula «polvo de oro»: motas que suben y se apartan del dedo.
 *
 * Y los de «Noche estrellada»:
 *
 * · Apertura «pide un deseo»: se toca el velo, cruza una estrella fugaz y
 *   la invitación entra.
 * · Partícula «cielo estrellado»: estrellas que titilan y siguen el giro
 *   del teléfono, y estrellas fugaces, solas y donde se toque.
 * · Cuenta atrás «órbitas»: el aro que se vacía y una luna que da vueltas.
 * · Programa «constelación»: una estrella por momento, unidas por una
 *   línea que se traza al bajar.
 * · Información útil «rasca y descubre»: una capa de plata que se rasca.
 *
 * Y los de «Rosa encantada»:
 *
 * · Apertura «libro de cuentos»: el velo es un libro cerrado; se toca la
 *   tapa, se abre y dentro está la invitación.
 * · Programa «capítulos»: cada momento es una página que entra girando,
 *   con su número al lado.
 *
 * Y el de «Rosa Real»:
 *
 * · Apertura «abanico»: el velo es un abanico cerrado que se despliega al
 *   tocarlo, girando sobre su remache.
 *
 * · Apertura «nubes»: dos nubes tapan la invitación y se van cada una por
 *   su lado, como cuando se abre el cielo.
 *
 * · Galería «carrusel»: una foto grande a la vez, con enganche y puntos.
 *
 * · Apertura «telón»: dos cortinas de terciopelo y un galón que se abren.
 *   Sin imágenes: el terciopelo son franjas sobre el color de acento.
 *
 * Aquí va lo que es igual para todos (el CSS y el JavaScript). Lo que
 * depende de los datos —el nombre en la carta, la fecha del calendario— lo
 * pone el renderer en el marcado, como atributos.
 *
 * Nota para quien edite: esto son plantillas de texto de TypeScript, así
 * que dentro no puede ir ninguna comilla invertida, ni en un comentario:
 * cierra la cadena y rompe la compilación.
 */

/* ────────────────────────────────────────────────────────────────
   El papel rasgado
   ──────────────────────────────────────────────────────────────── */

/**
 * La máscara de una foto con el borde roto a mano.
 *
 * Es un SVG en línea con un solo camino: cada lado del rectángulo se
 * recorre en pasos cortos y cada punto se aparta un poco hacia dentro o
 * hacia fuera, con alguna muesca más honda de vez en cuando. Tres semillas
 * dan tres roturas distintas, para que dos fotos seguidas no se rompan
 * igual.
 *
 * Se estira con la foto (`preserveAspectRatio="none"`): el diente mide poco
 * más del 1 % del lado, así que estirarlo no se nota, y a cambio la misma
 * máscara sirve para cualquier proporción.
 *
 * El azar es propio y con semilla —no `Math.random`— porque el CSS se
 * escribe una vez por render: con el azar del sistema, dos capturas de la
 * misma invitación saldrían rotas de distinta manera.
 */
function rasgado(semilla: number): string {
  let s = (semilla * 2654435761) % 2147483647;
  const azar = () => (s = (s * 1103515245 + 12345) % 2147483647) / 2147483647;
  const W = 100;
  const H = 125;
  const lado = (x0: number, y0: number, x1: number, y1: number, amp: number, n: number) => {
    const puntos: string[] = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const largo = Math.hypot(y1 - y0, x0 - x1);
      const nx = (y1 - y0) / largo;
      const ny = (x0 - x1) / largo;
      const d = (azar() * 2 - 1) * amp * (azar() > 0.22 ? 1 : 2.1);
      const x = x0 + (x1 - x0) * t + nx * d;
      const y = y0 + (y1 - y0) * t + ny * d;
      puntos.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return puntos;
  };
  const d =
    "M0 0L" +
    [
      ...lado(0, 0, W, 0, 1.5, 24),
      ...lado(W, 0, W, H, 1, 20),
      ...lado(W, H, 0, H, 1.5, 24),
      ...lado(0, H, 0, 0, 1, 20),
    ].join("L") +
    "Z";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" ` +
    `preserveAspectRatio="none"><path d="${d}" fill="#000"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* ────────────────────────────────────────────────────────────────
   CSS
   ──────────────────────────────────────────────────────────────── */

export const COMPONENTES_CSS = `
/* ── El sobre con sello ──────────────────────────────────────────
   Mientras está cerrado, el sobre sustituye al panel del velo: el panel
   sigue en el marcado —su botón es el que dispara la música y la cortina—
   pero no se ve. Al abrirse, el script pulsa ese mismo botón. */
#splash.inv-velo-sello .splash-modal{display:none}
.inv-sobre{position:relative;z-index:4;width:min(84vw,360px);aspect-ratio:1.45;
  cursor:pointer;perspective:1200px;-webkit-tap-highlight-color:transparent;
  animation:invSobreAsoma 1.1s cubic-bezier(.2,.7,.3,1) both}
@keyframes invSobreAsoma{from{opacity:0;transform:translateY(34px) rotateX(16deg)}
  to{opacity:1;transform:none}}
.inv-sobre-cuerpo,.inv-sobre-bolsillo{position:absolute;inset:0;border-radius:6px}
.inv-sobre-cuerpo{background:color-mix(in srgb,var(--inv-surface) 86%,var(--inv-accent));
  box-shadow:0 30px 70px -22px rgba(0,0,0,.6),
    inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 40%,transparent)}
.inv-sobre-carta{position:absolute;z-index:1;left:7%;right:7%;top:8%;height:84%;
  border-radius:4px;display:grid;place-content:center;gap:4px;text-align:center;
  background:var(--inv-surface);color:var(--inv-ink);
  box-shadow:0 2px 10px rgba(0,0,0,.08);
  transition:transform 1.1s cubic-bezier(.3,.7,.2,1) .35s}
.inv-sobre-ante{margin:0;font-family:var(--inv-font-ui);font-size:11px;
  letter-spacing:.32em;text-transform:uppercase;color:var(--inv-accent)}
.inv-sobre-nombre{margin:0;font-family:var(--inv-font-title);font-size:34px;line-height:1.15}
/* El bolsillo de delante tapa la carta mientras está dentro. */
.inv-sobre-bolsillo{z-index:2;overflow:hidden;pointer-events:none}
.inv-sobre-bolsillo::before,.inv-sobre-bolsillo::after{content:"";position:absolute;
  bottom:0;width:50.5%;height:100%;
  background:color-mix(in srgb,var(--inv-surface) 78%,var(--inv-accent))}
.inv-sobre-bolsillo::before{left:0;clip-path:polygon(0 0,100% 58%,100% 100%,0 100%)}
.inv-sobre-bolsillo::after{right:0;clip-path:polygon(100% 0,100% 100%,0 100%,0 58%);
  filter:brightness(.97)}
.inv-sobre-solapa{position:absolute;z-index:3;left:0;right:0;top:0;height:58%;
  transform-origin:50% 0;backface-visibility:hidden;
  background:color-mix(in srgb,var(--inv-surface) 72%,var(--inv-accent));
  clip-path:polygon(0 0,100% 0,50% 100%);
  transition:transform .8s cubic-bezier(.5,0,.2,1),z-index 0s .4s}
.inv-sobre-sello{position:absolute;z-index:4;left:50%;top:58%;width:84px;height:84px;
  translate:-50% -50%;border-radius:50%;display:grid;place-items:center;
  background:var(--inv-sello-img,radial-gradient(circle at 35% 30%,
    color-mix(in srgb,var(--inv-accent) 35%,#fff),var(--inv-accent) 48%,
    color-mix(in srgb,var(--inv-accent) 62%,#000)));
  background-size:contain;background-repeat:no-repeat;background-position:center;
  box-shadow:0 6px 18px rgba(0,0,0,.35);
  font-family:var(--inv-font-title);font-size:30px;color:var(--inv-on-accent);
  transition:transform .5s ease,opacity .5s ease;animation:invSelloLate 2.4s ease-in-out infinite}
.inv-sobre-sello.con-imagen{box-shadow:none;background-color:transparent;
  filter:drop-shadow(0 6px 14px rgba(0,0,0,.35))}
@keyframes invSelloLate{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.inv-sobre.abre .inv-sobre-sello{transform:scale(.4);opacity:0;animation:none}
.inv-sobre.abre .inv-sobre-solapa{transform:rotateX(180deg);z-index:0}
.inv-sobre.abre .inv-sobre-carta{transform:translateY(-58%)}
.inv-sobre-pista{position:absolute;z-index:4;left:0;right:0;
  bottom:calc(9vh + env(safe-area-inset-bottom));margin:0;text-align:center;
  font-family:var(--inv-font-ui);font-size:12px;letter-spacing:.4em;text-transform:uppercase;
  color:var(--inv-accent);animation:invPista 2.2s ease-in-out infinite}
@keyframes invPista{0%,100%{opacity:.35}50%{opacity:1}}
.inv-confeti{position:fixed;inset:0;width:100%;height:100%;z-index:10002;pointer-events:none}

/* ── La cuenta atrás de paletas ──────────────────────────────────
   Cada número es una placa partida por la mitad. El script de la cuenta
   atrás ya le pone .tick al número que cambia; aquí sólo se hace girar. */
.inv-cd-paletas{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;
  max-width:430px;margin-inline:auto}
.inv-cd-paletas .countdown-ring{display:block;background:none;border:0;box-shadow:none;
  perspective:420px;aspect-ratio:auto;padding:0}
.inv-cd-paletas .ring-inner{display:block;width:100%;text-align:center}
.inv-cd-paletas .ring-number{position:relative;display:grid;place-items:center;height:74px;
  border-radius:12px;overflow:hidden;
  background:linear-gradient(180deg,color-mix(in srgb,var(--inv-ink) 90%,var(--inv-accent)) 0 50%,
    var(--inv-ink) 50% 100%);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 45%,transparent),
    0 12px 24px -14px rgba(0,0,0,.7);
  color:var(--inv-surface);font-size:clamp(26px,8.4vw,38px);line-height:1}
.inv-cd-paletas .ring-number::after{content:"";position:absolute;left:0;right:0;top:50%;
  height:1px;background:rgba(0,0,0,.45)}
.inv-cd-paletas .ring-number.tick{animation:invPaleta .6s cubic-bezier(.4,0,.2,1)}
@keyframes invPaleta{0%{transform:rotateX(-90deg);opacity:.25}
  60%{transform:rotateX(12deg)}100%{transform:none;opacity:1}}
.inv-cd-paletas .ring-label{display:block;margin-top:8px}

/* ── Las fichas que se voltean ───────────────────────────────── */
.inv-fe-voltea{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.inv-fe-voltea .feature-card{position:relative;min-height:200px;padding:0;
  perspective:900px;cursor:pointer;background:transparent;box-shadow:none;border:0;
  -webkit-tap-highlight-color:transparent}
.inv-fe-voltea .inv-cara{position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:8px;padding:20px 14px;
  border-radius:var(--inv-radius,16px);backface-visibility:hidden;
  transition:transform .8s cubic-bezier(.3,.7,.2,1)}
.inv-fe-voltea .inv-cara-frente{background:var(--inv-surface);color:var(--inv-ink);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 35%,transparent),
    0 16px 30px -22px rgba(0,0,0,.5)}
.inv-fe-voltea .inv-cara-dorso{transform:rotateY(180deg);
  background:var(--inv-ink);color:var(--inv-surface);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 55%,transparent)}
.inv-fe-voltea .feature-card.vuelta .inv-cara-frente{transform:rotateY(-180deg)}
.inv-fe-voltea .feature-card.vuelta .inv-cara-dorso{transform:none}
.inv-fe-voltea .feature-text{margin:0;color:inherit}
.inv-fe-pista{font-family:var(--inv-font-ui);font-size:10px;letter-spacing:.3em;
  text-transform:uppercase;opacity:.6}
/* La tarjeta con fondo propio lo lleva en la cara, no detrás de las dos. */
.inv-fe-voltea .feature-card.inv-ficha-fondo::before{display:none}
.inv-fe-voltea .feature-card.inv-ficha-fondo .inv-cara-frente{
  background-color:var(--inv-ff-color,var(--inv-surface));
  background-image:var(--inv-ff-img);background-size:var(--inv-ff-size,cover);
  background-position:center;background-repeat:no-repeat}

/* ── Agendar ── */
/* Un botón que se ve como el enlace de «Cómo llegar», pero en contorno. */
.inv-mapa-btn.inv-agendar{margin-left:8px;background:transparent;color:var(--inv-accent);
  box-shadow:inset 0 0 0 1px var(--inv-accent);border:0;cursor:pointer;
  font-family:inherit;line-height:inherit}

/* ── Las capas de lienzo (polvo de oro, cielo estrellado, rasca) ──
   El elemento que deja el servidor es un <div>: el <canvas> lo crea el
   script en el navegador. Es a propósito. El HTML del servidor se arma con
   linkedom, y su <canvas> intenta usar el paquete «canvas» de Node —que no
   está en el contenedor— y revienta el render entero. */
.inv-polvo{position:fixed;inset:0;width:100%;height:100%;z-index:9997;pointer-events:none}
.inv-polvo canvas,.inv-cielo canvas,.inv-rasca-capa canvas{display:block;width:100%;height:100%}


/* ── Pide un deseo: el velo se toca y cruza una estrella fugaz ── */
#splash.inv-velo-deseo{cursor:pointer;-webkit-tap-highlight-color:transparent}
#splash.inv-velo-deseo .splash-btns{display:none}
.inv-deseo-pista{position:absolute;z-index:4;left:0;right:0;
  bottom:calc(9vh + env(safe-area-inset-bottom));margin:0;text-align:center;
  font-family:var(--inv-font-ui);font-size:12px;letter-spacing:.4em;text-transform:uppercase;
  color:var(--inv-accent);animation:invPista 2.4s ease-in-out infinite;pointer-events:none}
.inv-fugaz{position:fixed;left:0;top:0;z-index:10003;width:190px;height:2px;pointer-events:none;
  border-radius:2px;transform-origin:0 50%;
  background:linear-gradient(90deg,#fff,rgba(200,215,255,.75) 18%,rgba(200,215,255,0));
  box-shadow:0 0 10px 2px rgba(210,225,255,.8)}

/* ── El cielo estrellado (partícula) ── */
.inv-cielo{position:fixed;inset:0;width:100%;height:100%;z-index:9996;pointer-events:none}

/* ── Cuenta atrás en órbitas ──
   El aro es el de «anillos» —se va vaciando con el tiempo— con un brillo, y
   una luna pequeña que da la vuelta, cada unidad a su ritmo. */
.inv-cd-orbitas{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:440px;margin-inline:auto}
.inv-cd-orbitas .countdown-ring{position:relative;aspect-ratio:1;display:grid;place-items:center;
  background:none;border:0;box-shadow:none}
.inv-cd-orbitas .countdown-ring::before{content:"";position:absolute;inset:0;border-radius:50%;
  background:conic-gradient(var(--inv-accent) calc(var(--p,0) * 1turn),
    color-mix(in srgb,var(--inv-accent) 18%,transparent) 0);
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2.5px),#000 calc(100% - 2px));
          mask:radial-gradient(farthest-side,transparent calc(100% - 2.5px),#000 calc(100% - 2px));
  filter:drop-shadow(0 0 4px color-mix(in srgb,var(--inv-accent) 70%,transparent))}
.inv-cd-orbitas .countdown-ring::after{content:"";position:absolute;inset:0;border-radius:50%;
  background:radial-gradient(circle at 50% 3px,#fff 2.5px,transparent 3.5px);
  filter:drop-shadow(0 0 5px rgba(210,225,255,.9));animation:invOrbita 60s linear infinite}
.inv-cd-orbitas .countdown-ring:nth-child(2)::after{animation-duration:30s}
.inv-cd-orbitas .countdown-ring:nth-child(3)::after{animation-duration:14s}
.inv-cd-orbitas .countdown-ring:nth-child(4)::after{animation-duration:6s}
@keyframes invOrbita{to{transform:rotate(360deg)}}
.inv-cd-orbitas{padding-bottom:22px}
.inv-cd-orbitas .countdown-ring{overflow:visible}
.inv-cd-orbitas .ring-inner{position:static;text-align:center}
.inv-cd-orbitas .ring-number{display:block;font-size:clamp(19px,5.8vw,27px);line-height:1}
/* La etiqueta, fuera del aro: dentro se monta sobre el número, que es lo
   que de verdad se mira. */
.inv-cd-orbitas .ring-label{position:absolute;left:0;right:0;bottom:-19px;display:block;
  font-size:9px;letter-spacing:.18em}

/* ── Cuenta atrás de luciérnagas ──
   Un halo que respira detrás de cada número y tres luciérnagas que
   revolotean, cada una con su recorrido y su ritmo para que no se note el
   bucle. Las luciérnagas son sombras de un solo punto: tres cuerpos, cero
   elementos de más. */
.inv-cd-luciernagas{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:440px;margin-inline:auto}
.inv-cd-luciernagas .countdown-ring{position:relative;aspect-ratio:.9;display:grid;place-items:center;
  background:none;border:0;box-shadow:none;overflow:visible}
.inv-cd-luciernagas .countdown-ring::before{content:"";position:absolute;inset:6%;border-radius:50%;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--inv-accent) 52%,transparent),
    color-mix(in srgb,var(--inv-accent) 14%,transparent) 62%,transparent);
  animation:invHalo 4s ease-in-out infinite;transition:filter .5s}
.inv-cd-luciernagas .countdown-ring:nth-child(2)::before{animation-delay:-1s}
.inv-cd-luciernagas .countdown-ring:nth-child(3)::before{animation-delay:-2s}
.inv-cd-luciernagas .countdown-ring:nth-child(4)::before{animation-delay:-3s}
.inv-cd-luciernagas .countdown-ring::after{content:"";position:absolute;left:50%;top:50%;width:3px;height:3px;
  border-radius:50%;background:#fffbe0;pointer-events:none;
  box-shadow:0 0 6px 2px color-mix(in srgb,var(--inv-accent) 80%,#fff),
    22px -30px 0 0 #fffbe0,22px -30px 6px 2px color-mix(in srgb,var(--inv-accent) 70%,transparent),
    -28px 18px 0 0 #fffbe0,-28px 18px 6px 2px color-mix(in srgb,var(--inv-accent) 70%,transparent);
  animation:invRevolotea 9s ease-in-out infinite}
.inv-cd-luciernagas .countdown-ring:nth-child(2)::after{animation-duration:11s;animation-direction:reverse}
.inv-cd-luciernagas .countdown-ring:nth-child(3)::after{animation-duration:8s;animation-delay:-3s}
.inv-cd-luciernagas .countdown-ring:nth-child(4)::after{animation-duration:12s;animation-direction:alternate-reverse}
@keyframes invHalo{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1.05);opacity:1}}
@keyframes invRevolotea{
  0%{transform:translate(-8px,-26px);opacity:.9}20%{transform:translate(20px,-6px);opacity:.4}
  45%{transform:translate(6px,24px);opacity:1}70%{transform:translate(-22px,6px);opacity:.5}
  100%{transform:translate(-8px,-26px);opacity:.9}}
.inv-cd-luciernagas .ring-inner{position:relative;z-index:1;text-align:center}
.inv-cd-luciernagas .ring-number{display:block;font-size:clamp(24px,7.4vw,34px);line-height:1;
  text-shadow:0 0 14px color-mix(in srgb,var(--inv-accent) 70%,transparent)}
.inv-cd-luciernagas .ring-label{display:block;margin-top:6px;font-size:9.5px;letter-spacing:.18em}
/* El segundo que pasa: el número destella y su halo se aviva un instante. */
.inv-cd-luciernagas .ring-number.tick{animation:invDestellaNum .7s ease-out}
.inv-cd-luciernagas .countdown-ring:has(.tick)::before{filter:brightness(1.5) saturate(1.2)}
@keyframes invDestellaNum{0%{text-shadow:0 0 26px var(--inv-accent),0 0 6px #fff}100%{}}

/* ── El programa como sendero ──
   El camino lo traza el script por el centro de cada parada y se curva a un
   lado y a otro entre parada y parada: las curvas caen en el hueco entre
   dos momentos, que es donde no hay texto. La luciérnaga va por el mismo
   camino con offset-path, así que nunca se sale de él. */
.inv-ev-sendero{position:relative;display:block;max-width:440px;margin:24px auto 0;padding:26px 0}
.inv-senda{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.inv-senda path{fill:none;stroke-linecap:round}
.inv-senda-fondo{stroke:color-mix(in srgb,var(--inv-accent) 35%,transparent);stroke-width:1.5;stroke-dasharray:2 7}
.inv-senda-luz{stroke:var(--inv-accent);stroke-width:2;stroke-dasharray:1;
  stroke-dashoffset:calc(1 - var(--inv-senda,0));
  filter:drop-shadow(0 0 4px color-mix(in srgb,var(--inv-accent) 80%,transparent))}
.inv-luciernaga{position:absolute;left:0;top:0;z-index:4;width:12px;height:12px;border-radius:50%;
  pointer-events:none;opacity:0;
  background:radial-gradient(#fffbe0 20%,color-mix(in srgb,var(--inv-accent) 85%,#fff) 45%,transparent 72%);
  box-shadow:0 0 16px 6px color-mix(in srgb,var(--inv-accent) 55%,transparent);
  offset-rotate:0deg;offset-distance:calc(var(--inv-senda,0) * 100%);
  transition:offset-distance .3s linear,opacity .6s;animation:invTitila 1.7s ease-in-out infinite}
.inv-ev-sendero.trazado .inv-luciernaga{opacity:1}
@keyframes invTitila{0%,100%{scale:1}50%{scale:.7}}
.inv-ev-sendero .event-card{position:relative;display:grid;grid-template-columns:1fr 60px 1fr;column-gap:14px;
  align-items:center;min-height:118px;padding:10px 0;background:none;border:0;box-shadow:none;border-radius:0}
.inv-ev-sendero .event-card:hover{transform:none}
.inv-parada{grid-column:2;grid-row:1;justify-self:center;position:relative;z-index:3;
  width:54px;height:54px;display:grid;place-items:center;border-radius:50%;
  background:var(--inv-surface);color:var(--inv-accent);font-size:22px;font-style:normal;
  box-shadow:0 0 0 1.5px color-mix(in srgb,var(--inv-accent) 40%,transparent);
  transform:scale(.84);transition:transform .7s cubic-bezier(.2,.7,.3,1),box-shadow .7s}
.inv-parada .event-icon{display:grid;place-items:center;margin:0;padding:0;width:auto;height:auto;
  background:none;border:0;box-shadow:none;color:inherit;font-size:inherit}
.inv-parada svg{width:26px;height:26px}
/* Sin ícono, la parada es un punto de luz. */
.inv-parada:empty{width:18px;height:18px;
  background:radial-gradient(#fffbe0 25%,color-mix(in srgb,var(--inv-accent) 85%,#fff) 55%,transparent 72%)}
.inv-ev-sendero .event-card.encendido .inv-parada{transform:none;
  box-shadow:0 0 0 1.5px var(--inv-accent),0 0 24px 5px color-mix(in srgb,var(--inv-accent) 45%,transparent)}
.inv-ev-sendero .event-card.encendido .inv-parada:empty{box-shadow:0 0 18px 6px color-mix(in srgb,var(--inv-accent) 55%,transparent)}
.inv-ev-sendero .inv-dato{grid-column:3;grid-row:1;text-align:left;
  opacity:0;transform:translateX(14px);transition:opacity .8s ease .1s,transform .8s ease .1s}
.inv-ev-sendero .event-card:nth-of-type(odd) .inv-dato{grid-column:1;text-align:right;transform:translateX(-14px)}
.inv-ev-sendero .event-card.encendido .inv-dato{opacity:1;transform:none}
.inv-ev-sendero :is(.event-type,.event-title,.event-time,.event-place,.event-note){margin:0}
.inv-ev-sendero .event-map-btn{margin-top:8px}
html:not(.js) .inv-ev-sendero .inv-dato{opacity:1;transform:none}

/* ── El programa como viaje ──
   El hilo pasa por el centro de la columna de las paradas (14 px de margen
   más la mitad de 52): el viajero y los puntos se alinean con él sin
   medir nada. Lo que viaja es una imagen del diseño en --inv-viajero-img;
   sin ella, una esfera del color de acento. */
.inv-ev-viaje{position:relative;display:block;max-width:420px;margin:22px auto 0;padding-left:14px;text-align:left}
.inv-ev-viaje::before{content:"";position:absolute;left:39px;top:16px;bottom:16px;width:2px;
  background:linear-gradient(transparent,var(--inv-accent),transparent)}
.inv-viajero{position:absolute;left:14px;top:-30px;z-index:2;width:52px;height:64px;pointer-events:none;
  background:var(--inv-viajero-img,radial-gradient(circle at 42% 38%,#fff 0 10%,
    color-mix(in srgb,var(--inv-accent) 70%,#fff) 22%,var(--inv-accent) 46%,transparent 48%)) center/contain no-repeat;
  filter:drop-shadow(0 6px 12px rgba(0,0,0,.22));transition:top .45s cubic-bezier(.3,.7,.2,1)}
.inv-ev-viaje .event-card{position:relative;display:grid;grid-template-columns:52px 1fr;column-gap:18px;
  align-items:start;padding:14px 0;background:none;border:0;box-shadow:none;border-radius:0;text-align:left}
.inv-ev-viaje .event-card:hover{transform:none}
.inv-hito{grid-column:1;grid-row:1;width:14px;height:14px;margin:8px auto 0;border-radius:50%;
  background:var(--inv-surface);box-shadow:0 0 0 2px var(--inv-accent);transition:background .5s,box-shadow .5s}
.inv-ev-viaje .event-card.pasada .inv-hito{background:var(--inv-accent);
  box-shadow:0 0 0 2px var(--inv-accent),0 0 0 6px color-mix(in srgb,var(--inv-accent) 25%,transparent)}
.inv-ev-viaje .inv-dato{grid-column:2;grid-row:1;display:flex;flex-direction:column;align-items:flex-start;text-align:left}
.inv-ev-viaje .event-icon{display:none}
.inv-ev-viaje :is(.event-type,.event-title,.event-time,.event-place,.event-note){margin:0}
.inv-ev-viaje .event-map-btn{align-self:flex-start;margin-top:10px}

/* ── La ventana: dos postigos de balcón que se abren ──
   Las lamas son un degradado que se repite, así que no hay imagen que
   cargar y toma el color del acento de cualquier diseño. Cada postigo gira
   sobre su bisagra, hacia fuera, como una ventana francesa. */
#splash.inv-velo-ventana{cursor:pointer;-webkit-tap-highlight-color:transparent;overflow:hidden;perspective:1400px}
#splash.inv-velo-ventana .splash-btns{display:none}
#splash.inv-velo-ventana .splash-modal{position:relative;z-index:1}
.inv-postigo{position:absolute;top:0;bottom:0;width:50.5%;z-index:3;pointer-events:none;
  background:
    linear-gradient(90deg,color-mix(in srgb,var(--inv-accent) 70%,#000) 0 6px,transparent 6px calc(100% - 6px),
      color-mix(in srgb,var(--inv-accent) 70%,#000) calc(100% - 6px)),
    repeating-linear-gradient(180deg,color-mix(in srgb,var(--inv-accent) 92%,#fff) 0 9px,
      color-mix(in srgb,var(--inv-accent) 70%,#000) 9px 11px,var(--inv-accent) 11px 18px);
  box-shadow:inset 0 0 0 10px color-mix(in srgb,var(--inv-accent) 82%,#000),inset 0 0 40px rgba(0,0,0,.35);
  transition:transform 1.5s cubic-bezier(.55,0,.25,1)}
.inv-postigo::after{content:"";position:absolute;top:50%;width:8px;height:34px;margin-top:-17px;border-radius:4px;
  background:linear-gradient(#fff6d6,color-mix(in srgb,var(--inv-accent) 30%,#c9a24a));
  box-shadow:0 2px 4px rgba(0,0,0,.4)}
.inv-postigo-izq{left:0;transform-origin:left center}
.inv-postigo-izq::after{right:16px}
.inv-postigo-der{right:0;transform-origin:right center}
.inv-postigo-der::after{left:16px}
#splash.abriendo .inv-postigo-izq{transform:rotateY(-108deg)}
#splash.abriendo .inv-postigo-der{transform:rotateY(108deg)}
#splash.inv-velo-ventana .inv-sobre-pista{z-index:4;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.5)}

/* ── La claqueta: se toca, el palo cae —¡acción!— y empieza la película ──
   Toda en CSS: la tabla con sus renglones y el palo con las franjas. El
   palo gira sobre la bisagra de la izquierda. */
#splash.inv-velo-claqueta{cursor:pointer;-webkit-tap-highlight-color:transparent;overflow:hidden}
#splash.inv-velo-claqueta .splash-btns{display:none}
#splash.inv-velo-claqueta .splash-modal{position:relative;z-index:3}
.inv-claqueta{position:absolute;left:50%;top:15%;z-index:4;width:clamp(120px,36vw,160px);aspect-ratio:1.3;
  translate:-50% 0;pointer-events:none;filter:drop-shadow(0 10px 18px rgba(0,0,0,.45))}
.inv-claqueta-tabla{position:absolute;left:0;right:0;bottom:0;top:24%;border-radius:4px;background:
  repeating-linear-gradient(180deg,transparent 0 22%,rgba(255,255,255,.55) 22% calc(22% + 1px)),#15120e;
  box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--inv-accent) 70%,#fff)}
.inv-claqueta-palo{position:absolute;left:0;right:0;top:4%;height:18%;border-radius:3px;transform-origin:6% 100%;
  background:repeating-linear-gradient(-55deg,#15120e 0 12px,#f7f2e6 12px 24px);
  box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--inv-accent) 70%,#fff);
  transform:rotate(-24deg);transition:transform .22s cubic-bezier(.7,0,.9,.6)}
.inv-claqueta::before{content:"";position:absolute;left:1%;top:17%;width:12%;aspect-ratio:1;border-radius:50%;z-index:2;
  background:radial-gradient(#fff6d6,color-mix(in srgb,var(--inv-accent) 60%,#8a6d2a))}
.inv-claqueta::after{content:"";position:absolute;inset:-60%;border-radius:50%;opacity:0;pointer-events:none;
  background:radial-gradient(closest-side,rgba(255,250,230,.95),transparent)}
#splash.abriendo .inv-claqueta-palo{transform:rotate(0)}
#splash.abriendo .inv-claqueta::after{animation:invFlash .6s ease-out .2s both}
@keyframes invFlash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
#splash.inv-velo-claqueta.abriendo{animation:invCorte 1s ease-in .75s both}
@keyframes invCorte{to{opacity:0;filter:brightness(2.2)}}

/* ── Cuenta atrás de marquesina ──
   Cada unidad es un letrero de cine con bombillas en el marco. Son dos
   capas de bombillas desfasadas que se encienden por turnos: es lo que da
   la sensación de que la luz corre alrededor. */
.inv-cd-marquesina{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;max-width:440px;margin-inline:auto}
.inv-cd-marquesina .countdown-ring{position:relative;display:grid;place-items:center;aspect-ratio:.86;
  border:0;border-radius:10px;padding:0;overflow:visible;
  background:linear-gradient(180deg,color-mix(in srgb,var(--inv-accent) 18%,#140f0c),#0c0907);
  box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--inv-accent) 70%,transparent),0 0 22px -6px var(--inv-accent)}
.inv-cd-marquesina .countdown-ring::before,.inv-cd-marquesina .countdown-ring::after{content:"";position:absolute;
  inset:3px;border-radius:8px;padding:6px;pointer-events:none;
  background:radial-gradient(circle,#fffbe6 0 1.6px,color-mix(in srgb,var(--inv-accent) 80%,#fff) 2.4px,transparent 3.4px)
    0 0/12px 12px;
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
  filter:drop-shadow(0 0 3px var(--inv-accent));animation:invBombilla 1.2s steps(1) infinite}
.inv-cd-marquesina .countdown-ring::after{background-position:6px 6px;animation-delay:-.6s}
@keyframes invBombilla{0%{opacity:1}50%{opacity:.25}}
.inv-cd-marquesina .ring-inner{position:relative;z-index:1;text-align:center}
.inv-cd-marquesina .ring-number{display:block;font-size:clamp(24px,7.2vw,34px);line-height:1;color:#fff6de;
  text-shadow:0 0 12px color-mix(in srgb,var(--inv-accent) 80%,transparent)}
.inv-cd-marquesina .ring-label{display:block;margin-top:6px;font-size:8px;letter-spacing:.1em;text-transform:uppercase;
  color:color-mix(in srgb,var(--inv-accent) 70%,#fff)}
.inv-cd-marquesina .ring-number.tick{animation:invDestellaNum .6s ease-out}

/* ── El programa como cinta de cine ──
   Una tira vertical con sus perforaciones a los dos lados; cada momento
   es un fotograma, numerado como una escena. Al asomar, el fotograma se
   «proyecta»: parpadea como la luz de un proyector y se queda. */
.inv-ev-cinta{position:relative;display:block;max-width:420px;margin:22px auto 0;padding:14px 34px;counter-reset:escena;
  border-radius:6px;background:
    radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--inv-accent) 10%,#fff) 0 3.5px,transparent 4px) left 12px top 0/10px 18px repeat-y,
    radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--inv-accent) 10%,#fff) 0 3.5px,transparent 4px) right 12px top 0/10px 18px repeat-y,
    #0d0b09;
  box-shadow:0 18px 34px -20px rgba(0,0,0,.8),inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 35%,transparent)}
.inv-ev-cinta .event-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;margin:0 0 10px;
  padding:26px 16px 20px;text-align:center;counter-increment:escena;border:0;border-radius:3px;
  background:radial-gradient(120% 90% at 50% 0%,color-mix(in srgb,var(--inv-accent) 22%,#1b1611),#120e0b);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 40%,transparent)}
.inv-ev-cinta .event-card:last-child{margin-bottom:0}
.inv-ev-cinta .event-card:hover{transform:none}
.inv-ev-cinta .event-card::before{content:"ESCENA " counter(escena);position:absolute;left:10px;top:8px;
  font-family:var(--inv-font-ui);font-size:9px;letter-spacing:.24em;color:color-mix(in srgb,var(--inv-accent) 75%,#fff)}
.inv-ev-cinta .event-icon{width:auto;height:auto;margin:0 0 4px;background:none;border:0;box-shadow:none;
  font-size:26px;color:var(--inv-accent)}
.inv-ev-cinta .event-icon svg{width:30px;height:30px}
.inv-ev-cinta :is(.event-type,.event-title,.event-time,.event-place,.event-note){margin:0;color:#f6efe2}
.inv-ev-cinta .event-time{color:var(--inv-accent)}
.inv-ev-cinta :is(.event-place,.event-note){color:rgba(246,239,226,.72)}
.inv-ev-cinta .event-map-btn{margin-top:10px}
.js .inv-ev-cinta .event-card{opacity:0}
.js .inv-ev-cinta .event-card.proyectada{animation:invProyecta 1.1s steps(1) both}
@keyframes invProyecta{0%{opacity:.15}12%{opacity:.8}20%{opacity:.3}32%{opacity:1}40%{opacity:.6}52%,100%{opacity:1}}

/* ── El programa como postales ──
   Cada momento es una postal con su estampilla —el ícono, dentro de un
   sello de borde dentado— y el matasellos encima. Llegan torcidas, una a
   un lado y otra al otro, cayendo como si las dejaran sobre la mesa. */
.inv-ev-postales{display:flex;flex-direction:column;gap:18px;max-width:420px;margin:22px auto 0}
.inv-ev-postales .event-card{position:relative;display:block;padding:22px 96px 20px 20px;text-align:left;border:0;
  border-radius:4px;background:
    linear-gradient(90deg,transparent calc(100% - 118px),color-mix(in srgb,var(--inv-accent) 22%,transparent) calc(100% - 118px) calc(100% - 117px),transparent calc(100% - 117px)),
    var(--inv-surface);
  box-shadow:0 14px 26px -18px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 18%,transparent);
  rotate:-1.6deg}
.inv-ev-postales .event-card:nth-of-type(even){rotate:1.4deg}
.inv-ev-postales .event-card:hover{transform:none}
.inv-estampilla{position:absolute;right:16px;top:16px;width:62px;height:74px;display:grid;place-items:center;
  font-style:normal;background:
    radial-gradient(circle,transparent 3px,var(--inv-accent) 3.5px) -4px -4px/8px 8px;
  padding:5px}
.inv-estampilla::before{content:"";position:absolute;inset:5px;background:color-mix(in srgb,var(--inv-accent) 14%,#fff);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 45%,transparent)}
.inv-estampilla::after{content:"";position:absolute;left:-26px;top:22px;width:58px;height:40px;border-radius:50%;
  border:1.5px solid color-mix(in srgb,var(--inv-ink) 35%,transparent);opacity:.7;rotate:-14deg;
  box-shadow:18px 0 0 -12px color-mix(in srgb,var(--inv-ink) 35%,transparent)}
.inv-estampilla .event-icon{position:relative;z-index:1;display:grid;place-items:center;width:auto;height:auto;margin:0;
  background:none;border:0;box-shadow:none;color:var(--inv-accent);font-size:24px}
.inv-estampilla .event-icon svg{width:28px;height:28px}
.inv-ev-postales :is(.event-type,.event-title,.event-time,.event-place,.event-note){margin:0}
.inv-ev-postales .event-map-btn{margin-top:10px}
.js .inv-ev-postales .event-card{opacity:0;translate:0 -26px}
.js .inv-ev-postales .event-card.llega{opacity:1;translate:0 0;
  transition:opacity .6s ease,translate .8s cubic-bezier(.2,.8,.3,1.15)}

/* ── La mariposa: bate las alas despacio sobre el nombre; al tocarla, las
   bate deprisa y sale volando ──
   Cada ala es la mitad de la misma imagen (fondo al 200 %), así que basta
   una mariposa de frente y simétrica. El diseño la pone en
   --inv-mariposa-img; sin ella se dibuja una con cuatro elipses del acento. */
#splash.inv-velo-mariposa{cursor:pointer;-webkit-tap-highlight-color:transparent;overflow:hidden}
#splash.inv-velo-mariposa .splash-btns{display:none}
#splash.inv-velo-mariposa .splash-modal{position:relative;z-index:3;margin-top:16vh}
.inv-mariposa{position:absolute;left:50%;top:13%;z-index:4;width:clamp(150px,46vw,210px);aspect-ratio:1.33;
  margin-left:calc(clamp(150px,46vw,210px) / -2);pointer-events:none;perspective:700px;
  filter:drop-shadow(0 10px 18px rgba(0,0,0,.28));animation:invPosada 4s ease-in-out infinite}
.inv-ala{position:absolute;top:0;bottom:0;width:50%;background-repeat:no-repeat;background-size:200% 100%;
  background-image:var(--inv-mariposa-img,
    radial-gradient(ellipse 22% 30% at 30% 34%,var(--inv-accent) 0 62%,transparent 64%),
    radial-gradient(ellipse 16% 20% at 36% 74%,color-mix(in srgb,var(--inv-accent) 65%,#fff) 0 62%,transparent 64%),
    radial-gradient(ellipse 22% 30% at 70% 34%,var(--inv-accent) 0 62%,transparent 64%),
    radial-gradient(ellipse 16% 20% at 64% 74%,color-mix(in srgb,var(--inv-accent) 65%,#fff) 0 62%,transparent 64%));
  animation:invAleteoIzq 2.8s ease-in-out infinite}
.inv-ala-izq{left:0;background-position:0 0;transform-origin:100% 50%}
.inv-ala-der{right:0;background-position:100% 0;transform-origin:0 50%;animation-name:invAleteoDer}
@keyframes invAleteoIzq{0%,100%{transform:rotateY(0)}50%{transform:rotateY(58deg)}}
@keyframes invAleteoDer{0%,100%{transform:rotateY(0)}50%{transform:rotateY(-58deg)}}
@keyframes invPosada{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
#splash.abriendo .inv-ala{animation-duration:.26s}
#splash.abriendo .inv-mariposa{animation:invVuela 1.5s cubic-bezier(.45,0,.7,.35) .2s forwards}
@keyframes invVuela{40%{transform:translate(-6vw,-6vh) rotate(-10deg)}
  100%{transform:translate(42vw,-72vh) rotate(26deg) scale(.45);opacity:0}}

/* ── El jardín: el follaje se mece y la mariposa blanca se va ──
   La mariposa de arriba, pero posada en un jardín. Dos matas de follaje
   ocupan las esquinas del velo y respiran despacio, cada una a su ritmo;
   al tocar, la mariposa sale volando, las matas se apartan hacia afuera y
   el velo se disuelve encima de la foto de la portada.

   El diseño pone las matas en --inv-jardin-izq y --inv-jardin-der —con una
   sola, la otra es la misma en espejo— y la mariposa en --inv-mariposa-img.
   Sin ninguna de las tres queda el fundido y la mariposa dibujada con el
   acento, que es lo que ya hacía la apertura «mariposa». */
#splash.inv-velo-jardin{cursor:pointer;-webkit-tap-highlight-color:transparent;overflow:hidden}
#splash.inv-velo-jardin .splash-btns{display:none}
#splash.inv-velo-jardin .splash-modal{position:relative;z-index:3}
/* La pista cae justo donde está el follaje, y ahí un texto suelto se
   pierde entre las hojas: va en una pastilla del color del papel. */
#splash.inv-velo-jardin .inv-sobre-pista{z-index:5;bottom:20px;width:max-content;max-width:86%;
  margin-inline:auto;padding:7px 16px;border-radius:999px;
  background:color-mix(in srgb,var(--inv-surface) 84%,transparent)}
.inv-jardin{position:absolute;bottom:-4%;z-index:1;width:min(56vw,255px);aspect-ratio:.72;pointer-events:none;
  background:var(--inv-jardin-izq,none) bottom center/contain no-repeat;
  transform-origin:50% 100%;animation:invMeceIzq 7s ease-in-out infinite}
.inv-jardin-izq{left:-13%}
.inv-jardin-der{right:-13%;transform:scaleX(-1);
  background-image:var(--inv-jardin-der,var(--inv-jardin-izq,none));
  animation-name:invMeceDer;animation-duration:8.6s}
@keyframes invMeceIzq{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.5deg)}}
@keyframes invMeceDer{0%,100%{transform:scaleX(-1) rotate(1.6deg)}50%{transform:scaleX(-1) rotate(-1.5deg)}}
/* El velo se va en fundido, no de un corte: eso es lo que deja ver la foto
   de la portada apareciendo por debajo mientras la mariposa todavia vuela. */
#splash.inv-velo-jardin.abriendo{opacity:0;transition:opacity .9s ease .35s}
#splash.inv-velo-jardin.abriendo .inv-jardin-izq{animation:invMataIzq 1.2s ease forwards}
#splash.inv-velo-jardin.abriendo .inv-jardin-der{animation:invMataDer 1.2s ease forwards}
@keyframes invMataIzq{to{transform:translateX(-24%) rotate(-7deg)}}
@keyframes invMataDer{to{transform:scaleX(-1) translateX(-24%) rotate(-7deg)}}

/* ── Cuenta atrás con alas ──
   Cada número se posa entre dos alas que respiran; al cambiar, baten una
   vez. Son dos seudoelementos por casilla, con dos elipses cada uno. */
.inv-cd-alas{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;max-width:440px;margin-inline:auto}
.inv-cd-alas .countdown-ring{position:relative;aspect-ratio:1.05;display:grid;place-items:center;
  border:0;border-radius:0;padding:0;background:none;box-shadow:none;overflow:visible;perspective:320px}
/* Las alas son las dos mitades de una mariposa, como en la apertura: la
   del diseño en --inv-alas-img (o la de la apertura), o, sin ninguna, dos
   pares de alas dibujados con el acento. */
.inv-cd-alas .countdown-ring::before,.inv-cd-alas .countdown-ring::after{content:"";position:absolute;top:-6%;bottom:-6%;
  width:56%;pointer-events:none;background-repeat:no-repeat;background-size:200% 100%;
  background-image:var(--inv-alas-img,var(--inv-mariposa-img,
    radial-gradient(ellipse 34% 30% at 30% 30%,color-mix(in srgb,var(--inv-accent) 42%,transparent) 0 70%,transparent 72%),
    radial-gradient(ellipse 22% 22% at 36% 72%,color-mix(in srgb,var(--inv-accent) 30%,transparent) 0 70%,transparent 72%),
    radial-gradient(ellipse 34% 30% at 70% 30%,color-mix(in srgb,var(--inv-accent) 42%,transparent) 0 70%,transparent 72%),
    radial-gradient(ellipse 22% 22% at 64% 72%,color-mix(in srgb,var(--inv-accent) 30%,transparent) 0 70%,transparent 72%)));
  opacity:var(--inv-alas-op,.55);animation:invAlaCdIzq 3.4s ease-in-out infinite}
.inv-cd-alas .countdown-ring::before{right:50%;background-position:0 50%;transform-origin:100% 50%}
.inv-cd-alas .countdown-ring::after{left:50%;background-position:100% 50%;transform-origin:0 50%;animation-name:invAlaCdDer}
.inv-cd-alas .countdown-ring:nth-child(2)::before,.inv-cd-alas .countdown-ring:nth-child(2)::after{animation-delay:-.8s}
.inv-cd-alas .countdown-ring:nth-child(3)::before,.inv-cd-alas .countdown-ring:nth-child(3)::after{animation-delay:-1.6s}
.inv-cd-alas .countdown-ring:nth-child(4)::before,.inv-cd-alas .countdown-ring:nth-child(4)::after{animation-delay:-2.4s}
@keyframes invAlaCdIzq{0%,100%{transform:rotateY(0)}50%{transform:rotateY(38deg)}}
@keyframes invAlaCdDer{0%,100%{transform:rotateY(0)}50%{transform:rotateY(-38deg)}}
.inv-cd-alas .countdown-ring:has(.tick)::before{animation:invBateIzq .6s ease-in-out}
.inv-cd-alas .countdown-ring:has(.tick)::after{animation:invBateDer .6s ease-in-out}
@keyframes invBateIzq{50%{transform:rotateY(70deg)}}
@keyframes invBateDer{50%{transform:rotateY(-70deg)}}
.inv-cd-alas .ring-inner{position:relative;z-index:1;text-align:center}
.inv-cd-alas .ring-number{display:block;font-size:clamp(24px,7.2vw,34px);line-height:1;
  text-shadow:0 0 10px var(--inv-surface),0 0 3px var(--inv-surface)}
.inv-cd-alas .ring-label{text-shadow:0 0 6px var(--inv-surface)}
.inv-cd-alas .ring-label{display:block;margin-top:4px;font-size:9px;letter-spacing:.16em;text-transform:uppercase}

/* ── La escarcha: el velo es un vidrio congelado; al tocarlo se agrieta
   desde el dedo y se rompe en pedazos que caen ──
   El hielo es una capa con backdrop-filter —el nombre se ve empañado
   detrás— y un poco de escarcha pintada con degradados. Los pedazos los
   crea el script: copias de la misma capa recortadas en cuñas alrededor
   del punto tocado, así que no hay imagen que preparar. */
#splash.inv-velo-escarcha{cursor:pointer;-webkit-tap-highlight-color:transparent;overflow:hidden}
#splash.inv-velo-escarcha .splash-btns{display:none}
#splash.inv-velo-escarcha .splash-modal{position:relative;z-index:1}
.inv-escarcha{position:absolute;inset:0;z-index:3;pointer-events:none;
  -webkit-backdrop-filter:blur(4px) saturate(1.2);backdrop-filter:blur(4px) saturate(1.2);
  background:
    radial-gradient(120% 70% at 50% 0%,rgba(255,255,255,.34),transparent 60%),
    radial-gradient(60% 40% at 12% 88%,rgba(255,255,255,.4),transparent 70%),
    radial-gradient(50% 36% at 92% 70%,rgba(255,255,255,.3),transparent 70%),
    repeating-linear-gradient(62deg,rgba(255,255,255,.07) 0 2px,transparent 2px 9px),
    repeating-linear-gradient(-58deg,rgba(255,255,255,.05) 0 1px,transparent 1px 13px),
    color-mix(in srgb,var(--inv-accent) 22%,rgba(215,232,248,.35));
  box-shadow:inset 0 0 90px rgba(255,255,255,.45)}
.inv-escarcha.rota{opacity:0}
.inv-grietas{position:absolute;inset:0;z-index:5;width:100%;height:100%;pointer-events:none;overflow:visible}
.inv-grietas path{fill:none;stroke:#fff;stroke-width:1.4;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;
  filter:drop-shadow(0 0 3px rgba(190,225,255,.95));animation:invGrieta .22s ease-out forwards}
@keyframes invGrieta{to{stroke-dashoffset:0}}
.inv-pedazo{position:absolute;inset:0;z-index:4;pointer-events:none;
  transition:transform var(--t,1.1s) cubic-bezier(.5,0,.8,.5),opacity var(--t,1.1s) ease-in}
#splash.inv-velo-escarcha .inv-sobre-pista{z-index:6;color:#fff;text-shadow:0 1px 8px rgba(0,30,70,.6)}
#splash.abriendo .inv-sobre-pista{opacity:0;animation:none}

/* ── Cuenta atrás de cristales ──
   Cada número dentro de un cristal de hielo hexagonal, con facetas y un
   brillo que lo cruza de vez en cuando; al cambiar, el cristal destella.
   El hexágono es un recorte, así que el fondo y el brillo van en capas
   con el mismo recorte. */
.inv-cd-cristales{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:440px;margin-inline:auto}
.inv-cd-cristales .countdown-ring{position:relative;aspect-ratio:.87;display:grid;place-items:center;
  border:0;border-radius:0;padding:0;background:none;box-shadow:none;overflow:visible;
  filter:drop-shadow(0 8px 14px color-mix(in srgb,var(--inv-accent) 35%,transparent))}
.inv-cd-cristales .countdown-ring::before,.inv-cd-cristales .countdown-ring::after{content:"";position:absolute;inset:0;
  clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);pointer-events:none}
.inv-cd-cristales .countdown-ring::before{background:
  linear-gradient(90deg,transparent 49.5%,rgba(255,255,255,.35) 50%,transparent 50.5%),
  linear-gradient(30deg,transparent 49.6%,rgba(255,255,255,.22) 50%,transparent 50.4%),
  linear-gradient(-30deg,transparent 49.6%,rgba(255,255,255,.22) 50%,transparent 50.4%),
  linear-gradient(160deg,rgba(255,255,255,.95),color-mix(in srgb,var(--inv-accent) 14%,rgba(232,243,253,.92)) 45%,
    color-mix(in srgb,var(--inv-accent) 32%,rgba(200,224,248,.92)))}
.inv-cd-cristales .countdown-ring::after{background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.85) 50%,transparent 65%)
  -150% 0/250% 100% no-repeat;animation:invReflejo 5s ease-in-out infinite}
.inv-cd-cristales .countdown-ring:nth-child(2)::after{animation-delay:1.2s}
.inv-cd-cristales .countdown-ring:nth-child(3)::after{animation-delay:2.4s}
.inv-cd-cristales .countdown-ring:nth-child(4)::after{animation-delay:3.6s}
@keyframes invReflejo{0%,60%{background-position:-150% 0}100%{background-position:250% 0}}
.inv-cd-cristales .countdown-ring:has(.tick)::before{animation:invHielaTick .6s ease-out}
@keyframes invHielaTick{0%{filter:brightness(1.6)}100%{filter:none}}
.inv-cd-cristales .ring-inner{position:relative;z-index:1;text-align:center}
.inv-cd-cristales .ring-number{display:block;font-size:clamp(22px,7vw,32px);line-height:1;color:var(--inv-ink);
  text-shadow:0 1px 0 rgba(255,255,255,.7)}
.inv-cd-cristales .ring-label{display:block;margin-top:4px;font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;
  color:color-mix(in srgb,var(--inv-ink) 75%,transparent)}

/* ── El naipe: el velo es un As de corazones; al tocarlo se voltea y cae
   girando por la madriguera ──
   La carta es el propio panel del velo —así el nombre y la fecha son los
   de siempre—, con sus esquinas: A y corazón arriba, A y pica invertidos
   abajo, como un naipe de verdad. El dorso es una capa con la cara vuelta. */
#splash.inv-velo-naipe{cursor:pointer;-webkit-tap-highlight-color:transparent;overflow:hidden;perspective:1200px}
#splash.inv-velo-naipe .splash-btns{display:none}
#splash.inv-velo-naipe .splash-modal{position:relative;z-index:3;width:min(80vw,330px);aspect-ratio:.7;
  display:flex;flex-direction:column;justify-content:center;padding:18% 12%;border-radius:16px;
  background:var(--inv-naipe-fondo,var(--inv-surface));transform-style:preserve-3d;
  box-shadow:0 26px 50px -20px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--inv-ink) 18%,transparent),
    inset 0 0 0 9px var(--inv-naipe-fondo,var(--inv-surface)),inset 0 0 0 10px color-mix(in srgb,var(--inv-ink) 35%,transparent)}
#splash.inv-velo-naipe .splash-modal > *:not(.inv-naipe-dorso){backface-visibility:hidden;-webkit-backface-visibility:hidden}
/* Sin opacidad en la animación: una opacidad menor que 1 aplana el 3D y
   el dorso no llega a verse nunca. */
.inv-naipe-esq{position:absolute;display:flex;flex-direction:column;align-items:center;gap:2px;font-style:normal;
  font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:clamp(34px,10vw,46px);line-height:1;
  color:var(--inv-naipe-tinta,var(--inv-ink))}
.inv-naipe-esq span{font-size:.95em;line-height:.9}
.inv-naipe-arriba{left:7%;top:5%}
.inv-naipe-abajo{right:7%;bottom:5%;transform:rotate(180deg)}
.inv-naipe-dorso{position:absolute;inset:0;border-radius:16px;transform:rotateY(180deg);
  backface-visibility:hidden;-webkit-backface-visibility:hidden;
  background:
    repeating-linear-gradient(45deg,color-mix(in srgb,var(--inv-accent) 85%,#000) 0 6px,var(--inv-accent) 6px 12px),
    var(--inv-accent);
  box-shadow:inset 0 0 0 10px var(--inv-naipe-fondo,var(--inv-surface))}
#splash.abriendo .splash-modal{animation:invNaipeCae 1.7s cubic-bezier(.45,0,.55,1) forwards}
@keyframes invNaipeCae{
  0%{transform:none}
  30%{transform:rotateY(180deg)}
  45%{transform:rotateY(180deg) scale(1.02)}
  100%{transform:rotateY(180deg) rotateZ(900deg) scale(0)}}
#splash.inv-velo-naipe .inv-sobre-pista{z-index:4}

/* ── Cuenta atrás de reloj de bolsillo ──
   Cada unidad es la esfera de un reloj: las doce marcas, la corona arriba
   y una manecilla que gira con lo que le queda al ciclo (--p, el mismo que
   usan los anillos). El número va en la mitad de abajo, como el segundero
   de un reloj antiguo, y la unidad debajo de la esfera. */
.inv-cd-bolsillo{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:440px;margin-inline:auto;padding:14px 0 20px}
.inv-cd-bolsillo .countdown-ring{position:relative;aspect-ratio:1;display:block;border-radius:50%;padding:0;overflow:visible;
  border:0;background:
    repeating-conic-gradient(from -1deg,color-mix(in srgb,var(--inv-accent) 80%,transparent) 0 2deg,transparent 2deg 30deg) center/100% 100%,
    radial-gradient(circle,var(--inv-surface) 0 58%,transparent 59%),
    var(--inv-surface);
  box-shadow:0 0 0 3px var(--inv-accent),0 0 0 5px color-mix(in srgb,var(--inv-accent) 35%,var(--inv-surface)),
    0 10px 18px -10px rgba(0,0,0,.55)}
/* La corona del reloj. */
.inv-cd-bolsillo .countdown-ring::before{content:"";position:absolute;left:50%;top:-11px;width:12px;height:9px;translate:-50% 0;
  border-radius:3px 3px 1px 1px;background:var(--inv-accent)}
/* La manecilla, del centro hacia arriba, girando con el ciclo. */
.inv-cd-bolsillo .countdown-ring::after{content:"";position:absolute;left:50%;top:14%;width:2px;height:36%;margin-left:-1px;
  border-radius:2px;background:var(--inv-accent);transform-origin:50% 100%;
  transform:rotate(calc(var(--p,0) * 1turn));transition:transform .6s cubic-bezier(.4,1.6,.5,1);
  box-shadow:0 0 0 .5px color-mix(in srgb,var(--inv-accent) 40%,transparent)}
.inv-cd-bolsillo .ring-inner{position:absolute;inset:0;display:block;text-align:center}
.inv-cd-bolsillo .ring-inner::before{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;translate:-50% -50%;
  border-radius:50%;background:var(--inv-accent);z-index:1}
.inv-cd-bolsillo .ring-number{position:absolute;left:0;right:0;top:56%;display:block;font-size:clamp(15px,4.6vw,21px);line-height:1;
  color:var(--inv-ink)}
.inv-cd-bolsillo .ring-label{position:absolute;left:-6px;right:-6px;top:calc(100% + 10px);display:block;font-size:9.5px;
  letter-spacing:.16em;text-transform:uppercase;color:color-mix(in srgb,var(--inv-ink) 75%,transparent)}

/* ── El programa como naipes ──
   Cada momento es una carta —A, 2, 3… con su palo, corazones y diamantes
   en rojo— que se reparte desde un lado al asomar y queda apenas ladeada,
   como sobre la mesa del Sombrerero. */
.inv-ev-naipes{display:flex;flex-direction:column;gap:16px;max-width:400px;margin:22px auto 0;padding:0 10px}
.inv-ev-naipes .event-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:34px 54px 30px;text-align:center;border:0;border-radius:14px;background:var(--inv-surface);
  box-shadow:0 14px 26px -16px rgba(0,0,0,.55),inset 0 0 0 1px color-mix(in srgb,var(--inv-ink) 15%,transparent),
    inset 0 0 0 7px var(--inv-surface),inset 0 0 0 8px color-mix(in srgb,var(--inv-ink) 22%,transparent);
  rotate:-1.5deg;--palo-c:var(--inv-naipe-rojo,#a3242f)}
.inv-ev-naipes .event-card:nth-of-type(even){rotate:1.5deg;--palo-c:var(--inv-ink)}
.inv-ev-naipes .event-card:hover{transform:none}
.inv-ev-naipes .event-card::before,.inv-ev-naipes .event-card::after{position:absolute;white-space:pre;text-align:center;
  font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:21px;line-height:1.05;color:var(--palo-c)}
.inv-ev-naipes .event-card::before{left:14px;top:12px}
.inv-ev-naipes .event-card::after{right:14px;bottom:12px;transform:rotate(180deg)}
.inv-ev-naipes .event-card:nth-of-type(1)::before,.inv-ev-naipes .event-card:nth-of-type(1)::after{content:"A\\A\\2665"}
.inv-ev-naipes .event-card:nth-of-type(2)::before,.inv-ev-naipes .event-card:nth-of-type(2)::after{content:"2\\A\\2660"}
.inv-ev-naipes .event-card:nth-of-type(3)::before,.inv-ev-naipes .event-card:nth-of-type(3)::after{content:"3\\A\\2666"}
.inv-ev-naipes .event-card:nth-of-type(4)::before,.inv-ev-naipes .event-card:nth-of-type(4)::after{content:"4\\A\\2663"}
.inv-ev-naipes .event-card:nth-of-type(5)::before,.inv-ev-naipes .event-card:nth-of-type(5)::after{content:"5\\A\\2665"}
.inv-ev-naipes .event-card:nth-of-type(6)::before,.inv-ev-naipes .event-card:nth-of-type(6)::after{content:"6\\A\\2660"}
.inv-ev-naipes .event-card:nth-of-type(7)::before,.inv-ev-naipes .event-card:nth-of-type(7)::after{content:"7\\A\\2666"}
.inv-ev-naipes .event-card:nth-of-type(8)::before,.inv-ev-naipes .event-card:nth-of-type(8)::after{content:"8\\A\\2663"}
.inv-ev-naipes .event-icon{width:auto;height:auto;margin:0 0 4px;background:none;border:0;box-shadow:none;
  color:var(--palo-c);font-size:24px}
.inv-ev-naipes .event-icon svg{width:28px;height:28px}
.inv-ev-naipes :is(.event-type,.event-title,.event-time,.event-place,.event-note){margin:0}
.inv-ev-naipes .event-map-btn{margin-top:10px}
.js .inv-ev-naipes .event-card{opacity:0;translate:60vw -30px;transform:rotate(24deg)}
.js .inv-ev-naipes .event-card:nth-of-type(even){translate:-60vw -30px;transform:rotate(-24deg)}
.js .inv-ev-naipes .event-card.llega{opacity:1;translate:0 0;transform:none;
  transition:opacity .5s ease,translate .8s cubic-bezier(.2,.8,.25,1.05),transform .8s cubic-bezier(.2,.8,.25,1.05)}

/* ── El programa como constelación ──
   Las estrellas van por una franja central, un poco en zigzag, y cada
   momento a un lado y a otro: así la línea que las une nunca pisa texto. */
.inv-ev-constelacion{position:relative;display:block;max-width:440px;margin:24px auto 0}
.inv-traza{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.inv-traza path{fill:none;stroke:var(--inv-accent);stroke-width:1.2;stroke-dasharray:1;
  stroke-dashoffset:var(--inv-traza,1);opacity:.85;
  filter:drop-shadow(0 0 3px color-mix(in srgb,var(--inv-accent) 70%,transparent))}
.inv-ev-constelacion .event-card{position:relative;display:grid;grid-template-columns:1fr 64px 1fr;
  align-items:center;min-height:104px;padding:0;background:none;border:0;box-shadow:none;border-radius:0}
.inv-ev-constelacion .event-card:hover{transform:none}
.inv-luz{grid-column:2;grid-row:1;justify-self:center;width:22px;height:22px;border-radius:50%;
  translate:-14px 0;background:radial-gradient(#fff,color-mix(in srgb,var(--inv-accent) 30%,transparent) 60%,transparent 70%);
  opacity:.25;transform:scale(.6);transition:opacity .7s,transform .7s cubic-bezier(.2,.7,.3,1),box-shadow .7s}
.inv-ev-constelacion .inv-dato{grid-column:3;grid-row:1;text-align:left;
  opacity:0;transform:translateY(12px);transition:opacity .8s ease .15s,transform .8s ease .15s}
.inv-ev-constelacion .event-card:nth-of-type(odd) .inv-dato{grid-column:1;text-align:right}
.inv-ev-constelacion .event-card:nth-of-type(odd) .inv-luz{translate:14px 0}
.inv-ev-constelacion .event-card.encendido .inv-luz{opacity:1;transform:scale(1);
  box-shadow:0 0 18px 6px color-mix(in srgb,var(--inv-accent) 45%,transparent)}
.inv-ev-constelacion .event-card.encendido .inv-dato{opacity:1;transform:none}
.inv-ev-constelacion .event-icon{display:none}
.inv-ev-constelacion :is(.event-type,.event-title,.event-time,.event-place,.event-note){margin:0}
/* Sin JavaScript no hay quien las encienda: se ven todas. */
html:not(.js) .inv-ev-constelacion .inv-dato{opacity:1;transform:none}

/* ── Rasca y descubre ── */
.inv-fe-rasca .feature-card{position:relative;overflow:hidden;min-height:150px;
  user-select:none;-webkit-user-select:none}
.inv-rasca-capa{position:absolute;inset:0;z-index:2;
  touch-action:none;cursor:grab;transition:opacity .8s}
.feature-card.rascada .inv-rasca-capa{opacity:0;pointer-events:none}


/* ── El libro de cuentos ─────────────────────────────────────────
   Como el sobre: el velo se vuelve un libro cerrado y su panel se esconde,
   pero sigue ahí porque su botón es el que el libro pulsa al abrirse. */
#splash.inv-velo-libro .splash-modal{display:none}
.inv-libro{position:relative;z-index:4;width:min(78vw,330px);aspect-ratio:.76;cursor:pointer;
  perspective:1600px;-webkit-tap-highlight-color:transparent;
  animation:invSobreAsoma 1.1s cubic-bezier(.2,.7,.3,1) both}
.inv-libro-pagina{position:absolute;inset:0;border-radius:6px 12px 12px 6px;display:grid;
  place-content:center;gap:6px;text-align:center;padding:24px;
  background:linear-gradient(100deg,color-mix(in srgb,var(--inv-surface) 88%,var(--inv-accent)),
    var(--inv-surface) 18%,#fff);color:var(--inv-ink);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 35%,transparent),
    0 30px 60px -28px rgba(0,0,0,.8)}
.inv-libro-ante{margin:0;font-family:var(--inv-font-ui);font-size:11px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--inv-accent)}
.inv-libro-nombre{margin:0;font-family:var(--inv-font-title);font-size:40px;line-height:1.1}
.inv-libro-tapa{position:absolute;inset:0;z-index:2;transform-origin:left center;
  backface-visibility:hidden;border-radius:6px 12px 12px 6px;overflow:hidden;
  background:var(--inv-libro-img,linear-gradient(135deg,
    color-mix(in srgb,var(--inv-accent) 70%,#000),var(--inv-accent) 45%,
    color-mix(in srgb,var(--inv-accent) 55%,#fff)));
  background-size:cover;background-position:center;
  box-shadow:0 30px 60px -24px rgba(0,0,0,.85);
  transition:transform 1.3s cubic-bezier(.4,.05,.2,1)}
.inv-libro.abre .inv-libro-tapa{transform:rotateY(-158deg)}
.inv-libro-lomo{position:absolute;left:-6px;top:0;bottom:0;width:10px;z-index:3;border-radius:6px 0 0 6px;
  background:linear-gradient(color-mix(in srgb,var(--inv-accent) 60%,#000),var(--inv-accent),
    color-mix(in srgb,var(--inv-accent) 60%,#000))}

/* ── El programa por capítulos ───────────────────────────────────
   Cada momento es una página que se pasa: entra girando desde el lomo. */
.inv-ev-capitulos{display:block;max-width:440px;margin:18px auto 0;perspective:1200px}
.inv-ev-capitulos .event-card{position:relative;display:block;margin:0 0 12px;
  padding:18px 20px 18px 86px;text-align:left;border-radius:4px 12px 12px 4px;
  background:var(--inv-surface);transform-origin:left center;
  box-shadow:0 18px 30px -24px rgba(0,0,0,.6),
    inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 28%,transparent)}
.inv-ev-capitulos .event-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:8px;
  border-radius:4px 0 0 4px;background:linear-gradient(color-mix(in srgb,var(--inv-accent) 60%,#000),
    var(--inv-accent),color-mix(in srgb,var(--inv-accent) 60%,#000))}
/* El número del capítulo, en su propia columna: un «VIII» es tres veces más
   ancho que un «I», y sin ancho fijo se mete debajo del texto. */
.inv-ev-capitulos .event-icon{position:absolute;left:14px;top:50%;translate:0 -50%;width:60px;
  text-align:center;font-family:var(--inv-font-ui);font-weight:600;font-size:24px;
  letter-spacing:.04em;line-height:1;color:var(--inv-accent)}
.inv-ev-capitulos :is(.event-type,.event-title,.event-time,.event-place,.event-note){margin:0}
.js .inv-ev-capitulos .event-card{transform:rotateY(-92deg);opacity:0;
  transition:transform 1s cubic-bezier(.3,.7,.2,1),opacity .7s ease}
.js .inv-ev-capitulos.in .event-card{transform:none;opacity:1}
.js .inv-ev-capitulos.in .event-card:nth-child(2){transition-delay:.18s}
.js .inv-ev-capitulos.in .event-card:nth-child(3){transition-delay:.36s}
.js .inv-ev-capitulos.in .event-card:nth-child(4){transition-delay:.54s}
.js .inv-ev-capitulos.in .event-card:nth-child(5){transition-delay:.72s}
.js .inv-ev-capitulos.in .event-card:nth-child(n+6){transition-delay:.9s}


/* ── El abanico que se abre ──────────────────────────────────────
   Un abanico no aparece: se despliega. La imagen está entera desde el
   principio y lo que crece es una máscara cónica con el eje en el remache,
   abajo, que es por donde gira uno de verdad; a la vez se endereza. */
#splash.inv-velo-abanico .splash-modal{display:none}
.inv-abanico{position:relative;z-index:4;width:min(86vw,380px);text-align:center;cursor:pointer;
  -webkit-tap-highlight-color:transparent;animation:invSobreAsoma 1.1s cubic-bezier(.2,.7,.3,1) both}
.inv-abanico-hoja{width:100%;transform-origin:50% 96%;transform:rotate(var(--inv-ab-r,-74deg));
  background:var(--inv-abanico-img) center/contain no-repeat;aspect-ratio:1.72;
  -webkit-mask-image:conic-gradient(from 268deg at 50% 96%,#000 var(--inv-ab-a,30deg),transparent 0);
          mask-image:conic-gradient(from 268deg at 50% 96%,#000 var(--inv-ab-a,30deg),transparent 0);
  filter:drop-shadow(0 18px 30px rgba(0,0,0,.45))}
/* Sin imagen de abanico no hay nada que desplegar: en ese caso el velo se
   abre con un toque y se dice con la pista, en vez de enseñar un hueco. */
.inv-abanico:not([data-con-imagen]) .inv-abanico-hoja{display:none}
.inv-abanico-texto{margin-top:8px;opacity:0;transition:opacity .8s ease .5s}
.inv-abanico.abierto .inv-abanico-texto{opacity:1}
.inv-abanico-ante{margin:0;font-family:var(--inv-font-ui);font-size:11px;letter-spacing:.34em;
  text-transform:uppercase;color:var(--inv-accent)}
.inv-abanico-nombre{margin:0;font-family:var(--inv-font-title);font-size:44px;line-height:1.15;
  color:var(--inv-ink)}


/* ── El cielo que se abre ────────────────────────────────────────
   El velo es el cielo cerrado: dos nubes tapan la invitación y al tocar se
   van cada una por su lado. La nube la pone el diseño en --inv-nube-img;
   sin ella no hay nubes y el velo se abre con un toque, sin más. */
#splash.inv-velo-nubes{cursor:pointer;-webkit-tap-highlight-color:transparent}
#splash.inv-velo-nubes .splash-btns{display:none}
.inv-nube{position:absolute;z-index:1;width:min(150vw,1100px);aspect-ratio:1.95;pointer-events:none;
  background:var(--inv-nube-img) center/contain no-repeat;
  transition:transform 1.5s cubic-bezier(.5,0,.2,1),opacity 1.4s ease}
.inv-nube-izq{left:-42%;top:4%}
.inv-nube-der{right:-42%;bottom:2%;transform:scaleX(-1)}
#splash.abriendo .inv-nube-izq{transform:translate(-70%,-18%)}
#splash.abriendo .inv-nube-der{transform:scaleX(-1) translate(-70%,18%)}
/* Sólo en las nubes: sin el .inv-velo-nubes delante escondía el nombre en
   todas las aperturas —el telón, los anillos, la ventana— justo cuando
   tenía que verse. */
#splash.inv-velo-nubes.abriendo .splash-modal{opacity:0;transform:scale(1.06);
  transition:opacity .8s ease,transform 1s ease}


/* ── La galería en carrusel ──────────────────────────────────────
   Una foto grande a la vez, con enganche: el dedo la suelta y la foto se
   queda centrada. Los puntos los pone el script, que es quien sabe cuántas
   fotos hay — el marcado se escribe sin saberlo. */
.inv-ga-carrusel{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;
  padding:4px 0 10px;margin-inline:calc(50% - 50vw);padding-inline:max(22px,calc(50vw - 50%));
  scrollbar-width:none;-webkit-overflow-scrolling:touch}
.inv-ga-carrusel::-webkit-scrollbar{display:none}
.inv-ga-carrusel .gallery-item{flex:0 0 78%;scroll-snap-align:center;aspect-ratio:3/4;
  border-radius:var(--inv-radius,18px);overflow:hidden;
  box-shadow:0 18px 34px -24px rgba(0,0,0,.55)}
.inv-ga-carrusel .gallery-ph{width:100%;height:100%}
.inv-puntos{display:flex;justify-content:center;gap:7px;margin-top:10px}
.inv-puntos i{width:7px;height:7px;border-radius:50%;
  background:color-mix(in srgb,var(--inv-accent) 30%,transparent);transition:all .3s}
.inv-puntos i.act{background:var(--inv-accent);width:20px;border-radius:99px}


/* ── El telón ────────────────────────────────────────────────────
   Dos cortinas de terciopelo y un galón arriba, y ninguna imagen: el
   terciopelo son franjas de luz y sombra sobre el color de acento, así que
   el telón de un diseño rojo es rojo y el de uno azul es azul.

   Las clases dicen «telón» y no «cortina» a propósito: .inv-cortina ya es
   la cortina de vídeo de apertura, y su script buscaba el vídeo dentro de
   esto y reventaba —y como todos los scripts van en un mismo bloque, se
   llevaba por delante a los demás—. */
#splash.inv-velo-telon{cursor:pointer;-webkit-tap-highlight-color:transparent;overflow:hidden}
#splash.inv-velo-telon .splash-btns{display:none}
.inv-telon{position:absolute;top:0;bottom:0;width:52%;z-index:1;pointer-events:none;
  background:
    repeating-linear-gradient(90deg,rgba(0,0,0,.42) 0 6px,rgba(255,255,255,.07) 26px,rgba(0,0,0,.3) 52px),
    linear-gradient(90deg,color-mix(in srgb,var(--inv-accent) 72%,#000),var(--inv-accent) 45%,
      color-mix(in srgb,var(--inv-accent) 80%,#000));
  box-shadow:inset 0 0 60px rgba(0,0,0,.55);
  transition:transform 1.6s cubic-bezier(.5,0,.2,1)}
.inv-telon-izq{left:0;border-right:3px solid color-mix(in srgb,var(--inv-accent) 55%,#000)}
.inv-telon-der{right:0;border-left:3px solid color-mix(in srgb,var(--inv-accent) 55%,#000);
  background:
    repeating-linear-gradient(270deg,rgba(0,0,0,.42) 0 6px,rgba(255,255,255,.07) 26px,rgba(0,0,0,.3) 52px),
    linear-gradient(270deg,color-mix(in srgb,var(--inv-accent) 72%,#000),var(--inv-accent) 45%,
      color-mix(in srgb,var(--inv-accent) 80%,#000))}
.inv-telon-galon{position:absolute;top:0;left:0;right:0;height:46px;z-index:2;pointer-events:none;
  background:linear-gradient(color-mix(in srgb,var(--inv-accent) 35%,#fff),var(--inv-accent));
  box-shadow:0 6px 16px rgba(0,0,0,.45);transition:transform 1.2s ease}
#splash.abriendo .inv-telon-izq{transform:translateX(-101%)}
#splash.abriendo .inv-telon-der{transform:translateX(101%)}
#splash.abriendo .inv-telon-galon{transform:translateY(-100%)}
#splash.inv-velo-telon .splash-modal{position:relative;z-index:3}

/* ── Los anillos: se tocan, se unen y el velo se levanta ──────
   Dibujados con dos bordes y no con una imagen, para que sirvan en
   cualquier diseño sin pedirle nada. */
#splash.inv-velo-anillos{cursor:pointer;-webkit-tap-highlight-color:transparent;overflow:hidden;
  transition:transform 1.3s cubic-bezier(.6,0,.25,1) .9s,opacity 1s ease 1s}
#splash.inv-velo-anillos .splash-btns{display:none}
#splash.inv-velo-anillos .splash-modal{position:relative;z-index:3}
.inv-aros{position:absolute;top:17%;left:50%;width:0;height:0;z-index:4;pointer-events:none}
.inv-aros i{position:absolute;top:0;left:0;width:clamp(62px,18vw,84px);aspect-ratio:1;border-radius:50%;
  translate:-50% -50%;
  border:3px solid var(--inv-accent);
  box-shadow:0 0 20px -5px var(--inv-accent),inset 0 0 12px -6px var(--inv-accent);
  transition:transform 1s cubic-bezier(.45,0,.2,1)}
.inv-aro-izq{transform:translateX(-58%) rotate(-6deg)}
.inv-aro-der{transform:translateX(58%) rotate(6deg)}
#splash.abriendo .inv-aro-izq{transform:translateX(-24%) rotate(-16deg)}
#splash.abriendo .inv-aro-der{transform:translateX(24%) rotate(16deg)}
/* El destello del momento en que se juntan. */
.inv-aros::after{content:"";position:absolute;top:0;left:0;width:12px;height:12px;border-radius:50%;
  translate:-50% -50%;background:#fff;opacity:0;
  box-shadow:0 0 34px 14px color-mix(in srgb,var(--inv-accent) 70%,transparent)}
#splash.abriendo .inv-aros::after{animation:invDestello .9s ease .72s both}
@keyframes invDestello{0%{opacity:0;transform:scale(.3)}
  38%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.6)}}
#splash.inv-velo-anillos.abriendo{transform:translateY(-102%);opacity:0}

/* ── Galería y foto «papel rasgado» ──
   La foto sin marco ni esquinas, rota a mano por los cuatro lados: debajo
   se ve el papel del diseño, que es lo que hace el efecto. La máscara se
   reparte por posición, así que tres fotos seguidas se rompen distinto.
   El recorte se lleva la sombra por delante —una máscara recorta todo lo
   pintado, sombra incluida—, y por eso estas fotos no llevan. */
:root{--inv-rasgado-1:${rasgado(7)};
  --inv-rasgado-2:${rasgado(19)};
  --inv-rasgado-3:${rasgado(42)}}
.inv-ga-rasgada{display:flex;flex-direction:column;gap:30px;margin-top:26px}
.inv-ga-rasgada .gallery-item,.inv-foto-rasgada .gallery-item{width:100%;border:0;border-radius:0;padding:0;
  background:none;box-shadow:none;overflow:hidden;
  -webkit-mask:var(--inv-rasgado-1) center/100% 100% no-repeat;mask:var(--inv-rasgado-1) center/100% 100% no-repeat}
.inv-ga-rasgada .gallery-item{aspect-ratio:4/5}
.inv-ga-rasgada .gallery-item:nth-child(3n+2){-webkit-mask-image:var(--inv-rasgado-2);mask-image:var(--inv-rasgado-2)}
.inv-ga-rasgada .gallery-item:nth-child(3n+3){-webkit-mask-image:var(--inv-rasgado-3);mask-image:var(--inv-rasgado-3)}
.inv-ga-rasgada .gallery-ph,.inv-foto-rasgada .gallery-ph{width:100%;height:100%}
.inv-foto-rasgada .gallery-item{max-width:360px;margin:26px auto 0;aspect-ratio:3/4}

/* ── Párrafo «cita» ──
   Una frase en su tarjeta y la firma debajo, dentro. El antetítulo hace de
   firma: es el único campo suelto que tiene el bloque de párrafo, y una
   cita sin quién la dijo no es una cita. */
.inv-pa-cita{position:relative;max-width:480px;margin:26px auto 0;padding:36px 30px 28px;text-align:center;
  border-radius:var(--inv-radius);background:var(--inv-surface);
  box-shadow:0 18px 34px -28px rgba(0,0,0,.5),inset 0 0 0 1px color-mix(in srgb,var(--inv-accent) 16%,transparent)}
.inv-pa-cita::before{content:"“";position:absolute;top:6px;left:20px;font-size:58px;line-height:1;
  color:var(--inv-accent);opacity:.26}
.inv-cita-texto{margin:0;font-style:italic}
.inv-cita-firma{display:block;margin-top:16px;opacity:.9}

@media (prefers-reduced-motion:reduce){
  .inv-sobre,.inv-sobre-sello,.inv-sobre-pista,.inv-deseo-pista,
  .inv-cd-orbitas .countdown-ring::after{animation:none}
  .inv-cielo{display:none}
  .inv-libro-tapa{transition:none}
  .inv-abanico-hoja{transform:none;-webkit-mask-image:none;mask-image:none}
  .inv-nube,.inv-cortina,.inv-telon-galon{transition:none}
  .inv-aros i,#splash.inv-velo-anillos{transition:none}
  .inv-aros::after{animation:none}
  .inv-abanico-texto{opacity:1}
  .js .inv-ev-capitulos .event-card{transform:none;opacity:1;transition:none}
  .inv-ev-constelacion .inv-dato,.inv-luz{opacity:1;transform:none;transition:none}
  .inv-sobre-carta,.inv-sobre-solapa,.inv-fe-voltea .inv-cara{transition:none}
  .inv-cd-paletas .ring-number.tick{animation:none}
  .inv-cd-luciernagas .countdown-ring::before,.inv-cd-luciernagas .countdown-ring::after,
  .inv-cd-luciernagas .ring-number.tick,.inv-luciernaga{animation:none}
  .inv-ev-sendero .inv-dato,.inv-parada{transition:none}
  .inv-viajero,.inv-hito{transition:none}
  .inv-postigo,.inv-claqueta-palo{transition:none}
  .inv-pedazo,.inv-grietas path{transition:none;animation:none}
  #splash.abriendo .splash-modal{animation:none}
  .inv-cd-bolsillo .countdown-ring::after{transition:none}
  .js .inv-ev-naipes .event-card{opacity:1;translate:none;transform:none}
  .inv-cd-cristales .countdown-ring::after{animation:none}
  .inv-mariposa,.inv-ala,.inv-cd-alas .countdown-ring::before,.inv-cd-alas .countdown-ring::after{animation:none}
  .inv-jardin{animation:none}
  .inv-jardin-der{transform:scaleX(-1)}
  #splash.inv-velo-jardin.abriendo{transition:none}
  #splash.inv-velo-claqueta.abriendo,.inv-claqueta::after,.inv-cd-marquesina .countdown-ring::before,
  .inv-cd-marquesina .countdown-ring::after{animation:none}
  .js .inv-ev-cinta .event-card,.js .inv-ev-postales .event-card{opacity:1;translate:none;animation:none}
  .inv-polvo,.inv-confeti{display:none}
}`;

/* ────────────────────────────────────────────────────────────────
   JavaScript
   ──────────────────────────────────────────────────────────────── */

/**
 * El confeti. Lo usan el sobre, «Agendar» y el botón de confirmar por
 * WhatsApp. Los colores salen de la paleta en el momento, así que un
 * confeti en una invitación rosa es rosa.
 */
export const CONFETI_JS = `
(function(){
  if (window.invEstallar) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv, cx, piezas = [], corriendo = false, dpr = Math.min(2, window.devicePixelRatio || 1);
  function colores(){
    var s = getComputedStyle(document.documentElement), out = [];
    ['--brand-2','--accent','--brand','--inv-accent'].forEach(function(v){
      var c = s.getPropertyValue(v).trim(); if (c) out.push(c);
    });
    out.push('#fff4cf');
    return out;
  }
  function tam(){ cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
  function cuadro(){
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = piezas.length - 1; i >= 0; i--) {
      var p = piezas[i];
      p.vy += p.g; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vida -= .006;
      if (p.vida <= 0 || p.y > innerHeight + 40) { piezas.splice(i, 1); continue; }
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
      cx.globalAlpha = Math.min(1, p.vida * 1.6); cx.fillStyle = p.c;
      if (p.estrella) {
        cx.beginPath();
        for (var k = 0; k < 8; k++) { var r = k % 2 ? p.w * .28 : p.w * .8, a = k * Math.PI / 4; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        cx.closePath(); cx.fill();
      } else cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (.4 + Math.abs(Math.sin(p.rot))));
      cx.restore();
    }
    if (piezas.length) requestAnimationFrame(cuadro); else { corriendo = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  window.invEstallar = function(x, y, n){
    if (quieto) return;
    if (!cv) {
      cv = document.createElement('canvas'); cv.className = 'inv-confeti'; cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv); cx = cv.getContext('2d'); tam(); addEventListener('resize', tam);
    }
    var cs = colores();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 7;
      piezas.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, g: .16 + Math.random() * .1,
        w: 4 + Math.random() * 6, h: 2 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .4,
        c: cs[i % cs.length], vida: 1, estrella: Math.random() < .25 });
    }
    if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); }
  };
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-inv-wa]');
    if (!b) return;
    var r = b.getBoundingClientRect(); window.invEstallar(r.left + r.width / 2, r.top, 110);
  });
})();`;

/** El sobre: tocar el sello, abrir, y dejar pasar. */
export const SOBRE_JS = `
(function(){
  var sobre = document.querySelector('[data-inv-sobre]');
  if (!sobre) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function abrir(){
    if (sobre.classList.contains('abre')) return;
    sobre.classList.add('abre');
    var r = sobre.getBoundingClientRect();
    setTimeout(function(){ if (window.invEstallar) window.invEstallar(r.left + r.width / 2, r.top + r.height * .4, 90); }, 420);
    setTimeout(function(){
      /* El botón del velo, y no enterSite a secas: ese botón es el que
         arranca la música y la cortina, si las hay. */
      var b = document.querySelector('#splash .splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1500);
  }
  sobre.addEventListener('click', abrir);
  sobre.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });
})();`;

/** Las fichas que se voltean. */
export const VOLTEA_JS = `
(function(){
  function girar(c){ c.classList.toggle('vuelta'); c.setAttribute('aria-pressed', c.classList.contains('vuelta')); }
  document.addEventListener('click', function(e){
    var c = e.target.closest && e.target.closest('.inv-fe-voltea .feature-card');
    if (c && !e.target.closest('a')) girar(c);
  });
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var c = e.target.closest && e.target.closest('.inv-fe-voltea .feature-card');
    if (c) { e.preventDefault(); girar(c); }
  });
})();`;

/**
 * Agendar: arma un .ics con lo que trae el botón en sus atributos.
 * iOS y Android lo abren con su calendario; en un ordenador se descarga.
 */
export const AGENDAR_JS = `
(function(){
  function f(d){ return d.toISOString().replace(/[-:]/g, '').replace(/\\.\\d{3}/, ''); }
  function limpio(s){ return String(s || '').replace(/[\\r\\n]+/g, ' ').replace(/([,;])/g, '\\\\$1'); }
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-inv-agendar]');
    if (!b) return;
    e.preventDefault();
    var ini = new Date(b.getAttribute('data-inicio'));
    if (isNaN(ini)) return;
    var fin = new Date(ini.getTime() + 5 * 36e5);
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//tuinvitacion//ES', 'BEGIN:VEVENT',
      'UID:' + ini.getTime() + '@tuinvitacion', 'DTSTAMP:' + f(new Date()),
      'DTSTART:' + f(ini), 'DTEND:' + f(fin),
      'SUMMARY:' + limpio(b.getAttribute('data-titulo')),
      'LOCATION:' + limpio(b.getAttribute('data-lugar')),
      'END:VEVENT', 'END:VCALENDAR'].join('\\r\\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'invitacion.ics'; document.body.appendChild(a); a.click(); a.remove();
    var r = b.getBoundingClientRect();
    if (window.invEstallar) window.invEstallar(r.left + r.width / 2, r.top, 40);
  });
})();`;

/** El polvo de oro: motas que suben despacio y se apartan del dedo. */
export const POLVO_JS = `
(function(){
  var capa = document.querySelector('.inv-polvo');
  if (!capa || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  capa.appendChild(cv);
  var cx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
  var leer = function(a){ return capa.getAttribute(a); };
  var n = Math.max(10, Math.min(120, +leer('data-n') || 60));
  var color = leer('data-color') ||
    getComputedStyle(document.documentElement).getPropertyValue('--brand-2').trim() || '#f3dc9a';
  var op = +leer('data-op') || .8, lento = leer('data-ritmo');
  var vel = lento === 'lento' ? .5 : lento === 'rapido' ? 1.8 : 1;
  var escala = (+leer('data-tam') || 20) / 20;
  var motas = [], p = { x: -999, y: -999 };
  function tam(){ cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
  tam(); addEventListener('resize', tam);
  for (var i = 0; i < n; i++) motas.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: (.6 + Math.random() * 1.9) * escala, v: (.12 + Math.random() * .35) * vel, f: Math.random() * 6.28, vx: 0, vy: 0 });
  addEventListener('pointermove', function(e){ p.x = e.clientX; p.y = e.clientY; }, { passive: true });
  addEventListener('touchend', function(){ p.x = p.y = -999; });
  (function cuadro(){
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
    cx.fillStyle = color; cx.shadowColor = color; cx.shadowBlur = 6;
    for (var i = 0; i < motas.length; i++) {
      var m = motas[i], dx = m.x - p.x, dy = m.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 < 8100) { var fu = (8100 - d2) / 8100 * .9, d = Math.sqrt(d2) || 1; m.vx += dx / d * fu; m.vy += dy / d * fu; }
      m.vx *= .92; m.vy *= .92; m.f += .02;
      m.y -= m.v - m.vy; m.x += Math.sin(m.f) * .3 + m.vx;
      if (m.y < -10) { m.y = innerHeight + 10; m.x = Math.random() * innerWidth; }
      if (m.x < -10) m.x = innerWidth + 10; else if (m.x > innerWidth + 10) m.x = -10;
      cx.globalAlpha = op * (.45 + Math.sin(m.f * 2) * .35);
      cx.beginPath(); cx.arc(m.x, m.y, m.r, 0, 6.283); cx.fill();
    }
    requestAnimationFrame(cuadro);
  })();
})();`;

/**
 * La estrella fugaz: cruza en diagonal y acaba donde se pide. La usan el
 * velo «pide un deseo» y el cielo estrellado.
 */
export const FUGAZ_JS = `
(function(){
  if (window.invFugaz) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.invFugaz = function(xf, yf, luego){
    if (quieto) { if (luego) luego(); return; }
    var el = document.createElement('i'); el.className = 'inv-fugaz'; document.body.appendChild(el);
    var dx = 240 + Math.random() * 120, dy = -(140 + Math.random() * 70);
    var ang = Math.atan2(-dy, -dx) * 180 / Math.PI, t0 = performance.now(), dur = 850;
    (function paso(t){
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.style.opacity = k < .8 ? 1 : (1 - k) / .2;
      el.style.transform = 'translate(' + (xf + dx * (1 - e)) + 'px,' + (yf + dy * (1 - e)) + 'px) rotate(' + ang + 'deg)';
      if (k < 1) requestAnimationFrame(paso);
      else { el.remove(); if (window.invEstallar) window.invEstallar(xf, yf, 22); if (luego) luego(); }
    })(t0);
  };
})();`;

/** Pide un deseo: tocar el velo suelta una estrella fugaz y entra. */
export const DESEO_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-deseo');
  if (!velo) return;
  var hecho = false;
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    var x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
    (window.invFugaz || function(a, b, f){ f(); })(x, y, function(){
      setTimeout(function(){
        var b = velo.querySelector('.splash-btn-primary');
        if (b) b.click(); else if (window.enterSite) window.enterSite();
      }, 300);
    });
  });
})();`;

/**
 * El cielo estrellado: estrellas que titilan y se mueven un poco con el
 * giro del teléfono o el ratón, estrellas fugaces de vez en cuando, y una
 * donde se toque (fuera de botones y enlaces).
 */
export const CIELO_JS = `
(function(){
  var capa = document.querySelector('.inv-cielo');
  if (!capa || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  capa.appendChild(cv);
  var cx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
  var leer = function(a){ return capa.getAttribute(a); };
  var n = Math.max(40, Math.min(260, +leer('data-n') || 160));
  var op = +leer('data-op') || .9, escala = (+leer('data-tam') || 20) / 20;
  var color = leer('data-color') || '#ffffff';
  var ritmo = leer('data-ritmo'), cada = ritmo === 'lento' ? 16000 : ritmo === 'rapido' ? 5000 : 9000;
  var est = [], g = { x: 0, y: 0 }, o = { x: 0, y: 0 };
  function tam(){ cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
  tam(); addEventListener('resize', tam);
  for (var i = 0; i < n; i++) est.push({ x: Math.random(), y: Math.random(),
    r: (Math.random() < .08 ? 1.5 + Math.random() : .4 + Math.random() * .9) * escala,
    f: Math.random() * 6.28, v: .01 + Math.random() * .03, p: .3 + Math.random() * .7, azul: Math.random() < .3 });
  addEventListener('pointermove', function(e){ o.x = e.clientX / innerWidth - .5; o.y = e.clientY / innerHeight - .5; }, { passive: true });
  addEventListener('deviceorientation', function(e){ if (e.gamma == null) return;
    o.x = Math.max(-.5, Math.min(.5, e.gamma / 60)); o.y = Math.max(-.5, Math.min(.5, (e.beta - 40) / 60)); });
  (function cuadro(){
    g.x += (o.x - g.x) * .05; g.y += (o.y - g.y) * .05;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = 0; i < est.length; i++) {
      var s = est[i]; s.f += s.v;
      var x = s.x * innerWidth - g.x * 30 * s.p, y = s.y * innerHeight - g.y * 30 * s.p;
      var a = Math.max(.05, .6 + Math.sin(s.f) * .35) * op;
      cx.globalAlpha = a; cx.fillStyle = s.azul ? '#bccbff' : color;
      cx.beginPath(); cx.arc(x, y, s.r, 0, 6.283); cx.fill();
      if (s.r > 1.4) { cx.globalAlpha = a * .35; cx.fillRect(x - s.r * 3, y - .4, s.r * 6, .8); cx.fillRect(x - .4, y - s.r * 3, .8, s.r * 6); }
    }
    requestAnimationFrame(cuadro);
  })();
  function abierta(){ var v = document.getElementById('splash'); return !v || v.classList.contains('hidden'); }
  setInterval(function(){ if (!document.hidden && abierta() && window.invFugaz)
    window.invFugaz(innerWidth * (.2 + Math.random() * .6), innerHeight * (.15 + Math.random() * .3)); }, cada);
  document.addEventListener('click', function(e){
    if (!abierta() || !window.invFugaz) return;
    if (e.target.closest('a,button,input,textarea,select,label,form,.feature-card,iframe,video')) return;
    window.invFugaz(e.clientX, e.clientY);
  });
})();`;

/** La constelación del programa: la línea se traza al bajar. */
export const CONSTELACION_JS = `
(function(){
  var mapas = [].slice.call(document.querySelectorAll('.inv-ev-constelacion'));
  if (!mapas.length) return;
  function trazar(){
    mapas.forEach(function(m){
      var path = m.querySelector('.inv-traza path'); if (!path) return;
      var b = m.getBoundingClientRect(), d = '';
      [].slice.call(m.querySelectorAll('.event-card .inv-luz')).forEach(function(l, i){
        var r = l.getBoundingClientRect();
        d += (i ? ' L' : 'M') + (r.left + r.width / 2 - b.left).toFixed(1) + ' ' + (r.top + r.height / 2 - b.top).toFixed(1);
      });
      path.setAttribute('d', d);
    });
  }
  function bajar(){
    var mitad = innerHeight * .65;
    mapas.forEach(function(m){
      var b = m.getBoundingClientRect(), p = Math.max(0, Math.min(1, (mitad - b.top) / (b.height || 1)));
      m.style.setProperty('--inv-traza', (1 - p).toFixed(3));
      [].slice.call(m.querySelectorAll('.event-card')).forEach(function(c){
        if (c.getBoundingClientRect().top + 30 < mitad) c.classList.add('encendido');
      });
    });
  }
  trazar(); bajar();
  addEventListener('resize', function(){ trazar(); bajar(); });
  addEventListener('scroll', bajar, { passive: true });
  /* Las letras cambian la altura de cada momento al cargar: se vuelve a trazar. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(trazar);
  setTimeout(trazar, 1200);
})();`;

/**
 * El sendero: traza el camino por el centro de cada ícono, curvándose a un
 * lado y a otro entre parada y parada, lo pone también como recorrido de la
 * luciérnaga, y al bajar avanza la luz y enciende cada momento.
 */
export const SENDERO_JS = `
(function(){
  var sendas = [].slice.call(document.querySelectorAll('.inv-ev-sendero'));
  if (!sendas.length) return;
  function trazar(){
    sendas.forEach(function(m){
      var b = m.getBoundingClientRect();
      if (!b.width) return;
      var pts = [].slice.call(m.querySelectorAll('.event-card .inv-parada')).map(function(l){
        var r = l.getBoundingClientRect();
        return [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top];
      });
      if (!pts.length) return;
      var cx = b.width / 2, previo = [cx, 0], d = 'M' + cx.toFixed(1) + ' 0';
      var vaiven = Math.min(46, b.width * .11);
      pts.concat([[cx, b.height]]).forEach(function(p, i){
        var my = (previo[1] + p[1]) / 2, w = (i % 2 ? 1 : -1) * vaiven;
        d += ' C' + (previo[0] + w).toFixed(1) + ' ' + my.toFixed(1) + ' ' + (p[0] + w).toFixed(1) + ' ' +
          my.toFixed(1) + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
        previo = p;
      });
      [].slice.call(m.querySelectorAll('.inv-senda path')).forEach(function(x){ x.setAttribute('d', d); });
      var luz = m.querySelector('.inv-luciernaga');
      if (luz) luz.style.offsetPath = 'path("' + d + '")';
      m.classList.add('trazado');
    });
  }
  function bajar(){
    var mitad = innerHeight * .62;
    sendas.forEach(function(m){
      var b = m.getBoundingClientRect(), p = Math.max(0, Math.min(1, (mitad - b.top) / (b.height || 1)));
      m.style.setProperty('--inv-senda', p.toFixed(3));
      [].slice.call(m.querySelectorAll('.event-card')).forEach(function(c){
        var ic = c.querySelector('.inv-parada') || c;
        if (ic.getBoundingClientRect().top + 10 < mitad) c.classList.add('encendido');
      });
    });
  }
  trazar(); bajar();
  addEventListener('resize', function(){ trazar(); bajar(); });
  addEventListener('scroll', bajar, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(trazar);
  setTimeout(trazar, 1200);
})();`;

/** El viaje: el viajero baja por el hilo al ritmo del scroll y marca las paradas que pasa. */
export const VIAJE_JS = `
(function(){
  var viajes = [].slice.call(document.querySelectorAll('.inv-ev-viaje'));
  if (!viajes.length) return;
  function bajar(){
    var mitad = innerHeight * .62;
    viajes.forEach(function(v){
      var b = v.getBoundingClientRect(), p = Math.max(0, Math.min(1, (mitad - b.top) / (b.height || 1)));
      var g = v.querySelector('.inv-viajero');
      if (g) g.style.top = (b.height * p - g.offsetHeight / 2).toFixed(0) + 'px';
      [].slice.call(v.querySelectorAll('.event-card')).forEach(function(c){
        if (c.getBoundingClientRect().top + 24 < mitad) c.classList.add('pasada');
      });
    });
  }
  addEventListener('scroll', bajar, { passive: true });
  addEventListener('resize', bajar);
  bajar();
})();`;

/** La ventana: se toca, los postigos se abren y entra la invitación. */
export const VENTANA_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-ventana');
  if (!velo) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hecho = false;
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    velo.classList.add('abriendo');
    setTimeout(function(){
      var b = velo.querySelector('.splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1300);
  });
})();`;

/** La claqueta: el palo cae, destello, y corte a la invitación. */
export const CLAQUETA_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-claqueta');
  if (!velo) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hecho = false;
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    velo.classList.add('abriendo');
    if (window.invEstallar) setTimeout(function(){ window.invEstallar(innerWidth / 2, innerHeight * .2, 50); }, quieto ? 0 : 230);
    setTimeout(function(){
      var b = velo.querySelector('.splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1650);
  });
})();`;

/**
 * La cinta y las postales: cada fotograma se proyecta y cada postal llega
 * cuando asoma. Uno por uno, no la lista entera, para que se vea pasar.
 */
export const LLEGAN_JS = `
(function(){
  var fichas = [].slice.call(document.querySelectorAll('.inv-ev-cinta .event-card,.inv-ev-postales .event-card,.inv-ev-naipes .event-card'));
  if (!fichas.length) return;
  function marca(el){ el.classList.add(el.closest('.inv-ev-cinta') ? 'proyectada' : 'llega'); }
  if (!window.IntersectionObserver) { fichas.forEach(marca); return; }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting) { marca(e.target); io.unobserve(e.target); } });
  }, { threshold: .3 });
  fichas.forEach(function(f){ io.observe(f); });
})();`;

/** La mariposa: se toca, bate las alas deprisa y sale volando; detrás, la invitación. */
export const MARIPOSA_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-mariposa,#splash.inv-velo-jardin');
  if (!velo) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hecho = false;
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    velo.classList.add('abriendo');
    if (window.invEstallar) setTimeout(function(){ window.invEstallar(innerWidth / 2, innerHeight * .22, 46); }, quieto ? 0 : 250);
    setTimeout(function(){
      var b = velo.querySelector('.splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1500);
  });
})();`;

/**
 * La escarcha: se toca y el hielo se agrieta desde el dedo; luego se rompe
 * en cuñas que caen. Los pedazos son copias de la capa de hielo recortadas
 * con clip-path, así que se ven exactamente como el hielo que había.
 */
export const ESCARCHA_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-escarcha');
  if (!velo) return;
  var hielo = velo.querySelector('.inv-escarcha');
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hecho = false;
  function entrar(){
    var b = velo.querySelector('.splash-btn-primary');
    if (b) b.click(); else if (window.enterSite) window.enterSite();
  }
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    velo.classList.add('abriendo');
    if (quieto || !hielo) { entrar(); return; }
    var r = velo.getBoundingClientRect();
    var x = (e.clientX || r.width / 2) - r.left, y = (e.clientY || r.height / 2) - r.top;
    var R = Math.hypot(r.width, r.height) * 1.2, n = 11, angs = [], i;
    var base = Math.random() * 6.283;
    for (i = 0; i < n; i++) angs.push(base + (i + Math.random() * .6) * 6.283 / n);
    var medio = angs.map(function(){ return R * (.12 + Math.random() * .16); });
    var pt = function(a, d){ return [x + Math.cos(a) * d, y + Math.sin(a) * d]; };
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'inv-grietas');
    angs.forEach(function(a, k){
      var p1 = pt(a, medio[k]), p2 = pt(a + (Math.random() - .5) * .25, R);
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('pathLength', '1');
      path.setAttribute('d', 'M' + x + ' ' + y + ' L' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' L' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1));
      svg.appendChild(path);
    });
    velo.appendChild(svg);
    setTimeout(function(){
      var poli = function(ps){ return 'polygon(' + ps.map(function(p){ return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(',') + ')'; };
      angs.forEach(function(a, k){
        var b2 = angs[(k + 1) % n] + (k === n - 1 ? 6.283 : 0);
        var m1 = medio[k], m2 = medio[(k + 1) % n];
        [[[x, y], pt(a, m1), pt(b2, m2)], [pt(a, m1), pt(a, R), pt(b2, R), pt(b2, m2)]].forEach(function(ps, capa){
          var p = hielo.cloneNode(false);
          p.className = 'inv-escarcha inv-pedazo';
          p.style.clipPath = p.style.webkitClipPath = poli(ps);
          var mid = (a + b2) / 2, lejos = capa ? 160 : 70;
          p.style.setProperty('--t', (0.9 + Math.random() * .6).toFixed(2) + 's');
          velo.appendChild(p);
          requestAnimationFrame(function(){ requestAnimationFrame(function(){
            p.style.transform = 'translate(' + (Math.cos(mid) * lejos).toFixed(0) + 'px,' +
              (Math.sin(mid) * lejos + r.height * .9).toFixed(0) + 'px) rotate(' + ((Math.random() - .5) * 60).toFixed(0) + 'deg)';
            p.style.opacity = '0';
          }); });
        });
      });
      hielo.classList.add('rota');
      svg.remove();
      if (window.invEstallar) window.invEstallar(x + r.left, y + r.top, 40);
    }, 260);
    setTimeout(entrar, 1700);
  });
})();`;

/** El naipe: se toca, la carta se voltea y cae girando; detrás, la invitación. */
export const NAIPE_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-naipe');
  if (!velo) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hecho = false;
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    velo.classList.add('abriendo');
    if (window.invEstallar) setTimeout(function(){ window.invEstallar(innerWidth / 2, innerHeight / 2, 40); }, quieto ? 0 : 1300);
    setTimeout(function(){
      var b = velo.querySelector('.splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1650);
  });
})();`;

/** Rasca y descubre: una capa de plata sobre cada ficha. */
export const RASCA_JS = `
(function(){
  var capas = [].slice.call(document.querySelectorAll('.inv-rasca-capa'));
  if (!capas.length) return;
  var dpr = Math.min(2, window.devicePixelRatio || 1);
  var s = getComputedStyle(document.documentElement);
  var acento = s.getPropertyValue('--inv-accent').trim() || '#9aa5c4';
  capas.forEach(function(capa){
    var c = document.createElement('canvas');
    c.setAttribute('aria-label', capa.getAttribute('data-etiqueta') || 'Rasca para descubrir');
    capa.appendChild(c);
    var x = c.getContext('2d'), tarjeta = capa.closest('.feature-card'), listo = false, activo = false;
    function cubrir(){
      var w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
      c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
      var g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#9aa5c4'); g.addColorStop(.45, '#eef2fb'); g.addColorStop(.55, '#c9d1e6'); g.addColorStop(1, acento);
      x.globalCompositeOperation = 'source-over'; x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 50; i++) { x.fillStyle = 'rgba(255,255,255,' + Math.random() * .6 + ')';
        x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6, 0, 6.283); x.fill(); }
      x.fillStyle = 'rgba(20,24,48,.85)'; x.font = '600 11px Cinzel, Georgia, serif'; x.textAlign = 'center';
      x.fillText(capa.getAttribute('data-texto') || 'RASCA AQUÍ', w / 2, h / 2 + 4);
    }
    cubrir(); addEventListener('resize', function(){ if (!listo) cubrir(); });
    function borrar(e){
      if (!activo || listo) return;
      var b = c.getBoundingClientRect(); x.globalCompositeOperation = 'destination-out';
      x.beginPath(); x.arc(e.clientX - b.left, e.clientY - b.top, 22, 0, 6.283); x.fill();
    }
    function revisar(){
      if (listo || !c.width) return;
      var px = x.getImageData(0, 0, c.width, c.height).data, vacios = 0, total = 0;
      for (var i = 3; i < px.length; i += 64) { total++; if (px[i] === 0) vacios++; }
      if (vacios / total > .45) { listo = true; if (tarjeta) tarjeta.classList.add('rascada');
        var b = c.getBoundingClientRect(); if (window.invEstallar) window.invEstallar(b.left + b.width / 2, b.top + b.height / 2, 50); }
    }
    c.addEventListener('pointerdown', function(e){ activo = true; c.setPointerCapture(e.pointerId); borrar(e); });
    c.addEventListener('pointermove', borrar);
    c.addEventListener('pointerup', function(){ activo = false; revisar(); });
    c.addEventListener('pointercancel', function(){ activo = false; revisar(); });
  });
})();`;

/** El libro de cuentos: se toca la tapa, se abre y entra la invitación. */
export const LIBRO_JS = `
(function(){
  var libro = document.querySelector('[data-inv-libro]');
  if (!libro) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function abrir(){
    if (libro.classList.contains('abre')) return;
    libro.classList.add('abre');
    var r = libro.getBoundingClientRect();
    setTimeout(function(){ if (window.invEstallar) window.invEstallar(r.left + r.width * .55, r.top + r.height / 2, 70); }, 700);
    setTimeout(function(){
      var b = document.querySelector('#splash .splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1700);
  }
  libro.addEventListener('click', abrir);
  libro.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
})();`;

/**
 * Los capítulos se pasan solos al asomarse.
 *
 * No se reutiliza el observador del esqueleto —el de .reveal— porque ése
 * mira la sección entera y aquí hace falta el momento en que la lista entra
 * en pantalla, que con una sección alta es bastante después.
 */
export const CAPITULOS_JS = `
(function(){
  var listas = [].slice.call(document.querySelectorAll('.inv-ev-capitulos'));
  if (!listas.length) return;
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15 });
  listas.forEach(function(l){ io.observe(l); });
})();`;

/** El abanico: se toca, se despliega y entra la invitación. */
export const ABANICO_JS = `
(function(){
  var ab = document.querySelector('[data-inv-abanico]');
  if (!ab) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hoja = ab.querySelector('.inv-abanico-hoja');
  function entrar(){
    var b = document.querySelector('#splash .splash-btn-primary');
    if (b) b.click(); else if (window.enterSite) window.enterSite();
  }
  ab.addEventListener('click', function(){
    if (ab.classList.contains('abierto')) return;
    ab.classList.add('abierto');
    if (quieto || !hoja) { entrar(); return; }
    var t0 = performance.now(), dur = 1300;
    (function paso(t){
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      hoja.style.setProperty('--inv-ab-a', (30 + e * 150).toFixed(1) + 'deg');
      hoja.style.setProperty('--inv-ab-r', (-74 + e * 74).toFixed(1) + 'deg');
      if (k < 1) requestAnimationFrame(paso);
      else {
        var r = ab.getBoundingClientRect();
        if (window.invEstallar) window.invEstallar(r.left + r.width / 2, r.top + r.height * .8, 70);
        setTimeout(entrar, 900);
      }
    })(t0);
  });
  ab.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ab.click(); }
  });
})();`;

/** El cielo que se abre: se toca el velo, las nubes se van y entra. */
export const NUBES_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-nubes');
  if (!velo) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hecho = false;
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    velo.classList.add('abriendo');
    if (window.invEstallar) window.invEstallar(innerWidth / 2, innerHeight * .42, 60);
    setTimeout(function(){
      var b = velo.querySelector('.splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1100);
  });
})();`;

/**
 * El carrusel: los puntos y el que está mirándose.
 *
 * Los puntos se crean aquí y no en el marcado porque cuántos hay depende de
 * cuántas fotos se subieron, y eso sólo se sabe con la invitación delante.
 */
export const CARRUSEL_JS = `
(function(){
  [].slice.call(document.querySelectorAll('.inv-ga-carrusel')).forEach(function(pista){
    var fotos = [].slice.call(pista.children);
    if (fotos.length < 2) return;
    var caja = pista.parentNode.querySelector('.inv-puntos');
    if (!caja) return;
    fotos.forEach(function(){ caja.appendChild(document.createElement('i')); });
    var puntos = [].slice.call(caja.children);
    puntos[0].className = 'act';
    pista.addEventListener('scroll', function(){
      var i = Math.round(pista.scrollLeft / (pista.scrollWidth / fotos.length));
      i = Math.max(0, Math.min(fotos.length - 1, i));
      puntos.forEach(function(p, k){ p.className = k === i ? 'act' : ''; });
    }, { passive: true });
  });
})();`;

/**
 * Los anillos: se tocan, los dos aros se acercan hasta enlazarse, sale un
 * destello y el velo se levanta entero. Nació para la boda «Eterna», pero
 * no depende de ella: los aros son CSS y el color es el del acento.
 */
export const ANILLOS_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-anillos');
  if (!velo) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hecho = false;
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    velo.classList.add('abriendo');
    if (window.invEstallar) setTimeout(function(){
      window.invEstallar(innerWidth / 2, innerHeight * .17, 55);
    }, quieto ? 0 : 700);
    setTimeout(function(){
      var b = velo.querySelector('.splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1600);
  });
})();`;

/** El telón: se toca, las cortinas se van a los lados y entra. */
export const TELON_JS = `
(function(){
  var velo = document.querySelector('#splash.inv-velo-telon');
  if (!velo) return;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hecho = false;
  velo.addEventListener('click', function(e){
    if (hecho || e.target.closest('a')) return;
    hecho = true;
    velo.classList.add('abriendo');
    if (window.invEstallar) window.invEstallar(innerWidth / 2, innerHeight * .45, 70);
    setTimeout(function(){
      var b = velo.querySelector('.splash-btn-primary');
      if (b) b.click(); else if (window.enterSite) window.enterSite();
    }, quieto ? 0 : 1300);
  });
})();`;
