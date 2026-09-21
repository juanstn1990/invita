"""
Adornos para plantillas: de una frase a un PNG con transparencia de verdad.

    export XAI_API_KEY=...            # nunca en un archivo del proyecto
    python3 scripts/adornos-grok.py generar esquina "watercolor floral corner ..." --fondo claro
    python3 scripts/adornos-grok.py generar farolillo "glowing paper lantern ..." --fondo negro --aspecto 2:3
    python3 scripts/adornos-grok.py recortar mi-foto.jpg --fondo claro

Deja en `adornos-grok/` (fuera de git) el original (.jpg) y el recorte
(.png, reducido a 256 colores). El PNG es lo que se sube a la biblioteca del
editor y se usa como adorno o como partícula con «Una imagen propia».

Cómo pedirlo para que se pueda recortar
---------------------------------------
El modelo no da transparencia: da un fondo, y este script lo quita. Así que
el fondo se pide liso y la pieza sola:

· `--fondo claro` para lo pintado (acuarela, tinta, flores, marcos):
  "..., isolated on plain white paper, no shadow, no text, lots of margin".
· `--fondo negro` para lo que brilla (farolillos, destellos, soles, velas):
  "..., isolated on pure black background, no text". El halo se conserva
  como resplandor que se funde con lo que haya detrás.
· `--fondo solido` para objetos opacos sobre negro (una corona, un zapato):
  mismo prompt que negro, pero el objeto queda macizo y no translúcido.

Por qué no un fondo transparente pedido al modelo, ni un `mix-blend-mode`
en la página: lo primero no existe, y lo segundo se ve bien sobre el fondo
con el que se probó y mal sobre todos los demás. Un PNG de verdad sirve en
los 50 diseños y en cualquier paleta.
"""
import argparse
import base64
import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

import numpy as np
from PIL import Image, ImageFilter

URL = "https://api.x.ai/v1/images/generations"
MODELO = "grok-imagine-image-quality"
SALIDA = pathlib.Path("adornos-grok")


# ── generar ──────────────────────────────────────────────────────────


def generar(nombre: str, prompt: str, aspecto: str | None, modelo: str) -> pathlib.Path:
    clave = os.environ.get("XAI_API_KEY", "").strip()
    if not clave:
        sys.exit("Falta XAI_API_KEY en el entorno. Ponla con `export`, no en un archivo.")
    cuerpo = {"model": modelo, "prompt": prompt, "n": 1, "response_format": "b64_json"}
    if aspecto:
        cuerpo["aspect_ratio"] = aspecto
    req = urllib.request.Request(
        URL,
        data=json.dumps(cuerpo).encode(),
        method="POST",
        headers={"Authorization": f"Bearer {clave}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            d = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"✗ {nombre}: HTTP {e.code} {e.read()[:300]!r}")
    b = d["data"][0].get("b64_json")
    if not b:
        sys.exit(f"✗ {nombre}: la respuesta no trae imagen: {str(d)[:200]}")
    SALIDA.mkdir(exist_ok=True)
    out = SALIDA / f"{nombre}.jpg"
    out.write_bytes(base64.b64decode(b))
    print(f"✓ {out}  {out.stat().st_size // 1024} KB")
    return out


# ── recortar ─────────────────────────────────────────────────────────


def _fondo_de(a: np.ndarray) -> np.ndarray:
    """El color del papel: la mediana del borde, donde nunca hay dibujo."""
    borde = np.concatenate([
        a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3),
        a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3),
    ])
    return np.median(borde, axis=0)


def _guardar(rgb: np.ndarray, a: np.ndarray, dst: pathlib.Path) -> None:
    out = np.dstack([np.clip(rgb, 0, 1), np.clip(a, 0, 1)])
    Image.fromarray((out * 255).astype(np.uint8), "RGBA").save(dst, optimize=True)


