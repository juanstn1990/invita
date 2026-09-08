import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.8rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem" }}>
        No encontramos esta invitación
      </h1>
      <p style={{ color: "var(--text-muted)", maxWidth: "36ch" }}>
        Revisa el link que te compartieron, o vuelve al inicio.
      </p>
      <Link href="/" style={{ color: "var(--accent)" }}>
        ← Volver al inicio
      </Link>
    </main>
  );
}
