// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineDetector from "@/components/OfflineDetector";

export const metadata: Metadata = {
  title: "Smart Sales - Gestión Inteligente de Ventas",
  description: "Tu plataforma de gestión de ventas inteligente con predicciones ML, análisis en tiempo real y gestión completa de inventario",
  keywords: ["ventas", "gestión", "inventario", "predicciones", "ML", "análisis", "farmacia", "e-commerce"],
  authors: [{ name: "Smart Sales Team" }],
  creator: "Smart Sales",
  publisher: "Smart Sales",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Sales",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Smart Sales",
    title: "Smart Sales - Gestión Inteligente de Ventas",
    description: "Tu plataforma de gestión de ventas inteligente con predicciones ML y análisis en tiempo real",
  },
  twitter: {
    card: "summary",
    title: "Smart Sales",
    description: "Tu plataforma de gestión de ventas inteligente",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <NavBar />
        <main>{children}</main>
        <ChatBot />
        <PWAInstallPrompt />
        <OfflineDetector />
      </body>
    </html>
  );
}
