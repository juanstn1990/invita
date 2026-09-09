/**
 * El marcado, uno solo para todos los diseños.
 *
 * Cada elemento editable declara **qué campo del esquema es**:
 *
 *     <h2 class="section-title" data-inv="events.title">
 *     <div data-inv-list="events"> <article data-inv-item> …
 *
 * Eso reemplaza el mapa de selectores. Antes cada campo llevaba una lista de
 * selectores candidatos y ganaba el primero que existiera en ese diseño; con
 * 14 templates escritos a mano el mapa acertaba casi siempre y fallaba 213
 * veces, y el renderer no tenía forma de distinguir "el diseño no lo trae" de
 * "el selector no lo encontró". Ahora el marcado lo dice y el renderer sólo
 * busca por atributo: `[data-inv="events.title"]`.
 *
 * La consecuencia es que todos soportan todos los campos. Los que faltaban
 * —la frase de la portada, la sección de redes, el pie— están aquí, así que
 * ya no hay nada que esconder en el editor.
 *
 * Las clases se conservan (`.section-label`, `.event-card`, `.countdown-ring`…)
 * porque son las que estiliza el CSS de cada diseño y las que usan los
 * bloques con marcado propio de `blocks.ts`.
 */

import { baseCss } from "./css";
import type { Content } from "./content";
import type { Design, Theme } from "./theme";

const e = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ────────────────────────────────────────────────────────────────
   Piezas
   ──────────────────────────────────────────────────────────────── */

/**
 * Los nombres. Con pareja van separados por un `&` con su propia clase, que
 * es lo que `applyCouple` sabe reescribir; con un solo nombre no se emite
 * nada extra.
 */
const nombres = (c: Content, ampClass: string): string =>
  c.name2
    ? `${e(c.name)}<span class="${ampClass}">&amp;</span>${e(c.name2)}`
    : e(c.name);

const orn = (d: Design, t: Theme): string =>
  d.deco?.ornament ? `<div class="ornament">${d.deco.ornament(t)}</div>` : "";

const deco = (d: Design, t: Theme, k: "splash" | "hero" | "footer"): string =>
  d.deco?.[k] ? d.deco[k]!(t) : "";

/** El antetítulo y el título de una sección, con su adorno. */
const cabecera = (
  d: Design,
  t: Theme,
  sec: string,
  label: string,
  title: string
): string => `
    <p class="section-label" data-inv="${sec}.label">${e(label)}</p>
    <h2 class="section-title" data-inv="${sec}.title">${e(title)}</h2>${orn(d, t)}`;

const UNIDADES: [string, string][] = [
  ["days", "Días"],
  ["hours", "Horas"],
  ["mins", "Minutos"],
  ["secs", "Segundos"],
];

const TITULO: Record<Design["occasion"], string> = {
  boda: "Nuestra boda",
  quince: "Mis quince años",
  comunion: "Mi primera comunión",
  "primer-ano": "Mi primer añito",
  "baby-shower": "Baby shower",
};

/* ────────────────────────────────────────────────────────────────
   La página
   ──────────────────────────────────────────────────────────────── */

