import type { Metadata } from "next";
import { Tajawal, Amiri } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EventFace · معارض الفعاليات الذكية",
  description: "صور فعالياتك تصل لضيوفك بسيلفي واحدة فقط",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ar" dir="rtl" className={`${tajawal.variable} ${amiri.variable} h-full antialiased`}>
        <body className="min-h-full bg-[#fafaf7] text-zinc-900 font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
