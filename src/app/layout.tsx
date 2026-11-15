import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kebab Profitable",
  description:
    "Un jeu parodique sur la vie d'indie hacker, par Indie Hackers Lille. Objectif : 270 € de MRR, le prix d'un kebab par jour.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
