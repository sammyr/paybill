'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  const params = useParams();
  const invoiceId = params?.id?.toString() || '';
  const [invoice, setInvoice] = useState<InvoiceDraft | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        setIsLoading(true);
        const draftData = localStorage.getItem(`invoice_draft_${invoiceId}`);
        if (draftData) {
          const parsedDraft = JSON.parse(draftData);
          // Entferne führende Nullen von der Rechnungsnummer
          if (parsedDraft.number) {
            parsedDraft.number = parsedDraft.number.replace(/^0+/, '');
          }
          setInvoice(parsedDraft);
        }
        
        // Lade Einstellungen
        const db = getDatabase();
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
  }, [invoiceId]);

  const handleBack = () => {
    // Stelle sicher, dass die Daten im localStorage bleiben
    if (invoice) {
      localStorage.setItem(`invoice_draft_${invoiceId}`, JSON.stringify(invoice));
    }
    router.push('/rechnungen/neu');
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
        body: JSON.stringify({
          invoice: {
            ...invoice,
            vatAmounts: totals.vatAmounts,
            totalVat: totals.totalVat,
            totalNet: totals.netTotal,
            totalGross: totals.grossTotal,
            discountAmount: totals.discountAmount
          },
          settings
        })
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

      // Prüfe ob bereits eine Rechnung mit dieser Nummer existiert
      const existingInvoices = await db.listInvoices();
      const existingInvoice = existingInvoices.find(inv => inv.number === invoice.number);

      // Bereite die Rechnungsdaten vor
      const invoiceToSave = {
        ...invoice,
        status: 'ausstehend',
        updatedAt: new Date().toISOString()
      };

      if (existingInvoice) {
        // Aktualisiere die bestehende Rechnung
        await db.updateInvoice(existingInvoice.id, invoiceToSave);
        toast({
          title: "Erfolg",
          description: "Rechnung wurde aktualisiert",
        });
      } else {
        // Erstelle eine neue Rechnung
        const savedInvoice = await db.createInvoice(invoiceToSave);
        
        // Aktualisiere die ID in der Ansicht
        invoiceToSave.id = savedInvoice.id;
        
        toast({
          title: "Erfolg",
          description: "Neue Rechnung wurde gespeichert",
        });
      }

      // Lösche den Entwurf aus dem localStorage
      if (invoiceId.startsWith('draft_')) {
        localStorage.removeItem(`invoice_draft_${invoiceId}`);
      }

      // Aktualisiere die Rechnungsdaten in der Ansicht
      setInvoice(invoiceToSave);

    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Rechnung konnte nicht gespeichert werden"
      });
    }
  };

  const calculateTotals = (positions: InvoicePosition[], discount?: { type: 'percentage' | 'fixed', value: number }) => {
    // Netto-Summe berechnen
    const netTotal = positions.reduce((sum, pos) => sum + pos.totalNet, 0);

    // Rabatt berechnen
    let discountAmount = 0;
    if (discount) {
      if (discount.type === 'percentage') {
        discountAmount = netTotal * (discount.value / 100);
      } else {
        discountAmount = discount.value;
      }
    }

    // Netto nach Rabatt
    const netAfterDiscount = netTotal - discountAmount;

    // MwSt pro Satz berechnen
    const vatAmounts = positions.reduce((acc, pos) => {
      const positionNet = pos.totalNet;
      // Anteiligen Rabatt für diese Position berechnen
      const positionDiscountRatio = positionNet / netTotal;
      const positionDiscount = discountAmount * positionDiscountRatio;
      const positionNetAfterDiscount = positionNet - positionDiscount;
      
      const vatRate = pos.taxRate;
      if (!acc[vatRate]) {
        acc[vatRate] = 0;
      }
      acc[vatRate] += positionNetAfterDiscount * (vatRate / 100);
      return acc;
    }, {});

    // Gesamte MwSt
    const totalVat = Object.values(vatAmounts).reduce((sum: number, amount: number) => sum + amount, 0);

    // Brutto-Summe
    const grossTotal = netAfterDiscount + totalVat;

    return {
      netTotal,
      discountAmount,
      netAfterDiscount,
      vatAmounts,
      totalVat,
      grossTotal
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Lade Rechnungsdaten...</p>
        </div>
      </div>
    );
  }

  if (!invoice || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Keine Rechnungsdaten gefunden</p>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals(invoice.positions, invoice.discount ? {
    type: invoice.discountType || 'fixed',
    value: invoice.discountValue || invoice.discount
  } : undefined);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        {/* 
          WICHTIG: Diese Navigation darf in Zukunft nicht geändert werden!
          Der Zurück-Button muss immer zur /rechnungen/neu Seite führen, 
          da dies ein essentieller Teil des Workflows ist.
        */}
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zurück
        </Button>
        
        <div className="flex gap-2">
          {/* Speichern Button für neue Rechnungen und Entwürfe */}
          {(!invoice?.id || invoice.id.startsWith('draft_')) && (
            <Button 
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            PDF
          </Button>
          
          <Button
            variant="outline"
            onClick={handleEmail}
            className="flex items-center gap-2"
          >
            <MailIcon className="h-4 w-4" />
            E-Mail
          </Button>
          
          <Button 
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <PrinterIcon className="h-4 w-4" />
            Drucken
          </Button>
        </div>
      </div>

      <div id="invoice-container" className="bg-white p-8 rounded-lg print:shadow-none min-h-[297mm] relative">
        <InvoicePDF 
          invoice={{
            ...invoice,
            vatAmounts: totals.vatAmounts,
            totalVat: totals.totalVat,
            totalNet: totals.netTotal,
            totalGross: totals.grossTotal,
            discountAmount: totals.discountAmount
          }} 
          settings={settings} 
          mode="preview" 
        />
      </div>
    </div>
  );
}