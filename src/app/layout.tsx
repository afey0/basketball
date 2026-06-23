import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import PwaRegister from "@/components/layout/PwaRegister";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth()
  const user = session?.user as any
  const clubId = user?.clubId ? parseInt(user.clubId) : null
  let theme = 'default'

  if (clubId) {
    const settings = await prisma.clubSettings.findUnique({
      where: { clubId },
      select: { theme: true }
    })
    if (settings) {
      theme = settings.theme || 'default'
    }
  }

  return (
    <html lang="en" className={`theme-${theme}`}>
      <body className={`${inter.className} antialiased`}>
        <PwaRegister />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

