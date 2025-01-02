/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'invoiceFormData';

export interface InvoiceFormData {
  contactId?: string;
  recipient?: {
    id?: string;
    name: string;
    street: string;
    zip: string;
    city: string;
    country: string;
    email?: string;
    phone?: string;
    taxId?: string;
  };
  positions?: Array<{
    description: string;
    quantity: number;
    price: number;
    vat: number;
    discount: number;
    amount: number;
  }>;
  date?: string;
  dueDate?: string;
  deliveryDate?: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  notes?: string;
  paymentTerms?: string;
}

export function useInvoiceFormStorage(initialData?: InvoiceFormData): [
  InvoiceFormData,
  (newData: InvoiceFormData) => void,
  () => void
] {
  const getInitialState = (): InvoiceFormData => {
    const defaultData: InvoiceFormData = {
      contactId: '',
      recipient: {
        name: '',
        street: '',
        zip: '',
        city: '',
        country: 'Deutschland',
        email: '',
        phone: '',
        taxId: ''
      },
      positions: [],
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      referenceNumber: '',
      notes: '',
      paymentTerms: '14 Tage netto'
    };

    if (typeof window === 'undefined') return initialData || defaultData;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Stelle sicher, dass alle erforderlichen Felder vorhanden sind
        return {
          ...defaultData,
          ...parsedData,
          recipient: {
            ...defaultData.recipient,
            ...(parsedData.recipient || {})
          },
          positions: Array.isArray(parsedData.positions) ? parsedData.positions : defaultData.positions,
          contactId: parsedData.contactId || defaultData.contactId
        };
      } catch (e) {
        console.error('Fehler beim Laden der gespeicherten Rechnungsdaten:', e);
        return initialData || defaultData;
      }
    }

    return initialData || defaultData;
  };

  const [formData, setFormData] = useState<InvoiceFormData>(getInitialState);

  // Lade die Daten beim ersten Rendern und wenn sich der Storage ändert
  useEffect(() => {
    const handleStorageChange = () => {
      setFormData(getInitialState());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [getInitialState]);

  const updateFormData = (newData: InvoiceFormData) => {
    setFormData(newData);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    }
  };

  const clearFormData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setFormData(getInitialState());
  };

  return [formData, updateFormData, clearFormData];
}
