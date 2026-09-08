"use client";

import { useEffect, useRef, useState } from "react";
import { FONTS, FONT_BY_ID, GROUP_LABEL, previewHref } from "@/lib/fonts";
import styles from "./editor.module.css";

/**
 * Las muestras se ven en su propia tipografía, así que hay que cargarlas —
 * pero sólo la primera vez que alguien abre un selector, no al entrar al
 * editor.
 */
let cargadas = false;
function cargarFuentes() {
  if (cargadas || typeof document === "undefined") return;
  cargadas = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = previewHref();
  document.head.appendChild(link);
}

export function FontPicker({
  value, onChange, shared,
}: {
  value: string;
  onChange: (id: string) => void;
  /** El campo pertenece a una lista: la letra se aplica a todas las fichas. */
  shared?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const elegida = FONT_BY_ID[value];

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <div className={styles.fontWrap} ref={caja}>
      <button
        className={styles.fontBtn}
        data-set={!!elegida}
        style={elegida ? { fontFamily: elegida.css } : undefined}
        title={
          (elegida ? `Tipografía: ${elegida.name}` : "Tipografía del diseño") +
          (shared ? " · se aplica a toda la lista" : "")
        }
        aria-label="Cambiar tipografía"
        onClick={() => { cargarFuentes(); setAbierto(!abierto); }}
      >
        Aa
      </button>

      {abierto && (
        <div className={styles.fontMenu} role="listbox">
          <button
            className={styles.fontItem}
            data-active={!elegida}
            onClick={() => { onChange(""); setAbierto(false); }}
          >
            <span className={styles.fontItemName}>Según el diseño</span>
          </button>

          {(Object.keys(GROUP_LABEL) as (keyof typeof GROUP_LABEL)[]).map((grupo) => (
            <div key={grupo}>
              <p className={styles.fontGroup}>{GROUP_LABEL[grupo]}</p>
              {FONTS.filter((f) => f.group === grupo).map((f) => (
                <button
                  key={f.id}
                  className={styles.fontItem}
                  data-active={f.id === value}
                  onClick={() => { onChange(f.id); setAbierto(false); }}
                >
                  <span className={styles.fontItemName} style={{ fontFamily: f.css }}>
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
