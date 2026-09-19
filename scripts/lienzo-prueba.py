"""
Arma el prototipo del bloque «Lienzo» en un solo HTML que se abre con doble clic.

    python3 scripts/lienzo-prueba.py <lamina.png> [salida.html]

La lámina va incrustada en base64 para que el archivo se pueda mandar por
WhatsApp o abrir sin servidor. Es un prototipo para mirar y tocar, no el
bloque de verdad: el bloque irá en `blocks.ts` con sus campos y su arrastre.
"""

import base64
import sys
from pathlib import Path

lamina = Path(sys.argv[1] if len(sys.argv) > 1 else "lamina.png")
salida = Path(sys.argv[2] if len(sys.argv) > 2 else "lienzo-prueba.html")

b64 = base64.b64encode(lamina.read_bytes()).decode()
tipo = "image/png" if lamina.suffix.lower() == ".png" else "image/jpeg"

HTML = """<!doctype html>
<html lang="es">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lienzo · prueba</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Parisienne&display=swap" rel="stylesheet">
<style>
  :root{ --ui:#7b5228; --borde:#e2dad0; }
  *{box-sizing:border-box}
  body{margin:0;background:#f3efe9;color:#2e2a26;
    font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}

  header{padding:18px 20px 12px;text-align:center}
  h1{margin:0 0 4px;font:600 15px/1.3 inherit;letter-spacing:.02em}
  header p{margin:0;font-size:12.5px;color:#7d746a}

  .mandos{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;
    align-items:center;padding:10px 20px 16px}
  .mandos label{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#5c554d}
  .mandos input[type=range]{width:150px;accent-color:var(--ui)}
  .mandos button{padding:6px 12px;font:inherit;font-size:12.5px;cursor:pointer;
    background:#fff;border:1px solid var(--borde);border-radius:999px;color:#5c554d}
  .mandos button[aria-pressed=true]{background:var(--ui);border-color:var(--ui);color:#fff}

  .marco{display:flex;justify-content:center;padding:0 16px 40px}

  /* ── El lienzo ───────────────────────────────────────────────
     La proporción es la de la lámina y `container-type` es lo que hace que
     `cqw` signifique «porcentaje del ancho del lienzo». Con eso, posición y
     tamaño de letra escalan juntos en cualquier pantalla. */
  .lienzo{position:relative;width:100%;max-width:560px;
    aspect-ratio:572/1024;container-type:inline-size;
    background:url(data:__TIPO__;base64,__B64__) center/100% 100% no-repeat;
    box-shadow:0 10px 40px -18px rgba(46,42,38,.4)}

  .caja{position:absolute;translate:-50% -50%;margin:0;text-align:center;
    color:#4a5468;line-height:1.15;outline:0}
  .caja:focus{outline:1px dashed rgba(123,82,40,.55);outline-offset:6px}

  /* Coordenadas medidas sobre la lámina: papel limpio en x 18–81 %,
     y 32–61 %. El ramo ocupa el centro por debajo del 62 %. */
  .antetitulo{left:49.5%;top:35.5%;width:52cqw;font-family:"Cormorant Garamond",serif;
    font-size:3cqw;letter-spacing:.3em;text-transform:uppercase;color:#6a7382}
  .novia{left:49.5%;top:43%;width:60cqw;font-family:Parisienne,cursive;font-size:11cqw}
  .amp{left:49.5%;top:49.5%;width:20cqw;font-family:"Cormorant Garamond",serif;
    font-style:italic;font-size:5cqw;color:#7d8798}
  .novio{left:49.5%;top:55.5%;width:60cqw;font-family:Parisienne,cursive;font-size:11cqw}
  .fecha{left:49.5%;top:60%;width:62cqw;font-family:"Cormorant Garamond",serif;
    font-size:2.6cqw;letter-spacing:.18em;text-transform:uppercase;color:#6a7382}

  /* La zona útil, para ver de dónde salen las coordenadas. */
  .zona{position:absolute;left:18%;right:19%;top:32%;bottom:38%;
    border:1px dashed rgba(200,60,60,.75);background:rgba(200,60,60,.06);
    display:none;pointer-events:none}
  .zona::after{content:"zona libre medida · x 18–81 % · y 32–62 %";
    position:absolute;left:0;top:-20px;font:11px/1 sans-serif;color:#b03b3b}
  .lienzo[data-zona] .zona{display:block}

  footer{padding:0 20px 44px;text-align:center;font-size:12px;color:#7d746a}
  footer code{background:#e9e3da;padding:1px 5px;border-radius:4px;font-size:11.5px}
</style>

<header>
  <h1>Bloque «Lienzo» · prueba</h1>
  <p>Los textos son editables: haz clic y escribe. Se encogen solos para no salirse.</p>
</header>

<div class="mandos">
  <label>Ancho
    <input type="range" id="ancho" min="300" max="560" value="560">
    <span id="px">560px</span>
  </label>
  <button id="verZona" aria-pressed="false">Ver zona medida</button>
  <button id="largo">Probar nombres largos</button>
  <button id="corto">Nombres cortos</button>
</div>

<div class="marco">
  <div class="lienzo" id="lienzo">
    <div class="zona"></div>
    <p class="caja antetitulo" contenteditable data-max="2">Tenemos el honor de invitarte a la boda de</p>
    <p class="caja novia" contenteditable data-max="1">Juliana García</p>
    <p class="caja amp" contenteditable>&amp;</p>
    <p class="caja novio" contenteditable data-max="1">Ethan Mendoza</p>
    <p class="caja fecha" contenteditable data-max="1">Ciudad de México · 12 · 04 · 2027</p>
  </div>
</div>

<footer>
  Prototipo. La lámina va incrustada en el archivo, así que funciona sin conexión
  salvo por las tipografías.<br>
  Coordenadas medidas sobre la imagen, no puestas a ojo:
  <code>x 18–81 %</code> <code>y 32–62 %</code>
</footer>

<script>
/* ── Auto-encoger ──────────────────────────────────────────────
   Cada caja dice cuántas líneas admite. Si el texto ocupa más, se baja el
   cuerpo hasta que quepa. Es lo que impide que un nombre largo invada al
   vecino: sobre una lámina fija, el texto no puede empujar nada. */
function encoger(){
  document.querySelectorAll('.caja[data-max]').forEach(function(el){
    var max = +el.dataset.max;
    if (!el.dataset.base) {
      el.style.fontSize = '';
      el.dataset.base = parseFloat(getComputedStyle(el).fontSize);
    }
    var base = +el.dataset.base, px = base, vueltas = 0;
    el.style.fontSize = px + 'px';
    var linea = parseFloat(getComputedStyle(el).lineHeight);
    while (el.scrollHeight > linea * max + 1 && px > base * 0.5 && vueltas++ < 40) {
      px -= base * 0.03;
      el.style.fontSize = px + 'px';
      linea = parseFloat(getComputedStyle(el).lineHeight);
    }
  });
}

/* Al cambiar el ancho, el cuerpo base cambia con él (va en cqw), así que
   hay que olvidar el que se midió antes o el encogido se va acumulando. */
function recalcular(){
  document.querySelectorAll('.caja[data-max]').forEach(function(el){
    el.style.fontSize = ''; delete el.dataset.base;
  });
  encoger();
}

var lienzo = document.getElementById('lienzo');
document.fonts.ready.then(recalcular);
addEventListener('resize', recalcular);
document.querySelectorAll('.caja').forEach(function(el){
  el.addEventListener('input', encoger);
});

var ancho = document.getElementById('ancho'), px = document.getElementById('px');
ancho.addEventListener('input', function(){
  lienzo.style.maxWidth = ancho.value + 'px';
  px.textContent = ancho.value + 'px';
  recalcular();
});

var verZona = document.getElementById('verZona');
verZona.addEventListener('click', function(){
  var puesto = lienzo.hasAttribute('data-zona');
  lienzo.toggleAttribute('data-zona', !puesto);
  verZona.setAttribute('aria-pressed', String(!puesto));
});

function poner(a, b, f){
  document.querySelector('.novia').textContent = a;
  document.querySelector('.novio').textContent = b;
  document.querySelector('.fecha').textContent = f;
  recalcular();
}
document.getElementById('largo').addEventListener('click', function(){
  poner('María Fernanda Villaescusa', 'Juan Sebastián Echeverría',
        'Hacienda El Encanto · Chinauta · 19 · 12 · 2026');
});
document.getElementById('corto').addEventListener('click', function(){
  poner('Juliana García', 'Ethan Mendoza', 'Ciudad de México · 12 · 04 · 2027');
});
</script>
"""

salida.write_text(
    HTML.replace("__B64__", b64).replace("__TIPO__", tipo), encoding="utf-8"
)
print(f"Escrito: {salida}  ({salida.stat().st_size // 1024} KB)")
