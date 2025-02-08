import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from 'react-hot-toast'
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zagabria Apartments",
  description: "Apartment management system for Zagabria Boutique Studio Apartments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className}>
      <body className="bg-gray-50">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
