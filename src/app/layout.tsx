import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "EventFace - معارض الفعاليات الذكية",
  description: "منصة معارض صور الفعاليات مع البحث بالوجه",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl" className={`${geist.variable} h-full antialiased`}>
        <body className="min-h-full bg-gray-50 text-gray-900">{children}</body>
      </html>
    </ClerkProvider>
  );
}
