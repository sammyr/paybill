import { Open_Sans } from 'next/font/google'
import { Metadata } from 'next'
import "./globals.css";
import LayoutClient from './layout-client';

const openSans = Open_Sans({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Paybill",
  description: "Rechnungen einfach erstellen und verwalten",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className={`${openSans.className} antialiased`}>
        <LayoutClient>
          {children}
        </LayoutClient>
      </body>
    </html>
  );
}
