import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeedDesk",
  description: "Seed dealer billing and lot inventory SaaS"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
