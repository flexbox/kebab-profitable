import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import { MEETUP_URL, NAVY, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

// One readable typeface for the whole interface.
const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Indie Hackers Lille", url: MEETUP_URL }],
  category: "game",
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    url: "/",
    type: "website",
    locale: "fr_FR",
    alternateLocale: "en_GB",
  },
  // The picture itself is `opengraph-image.png`, next to this file: X shows it large.
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: NAVY,
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
