import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian — Calendar OS",
  description: "Accurate Next.js TypeScript port of Meridian Calendar OS",
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
