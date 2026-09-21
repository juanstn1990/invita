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
#splash.abriendo .splash-modal{opacity:0;transform:scale(1.06);
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
