/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

import { useEffect, useState, useMemo } from 'react';

const STORAGE_KEY_PREFIX = 'invoiceFormData_';

export interface InvoiceFormData {
  id?: string;
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
    unitPrice: number;
    taxRate: number;
    totalNet: number;
    totalGross: number;
  }>;
  date?: string;
  dueDate?: string;
  deliveryDate?: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  notes?: string;
  paymentTerms?: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  number?: string;
  subject?: string;
  totalNet?: number;
  totalGross?: number;
  vatAmount?: number;
  vatAmounts?: {};
}

export function useInvoiceFormStorage(invoiceId?: string): [
  InvoiceFormData,
  (newData: InvoiceFormData) => void,
  () => void
] {
  const storageKey = useMemo(() => 
    invoiceId ? `${STORAGE_KEY_PREFIX}${invoiceId}` : STORAGE_KEY_PREFIX + 'new',
    [invoiceId]
  );

  const getInitialState = (): InvoiceFormData => {
    const defaultData: InvoiceFormData = {
      id: '',
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
      paymentTerms: '14 Tage netto',
      discount: {
        type: 'fixed',
        value: 0
      },
      number: '',
      subject: '',
      totalNet: 0,
      totalGross: 0,
      vatAmount: 0,
      vatAmounts: {}
    };

    if (typeof window === 'undefined') return defaultData;
    
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        return {
          ...defaultData,
          ...parsedData,
          recipient: {
            ...defaultData.recipient,
            ...(parsedData.recipient || {})
          },
          positions: Array.isArray(parsedData.positions) ? parsedData.positions : [],
          discount: {
            type: parsedData.discount?.type || 'fixed',
            value: typeof parsedData.discount?.value === 'number' ? parsedData.discount.value : 0
          }
        };
      } catch (e) {
        console.error('Fehler beim Laden der gespeicherten Rechnungsdaten:', e);
        return defaultData;
      }
    }

    return defaultData;
  };

  const [formData, setFormData] = useState<InvoiceFormData>(getInitialState);

  // Lade die Daten beim ersten Rendern und wenn sich der Storage ändert
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setFormData(getInitialState());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [storageKey]);

  const updateFormData = (newData: InvoiceFormData) => {
    setFormData(newData);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newData));
    }
  };

  const clearFormData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
    setFormData(getInitialState());
  };

  return [formData, updateFormData, clearFormData];
}
