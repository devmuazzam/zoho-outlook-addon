import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import Script from 'next/script';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zoho V2 App",
  description: "Full-stack Next.js application with separate backend",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script src="https://appsforoffice.microsoft.com/lib/1.1/hosted/office.js" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}