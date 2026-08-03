import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GearUp — Rent Sports & Outdoor Gear Instantly",
    template: "%s · GearUp",
  },
  description:
    "A premium rentals marketplace for sports and outdoor gear. Browse curated equipment, book by the day, and pay securely.",
  applicationName: "GearUp",
  authors: [{ name: "GearUp" }],
  keywords: [
    "GearUp",
    "sports gear rental",
    "outdoor equipment",
    "premium rentals",
    "Next.js",
  ],
  openGraph: {
    type: "website",
    title: "GearUp — Rent Sports & Outdoor Gear Instantly",
    description:
      "A premium rentals marketplace for sports and outdoor gear. Browse curated equipment, book by the day, and pay securely.",
    siteName: "GearUp",
  },
  twitter: {
    card: "summary_large_image",
    title: "GearUp — Rent Sports & Outdoor Gear Instantly",
    description: "Premium rentals marketplace for sports and outdoor gear.",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <div className="relative isolate flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
