import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const instrumentSans = localFont({
  src: [
    { path: "./fonts/InstrumentSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/InstrumentSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/InstrumentSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-instrument-sans",
  display: "swap",
});

const instrumentSansCondensed = localFont({
  src: [
    { path: "./fonts/InstrumentSansCondensed-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSansCondensed-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-instrument-sans-condensed",
  display: "swap",
});

const sourceCodePro = localFont({
  src: "./c9e42e3eae6237c2-s.p.24d96596.woff2",
  variable: "--font-source-code",
  weight: "200 900",
  display: "swap",
});

const instrumentSerif = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "peard — Discover Coins",
  description: "Discover trending community coins on peard.",
  icons: { icon: "/favicon.png", apple: "/peard.webp" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${instrumentSans.variable} ${instrumentSansCondensed.variable} ${sourceCodePro.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
