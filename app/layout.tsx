import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oddly Specific — Making ideas harder to ignore",
  description:
    "Oddly Specific is a boutique creative studio working in brands, stories, interfaces and other rabbit holes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}
        {/* blue-purple gradient wash, then film grain + vignette */}
        <div className="aurora" aria-hidden />
        <div className="grain" aria-hidden />
        <div className="vignette" aria-hidden />
      </body>
    </html>
  );
}
