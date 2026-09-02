import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Medicompass 迈蒂康 · 全球跨境医旅平台",
    template: "%s · Medicompass 迈蒂康",
  },
  description:
    "Medicompass (迈蒂康) — the world's leading cross-border medical travel platform. AI-powered global medical travel and international second opinions.",
  metadataBase: new URL("https://medicomai.com"),
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
