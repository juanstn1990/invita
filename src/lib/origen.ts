/**
 * El origen desde el que el navegador pidió, para armar URLs absolutas.
 *
 * No se puede usar `new URL(request.url).origin`: en un contenedor eso da el
 * hostname interno de Docker —`http://d669a6429fc7:3000`— que el navegador no
 * resuelve. Era exactamente el fallo de las imágenes en la vista previa: el
 * iframe del editor usa `srcdoc`, así que las rutas tienen que ser absolutas,
 * y las absolutas apuntaban a un nombre que sólo existe dentro de la red de
 * Docker.
 *
 * Se saca de las cabeceras, que sí traen lo que el navegador pidió. Detrás de
 * un proxy —el de EasyPanel, por ejemplo— las de `x-forwarded-*` traen el
 * dominio público y el esquema real, y son las que manda.
 */
export function origenDe(request: Request): string {
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return new URL(request.url).origin;

  /* Un proxy puede encadenar varios valores: "https,http". Vale el primero. */
  const proto = (h.get("x-forwarded-proto") || "").split(",")[0].trim();
  if (proto) return `${proto}://${host}`;

  /* Sin cabecera de esquema: se deduce del propio host. Un dominio de verdad
     va por https; localhost y las IPs de la red interna, por http. */
  const local = /^(localhost|127\.|\[?::1\]?|0\.0\.0\.0)/.test(host);
  return `${local ? "http" : "https"}://${host}`;
}
