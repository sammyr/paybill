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
import { PDFDownloadLink } from '@react-pdf/renderer';

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
          
          // Generiere Rechnungsnummer für neue Rechnungen
          if (!parsedDraft.number) {
            /**
             * @important RECHNUNGSNUMMER-FORMAT
             * Das Format der Rechnungsnummer MUSS immer eine vierstellige Zahl sein (z.B. "5183").
             * Dieses Format ist fest definiert und darf NICHT geändert werden, da:
             * 1. Es für die Buchhaltung und Archivierung essentiell ist
             * 2. Externe Systeme darauf aufbauen
             * 3. Die Rechnungsnummer in dieser Form rechtlich bindend ist
             * 
             * @format XXXX (X = Ziffer von 0-9)
             * @example "5183"
             */
            parsedDraft.number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          }
          
          // Berechne die Preise für jede Position
          if (parsedDraft.positions) {
            parsedDraft.positions = parsedDraft.positions.map(pos => {
              // Setze Standardpreise basierend auf der Beschreibung
              const unitPrice = pos.description.toLowerCase().includes('webentwicklung') ? 85 : 75;
              const quantity = parseFloat(pos.quantity?.toString() || '0');
              
              return {
                ...pos,
                unitPrice: pos.unitPrice || unitPrice,
                totalNet: quantity * (pos.unitPrice || unitPrice),
                taxRate: 19 // Standardmäßig 19% MwSt
              };
            });
          }
          
          // Berechne Gesamtbeträge
          const totals = {
            netTotal: 0,
            vatAmount: 0,
            grossTotal: 0,
            discountAmount: 0
          };

          // Berechne Netto-Gesamtbetrag aus den Positionen
          totals.netTotal = parsedDraft.positions.reduce((sum, pos) => {
            const quantity = parseFloat(pos.quantity?.toString() || '0');
            const unitPrice = parseFloat(pos.unitPrice?.toString() || '0');
            return sum + (quantity * unitPrice);
          }, 0);

          // Berechne Rabatt
          if (parsedDraft.discount && parsedDraft.discountValue) {
            totals.discountAmount = parsedDraft.discountType === 'percentage'
              ? (totals.netTotal * (parseFloat(parsedDraft.discountValue.toString()) / 100))
              : parseFloat(parsedDraft.discountValue.toString());
          }

          // Berechne MwSt und Brutto
          const netAfterDiscount = totals.netTotal - totals.discountAmount;
          totals.vatAmount = netAfterDiscount * 0.19; // 19% MwSt
          totals.grossTotal = netAfterDiscount + totals.vatAmount;

          // Runde alle Beträge auf 2 Dezimalstellen
          Object.keys(totals).forEach(key => {
            totals[key] = Number(totals[key].toFixed(2));
          });

          // Aktualisiere die Rechnungsdaten
          const updatedInvoice = {
            ...parsedDraft,
            positions: parsedDraft.positions,
            totalNet: totals.netTotal,
            vatAmount: totals.vatAmount,
            totalGross: totals.grossTotal,
            vatAmounts: { "19": totals.vatAmount },
            discountAmount: totals.discountAmount,
            status: parsedDraft.status || 'entwurf' as const,
            createdAt: parsedDraft.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Speichere aktualisierte Daten zurück in localStorage
          localStorage.setItem(`invoice_draft_${invoiceId}`, JSON.stringify(updatedInvoice));
          
          setInvoice(updatedInvoice);
        } else {
          const db = getDatabase();
          const invoiceData = await db.getInvoice(invoiceId);
          if (invoiceData) {
            setInvoice(invoiceData);
          } else {
            throw new Error("Keine Rechnungsdaten gefunden");
          }
        }

        // Lade die Einstellungen
        const db = getDatabase();
        const loadedSettings = await db.getSettings();
        setSettings(loadedSettings);

      } catch (error) {
        console.error("Fehler beim Laden der Rechnung:", error);
        toast({
          variant: "destructive",
          title: "Fehler",
          description: error instanceof Error ? error.message : "Rechnung konnte nicht geladen werden"
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
    // Implementierung für Download
    console.log('Download invoice:', invoice?.id);
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
          
          {/* PDF Download Button */}
          <Button 
            variant="outline"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <DownloadIcon className="h-4 w-4" />
            PDF
          </Button>
          
          {/* E-Mail Button */}
          <Button
            variant="outline"
            onClick={handleEmail}
            className="flex items-center gap-2"
          >
            <MailIcon className="h-4 w-4" />
            E-Mail
          </Button>
          
          {/* Drucken Button */}
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