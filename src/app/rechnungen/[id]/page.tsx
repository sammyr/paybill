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
  const [contact, setContact] = useState<Contact | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const { id } = use(params);

  useEffect(() => {
    const loadInvoiceData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        
        // Prüfe zuerst, ob es ein Entwurf ist
        const draftData = localStorage.getItem(`invoice_draft_${id}`);
        if (draftData) {
          const parsedDraft = JSON.parse(draftData);
          setFormData(parsedDraft);
          setPositions(parsedDraft.positions || []);
          return;
        }

        // Wenn kein Entwurf, versuche aus der Datenbank zu laden
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
        setFormData(loadedInvoice);
        setPositions(loadedInvoice.positions || []);

        // Lade Einstellungen
        const loadedSettings = await db.getSettings();
        console.log('Loaded settings:', loadedSettings);
        setSettings(loadedSettings);

        // Lade Kontakt wenn vorhanden
        if (loadedInvoice.contactId) {
          console.log('Loading contact with ID:', loadedInvoice.contactId);
          const loadedContact = await db.getContact(loadedInvoice.contactId);
          console.log('Loaded contact:', loadedContact);
          if (loadedContact) {
            setContact(loadedContact);
          }
        }

      } catch (error) {
        console.error('Fehler beim Laden der Rechnung:', error);
        toast({
          variant: "destructive",
          title: "Fehler beim Laden",
          description: error instanceof Error ? error.message : 'Fehler beim Laden der Rechnung'
        });
        router.push('/rechnungen');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoiceData();
  }, [id, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-4">Fehler</h1>
            <p className="text-gray-600">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="mt-4"
            >
              Zurück
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !invoice || !settings) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Rechnung...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-semibold">Rechnung {invoice.number}</h1>
              {contact && <p className="text-gray-500">{contact.name}</p>}
              {!contact && invoice.contactId && (
                <p className="text-yellow-600">⚠️ Kontakt nicht gefunden</p>
              )}
              {!contact && !invoice.contactId && (
                <p className="text-gray-500">Kein Kontakt zugewiesen</p>
              )}
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Zurück
              </Button>
              <Button>
                PDF herunterladen
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <InvoicePDF invoice={invoice} contact={contact} settings={settings} />
        </div>
      </div>
    </div>
  );
}
