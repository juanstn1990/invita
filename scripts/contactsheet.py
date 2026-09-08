"""Parte las capturas altas en columnas lado a lado para poder revisarlas."""
import sys, os
from PIL import Image

SHOTS = ".preview/shots"
OUT = ".preview/sheets"
os.makedirs(OUT, exist_ok=True)
SLICE = 1300
GAP = 10

for name in sys.argv[1:]:
    src = os.path.join(SHOTS, f"{name}.png")
    im = Image.open(src)
    w, h = im.size
    n = (h + SLICE - 1) // SLICE
    sheet = Image.new("RGB", (n * w + (n - 1) * GAP, SLICE), (225, 222, 218))
    for i in range(n):
        tile = im.crop((0, i * SLICE, w, min((i + 1) * SLICE, h)))
        sheet.paste(tile, (i * (w + GAP), 0))
    sheet = sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS)
    dst = os.path.join(OUT, f"{name}.png")
    sheet.save(dst, optimize=True)
    print(f"{name}: {n} columnas → {sheet.width}×{sheet.height}")
