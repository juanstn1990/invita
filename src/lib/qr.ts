import QRCode from "qrcode";

/**
 * El QR de una dirección, como `data:` URI listo para un `<img>`.
 *
 * En SVG y no en PNG: se escala sin pixelarse si alguien lo agranda para
 * imprimirlo en un cartel de mesa, que es justo para lo que sirve.
 */
export async function qrSvgDataUrl(texto: string): Promise<string> {
  const svg = await QRCode.toString(texto, { type: "svg", margin: 1 });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
