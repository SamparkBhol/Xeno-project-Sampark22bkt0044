import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/SessionProvider"; // This is the line we added

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// We've updated the metadata to be more descriptive
export const metadata: Metadata = {
  title: "Xeno Insights Dashboard",
  description: "Shopify Data Ingestion & Insights Service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* This AuthProvider wrapper is the critical change */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

