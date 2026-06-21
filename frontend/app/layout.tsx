import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SignVerse AI - Research Prototype",
  description: "AI-powered American Sign Language (ASL) research laboratory for gesture tracking and similarity classification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="bg-[#F5EBD7] text-[#2F241F] min-h-screen flex flex-col antialiased selection:bg-[#3D4F73]/20 selection:text-[#2F241F]">
        <Navbar />
        <main className="flex-1 pt-16 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
