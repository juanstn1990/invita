"use client";

import { useEffect, useState } from "react";
import { Galeria, type Foto } from "../../editor/[id]/fotos/Galeria";
import { CLAVE_MIS_FOTOS } from "./misFotos";

/**
 * "Cada quien ve sólo las suyas": pide al servidor exactamente los ids que
 * este navegador recuerda haber subido (ver `misFotos.ts` y `Camara.tsx`), y
 * pinta el mismo componente de galería que usa el panel del organizador —
 * sin poder borrar, que es lo único que sigue siendo suyo.
 */
export function GaleriaPropia({ slug }: { slug: string }) {
  const [fotos, setFotos] = useState<Foto[] | null>(null);

  useEffect(() => {
    let vivo = true;
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem(CLAVE_MIS_FOTOS(slug)) || "[]");
    } catch {}
    if (!ids.length) { setFotos([]); return; }

    fetch(`/api/i/${slug}/fotos/mias?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((j) => { if (vivo) setFotos(j.fotos || []); })
      .catch(() => { if (vivo) setFotos([]); });
    return () => { vivo = false; };
  }, [slug]);

  if (fotos === null) return null;
  if (!fotos.length) {
    return <p style={{ textAlign: "center", color: "#8a8177", fontSize: 13.5 }}>Todavía no has subido ninguna foto.</p>;
  }
  return <Galeria invitationId={slug} inicial={fotos} puedeBorrar={false} />;
}
