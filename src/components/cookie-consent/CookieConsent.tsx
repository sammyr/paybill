'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Wir respektieren Ihre Privatsphäre</h3>
            <p className="text-gray-600">
              Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
              Einige sind notwendig für den Betrieb der Website, während andere uns helfen, 
              die Website zu verbessern und Ihnen personalisierte Inhalte anzubieten. 
              Weitere Informationen finden Sie in unserer{' '}
              <a href="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</a>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleAcceptNecessary}
              className="whitespace-nowrap"
            >
              Nur notwendige
            </Button>
            <Button
              onClick={handleAcceptAll}
              className="whitespace-nowrap"
            >
              Alle akzeptieren
            </Button>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
