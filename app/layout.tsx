import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "./register-sw";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  title: "HibiLog",
  description: "思い出を食べるバクを育てよう",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} antialiased`}>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