export function page(d: Design, t: Theme, c: Content): string {
  const titulo = `${e(c.name)}${c.name2 ? " &amp; " + e(c.name2) : ""} · ${TITULO[d.occasion]}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- Sin esta clase el CSS no oculta nada: un fallo de JavaScript deja la
     invitación legible en vez de en blanco. -->
<script>document.documentElement.classList.add('js')</script>
<title>${titulo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${d.fontUrl}" rel="stylesheet">
<style>${baseCss(t, d.layout)}${d.css ? d.css(t) : ""}</style>
</head>
<body>

<div class="progress" aria-hidden="true"><i></i></div>

<div id="splash" data-inv-section="splash">
  ${deco(d, t, "splash")}
  <div class="splash-modal">
    <p class="splash-subtitle" data-inv="splash.label">${e(c.splash.label)}</p>
    <h1 class="splash-name" data-inv="event.names">${nombres(c, "splash-amp")}</h1>
    <p class="splash-subtitle" data-inv="splash.subtitle">${e(c.splash.subtitle)}</p>
    <p class="splash-date" data-inv="event.dateLabel">${e(c.dateLabel)}</p>
    <div class="splash-btns">
      <button class="splash-btn splash-btn-primary" type="button" onclick="enterSite()"
        data-inv="splash.ctaPrimary">${e(c.splash.cta1)}</button>
      <button class="splash-btn" type="button" onclick="enterSite()"
        data-inv="splash.ctaSecondary">${e(c.splash.cta2)}</button>
    </div>
  </div>
</div>

<section id="hero" data-inv-section="hero">
  <div class="hero-bg" data-inv="hero.backgroundUrl"></div>
  ${deco(d, t, "hero")}
  <div class="hero-content">
    <p class="hero-label" data-inv="hero.label">${e(c.hero.label)}</p>
    <h1 class="hero-name" data-inv="event.names">${nombres(c, "hero-amp")}</h1>
    <p class="hero-sub" data-inv="hero.subtitle">${e(c.hero.sub)}</p>
    <p class="hero-date" data-inv="event.dateLabel">${e(c.dateLabel)}</p>
    <p class="hero-quote" data-inv="event.quote">${e(c.hero.quote)}</p>
    <a class="hero-btn" href="#countdown" data-inv="hero.cta">${e(c.hero.cta)}</a>
  </div>
  <div class="hero-scroll" aria-hidden="true">
    <svg width="18" height="26" viewBox="0 0 18 26" fill="none" stroke="currentColor"
      stroke-width="1.4" stroke-linecap="round"><path d="M9 3v18M3 15l6 6 6-6"/></svg>
  </div>
</section>

<div class="divider" aria-hidden="true"></div>

<section id="countdown" class="reveal" data-inv-section="countdown">
  <div class="container">${cabecera(d, t, "countdown", c.countdown.label, c.countdown.title)}
    <p class="section-body" data-inv="countdown.text">${e(c.countdown.body)}</p>
    <div class="countdown-grid">
      ${UNIDADES.map(
        ([k, etiqueta]) =>
          `<div class="countdown-ring"><div class="ring-inner">` +
          `<span class="ring-number" data-cd="${k}">--</span>` +
          `<span class="ring-label">${etiqueta}</span>` +
          `</div></div>`
      ).join("\n      ")}
    </div>
  </div>
</section>

<section id="guests" class="reveal alt" data-inv-section="guests">
  <div class="container">${cabecera(d, t, "guests", c.guests.label, c.guests.title)}
    <p class="guests-text" data-inv="guests.text">${e(c.guests.text)}</p>
    <p class="guests-text" data-inv="guests.textSecondary">${e(c.guests.text2)}</p>
    <p class="guests-address" data-inv="guests.address">${e(c.guests.address)}</p>
    <div class="guests-grid" data-inv-list="guests">
      ${c.guests.cards
        .map(
          (g) => `<div class="guest-card" data-inv-item>
        <span class="guest-avatar" data-inv="guests.items.initial">${e(g.name.charAt(0))}</span>
        <p class="guest-name" data-inv="guests.items.name">${e(g.name)}</p>
        <p class="guest-role" data-inv="guests.items.role">${e(g.role)}</p>
      </div>`
        )
        .join("\n      ")}
    </div>
  </div>
</section>

<section id="events" class="reveal" data-inv-section="events">
  <div class="container">${cabecera(d, t, "events", c.events.label, c.events.title)}
    <p class="section-body" data-inv="events.text">${e(c.events.body)}</p>
    <div class="events-grid" data-inv-list="events">
      ${c.events.items
        .map(
          (ev) => `<article class="event-card" data-inv-item>
        <span class="event-icon" data-inv="events.items.icon">${ev.icon}</span>
        <p class="event-type" data-inv="events.items.kind">${e(ev.kind)}</p>
        <h3 class="event-title" data-inv="events.items.title">${e(ev.title)}</h3>
        <p class="event-time" data-inv="events.items.time">${e(ev.time)}</p>
        <p class="event-place" data-inv="events.items.place">${e(ev.place)}<small data-inv="events.items.address">${e(ev.address)}</small></p>
        <p class="event-note" data-inv="events.items.note">${e(ev.note)}</p>
        <a class="event-map-btn" href="#" data-inv="events.items.mapUrl">¿Cómo llegar?</a>
      </article>`
        )
        .join("\n      ")}
    </div>
  </div>
</section>

<section id="confirmation" class="reveal alt" data-inv-section="confirm">
  <div class="container">${cabecera(d, t, "confirm", c.confirm.label, c.confirm.title)}
    <p class="confirmation-text" data-inv="confirm.text">${e(c.confirm.text)}</p>
    <p class="confirmation-deadline" data-inv="confirm.deadlineText">${e(c.confirm.deadline)}</p>
    <p class="confirmation-text" data-inv="confirm.note">${e(c.confirm.note)}</p>
    <!-- El renderer reemplaza el <form> entero por su componente. Se
         reemplaza el form y no el botón: anidar formularios es HTML inválido
         y el navegador descarta el de dentro. -->
    <form class="confirm-form" data-inv-rsvp>
      <input class="confirm-input" type="text" name="nombre" placeholder="Tu nombre">
      <input class="confirm-input" type="tel" name="telefono" placeholder="Teléfono (opcional)">
      <input class="confirm-input" type="number" name="acompanantes" min="1" max="10" value="1">
      <textarea class="confirm-input" name="mensaje" rows="2" placeholder="Mensaje (opcional)"></textarea>
      <!-- Sin data-inv: el renderer reemplaza el formulario entero. -->
      <button class="confirm-btn" type="submit">${e(c.confirm.cta)}</button>
    </form>
  </div>
</section>

<section id="gallery" class="reveal" data-inv-section="gallery">
  <div class="container">${cabecera(d, t, "gallery", c.gallery.label, c.gallery.title)}
    <p class="gallery-text" data-inv="gallery.text">${e(c.gallery.text)}</p>
    <div class="gallery-grid" data-inv-list="gallery">
      ${Array.from(
        { length: 6 },
        (_, i) =>
          `<div class="gallery-item" data-inv-item><div class="gallery-ph" data-inv="gallery.items.url">` +
          `<span class="gallery-ph-text">Foto ${i + 1}</span></div></div>`
      ).join("\n      ")}
    </div>
  </div>
</section>

<section id="features" class="reveal alt" data-inv-section="features">
  <div class="container">${cabecera(d, t, "features", c.features.label, c.features.title)}
    <div class="features-grid" data-inv-list="features">
      ${c.features.items
        .map(
          (f) => `<div class="feature-card" data-inv-item>
        <span class="feature-icon" data-inv="features.items.icon">${f.icon}</span>
        <h3 class="feature-title" data-inv="features.items.title">${e(f.title)}</h3>
        <p class="feature-text" data-inv="features.items.text">${e(f.text)}</p>
      </div>`
        )
        .join("\n      ")}
    </div>
  </div>
</section>

<section id="gifts" class="reveal" data-inv-section="gifts">
  <div class="container">${cabecera(d, t, "gifts", c.gifts.label, c.gifts.title)}
    <p class="gifts-text" data-inv="gifts.text">${e(c.gifts.text)}</p>
    <div class="gifts-account">
      <p class="gifts-bank" data-inv="gifts.bankLabel">${e(c.gifts.bankLabel)}</p>
      <p class="gifts-iban" data-inv="gifts.account">${e(c.gifts.account)}</p>
    </div>
    <p class="gifts-note" data-inv="gifts.note">${e(c.gifts.note)}</p>
    <div class="gifts-cards" data-inv-list="gifts">
      ${c.gifts.cards
        .map(
          (g) => `<div class="gift-card" data-inv-item>
        <span class="gift-icon" data-inv="gifts.items.icon">${g.icon}</span>
        <h3 class="gift-title" data-inv="gifts.items.title">${e(g.title)}</h3>
        <p class="gift-desc" data-inv="gifts.items.text">${e(g.text)}</p>
        <a class="gift-link" href="#" data-inv="gifts.items.url">Ver</a>
      </div>`
        )
        .join("\n      ")}
    </div>
    <a class="gifts-btn" href="#" data-inv="gifts.url">Ver mesa de regalos</a>
  </div>
</section>

<section id="social" class="reveal alt" data-inv-section="social">
  <div class="container">${cabecera(d, t, "social", c.social.label, c.social.title)}
    <p class="social-sub" data-inv="social.text">${e(c.social.text)}</p>
    <span class="social-hashtag" data-inv="social.hashtag">${e(c.social.tag)}</span>
    <a class="social-ig" href="#" data-inv="social.instagram">${e(c.social.ig)}</a>
  </div>
</section>

<footer data-inv-section="footer">
  ${deco(d, t, "footer")}
  <!-- El pie lleva su .container como el resto de las secciones, aunque su
       contenido quepa sin él: es lo que el renderer sube por encima de un
       adorno puesto "debajo del texto". Sin envoltorio posicionado, un adorno
       absoluto se pintaba sobre estos párrafos. -->
  <div class="container">
    <p class="footer-names" data-inv="event.names">${nombres(c, "amp")}</p>
    <p class="footer-date" data-inv="footer.dateLine">${e(c.dateLabel)}</p>
    <p class="footer-copy" data-inv="footer.note">${e(c.footer)}</p>
  </div>
</footer>

<script>
(function () {
  document.body.style.overflow = 'hidden';
  window.enterSite = function () {
    var s = document.getElementById('splash');
    if (s) s.classList.add('hidden');
    document.body.style.overflow = '';
  };

  /* La cuenta atrás busca por [data-cd], no por ids fijos: así el renderer
     puede sustituir la sección por una variante con marcado propio sin que
     este script quede lanzando errores cada segundo. */
  var TARGET = new Date('${c.dateIso}');
  function tick() {
    var diff = TARGET - new Date();
    if (diff < 0) diff = 0;
    var s = Math.floor(diff / 1000);
    var v = {
      days: Math.floor(s / 86400),
      hours: Math.floor(s / 3600) % 24,
      mins: Math.floor(s / 60) % 60,
      secs: s % 60
    };
    document.querySelectorAll('[data-cd]').forEach(function (el) {
      var n = v[el.getAttribute('data-cd')];
      if (n === undefined) return;
      var next = String(n).padStart(2, '0');
      if (el.textContent === next) return;
      el.textContent = next;
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
    });
  }
  tick();
  setInterval(tick, 1000);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* Parallax de la portada y barra de progreso, en un solo rAF: dos
     escuchadores de scroll en un móvil son una sucesión de tirones. */
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroBg = document.querySelector('.hero-bg');
  var barra = document.querySelector('.progress i');
  var pendiente = false;
  function pintar() {
    pendiente = false;
    var y = window.scrollY || 0;
    if (heroBg && !quieto && y < window.innerHeight * 1.4) {
      heroBg.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0) scale(1.12)';
    }
    if (barra) {
      var total = document.body.scrollHeight - window.innerHeight;
      barra.style.width = (total > 0 ? Math.min(100, (y / total) * 100) : 0) + '%';
    }
  }
  addEventListener('scroll', function () {
    if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); }
  }, { passive: true });
  pintar();
})();
</script>
</body>
</html>`;
}
