"use client";

import styles from "./editor.module.css";

export interface RsvpRow {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  partySize: number;
  note: string | null;
  createdAt: string;
}

const LABEL: Record<string, string> = {
  confirmado: "Asiste",
  rechazado: "No asiste",
  quiza: "Tal vez",
};

export function RsvpList({
  rsvps, published, slug,
}: {
  rsvps: RsvpRow[];
  published: boolean;
  slug: string;
}) {
  if (!published) {
    return (
      <p className={styles.panelNote}>
        Todavía no has publicado la invitación. Cuando lo hagas, las
        confirmaciones que lleguen a <b className="mono">/{slug}</b> aparecerán aquí.
      </p>
    );
  }

  if (rsvps.length === 0) {
    return (
      <p className={styles.panelNote}>
        Sin confirmaciones todavía. Comparte el link y aparecerán aquí — esta
        lista se actualiza al recargar la página.
      </p>
    );
  }

  const going = rsvps.filter((r) => r.status === "confirmado");
  const people = going.reduce((n, r) => n + r.partySize, 0);

  const csv = () => {
    const rows = [
      ["Nombre", "Estado", "Personas", "Teléfono", "Nota", "Fecha"],
      ...rsvps.map((r) => [
        r.name, LABEL[r.status] ?? r.status, String(r.partySize),
        r.phone ?? "", r.note ?? "", new Date(r.createdAt).toLocaleString("es-CO"),
      ]),
    ];
    const body = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${body}`], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `confirmaciones-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.rsvpWrap}>
      <div className={styles.rsvpSummary}>
        <b>{people}</b> {people === 1 ? "persona confirmada" : "personas confirmadas"}
        <span> · {rsvps.length} {rsvps.length === 1 ? "respuesta" : "respuestas"}</span>
        <button className="btn btn-sm" onClick={csv}>Descargar CSV</button>
      </div>

      <ul className={styles.rsvpList}>
        {rsvps.map((r) => (
          <li key={r.id} className={styles.rsvpRow} data-status={r.status}>
            <div className={styles.rsvpTop}>
              <span className={styles.rsvpName}>{r.name}</span>
              <span className={styles.rsvpStatus}>{LABEL[r.status] ?? r.status}</span>
            </div>
            <div className={styles.rsvpMeta}>
              {r.status === "confirmado" && r.partySize > 1 && `${r.partySize} personas · `}
              {r.phone && `${r.phone} · `}
              {new Date(r.createdAt).toLocaleDateString("es-CO", {
                day: "numeric", month: "short",
              })}
            </div>
            {r.note && <p className={styles.rsvpNote}>“{r.note}”</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
