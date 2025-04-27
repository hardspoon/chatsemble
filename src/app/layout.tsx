import type {Metadata} from 'next/server';
import {Inter} from 'next/font/google';
import './globals.css';
import {SessionProvider} from 'next-auth/react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DocuMind - AI Documentation System',
  description:
    'AI-Driven Documentation Monitoring System with AI-assisted fixes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

