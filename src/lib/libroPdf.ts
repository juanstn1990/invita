import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * El libro, en PDF: una portada y una página por deseo.
 *
 * Fuentes estándar (Times) y no una tipografía propia incrustada: las 14
 * fuentes base de PDF no pesan nada —vienen en cualquier lector— y su
 * codificación WinAnsi ya trae las tildes y la ñ, que es todo lo que un
 * deseo escrito en español necesita.
 */

const ANCHO = 420;
const ALTO = 560;
const TINTA = rgb(0.17, 0.13, 0.07);

function envolver(font: PDFFont, size: number, texto: string, anchoMax: number): string[] {
  const lineas: string[] = [];
  for (const parrafo of texto.split("\n")) {
    if (!parrafo.trim()) { lineas.push(""); continue; }
    let actual = "";
    for (const palabra of parrafo.split(/\s+/)) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (actual && font.widthOfTextAtSize(prueba, size) > anchoMax) {
        lineas.push(actual);
        actual = palabra;
      } else {
        actual = prueba;
      }
    }
    if (actual) lineas.push(actual);
  }
  return lineas;
}

function centrado(page: PDFPage, texto: string, font: PDFFont, size: number, y: number, color = TINTA) {
  const ancho = font.widthOfTextAtSize(texto, size);
  page.drawText(texto, { x: (ANCHO - ancho) / 2, y, size, font, color });
}

export interface DeseoPdf {
  nombre: string;
  texto: string;
}

export async function generarLibroPdf(opts: {
  nombreEvento: string;
  deseos: DeseoPdf[];
  portada?: { bytes: Uint8Array; mime: string } | null;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const titulo = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const texto = await pdf.embedFont(StandardFonts.TimesRoman);
  const firma = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  /* La portada: la imagen a sangre con una capa oscura para que el título
     se lea encima, sea cual sea la foto. Sin imagen, un fondo liso. */
  const tapa = pdf.addPage([ANCHO, ALTO]);
  let colorTapa = TINTA;
  if (opts.portada) {
    try {
      const img = opts.portada.mime === "image/png"
        ? await pdf.embedPng(opts.portada.bytes)
        : await pdf.embedJpg(opts.portada.bytes);
      const escala = Math.max(ANCHO / img.width, ALTO / img.height);
      const w = img.width * escala;
      const h = img.height * escala;
      tapa.drawImage(img, { x: (ANCHO - w) / 2, y: (ALTO - h) / 2, width: w, height: h });
      tapa.drawRectangle({ x: 0, y: 0, width: ANCHO, height: ALTO, color: rgb(0, 0, 0), opacity: 0.4 });
      colorTapa = rgb(1, 1, 1);
    } catch {
      // Una imagen que pdf-lib no sepa abrir no debe tumbar el libro entero.
      tapa.drawRectangle({ x: 0, y: 0, width: ANCHO, height: ALTO, color: rgb(0.98, 0.96, 0.92) });
    }
  } else {
    tapa.drawRectangle({ x: 0, y: 0, width: ANCHO, height: ALTO, color: rgb(0.98, 0.96, 0.92) });
  }
  centrado(tapa, "Libro de deseos", titulo, 26, ALTO * 0.56, colorTapa);
  centrado(tapa, opts.nombreEvento, texto, 14, ALTO * 0.56 - 28, colorTapa);

  if (!opts.deseos.length) {
    const vacia = pdf.addPage([ANCHO, ALTO]);
    centrado(vacia, "Todavía no hay deseos escritos.", texto, 13, ALTO / 2, rgb(0.55, 0.5, 0.45));
  }

  for (const d of opts.deseos) {
    const page = pdf.addPage([ANCHO, ALTO]);
    const lineas = envolver(texto, 13, d.texto, ANCHO - 80);
    let y = Math.min(ALTO - 70, 40 + lineas.length * 18 + 60);
    for (const linea of lineas) {
      page.drawText(linea, { x: 40, y, size: 13, font: texto, color: TINTA });
      y -= 18;
    }
    const firmado = `— ${d.nombre}`;
    const anchoFirma = firma.widthOfTextAtSize(firmado, 13);
    page.drawText(firmado, { x: ANCHO - 40 - anchoFirma, y: 46, size: 13, font: firma, color: TINTA });
  }

  return pdf.save();
}
