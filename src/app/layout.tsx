import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import { SITE_NAME, SITE_URL, THEME_COLOR } from "@/lib/site";
import "./globals.css";

// One readable typeface for the whole interface.
const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
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
