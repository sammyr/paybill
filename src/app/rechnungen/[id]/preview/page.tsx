'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import InvoicePDF from '@/components/invoice/InvoicePDF';
import { getDatabase } from '@/lib/db';
import type { Invoice } from '@/lib/db/interfaces';

export default function InvoicePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!invoiceId) return;

      try {
        const db = getDatabase();
        const loadedInvoice = await db.getInvoice(invoiceId);
        setInvoice(loadedInvoice);

        const loadedSettings = await db.getSettings();
        setSettings(loadedSettings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Rechnung');
        console.error('Fehler beim Laden der Daten:', err);
      }
    };

    loadData();
  }, [invoiceId]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Fehler</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Lade Rechnungsdaten...</p>
        </div>
      </div>
    );
  }

  if (!invoice.positions || !Array.isArray(invoice.positions)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Fehler</h2>
          <p>Die Rechnungspositionen sind nicht korrekt formatiert.</p>
          <pre className="mt-4 text-sm text-gray-600">
            {JSON.stringify(invoice, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Zurück
        </Button>
        <div className="flex gap-4">
          <Button variant="outline">
            PDF herunterladen
          </Button>
          <Button variant="outline">
            Als E-Mail senden
          </Button>
          <Button variant="default" className="bg-orange-500 hover:bg-orange-600">
            Drucken
          </Button>
        </div>
      </div>

      <div className="bg-white  rounded-lg overflow-hidden">
        <InvoicePDF 
          invoice={invoice}
          settings={settings}
          mode="preview"
        />
      </div>
    </div>
  );
}
