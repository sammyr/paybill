/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import InvoicePDF from '@/components/invoice/InvoicePDF';
import { Button } from '@/components/ui/button';
import { getDatabase } from '@/lib/db';
import { Invoice, Contact } from '@/lib/db/interfaces';

interface InvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { id } = use(params);

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        console.log('Loading invoice with ID:', id);
        const db = getDatabase();
        
        // Lade Rechnung
        const loadedInvoice = await db.getInvoice(id);
        console.log('Loaded invoice:', loadedInvoice);
        if (!loadedInvoice) {
          setError('Rechnung nicht gefunden');
          return;
        }
        setInvoice(loadedInvoice);

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
        console.error('Error loading invoice data:', error);
        setError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
      }
    };
    loadInvoiceData();
  }, [id]);

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

  if (!invoice || !settings) {
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
