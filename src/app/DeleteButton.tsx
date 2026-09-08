"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setConfirming(true)}
        title="Eliminar invitación"
      >
        ✕
      </button>
    );
  }

  return (
    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>¿Eliminar?</span>
      <button
        className="btn btn-sm btn-danger"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await fetch(`/api/invitations/${id}`, { method: "DELETE" });
          router.refresh();
        }}
      >
        Sí
      </button>
      <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>
        No
      </button>
    </span>
  );
}
