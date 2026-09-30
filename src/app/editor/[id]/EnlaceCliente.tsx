"use client";

import { useState } from "react";

/**
 * Un enlace para copiar o abrir, con retroalimentación de "Copiado".
 *
 * Lo usan el álbum de fotos y el libro de deseos para el enlace que abre
 * quien organiza sin cuenta —el mismo `manageToken` de `/g/[token]`, pero
 * apuntando a su fotos o su libro en vez de al panel de invitados—, y
 * también para descargar el QR: son tres botones que necesitan el mismo
 * "copiar y avisar", y escribirlo tres veces invitaba a que se desincronizaran.
 */
export function EnlaceCliente({ ruta, texto }: { ruta: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = typeof window === "undefined" ? ruta : `${window.location.origin}${ruta}`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <code className="mono" style={{ fontSize: 13 }}>{texto}</code>
      <button
        type="button"
        className="btn btn-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1800);
          } catch {
            prompt("Copia el enlace:", url);
          }
        }}
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
      <a className="btn btn-ghost btn-sm" href={ruta} target="_blank" rel="noopener">
        Abrir
      </a>
    </div>
  );
}
