/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Salida autónoma, para la imagen de Docker.
   *
   * Next traza qué archivos hace falta llevarse y deja en `.next/standalone`
   * un servidor con sólo eso, en vez de arrastrar `node_modules` entero.
   *
   * Ojo con lo que **no** puede trazar: `templates/` se lee con una ruta
   * construida en tiempo de ejecución (`path.join(process.cwd(), …)`), así que
   * el trazado no la ve y el Dockerfile la copia a mano.
   */
  output: "standalone",
};

module.exports = nextConfig;
