"use client";

import { useRef, useState } from "react";
import { Libro, type DeseoLeido } from "./Libro";
import { Formulario } from "./Formulario";
import styles from "./deseos.module.css";

/**
 * Junta el libro y el formulario en un solo componente de cliente porque
 * tienen que compartir estado: sin esto, firmar un deseo lo guarda en la
 * base pero el libro que ya está en pantalla —lleno con lo que trajo el
 * servidor al abrir la página— no se entera, y hacía falta recargar para
 * verlo. Aquí el deseo entra a la lista en el momento mismo en que el
 * formulario confirma que se guardó, y el libro salta a esa página para
 * que quien acaba de escribir vea que ya quedó.
 */
export function LibroConFormulario({
  slug, portada, portadaX, portadaY, colorHoja, colorLetra, deseosIniciales, esOrganizador, token,
}: {
  slug: string;
  portada: string;
  portadaX: number;
  portadaY: number;
  colorHoja: string;
  colorLetra: string;
  deseosIniciales: DeseoLeido[];
  esOrganizador: boolean;
  /** El `manageToken` de quien organiza sin cuenta: sólo hace falta para el
   *  enlace de descargar el PDF, que igual que las fotos pide sesión o
   *  token por `?t=`. */
  token?: string;
}) {
  const [deseos, setDeseos] = useState<DeseoLeido[]>(deseosIniciales);
  const [saltarA, setSaltarA] = useState<number | null>(null);
  const detalleRef = useRef<HTMLDetailsElement>(null);

  function alFirmar(nuevo: { nombre: string; texto: string }) {
    setDeseos((prev) => {
      const lista = [...prev, { id: `nuevo-${prev.length}-${Date.now()}`, ...nuevo }];
      setSaltarA(lista.length); // la página del deseo recién agregado
      return lista;
    });
    if (detalleRef.current) detalleRef.current.open = false;
  }

  return (
    <>
      <Libro
        slug={slug}
        portada={portada}
        portadaX={portadaX}
        portadaY={portadaY}
        colorHoja={colorHoja}
        colorLetra={colorLetra}
        deseos={deseos}
        esOrganizador={esOrganizador}
        saltarA={saltarA}
        token={token}
      />
      <details className={styles.escribir} ref={detalleRef}>
        <summary>Escribir mi deseo</summary>
        <Formulario slug={slug} onFirmado={alFirmar} />
      </details>
    </>
  );
}
