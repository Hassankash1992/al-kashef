import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EventFace - معارض الفعاليات الذكية",
  description: "منصة معارض صور الفعاليات مع البحث بالوجه",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
        <body className="min-h-full bg-zinc-50 text-zinc-900 font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
