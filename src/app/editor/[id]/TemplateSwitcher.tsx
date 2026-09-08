"use client";

import { useEffect } from "react";
import { SECTIONS, type InvitationData } from "@/lib/schema";
import type { TemplateInfo } from "@/lib/templates";
import type { TemplateSupport } from "@/lib/support";
import styles from "./editor.module.css";

interface Props {
  templates: TemplateInfo[];
  supports: Record<string, TemplateSupport>;
  current: string;
  data: InvitationData;
  onPick: (id: string) => void;
  onClose: () => void;
}

/**
 * Cambiar de diseño no pierde contenido: todos los diseños leen el mismo
 * esquema. Lo único que puede pasar es que el nuevo no tenga dónde mostrar
 * algo que ya escribiste, así que se avisa antes.
 */
export function TemplateSwitcher({
  templates, supports, current, data, onPick, onClose,
}: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  function losses(templateId: string): string[] {
    const support = supports[templateId];
    if (!support) return [];
    const out: string[] = [];
    for (const spec of SECTIONS) {
      const d = data[spec.key];
      if (!d) continue;
      if (spec.key !== "event" && !support.sections.includes(spec.key)) {
        if (d.enabled !== false) out.push(spec.label);
        continue;
      }
      for (const f of spec.fields) {
        const v = d[f.key];
        if (typeof v === "string" && v.trim() && !support.fields.includes(`${spec.key}.${f.key}`)) {
          out.push(`${spec.label}: ${f.label.toLowerCase()}`);
        }
      }
      if (spec.list && (d.items as unknown[])?.length && !support.fields.includes(`${spec.key}.items`)) {
        out.push(`${spec.label}: ${spec.list.label.toLowerCase()}`);
      }
    }
    return out;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <header className={styles.sheetHead}>
          <h2 className={styles.dialogTitle}>Cambiar de diseño</h2>
          <p className={styles.dialogText}>
            Tu contenido se conserva tal cual. Si el nuevo diseño no tiene dónde
            poner algo, te lo aviso aquí abajo.
          </p>
        </header>

        <div className={styles.sheetGrid}>
          {templates.map((t) => {
            const lost = losses(t.id);
            const isCurrent = t.id === current;
            return (
              <button
                key={t.id}
                className={styles.sheetCard}
                data-current={isCurrent}
                disabled={isCurrent}
                onClick={() => onPick(t.id)}
              >
                <span className={styles.sheetFrame}>
                  <iframe
                    src={`/api/plantilla/${t.id}`}
                    title={t.name}
                    loading="lazy"
                    scrolling="no"
                    tabIndex={-1}
                  />
                </span>
                <span className={styles.sheetName}>
                  {t.name}
                  {isCurrent && <span className="tag">Actual</span>}
                </span>
                {lost.length > 0 && !isCurrent && (
                  <span className={styles.sheetWarn}>
                    No muestra: {lost.slice(0, 3).join(", ")}
                    {lost.length > 3 ? ` y ${lost.length - 3} más` : ""}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <footer className={styles.sheetFoot}>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
}