def claro(src, dst, suelo=0.06, techo=0.55):
    """
    Pintura sobre papel. La transparencia sale de cuánto se aparta el píxel
    del papel: hacia lo oscuro o hacia el color. Sólo con lo oscuro, un
    pétalo rosa pálido o un dorado claro se quedaban medio transparentes,
    porque son casi tan luminosos como el papel; la saturación los rescata.

    Luego se descontamina: al color se le quita la parte de papel que
    llevaba mezclada, C = (P - (1-a)·B) / a. Sin eso los bordes suaves
    dejan un halo blanquecino que se ve en cuanto el adorno va sobre oscuro.
    """
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
    B = _fondo_de(im)
    oscuro = np.max(np.clip(B - im, 0, None) / np.maximum(B, 1e-3), axis=2)
    sat = (im.max(axis=2) - im.min(axis=2)) - (B.max() - B.min())
    dist = np.maximum(oscuro, np.clip(sat, 0, None))
    a = np.clip((dist - suelo) / (techo - suelo), 0, 1)
    a = np.asarray(
        Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    ).astype(np.float32) / 255
    aa = np.maximum(a[..., None], 1e-3)
    _guardar((im - (1 - aa) * B) / aa, a, dst)


def negro(src, dst, suelo=0.05, gamma=0.9):
    """Lo que brilla: la transparencia es el brillo, y el halo queda halo."""
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
    a = np.clip((im.max(axis=2) - suelo) / (1 - suelo), 0, 1) ** gamma
    _guardar(im / np.maximum(a[..., None], 1e-3), a, dst)


def solido(src, dst, suelo=0.06, techo=0.22):
    """
    Un objeto opaco sobre negro. Con `negro` las zonas oscuras del objeto
    —la sombra de una corona— quedarían translúcidas y se vería el fondo a
    través; aquí el alfa sube rápido y el objeto queda macizo, con sólo el
    borde suavizado.
    """
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
    a = np.clip((im.max(axis=2) - suelo) / (techo - suelo), 0, 1)
    a = np.asarray(
        Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
    ).astype(np.float32) / 255
    _guardar(im, a, dst)


def ajustar(dst: pathlib.Path, margen=6) -> None:
    """Recorta el lienzo al contenido: medio lienzo vacío no se sabe colocar."""
    im = Image.open(dst)
    caja = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if caja:
        caja = (max(0, caja[0] - margen), max(0, caja[1] - margen),
                min(im.width, caja[2] + margen), min(im.height, caja[3] + margen))
        im = im.crop(caja)
    # 256 colores: un adorno de 1,5 MB baja a ~150 KB y a simple vista es el
    # mismo. En una invitación que se abre desde WhatsApp con datos, se nota.
    im.quantize(256, method=Image.Quantize.FASTOCTREE).save(dst, optimize=True)


RECORTES = {"claro": claro, "negro": negro, "solido": solido}


def recortar(src: pathlib.Path, fondo: str) -> pathlib.Path:
    SALIDA.mkdir(exist_ok=True)
    dst = SALIDA / f"{src.stem}.png"
    RECORTES[fondo](src, dst)
    ajustar(dst)
    im = Image.open(dst)
    print(f"✓ {dst}  {im.size[0]}×{im.size[1]}  {dst.stat().st_size // 1024} KB")
    return dst


# ── línea de órdenes ─────────────────────────────────────────────────


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="orden", required=True)

    g = sub.add_parser("generar", help="pedir la imagen a Grok y recortarla")
    g.add_argument("nombre")
    g.add_argument("prompt")
    g.add_argument("--fondo", choices=RECORTES, default="claro")
    g.add_argument("--aspecto", help="1:1, 2:3, 3:2, 9:16, 16:9 …")
    g.add_argument("--modelo", default=MODELO)
    g.add_argument("--sin-recorte", action="store_true", help="dejar sólo el .jpg (p. ej. un fondo de portada)")

    r = sub.add_parser("recortar", help="recortar una imagen que ya tienes")
    r.add_argument("archivo", type=pathlib.Path)
    r.add_argument("--fondo", choices=RECORTES, default="claro")

    a = p.parse_args()
    if a.orden == "generar":
        jpg = generar(a.nombre, a.prompt, a.aspecto, a.modelo)
        if not a.sin_recorte:
            recortar(jpg, a.fondo)
    else:
        recortar(a.archivo, a.fondo)


if __name__ == "__main__":
    main()
