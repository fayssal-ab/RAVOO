import type { Metadata, Viewport } from "next";
import { Chakra_Petch, JetBrains_Mono, Metal_Mania, Pixelify_Sans, Sora } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import "./globals.css";

const metal = Metal_Mania({ subsets: ["latin"], weight: "400", variable: "--nf-metal", display: "swap" });
const chakra = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--nf-chakra", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--nf-sora", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--nf-mono", display: "swap" });
const pixel = Pixelify_Sans({ subsets: ["latin"], variable: "--nf-pixel", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · Leaderboard, Store & Raffles`, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
  icons: { icon: "/icon.png" },
  openGraph: { title: SITE_NAME, description: SITE_TAGLINE, images: ["/og.jpg"] },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#040605" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${metal.variable} ${chakra.variable} ${sora.variable} ${mono.variable} ${pixel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
