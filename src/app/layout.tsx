import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeScript } from "@/components/ui/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "TBO Assemble | The Operating System for Group Travel",
    template: "%s | TBO Assemble",
  },
  description:
    "AI-orchestrated Group Inventory Management Platform for MICE conferences, destination weddings & corporate retreats. Smart room-block allocation, real-time attrition tracking, and automated guest communication.",
  keywords: [
    "group travel",
    "MICE",
    "hotel room block",
    "wedding management",
    "TBO",
    "travel technology",
    "attrition management",
    "room allocation",
  ],
  authors: [{ name: "TBO Assemble" }],
  openGraph: {
    title: "TBO Assemble — Smart Group Travel OS",
    description:
      "AI-powered hotel room block management for MICE events and destination weddings. Replace spreadsheets with intelligence.",
    type: "website",
    siteName: "TBO Assemble",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "TBO Assemble — Smart Group Travel OS",
    description:
      "AI-powered hotel room block management for MICE events and destination weddings.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Toaster>
          {children}
        </Toaster>
      </body>
    </html>
  );
}
