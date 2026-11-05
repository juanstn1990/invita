"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./regalos.module.css";

export interface RegaloRueda {
  id: string;
  nombre: string;
  nota: string;
  imagen: string;
  cupo: number;
  libres: number;
  mio: boolean;
}

interface Premio {
  id: string;
  nombre: string;
  nota: string;
  imagen: string;
}

export type Giro =
  | { ok: true; regalo: Premio }
  | { ok: false };

/** Lo que tarda la rueda en parar. Se la damos al CSS desde aquí para que
    la espera y la animación no puedan desajustarse. */
const DURACION = 5400;
/** Vueltas enteras antes de frenar, para que se vea rodar y no saltar. */
const VUELTAS = 6;

/**
 * La ruleta de regalos.
 *
 * **La rueda no sortea nada.** Toca girar, el servidor aparta un regalo en
 * la base y contesta cuál; sólo entonces empieza a moverse, y se mueve hasta
 * ese gajo. Al revés —sortear aquí y avisar después— dos invitadas girando
 * en el mismo segundo sacan el mismo regalo, porque cada teléfono sortea
 * sobre su copia de la lista y las dos copias dicen que está libre. Ver
 * `girarRuleta`.
 *
 * De ahí sale la única regla rara de este archivo: **el gajo ganador tiene
 * que estar en la rueda antes de empezar a girar**. La lista que se está
 * mirando puede tener cinco segundos y no incluirlo —otra acaba de soltar
 * algo, o la nuestra es la primera visita de la tarde—, así que si el
 * servidor devuelve uno que no está dibujado, se dibuja y se espera a que
 * pinte antes de arrancar. La alternativa era girar hasta un gajo cualquiera
 * y luego enseñar otro nombre en la tarjeta, que es la clase de detalle por
 * la que una ruleta deja de parecer de verdad.
 */
