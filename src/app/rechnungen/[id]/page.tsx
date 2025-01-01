/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InvoicePDF } from '@/components/invoice/InvoicePDF';
import { Button } from '@/components/ui/button';

interface InvoicePageProps {
  params: {
    id: string;
  };
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const router = useRouter();
  const [invoice, setInvoice] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Lade Rechnungsdaten
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/${params.id}`);
        const data = await response.json();
        setInvoice(data);
      } catch (error) {
        console.error('Fehler beim Laden der Rechnung:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [params.id]);

  if (loading) {
    return <div>Lade Rechnung...</div>;
  }

  if (!invoice) {
    return <div>Rechnung nicht gefunden</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                ←
              </button>
              <h1 className="text-xl font-semibold">Rechnung Nr. {invoice.number}</h1>
            </div>
            <div className="flex gap-4">
              <Button variant="outline">Neue Rechnung</Button>
              <Button variant="outline">Mehr</Button>
              <Button variant="outline">Herunterladen</Button>
              <Button variant="default">Als bezahlt markieren</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* PDF Preview */}
          <div className="flex-1 bg-white rounded-lg shadow">
            <InvoicePDF invoice={invoice} />
          </div>

          {/* Sidebar */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">{invoice.contact.name}</h2>
                <div className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString()}</div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span>Betrag (Brutto)</span>
                  <span className="text-xl font-semibold">{invoice.total.toFixed(2)} EUR</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Rechnungsdetails</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fälligkeit</span>
                    <span>In {invoice.dueDate} Tagen</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zahlungsziel</span>
                    <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tags</span>
                    <button className="text-blue-600">Tags hinzufügen</button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rechnungsdatum</span>
                    <span>{new Date(invoice.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versendet am</span>
                    <span>{new Date(invoice.sentDate).toLocaleDateString()} als PDF</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">DATEV Export-Historie</span>
                  <span className="text-blue-600">Zum Export</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
