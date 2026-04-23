import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/providers/toast-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Memoirs | Class Yearbook", template: "%s | Memoirs" },
  description: "The digital yearbook for your graduating class.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-white text-black antialiased">
        <ToastContainer>{children}</ToastContainer>
      </body>
    </html>
  );
}