export function Ruleta({
  regalos,
  puedeGirar,
  girar,
  alTerminar,
}: {
  regalos: RegaloRueda[];
  /** Falso mientras la lista no esté abierta o se entre sin enlace. */
  puedeGirar: boolean;
  girar: () => Promise<Giro>;
  /** La rueda paró: ya se puede volver a refrescar la lista. */
  alTerminar: () => void;
}) {
  /* Lo que hay dibujado. No es `regalos` directamente: mientras gira, y una
     vez que salió el premio, la rueda se queda quieta aunque la lista de
     abajo siga refrescándose. Si no, el gajo de una se movería de sitio cada
     vez que otra invitada gira. */
  const [gajos, setGajos] = useState<Premio[]>([]);
  const [vuelta, setVuelta] = useState(0);
  const [animar, setAnimar] = useState(false);
  const [girando, setGirando] = useState(false);
  const [premio, setPremio] = useState<Premio | null>(null);
  const quieta = useRef(false);

  const enRueda = regalos.filter((r) => r.libres > 0 || r.mio);
  /* Los ids en orden: es lo que de verdad cambia la rueda. Comparar el
     arreglo entero volvería a dibujar en cada sondeo aunque no cambie nada. */
  const firma = enRueda.map((r) => r.id).join(",");

  useEffect(() => {
    if (quieta.current || girando) return;
    setGajos(
      enRueda.map((r) => ({ id: r.id, nombre: r.nombre, nota: r.nota, imagen: r.imagen }))
    );
    /* `enRueda` se arma en cada render; la firma es lo que dice si cambió. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, girando]);

  /* Quien ya giró y vuelve a entrar: la rueda aparece parada en su regalo,
     sin animación. Es la misma pantalla que dejó, no una ruleta por girar. */
  useEffect(() => {
    if (quieta.current || girando || !gajos.length) return;
    const mio = regalos.find((r) => r.mio);
    if (!mio) return;
    const i = gajos.findIndex((g) => g.id === mio.id);
    if (i < 0) return;
    quieta.current = true;
    setAnimar(false);
    setVuelta(detener(i, gajos.length));
    setPremio({ id: mio.id, nombre: mio.nombre, nota: mio.nota, imagen: mio.imagen });
  }, [gajos, regalos, girando]);

  const tirar = useCallback(async () => {
    if (girando || quieta.current || !gajos.length) return;
    setGirando(true);

    const r = await girar();
    if (!r.ok) {
      /* El mensaje lo pinta quien nos llama, que es quien habló con el
         servidor; aquí sólo se suelta el botón. */
      setGirando(false);
      return;
    }

    let lista = gajos;
    let i = lista.findIndex((g) => g.id === r.regalo.id);
    if (i < 0) {
      lista = [...gajos, r.regalo];
      setGajos(lista);
      i = lista.length - 1;
    }
    quieta.current = true;

    /* Dos cuadros: uno para que React pinte el gajo que pueda faltar y otro
       para que el navegador lo tenga ya en pantalla. Arrancar la transición
       en el mismo cuadro en que aparece el gajo la deja sin punto de
       partida y la rueda salta al final sin rodar. */
    await nuevoCuadro();
    await nuevoCuadro();

    const lento = !ahorraMovimiento();
    setAnimar(lento);
    setVuelta((v) => destino(v, i, lista.length));
    setTimeout(() => {
      setGirando(false);
      setPremio(r.regalo);
      alTerminar();
    }, lento ? DURACION : 0);
  }, [gajos, girar, girando, alTerminar]);

  const vacia = !enRueda.length;

  return (
    <>
      <div className={styles.ruedaZona}>
        <div className={styles.aguja} />
        <div
          className={styles.ruedaGiro}
          style={{
            transform: `rotate(${vuelta.toFixed(2)}deg)`,
            transitionDuration: animar ? `${DURACION}ms` : "0ms",
          }}
        >
          <Rueda gajos={gajos} />
        </div>
        <button
          className={styles.eje}
          onClick={tirar}
          disabled={!!premio || girando || vacia || !puedeGirar}
        >
          {premio ? "YA ESTÁ" : girando ? "…" : vacia ? "VACÍA" : "GIRAR"}
        </button>
      </div>

      {premio && (
        <div className={styles.premio}>
          <p className={styles.premioTitulo}>Te tocó</p>
          {premio.imagen && <img className={styles.premioFoto} src={premio.imagen} alt="" />}
          <p className={styles.premioNombre}>{premio.nombre}</p>
          {premio.nota && <p className={styles.premioNota}>{premio.nota}</p>}
        </div>
      )}

      {!premio && vacia && (
        <p className={styles.aviso}>Ya no queda nada por repartir.</p>
      )}

      <p className={styles.listaTitulo}>Toda la lista</p>
      <ul className={styles.rejilla}>
        {regalos.map((r) => {
          const tomado = r.libres <= 0 && !r.mio;
          return (
            <li
              key={r.id}
              className={`${styles.ficha} ${r.mio ? styles.fichaMia : ""} ${
                tomado ? styles.fichaTomada : ""
              }`}
            >
              {r.imagen && <img className={styles.foto} src={r.imagen} alt="" />}
              <div className={styles.datos}>
                <p className={styles.nombre}>{r.nombre}</p>
                {r.nota && <p className={styles.nota}>{r.nota}</p>}
              </div>
              {r.mio ? (
                <span className={styles.yaEsta}>Te tocó</span>
              ) : tomado ? (
                <span className={styles.yaEsta}>Ya lo llevan</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
   El dibujo
   ──────────────────────────────────────────────────────────────── */

const R = 190;
/** El cubo del centro, que tapa las puntas de los gajos. */
const CUBO = 48;
/**
 * Los tintes de los gajos, en ciclo.
 *
 * No son colores sino variables, y los calcula el CSS aclarando el acento
 * del diseño. Puestos a mano, la ruleta salía rosa encima de una invitación
 * malva y se veía como una pantalla pegada de otra aplicación — que es
 * justo lo que el resto de esta página evita sacando su color de la paleta.
 *
 * El ciclo es impar a propósito: con uno par, una lista con un número par de
 * regalos deja dos gajos del mismo color pegados en la costura.
 */
const TINTES = [
  "var(--gajo-1)", "var(--gajo-2)", "var(--gajo-3)", "var(--gajo-4)", "var(--gajo-5)",
];

function Rueda({ gajos }: { gajos: Premio[] }) {
  const n = gajos.length;
  return (
    <svg viewBox="-200 -200 400 400" aria-hidden="true">
      {n === 0 && <circle r={R} fill="var(--gajo-2)" />}
      {n === 1 && <circle r={R} fill={TINTES[0]} stroke="#fff" strokeWidth={3} />}
      {n > 1 &&
        gajos.map((g, i) => (
          <path
            key={g.id}
            d={tajada(i, n)}
            fill={TINTES[i % TINTES.length]}
            stroke="#fff"
            strokeWidth={3}
          />
        ))}
      {gajos.map((g, i) => (
        <Nombre key={g.id} nombre={g.nombre} angulo={n === 1 ? -90 : centroDe(i, n)} gajos={n} />
      ))}
      <circle r={R} fill="none" stroke="#fff" strokeWidth={6} />
    </svg>
  );
}

/** El ángulo donde mira el centro del gajo, en grados de SVG (0 = este). */
function centroDe(i: number, n: number): number {
  return -90 + (i + 0.5) * (360 / n);
}

function tajada(i: number, n: number): string {
  const paso = 360 / n;
  const a1 = (-90 + i * paso) * (Math.PI / 180);
  const a2 = a1 + paso * (Math.PI / 180);
  const grande = paso > 180 ? 1 : 0;
  const x1 = (R * Math.cos(a1)).toFixed(2), y1 = (R * Math.sin(a1)).toFixed(2);
  const x2 = (R * Math.cos(a2)).toFixed(2), y2 = (R * Math.sin(a2)).toFixed(2);
  return `M 0 0 L ${x1} ${y1} A ${R} ${R} 0 ${grande} 1 ${x2} ${y2} Z`;
}

/**
 * El nombre, escrito a lo largo del radio de su gajo.
 *
 * Dos cosas distintas limitan la letra: cuántos gajos hay —que decide el
 * grueso, o sea el alto— y lo largo del nombre —que decide si cabe en el
 * radio—. Se toma la menor de las dos y sólo se corta lo que ni encogiendo
 * entra, para que «Zapatillas de casa» quepa entero, que es lo que uno
 * escribe de verdad en una lista.
 *
 * Los gajos de la mitad izquierda se escriben dados la vuelta. Si no, el
 * mismo giro que los coloca los deja boca abajo y media ruleta se lee con la
 * cabeza torcida.
 */
function Nombre({ nombre, angulo, gajos }: { nombre: string; angulo: number; gajos: number }) {
  const largo = R - 16 - CUBO;
  const porGajo = gajos <= 6 ? 15 : gajos <= 9 ? 13 : gajos <= 12 ? 11.5 : 10;
  const tope = Math.floor(largo / (8.5 * 0.56));
  const corto = nombre.length > tope ? `${nombre.slice(0, tope - 1).trim()}…` : nombre;
  const tam = Math.max(8.5, Math.min(porGajo, largo / (corto.length * 0.56)));
  const vuelto = Math.cos((angulo * Math.PI) / 180) < 0;
  return (
    <text
      transform={`rotate(${(vuelto ? angulo + 180 : angulo).toFixed(2)})`}
      x={vuelto ? -(R - 16) : R - 16}
      y={0}
      textAnchor={vuelto ? "start" : "end"}
      dominantBaseline="central"
      fontSize={tam.toFixed(1)}
      fontWeight={600}
      fill="var(--gajo-letra)"
    >
      {corto}
    </text>
  );
}

/* ────────────────────────────────────────────────────────────────
   El giro
   ──────────────────────────────────────────────────────────────── */

/** Dónde queda la rueda para que el gajo `i` mire a la aguja de arriba. */
function detener(i: number, n: number): number {
  const paso = 360 / n;
  return (360 - (i * paso + paso / 2) + 360) % 360;
}

/**
 * A cuánto hay que llevar la rueda para frenar en el gajo `i`.
 *
 * Se parte de donde está —el giro sólo crece, nunca retrocede— y se añaden
 * las vueltas enteras más lo que falte para dejar ese gajo arriba. El desvío
 * al azar es para que no clave siempre el mismo punto del gajo, y se queda
 * dentro con un margen para no frenar justo encima de la raya.
 */
function destino(actual: number, i: number, n: number): number {
  const paso = 360 / n;
  const desvio = (Math.random() - 0.5) * paso * 0.6;
  const sobra = ((actual % 360) + 360) % 360;
  return actual + 360 * VUELTAS + (detener(i, n) - desvio) - sobra;
}

function nuevoCuadro(): Promise<void> {
  return new Promise((listo) => requestAnimationFrame(() => listo()));
}

/** Quien pidió menos movimiento ve el resultado, no el viaje. */
function ahorraMovimiento(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}
