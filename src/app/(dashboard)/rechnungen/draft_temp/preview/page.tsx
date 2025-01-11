'use client';

import { useState, useEffect } from 'react';
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
import { InvoicePDF } from '@/components/invoice/InvoicePDF';
import type { Invoice } from '@/lib/db/interfaces';

interface InvoicePosition {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

interface InvoiceDraft {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
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
  positions: InvoicePosition[];
  totalNet: number;
  totalGross: number;
  vatAmount?: number;
  vatAmounts?: { [key: string]: number };
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  notes?: string;
  status: 'entwurf' | 'ausstehend' | 'bezahlt' | 'storniert';
  createdAt: Date;
  updatedAt: Date;
}

export default function InvoicePreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceDraft | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        setIsLoading(true);
        const number = searchParams.get('number');
        if (!number) {
          toast({
            title: "Fehler",
            description: "Keine Rechnungsnummer gefunden",
            variant: "destructive"
          });
          router.push('/rechnungen');
          return;
        }

        const db = getDatabase();
        const invoices = await db.listInvoices();
        const foundInvoice = invoices.find(inv => 
          inv.number.replace(/^0+/, '') === number.replace(/^0+/, '')
        );
        
        if (!foundInvoice) {
          toast({
            title: "Fehler",
            description: "Rechnung nicht gefunden",
            variant: "destructive"
          });
          router.push('/rechnungen');
          return;
        }

        setInvoice(foundInvoice);
        
        // Lade Einstellungen
        const loadedSettings = await db.getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Fehler beim Laden der Rechnungsdaten:', error);
        toast({
          title: "Fehler",
          description: "Die Rechnungsdaten konnten nicht geladen werden.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoiceData();
  }, [searchParams]);

  const handleBack = () => {
    router.push(`/rechnungen/neu?number=${invoice?.number}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!invoice) return;

    try {
      toast({
        title: "PDF wird erstellt",
        description: "Bitte warten Sie einen Moment...",
      });

      const response = await fetch('/api/invoice/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice, settings })
      });

      if (!response.ok) {
        throw new Error('PDF konnte nicht erstellt werden');
      }

      // PDF-Blob erstellen und herunterladen
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rechnung-${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF erfolgreich erstellt",
        description: "Die Rechnung wurde als PDF exportiert.",
      });

    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      toast({
        title: "Fehler beim PDF-Export",
        description: "Die PDF konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const handleEmail = async () => {
    // Implementierung für E-Mail
    console.log('Email invoice:', invoice?.id);
  };

  const handleSave = async () => {
    try {
      const db = getDatabase();
      if (!invoice) return;

      await db.updateInvoice(invoice.id, {
        status: 'ausstehend'
      });
      
      toast({
        title: "Erfolg",
        description: "Rechnung wurde finalisiert",
      });
      
      router.push('/rechnungen');
    } catch (error) {
      console.error('Fehler beim Finalisieren:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Finalisieren der Rechnung",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Lade Rechnung...</div>;
  }

  if (!invoice) {
    return <div>Rechnung nicht gefunden</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rechnung #{invoice.number}</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <PrinterIcon className="w-4 h-4 mr-2" />
            Drucken
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleEmail}>
            <MailIcon className="w-4 h-4 mr-2" />
            E-Mail
          </Button>
          <Button onClick={handleSave}>
            <SaveIcon className="w-4 h-4 mr-2" />
            Finalisieren
          </Button>
        </div>
      </div>

      <InvoicePDF invoice={invoice} settings={settings} />
    </div>
  );
}
