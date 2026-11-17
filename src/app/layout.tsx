import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import "./globals.css";

// One readable typeface for the whole interface.
const sans = Inter({
  variable: "--font-sans",
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
  themeColor: "#0e2439",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={sans.variable}>
      <body>
        {children}
        {/* Page views, counted by Vercel without cookies. */}
        <Analytics />
      </body>
    </html>
  );
}
