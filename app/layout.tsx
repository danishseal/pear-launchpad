import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const inter = localFont({
  src: "./83afe278b6a6bb3c-s.p.3a6ba036.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

const sourceCodePro = localFont({
  src: "./c9e42e3eae6237c2-s.p.24d96596.woff2",
  variable: "--font-source-code",
  weight: "200 900",
  display: "swap",
});

const instrumentSerif = localFont({
  src: "./e41d5df559864f9e-s.p.380d09ea.woff2",
  variable: "--font-instrument-serif",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "peard — Discover Coins",
  description: "Discover trending community coins on peard.",
  icons: { icon: "/peard.webp", apple: "/peard.webp" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${sourceCodePro.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
