'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/navigation/Navigation';
import Footer from '@/components/footer/Footer';
import CookieConsent from '@/components/cookie-consent/CookieConsent';
import { Toaster } from "@/components/ui/toaster";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <>
      {!isDashboard && <Navigation />}
      <main className={!isDashboard ? "min-h-screen pt-16" : "min-h-screen"}>
        {children}
      </main>
      {!isDashboard && <Footer />}
      <CookieConsent />
      <Toaster position="top-center" />
    </>
  );
}
