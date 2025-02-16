/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { getDatabase } from '@/lib/db';
import { Invoice, Contact } from '@/lib/db/interfaces';
import { useToast } from '@/components/ui/use-toast';

interface InvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const { id } = use(params);

  useEffect(() => {
    const loadInvoiceData = async () => {
      if (!id) return;

      try {
        const db = getDatabase();
        const loadedInvoice = await db.getInvoice(id);
        
        if (!loadedInvoice) {
          toast({
            variant: "destructive",
            title: "Fehler beim Laden",
            description: `Rechnung mit ID ${id} wurde nicht gefunden`
          });
          router.push('/rechnungen');
          return;
        }

        setInvoice(loadedInvoice);
        
        // Leite direkt zur Bearbeitungsseite weiter
        router.push(`/rechnungen/neu?number=${loadedInvoice.number}`);

      } catch (error) {
        console.error('Fehler beim Laden der Rechnung:', error);
        toast({
          variant: "destructive",
          title: "Fehler beim Laden",
          description: error instanceof Error ? error.message : 'Fehler beim Laden der Rechnung'
        });
        router.push('/rechnungen');
      }
    };

    loadInvoiceData();
  }, [id, router, toast]);

  // Zeige Ladeanimation während der Weiterleitung
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Lade Rechnung...</p>
      </div>
    </div>
  );
}
