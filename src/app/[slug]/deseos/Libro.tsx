"use client";

import { useRef, useState } from "react";
import styles from "./libro.module.css";

export interface DeseoLeido {
  id: string;
  nombre: string;
  texto: string;
}

/**
 * El libro que se hojea: portada, una página por deseo, y una última página
 * con el botón de descarga. Pasar la hoja es una animación de dos tiempos
 * —la de salida gira y se desvanece, después entra la siguiente girando
 * desde el otro lado— y no una hoja de verdad con anverso y reverso: esa
 * versión pide tener listo el contenido de las dos caras a la vez, y aquí
 * basta con que **se sienta** como pasar una página.
 */
export function Libro({
  slug, nombreEvento, portada, colorHoja, colorLetra, deseos, esOrganizador,
}: {
  slug: string;
  nombreEvento: string;
  portada: string;
  colorHoja: string;
  colorLetra: string;
  deseos: DeseoLeido[];
  esOrganizador: boolean;
}) {
  /* 0 = portada, 1..N = un deseo por página, N+1 = la última (descargar). */
  const total = deseos.length + 2;
  const [pagina, setPagina] = useState(0);
  const [fase, setFase] = useState<"quieta" | "saliendo" | "entrando">("quieta");
  const destino = useRef(0);
  const inicioX = useRef<number | null>(null);

  function ir(a: number) {
    if (a < 0 || a > total - 1 || a === pagina || fase !== "quieta") return;
    destino.current = a;
    setFase("saliendo");
    setTimeout(() => {
      setPagina(destino.current);
      setFase("entrando");
      setTimeout(() => setFase("quieta"), 320);
    }, 260);
  }

  const siguiente = () => ir(pagina + 1);
  const anterior = () => ir(pagina - 1);

  function alTocar(e: React.TouchEvent) {
    inicioX.current = e.touches[0].clientX;
  }
  function alSoltar(e: React.TouchEvent) {
    if (inicioX.current === null) return;
    const delta = e.changedTouches[0].clientX - inicioX.current;
    inicioX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) siguiente(); else anterior();
  }

  const esPortada = pagina === 0;
  const esFinal = pagina === total - 1;
  const deseo = !esPortada && !esFinal ? deseos[pagina - 1] : null;

  return (
    <div className={styles.envoltorio}>
      <div
        className={styles.libro}
        onTouchStart={alTocar}
        onTouchEnd={alSoltar}
        style={{ "--colorHoja": colorHoja, "--colorLetra": colorLetra } as React.CSSProperties}
      >
        <div className={styles.hoja} data-fase={fase}>
          {esPortada && (
            <div className={styles.portada} style={portada ? { backgroundImage: `url(${portada})` } : undefined}>
              <p className={styles.portadaTitulo}>Libro de deseos</p>
              <p className={styles.portadaEvento}>{nombreEvento}</p>
            </div>
          )}

          {deseo && (
            <div className={styles.pagina}>
              <p className={styles.deseoTexto}>{deseo.texto}</p>
              <p className={styles.deseoFirma}>— {deseo.nombre}</p>
            </div>
          )}

          {esFinal && (
            <div className={styles.paginaFinal}>
              <p className={styles.finTitulo}>Gracias por leer</p>
              <p className={styles.finTexto}>
                {deseos.length
                  ? `${deseos.length} ${deseos.length === 1 ? "deseo" : "deseos"} hasta ahora.`
                  : "Todavía no hay deseos — sé el primero."}
              </p>
              {esOrganizador && (
                <a className={styles.descargar} href={`/api/i/${slug}/deseos/pdf`} download>
                  Descargar el libro (PDF)
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.controles}>
        <button type="button" onClick={anterior} disabled={pagina === 0} aria-label="Página anterior">‹</button>
        <span className={styles.numero}>{pagina + 1} / {total}</span>
        <button type="button" onClick={siguiente} disabled={pagina === total - 1} aria-label="Página siguiente">›</button>
      </div>
    </div>
  );
}
