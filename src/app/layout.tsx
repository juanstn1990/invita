import type { Metadata } from "next";
import { DM_Serif_Display, Quicksand } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
  style: ["normal", "italic"],
});

const body = Quicksand({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Invita — crea tu invitación",
  description: "Elige un diseño, edítalo y publícalo en tu propia dirección.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
