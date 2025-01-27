'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getDatabase } from '@/lib/db';
import { 
  ArrowLeftIcon, 
  SaveIcon, 
  PrinterIcon, 
  DownloadIcon, 
  MailIcon 
} from 'lucide-react';
import { OfferPDF } from '@/components/offer/OfferPDF';
import type { Offer } from '@/lib/db/interfaces';
import { calculateInvoiceTotals, formatCurrency } from '@/lib/invoice-utils';

interface OfferPosition {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

interface OfferDraft {
  id: string;
  number: string;
  date: Date;
  validUntil: Date;
  recipient: {
    name: string;
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
    taxId?: string;
  };
  positions: OfferPosition[];
  totalNet: number;
  totalGross: number;
  vatAmount?: number;
  vatAmounts?: { [key: string]: number };
  notes?: string;
  status: 'entwurf' | 'offen' | 'angenommen' | 'abgelehnt' | 'abgelaufen';
  createdAt: Date;
  updatedAt: Date;
}

function OfferPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [offer, setOffer] = useState<OfferDraft | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadOfferData = async () => {
      try {
        setIsLoading(true);
        const number = searchParams.get('number');
        if (!number) {
          toast({
            title: "Fehler",
            description: "Keine Angebotsnummer gefunden",
            variant: "destructive"
          });
          router.push('/angebote');
          return;
        }

        const db = getDatabase();
        const offers = await db.listOffers();
        
        // Bereinige die Suchnummer
        const cleanSearchNumber = number.replace(/^0+/, '');
        
        // Suche nach dem Angebot und berücksichtige null-Werte
        const foundOffer = offers.find(off => {
          if (!off || !off.number) return false;
          const cleanOfferNumber = off.number.replace(/^0+/, '');
          return cleanOfferNumber === cleanSearchNumber;
        });
        
        if (!foundOffer) {
          // Versuche die Daten aus dem localStorage zu laden
          const draftData = localStorage.getItem(`offer_draft_${cleanSearchNumber}`);
          if (draftData) {
            const parsedDraft = JSON.parse(draftData);
            setOffer(parsedDraft);
          } else {
            toast({
              title: "Fehler",
              description: "Angebot nicht gefunden",
              variant: "destructive"
            });
            router.push('/angebote');
            return;
          }
        } else {
          // Berechne die Gesamtsummen neu
          const totals = calculateInvoiceTotals(foundOffer);
          const offer = {
            ...foundOffer,
            totalNet: totals.netTotal,
            totalGross: totals.grossTotal,
            vatAmount: totals.totalVat,
            vatAmounts: totals.vatAmounts
          };

          setOffer(offer);
        }

        // Lade Einstellungen
        const loadedSettings = await db.getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Fehler beim Laden der Angebotsdaten:', error);
        toast({
          title: "Fehler",
          description: "Die Angebotsdaten konnten nicht geladen werden.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOfferData();
  }, [searchParams, router, toast]);

  const handleBack = () => {
    router.push(`/angebote/neu?number=${offer?.number}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!offer) return;

    try {
      toast({
        title: "PDF wird erstellt",
        description: "Bitte warten Sie einen Moment...",
      });

      const response = await fetch('/api/offer/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offer, settings })
      });

      if (!response.ok) {
        throw new Error('PDF konnte nicht erstellt werden');
      }

      // PDF-Blob erstellen und herunterladen
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Angebot-${offer.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF erfolgreich erstellt",
        description: "Das Angebot wurde als PDF exportiert.",
      });

    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Lade Angebot...</div>;
  }

  if (!offer) {
    return <div>Angebot nicht gefunden</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="outline"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Zurück
        </Button>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <PrinterIcon className="w-4 h-4" />
            Drucken
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none">
        <OfferPDF offer={offer} settings={settings} />
      </div>
    </div>
  );
}

export default function OfferPreviewPage() {
  return (
    <Suspense fallback={<div>Lade...</div>}>
      <OfferPreviewContent />
    </Suspense>
  );
}
