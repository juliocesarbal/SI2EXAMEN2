// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";

export const metadata: Metadata = {
  title: "Smart Sales",
  description: "Tu plataforma de gestión de ventas inteligente",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <NavBar />
        <main>{children}</main>
        <ChatBot />
      </body>
    </html>
  );
}
