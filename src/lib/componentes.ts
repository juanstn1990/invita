/**
 * Componentes interactivos que sirven a cualquier diseño.
 *
 * Nacieron con «Quince Dorado», pero ninguno es de ese diseño: todos salen
 * de las variables de la paleta (--inv-accent, --inv-ink, --inv-surface…)
 * y se eligen desde el editor en cualquiera de los 52.
 *
 * · Apertura «sobre con sello»: el velo es un sobre cerrado; se toca el
 *   sello, la solapa se abre, la carta sube y la invitación entra.
 * · Cuenta atrás «paletas»: cada número gira como un reloj de aeropuerto.
 * · Fichas «se voltean»: por delante el ícono y el título, por detrás el
 *   texto. Se toca para darles la vuelta.
 * · Ubicación con «Agendar»: descarga el evento al calendario del teléfono.
 * · Partícula «polvo de oro»: motas que suben y se apartan del dedo.
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

/* ── El polvo de oro ── */
.inv-polvo{position:fixed;inset:0;width:100%;height:100%;z-index:9997;pointer-events:none}

@media (prefers-reduced-motion:reduce){
  .inv-sobre,.inv-sobre-sello,.inv-sobre-pista{animation:none}
  .inv-sobre-carta,.inv-sobre-solapa,.inv-fe-voltea .inv-cara{transition:none}
  .inv-cd-paletas .ring-number.tick{animation:none}
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
  var cv = document.querySelector('.inv-polvo');
  if (!cv || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
  var n = Math.max(10, Math.min(120, +cv.getAttribute('data-n') || 60));
  var color = cv.getAttribute('data-color') ||
    getComputedStyle(document.documentElement).getPropertyValue('--brand-2').trim() || '#f3dc9a';
  var op = +cv.getAttribute('data-op') || .8, lento = cv.getAttribute('data-ritmo');
  var vel = lento === 'lento' ? .5 : lento === 'rapido' ? 1.8 : 1;
  var escala = (+cv.getAttribute('data-tam') || 20) / 20;
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
