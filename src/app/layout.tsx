import type { Metadata, Viewport } from "next";
import { Big_Shoulders_Stencil, IBM_Plex_Mono, VT323 } from "next/font/google";
import "./globals.css";

// Stencilled lettering for the console, a terminal face for its screens and a
// typewriter-ish monospace for everything bolted around them.
const display = Big_Shoulders_Stencil({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  // Next has no fallback metrics for this face; the CSS names its own fallback.
  adjustFontFallback: false,
});

const term = VT323({
  variable: "--font-term",
  weight: "400",
  subsets: ["latin", "latin-ext"],
});

const body = IBM_Plex_Mono({
  variable: "--font-body",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});

const description =
  "Un jeu parodique sur la vie d'indie hacker, par Indie Hackers Lille. Objectif : 270 € de MRR, le prix d'un kebab par jour.";

export const metadata: Metadata = {
  metadataBase: new URL("https://kebab-profitable.vercel.app"),
  title: "Kebab Profitable",
  description,
  openGraph: {
    title: "Kebab Profitable",
    description,
    type: "website",
    locale: "fr_FR",
    alternateLocale: "en_GB",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0b09",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${term.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
