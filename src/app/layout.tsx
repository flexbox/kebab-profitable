import type { Metadata, Viewport } from "next";
import { Geist, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const display = Pixelify_Sans({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const body = Geist({
  variable: "--font-body",
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
  themeColor: "#1a1423",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
