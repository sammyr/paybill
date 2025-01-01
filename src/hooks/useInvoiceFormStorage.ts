/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'invoice_draft';

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
        // Stelle sicher, dass recipient existiert
        if (!parsedData.recipient) {
          parsedData.recipient = defaultData.recipient;
        }
        // Stelle sicher, dass positions ein Array ist
        if (!Array.isArray(parsedData.positions)) {
          parsedData.positions = defaultData.positions;
        }
        return { ...defaultData, ...parsedData };
      } catch (e) {
        console.error('Fehler beim Laden der gespeicherten Rechnungsdaten:', e);
        return initialData || defaultData;
      }
    }

    return initialData || defaultData;
  };

  const [formData, setFormData] = useState<InvoiceFormData>(getInitialState);

  const updateFormData = (newData: InvoiceFormData) => {
    setFormData(newData);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    }
  };

  const clearFormData = () => {
    const defaultData = getInitialState();
    setFormData(defaultData);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return [formData, updateFormData, clearFormData];
}
