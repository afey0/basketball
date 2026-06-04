import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import PwaRegister from "@/components/layout/PwaRegister";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Basketball Club CRM",
  description: "Manage your basketball training club — students, payments, attendance, and more.",
  appleWebApp: {
    capable: true,
    title: "MBC CRM",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-[#f8fafc] text-[#0f172a]`}>
        <PwaRegister />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

