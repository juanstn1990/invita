"use client";

import styles from "./editor.module.css";

/**
 * Cuánta gente abrió la invitación.
 *
 * Sólo personas: los rastreadores de WhatsApp y compañía no cuentan, ni las
 * recargas, ni las veces que el organizador abre la suya para revisarla (ver
 * `src/lib/aperturas.ts`). Por eso el número es más bajo de lo que uno
 * esperaría, y por eso sirve.
 *
 * Aquí va el total; lo que se usa para decidir a quién insistirle es la
 * columna por familia del panel de invitados.
 */
export function Aperturas({
  personas, veces, ultima, publicada,
}: {
  personas: number;
  veces: number;
  ultima: string | null;
  publicada: boolean;
}) {
  if (!publicada) {
    return (
      <div className={styles.aperturas}>
        <p className={styles.aperturasVacio}>
          Cuando publiques la invitación, aquí verás cuánta gente la ha abierto.
        </p>
      </div>
    );
  }

  if (!personas) {
    return (
      <div className={styles.aperturas}>
        <p className={styles.aperturasVacio}>
          Todavía no la ha abierto nadie. La vista previa que arma WhatsApp al
          pegar el enlace no cuenta como una persona.
        </p>
      </div>
    );
  }

  const cuando = (() => {
    const ms = Date.now() - new Date(ultima || "").getTime();
    const min = Math.round(ms / 60000);
    if (!isFinite(min)) return "";
    if (min < 60) return `hace ${Math.max(1, min)} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? "ayer" : `hace ${d} días`;
  })();

  return (
    <div className={styles.aperturas}>
      <p className={styles.aperturasNum}>
        <b>{personas}</b> {personas === 1 ? "persona la abrió" : "personas la abrieron"}
      </p>
      <p className={styles.aperturasPie}>
        {veces} {veces === 1 ? "apertura" : "aperturas"} en total
        {cuando ? ` · la última ${cuando}` : ""}
      </p>
    </div>
  );
}
