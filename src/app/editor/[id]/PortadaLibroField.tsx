"use client";

import { useRef, useState } from "react";
import { ImageField } from "./ImageField";
import styles from "./editor.module.css";

/**
 * La portada del libro de deseos: subir, ver exactamente cómo va a quedar y
 * arrastrar para ajustar qué parte de la foto se ve.
 *
 * La portada del libro (`Libro.tsx`) recorta a 3:4 con `background-size:
 * cover`, igual que el fondo de una sección. Sin esto, quien organiza subía
 * una foto a ciegas y sólo veía el recorte real al abrir `/{slug}/deseos` —
 * y si alguien importante quedaba fuera del recorte, tocaba adivinar otra
 * vez. Aquí la vista previa es la misma caja de 3:4 con el mismo `cover`, así
 * que lo que se ve aquí es exactamente lo que ve quien hojea el libro.
 *
 * `portadaX`/`portadaY` (0-100, como un `background-position` en porcentaje)
 * son datos nuevos del bloque, aparte de `portada`: al subir una foto nueva
 * se reinician al centro, porque la posición que servía para la anterior no
 * dice nada de la nueva.
 */
export function PortadaLibroField({
  value, x, y, colorHoja, onChange,
}: {
  value: string;
  x: number;
  y: number;
  colorHoja: string;
  onChange: (patch: { portada?: string; portadaX?: number; portadaY?: number }) => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  function posicionDesde(clientX: number, clientY: number) {
    const rect = caja.current?.getBoundingClientRect();
    if (!rect) return null;
    const px = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const py = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    return { px, py };
  }

  function mover(clientX: number, clientY: number) {
    const p = posicionDesde(clientX, clientY);
    if (p) onChange({ portadaX: Math.round(p.px), portadaY: Math.round(p.py) });
  }

  return (
    <div className={styles.portadaLibro}>
      {value && (
        <>
          <div
            ref={caja}
            className={styles.portadaLibroCaja}
            data-arrastrando={arrastrando || undefined}
            style={{
              backgroundColor: colorHoja || "#fffdf8",
              backgroundImage: `url("${value}")`,
              backgroundSize: "cover",
              backgroundPosition: `${x}% ${y}%`,
            }}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              setArrastrando(true);
              mover(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => { if (arrastrando) mover(e.clientX, e.clientY); }}
            onPointerUp={() => setArrastrando(false)}
            onPointerLeave={() => setArrastrando(false)}
          >
            <span className={styles.portadaLibroMarca} style={{ left: `${x}%`, top: `${y}%` }} />
          </div>
          <p className="field-help">
            Así se va a ver. Arrastra dentro del recuadro para elegir qué parte de la
            foto queda a la vista — el resto se recorta, igual que aquí.
          </p>
        </>
      )}

      <ImageField
        value={value}
        kind="foto"
        onChange={(url) => onChange({ portada: url, portadaX: 50, portadaY: 50 })}
      />
    </div>
  );
}
