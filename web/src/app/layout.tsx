import type { Metadata } from "next";
import "./globals.css";
import "pdfjs-dist/web/pdf_viewer.css";

export const metadata: Metadata = {
  title: "Pathfinder Campaign",
  description: "A private campaign atlas and management workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
