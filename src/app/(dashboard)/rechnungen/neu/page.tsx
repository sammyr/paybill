/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus as PlusIcon, X as XIcon, Percent as PercentIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { getDatabase } from '@/lib/db';
import { Contact, Invoice } from '@/lib/db/interfaces';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { 
  calculateInvoiceTotals, 
  formatCurrency,
  calculatePositionTotals,
  type Invoice as InvoiceType,
  type InvoiceTotals
} from '@/lib/invoice-utils';
import { NewContactDialog } from "@/components/contact/NewContactDialog";

// Hilfsfunktion zur Generierung einer einfachen UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface FormData {
  contactId: string;
  recipient: {
    name: string;
    street: string;
    zip: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    taxId: string;
  };
  positions: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    totalNet: number;
    totalGross: number;
  }[];
  date: Date;
  dueDate: Date;
  deliveryDate: Date;
  invoiceNumber: string;
  referenceNumber: string;
  notes: string;
  paymentTerms: string;
  bankDetails: {
    accountHolder: string;
    iban: string;
    bic: string;
    bankName: string;
  };
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  number: string;
  subject: string;
  totalNet: number;
  totalGross: number;
  vatAmount: number;
  vatAmounts: {};
}

const defaultFormData: FormData = {
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
  positions: [
    {
      description: 'Webentwicklung - Frontend',
      quantity: 20,
      unitPrice: 90,
      taxRate: 19,
      totalNet: 1800,
      totalGross: 1800 * (1 + 19 / 100)
    },
    {
      description: 'UI/UX Design',
      quantity: 15,
      unitPrice: 85,
      taxRate: 19,
      totalNet: 1275,
      totalGross: 1275 * (1 + 19 / 100)
    },
    {
      description: 'Projektmanagement',
      quantity: 8,
      unitPrice: 95,
      taxRate: 19,
      totalNet: 760,
      totalGross: 760 * (1 + 19 / 100)
    }
  ],
  date: new Date(),
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  deliveryDate: new Date(),
  invoiceNumber: `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
  referenceNumber: 'PROJ-2024-001',
  notes: 'Vielen Dank für Ihren Auftrag!\n\nBitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten angegebene Konto.',
  paymentTerms: '14 Tage netto',
  bankDetails: {
    accountHolder: 'Max Mustermann',
    iban: 'DE89 3704 0044 0532 0130 00',
    bic: 'COBADEFFXXX',
    bankName: 'Commerzbank'
  },
  number: '',
  subject: '',
  totalNet: 0,
  totalGross: 0,
  vatAmount: 0,
  vatAmounts: {}
};

const useInvoiceFormStorage = () => {
  const getInitialState = (): FormData => {
    if (typeof window === 'undefined') return defaultFormData;
    
    try {
      const savedState = localStorage.getItem('invoiceFormData');
      if (!savedState) return defaultFormData;
      
      const parsedState = JSON.parse(savedState);
      return {
        ...defaultFormData,
        ...parsedState
      };
    } catch (error) {
      console.error('Fehler beim Laden des Formularzustands:', error);
      return defaultFormData;
    }
  };

  const [formData, setFormData] = useState<FormData>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem('invoiceFormData', JSON.stringify(formData));
    } catch (error) {
      console.error('Fehler beim Speichern des Formularzustands:', error);
    }
  }, [formData]);

  return [formData, setFormData] as const;
};

export default function NeueRechnungPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceNumber = searchParams.get('number');
  const [isClient, setIsClient] = useState(false);
  const [paymentDays, setPaymentDays] = useState(14);
  const [isErechnung, setIsErechnung] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData, clearFormData] = useInvoiceFormStorage(invoiceNumber || undefined);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [deliveryDatePopoverOpen, setDeliveryDatePopoverOpen] = useState(false);
  const [dueDatePopoverOpen, setDueDatePopoverOpen] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    recipient?: string;
    street?: string;
    positions?: string;
  }>({});

  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Aktualisiere das Fälligkeitsdatum basierend auf Rechnungsdatum und Zahlungsziel
    if (formData.date) {
      const dueDate = new Date(formData.date);
      dueDate.setDate(dueDate.getDate() + paymentDays);
      setFormData({
        ...formData,
        dueDate: dueDate
      });
    }
  }, [formData.date, paymentDays]);

  useEffect(() => {
    const loadInvoiceData = async () => {
      if (!invoiceNumber) return;

      try {
        const db = getDatabase();
        const invoices = await db.listInvoices();
        const invoice = invoices.find(inv => inv.number === invoiceNumber);

        if (invoice) {
          console.log('Lade Rechnung mit Nummer:', invoiceNumber);
          console.log('Gefundene Rechnung:', invoice);

          // Stelle sicher, dass der Rabatt korrekt geladen wird
          const discount = invoice.discount || { type: 'fixed', value: 0 };
          console.log('Geladener Rabatt:', discount);

          // Konvertiere die Daten in das FormData-Format
          const updatedFormData = {
            ...formData,
            id: invoice.id,
            number: invoice.number,
            recipient: invoice.recipient || formData.recipient,
            positions: invoice.positions.map(pos => ({
              description: pos.description,
              quantity: pos.quantity,
              unitPrice: pos.unitPrice,
              taxRate: pos.taxRate,
              totalNet: pos.totalNet || 0,
              totalGross: pos.totalGross || 0
            })),
            date: invoice.date || formData.date,
            dueDate: invoice.dueDate || formData.dueDate,
            notes: invoice.notes || '',
            discount: {
              type: discount.type,
              value: typeof discount.value === 'number' ? discount.value : 0
            }
          };

          console.log('Aktualisierte Formulardaten:', updatedFormData);
          setFormData(updatedFormData);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Rechnungsdaten:', error);
        toast({
          title: "Fehler",
          description: "Die Rechnungsdaten konnten nicht geladen werden",
          variant: "destructive"
        });
      }
    };

    loadInvoiceData();
  }, [invoiceNumber]);

  useEffect(() => {
    const loadData = async () => {
      // Hole die Rechnungsnummer und ID aus der URL
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      let number = urlParams.get('number');
      
      // Lösche vorherige Draft-Daten
      localStorage.removeItem('lastEditedInvoice');
      localStorage.removeItem(`invoice_draft_${'draft_temp'}`);

      const db = getDatabase();

      // Wenn eine ID vorhanden ist, lade die bestehende Rechnung
      if (id) {
        try {
          const invoice = await db.getInvoice(id);
          if (invoice) {
            console.log('Geladene Rechnung:', invoice); // Debug-Log
            
            // Verwende die existierende Nummer
            number = invoice.number;
            
            // Stelle sicher, dass alle Positionen die erforderlichen Felder haben
            const positions = invoice.positions?.map(pos => {
              const quantity = typeof pos.quantity === 'number' ? pos.quantity : parseFloat(String(pos.quantity)) || 0;
              const unitPrice = typeof pos.unitPrice === 'number' ? pos.unitPrice : parseFloat(String(pos.unitPrice)) || 0;
              const taxRate = typeof pos.taxRate === 'number' ? pos.taxRate : 19;
              
              const totalNet = quantity * unitPrice;
              const totalGross = totalNet * (1 + (taxRate / 100));
              
              return {
                description: pos.description || '',
                quantity: quantity,
                unitPrice: unitPrice,
                taxRate: taxRate,
                totalNet: totalNet,
                totalGross: totalGross
              };
            }) || [];

            // Stelle sicher, dass der Rabatt korrekt geladen wird
            const discount = invoice.discount || { type: 'fixed', value: 0 };
            console.log('Geladener Rabatt:', discount); // Debug-Log

            // Aktualisiere das Formular mit allen Daten
            const updatedFormData = {
              ...formData,
              id: invoice.id,
              number: invoice.number,
              date: invoice.date,
              dueDate: invoice.dueDate,
              recipient: invoice.recipient || formData.recipient,
              positions: positions,
              notes: invoice.notes || '',
              discount: {
                type: discount.type,
                value: typeof discount.value === 'number' ? discount.value : 0
              }
            };
            
            // Debug-Log für die finalen Formulardaten
            console.log('Finale Formulardaten:', updatedFormData);
            
            setFormData(updatedFormData);
          }
        } catch (error) {
          console.error('Fehler beim Laden der Rechnung:', error);
          toast({
            title: "Fehler",
            description: "Die Rechnung konnte nicht geladen werden",
            variant: "destructive"
          });
        }
      }
      
      // Aktualisiere das Formular mit der Nummer, falls noch nicht geschehen
      if (!id) {
        setFormData(prev => ({
          ...prev,
          number: number
        }));
      }

      // Lade Kontakte
      try {
        const loadedContacts = await db.listContacts();
        setContacts(loadedContacts);
      } catch (error) {
        console.error('Fehler beim Laden der Kontakte:', error);
        toast({
          title: "Fehler",
          description: "Kontakte konnten nicht geladen werden.",
          variant: "destructive"
        });
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!formData.contactId) return;
    
    const contact = contacts.find(c => c.id === formData.contactId);
    if (!contact) {
      // Kontakt nicht gefunden, setze zurück
      setFormData({
        ...formData,
        contactId: '',
        recipient: {
          name: '',
          street: '',
          zip: '',
          city: '',
          country: 'DE',
          email: '',
          phone: '',
          taxId: ''
        }
      });
    }
  }, [contacts, formData.contactId]); // Nur prüfen wenn sich die Kontakte oder die contactId ändert

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: newValue
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const [totals, setTotals] = useState<InvoiceTotals>({
    netTotal: 0,
    discountAmount: 0,
    netAfterDiscount: 0,
    vatAmounts: {},
    totalVat: 0,
    grossTotal: 0
  });

  useEffect(() => {
    const newTotals = calculateInvoiceTotals(formData);
    setTotals(newTotals);
  }, [formData]);

  const handlePositionChange = (index: number, field: string, value: any) => {
    const positions = [...formData.positions];
    const position = { ...positions[index] };

    // Konvertiere Werte in Zahlen wo nötig
    if (field === 'quantity' || field === 'unitPrice') {
      position[field] = value === '' ? 0 : Number(value);
    } else if (field === 'taxRate') {
      position[field] = Number(value);
    } else {
      position[field] = value;
    }

    // Berechne die Position neu
    const { totalNet, totalGross } = calculatePositionTotals(position);
    position.totalNet = totalNet;
    position.totalGross = totalGross;

    positions[index] = position;
    setFormData({
      ...formData,
      positions
    });
  };

  const addPosition = () => {
    const newPositions = [...formData.positions, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 19,
      totalNet: 0,
      totalGross: 0
    }];
    setFormData({
      ...formData,
      positions: newPositions
    });
  };

  const removePosition = (index: number) => {
    const positions = [...formData.positions];
    positions.splice(index, 1);
    setFormData({
      ...formData,
      positions
    });
  };

  const handleAddDiscount = () => {
    setShowDiscountDialog(true);
  };

  const handleDiscountSubmit = (type: 'percentage' | 'fixed', value: number) => {
    setFormData({
      ...formData,
      discount: {
        type,
        value: Number(value)
      }
    });
    setShowDiscountDialog(false);
  };

  const handleContactSelect = (contact: Contact) => {
    // Extrahiere Straße, PLZ und Stadt aus der Adresse
    const addressParts = contact.address?.split(',').map(part => part.trim()) || ['', ''];
    const [street = '', cityPart = ''] = addressParts;
    const [zip = '', city = ''] = cityPart.split(' ').filter(Boolean);

    setFormData({
      ...formData,
      contactId: contact.id,
      recipient: {
        name: contact.name,
        street: street,
        zip: zip,
        city: city,
        country: 'Deutschland',
        email: contact.email || '',
        phone: contact.phone || '',
        taxId: contact.taxId || ''
      }
    });
    setShowContactDialog(false);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Empfänger-Validierung
    if (!formData.contactId || formData.contactId === 'none') {
      errors.recipient = 'Bitte wählen Sie einen Kontakt aus';
    }
    if (!formData.recipient?.street) {
      errors.street = 'Straße ist ein Pflichtfeld';
    }
    if (!formData.recipient?.zip) {
      errors.zip = 'PLZ ist ein Pflichtfeld';
    }
    if (!formData.recipient?.city) {
      errors.city = 'Stadt ist ein Pflichtfeld';
    }

    // Rechnungsinformationen-Validierung
    if (!formData.date) {
      errors.date = 'Rechnungsdatum ist ein Pflichtfeld';
    }
    if (!formData.deliveryDate) {
      errors.deliveryDate = 'Lieferdatum ist ein Pflichtfeld';
    }
    if (!formData.dueDate) {
      errors.dueDate = 'Zahlungsziel ist ein Pflichtfeld';
    }

    // Positionen-Validierung
    if (!formData.positions || formData.positions.length === 0) {
      errors.positions = 'Mindestens eine Position ist erforderlich';
    } else {
      formData.positions.forEach((position, index) => {
        if (!position.description) {
          errors[`position_${index}_description`] = 'Beschreibung ist erforderlich';
        }
        if (position.quantity <= 0) {
          errors[`position_${index}_quantity`] = 'Menge muss größer als 0 sein';
        }
        if (position.unitPrice < 0) {
          errors[`position_${index}_unitPrice`] = 'Preis darf nicht negativ sein';
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('Validiere Formular...');
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log('Validierungsfehler:', errors);
      setValidationErrors(errors);
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle erforderlichen Felder aus.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    try {
      console.log('Speichere Rechnung...');
      const db = getDatabase();
      
      // Berechne Gesamtbeträge
      const totals = calculateInvoiceTotals(formData);

      // Erstelle neue Rechnung
      const invoice: Omit<InvoiceType, 'id' | 'createdAt' | 'updatedAt'> = {
        date: formData.date,
        dueDate: formData.dueDate,
        number: formData.number,
        status: 'entwurf',
        recipient: {
          name: formData.recipient.name,
          street: formData.recipient.street,
          zip: formData.recipient.zip,
          city: formData.recipient.city,
          country: formData.recipient.country || 'Deutschland',
          email: formData.recipient.email,
          phone: formData.recipient.phone,
          taxId: formData.recipient.taxId
        },
        positions: formData.positions?.map(pos => ({
          id: generateId(),
          description: pos.description,
          quantity: Number(pos.quantity),
          unitPrice: Number(pos.unitPrice),
          taxRate: Number(pos.taxRate),
          totalNet: Number(pos.totalNet),
          totalGross: Number(pos.totalGross)
        })) || [],
        notes: formData.notes,
        discount: totals.discountAmount,
        discountType: formData.discount?.type,
        discountValue: formData.discount?.value,
        totalNet: totals.netTotal,
        totalGross: totals.grossTotal,
        vatAmount: totals.totalVat,
        vatAmounts: totals.vatAmounts
      };

      try {
        const savedInvoice = await db.createInvoice(invoice);
        console.log('Rechnung gespeichert:', savedInvoice);
        
        // Lösche temporäre Daten
        localStorage.removeItem('invoiceFormData');
        localStorage.removeItem('lastEditedInvoice');
        
        // Navigiere zur Preview-Seite mit Rechnungsnummer
        router.push(`/rechnungen/draft_temp/preview?number=${savedInvoice.number}`);
      } catch (error) {
        if (error.message?.includes('existiert bereits')) {
          // Hole eine neue Nummer und versuche es erneut
          const nextNumber = await db.getNextInvoiceNumberPublic();
          invoice.number = nextNumber;
          // Aktualisiere die URL
          const newUrl = `${window.location.pathname}?number=${nextNumber}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
          const savedInvoice = await db.createInvoice(invoice);
          router.push(`/rechnungen/draft_temp/preview?number=${savedInvoice.number}`);
        } else {
          throw error;
        }
      }
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern der Rechnung. Bitte versuchen Sie es erneut.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleContactChange = async (contactId: string) => {
    try {
      if (contactId === 'none') {
        const emptyRecipient = {
          name: '',
          street: '',
          zip: '',
          city: '',
          country: 'DE',
          email: '',
          phone: '',
          taxId: ''
        };
        
        const updatedFormData = {
          ...formData,
          contactId: '',
          recipient: emptyRecipient
        };
        
        setFormData(updatedFormData);
        return;
      }

      const db = getDatabase();
      const contact = await db.getContact(contactId);
      
      if (contact) {
        // Extrahiere Straße, PLZ und Stadt aus der Adresse
        const addressMatch = contact.address?.match(/^(.*?),\s*(\d{5})\s+(.*)$/);
        
        let street = contact.street || '';
        let zip = contact.zip || '';
        let city = contact.city || '';
        let country = contact.country || 'DE';
        
        const updatedFormData = {
          ...formData,
          contactId: contact.id,
          recipient: {
            name: contact.name,
            street: street,
            zip: zip,
            city: city,
            country: country,
            email: contact.email || '',
            phone: contact.phone || '',
            taxId: contact.taxId || ''
          }
        };
        
        setFormData(updatedFormData);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Kontakts:', error);
      toast({
        title: "Fehler",
        description: "Der Kontakt konnte nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  // Funktion zum temporären Speichern der Rechnung
  const saveDraft = async () => {
    try {
      const db = getDatabase();
      const totals = calculateInvoiceTotals(formData);

      // Prüfe ob die Rechnungsnummer bereits existiert
      const existingInvoices = await db.listInvoices();
      const existingInvoice = existingInvoices.find(inv => 
        inv.number.replace(/^0+/, '') === formData.number.replace(/^0+/, '')
      );

      // Wenn die Rechnung bereits existiert, aktualisiere sie
      if (existingInvoice) {
        const updatedInvoice = await db.updateInvoice(existingInvoice.id, {
          date: formData.date,
          dueDate: formData.dueDate,
          number: formData.number,
          status: 'entwurf',
          recipient: {
            name: formData.recipient.name,
            street: formData.recipient.street,
            zip: formData.recipient.zip,
            city: formData.recipient.city,
            country: formData.recipient.country || 'Deutschland',
            email: formData.recipient.email,
            phone: formData.recipient.phone,
            taxId: formData.recipient.taxId
          },
          positions: formData.positions?.map(pos => ({
            id: generateId(),
            description: pos.description,
            quantity: Number(pos.quantity),
            unitPrice: Number(pos.unitPrice),
            taxRate: Number(pos.taxRate),
            totalNet: Number(pos.totalNet),
            totalGross: Number(pos.totalGross)
          })) || [],
          notes: formData.notes,
          discount: formData.discount ? {
            type: formData.discount.type,
            value: Number(formData.discount.value)
          } : undefined,
          totalNet: totals.netTotal,
          totalGross: totals.grossTotal,
          vatAmount: totals.totalVat,
          vatAmounts: totals.vatAmounts
        });
        return updatedInvoice;
      }

      // Erstelle eine neue Rechnung
      const invoice: Omit<InvoiceType, 'id' | 'createdAt' | 'updatedAt'> = {
        date: formData.date,
        dueDate: formData.dueDate,
        number: formData.number,
        status: 'draft',
        recipient: {
          name: formData.recipient.name,
          street: formData.recipient.street,
          zip: formData.recipient.zip,
          city: formData.recipient.city,
          country: formData.recipient.country || 'Deutschland',
          email: formData.recipient.email,
          phone: formData.recipient.phone,
          taxId: formData.recipient.taxId
        },
        positions: formData.positions?.map(pos => ({
          id: generateId(),
          description: pos.description,
          quantity: Number(pos.quantity),
          unitPrice: Number(pos.unitPrice),
          taxRate: Number(pos.taxRate),
          totalNet: Number(pos.totalNet),
          totalGross: Number(pos.totalGross)
        })) || [],
        notes: formData.notes,
        discount: formData.discount ? {
          type: formData.discount.type,
          value: Number(formData.discount.value)
        } : undefined,
        ...totals
      };

      const savedInvoice = await db.createInvoice(invoice);
      return savedInvoice;
    } catch (error) {
      console.error('Fehler beim Speichern des Entwurfs:', error);
      throw error;
    }
  };

  const handlePreview = async () => {
    try {
      // Validiere die Rechnungsnummer
      if (!formData.number) {
        toast({
          title: "Fehler",
          description: "Keine Rechnungsnummer vorhanden",
          variant: "destructive"
        });
        return;
      }

      // Speichere zuerst den aktuellen Stand
      const savedInvoice = await saveDraft();
      
      // Navigiere zur Vorschau
      router.push(`/rechnungen/draft_temp/preview?number=${savedInvoice.number}`);
    } catch (error) {
      console.error('Fehler beim Anzeigen der Vorschau:', error);
      // Wenn die Rechnungsnummer bereits existiert, hole eine neue
      if (error.message?.includes('existiert bereits')) {
        try {
          const db = getDatabase();
          const nextNumber = await db.getNextInvoiceNumberPublic();
          // Aktualisiere das Formular und die URL
          setFormData(prev => ({
            ...prev,
            number: nextNumber
          }));
          const newUrl = `${window.location.pathname}?number=${nextNumber}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
          
          toast({
            title: "Info",
            description: "Eine neue Rechnungsnummer wurde generiert",
          });
        } catch (innerError) {
          console.error('Fehler beim Generieren einer neuen Nummer:', innerError);
          toast({
            title: "Fehler",
            description: "Fehler beim Generieren einer neuen Rechnungsnummer",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Fehler",
          description: "Fehler beim Erstellen der Vorschau",
          variant: "destructive"
        });
      }
    }
  };

  // Funktion zum Zurücksetzen des Formulars
  const resetForm = async () => {
    try {
      const db = getDatabase();
      const nextNumber = await db.getNextInvoiceNumberPublic();
      
      const defaultFormData: FormData = {
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
        number: nextNumber,
        subject: '',
        totalNet: 0,
        totalGross: 0,
        vatAmount: 0,
        vatAmounts: {}
      };
      
      setFormData(defaultFormData);

      // Aktualisiere die URL ohne Neuladen der Seite
      const newUrl = `${window.location.pathname}?number=${nextNumber}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

    } catch (error) {
      console.error('Fehler beim Generieren der nächsten Rechnungsnummer:', error);
      toast({
        title: "Fehler",
        description: "Die nächste Rechnungsnummer konnte nicht generiert werden",
        variant: "destructive"
      });
    }
  };

  // Sicherstelle, dass alle Werte definiert sind
  const safeFormData = {
    ...formData,
    recipient: {
      name: formData.recipient?.name || '',
      street: formData.recipient?.street || '',
      zip: formData.recipient?.zip || '',
      city: formData.recipient?.city || '',
      country: formData.recipient?.country || 'Deutschland',
      email: formData.recipient?.email || '',
      phone: formData.recipient?.phone || '',
      taxId: formData.recipient?.taxId || ''
    },
    positions: formData.positions || [],
    date: formData.date || new Date().toISOString().split('T')[0],
    dueDate: formData.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryDate: formData.deliveryDate || new Date().toISOString().split('T')[0],
    invoiceNumber: formData.invoiceNumber || '',
    referenceNumber: formData.referenceNumber || '',
    notes: formData.notes || '',
    subject: formData.subject || '',
    number: formData.number || '',
    discount: formData.discount || { type: 'fixed', value: 0 }
  };

  if (!isClient) {
    return <div>Lade...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <style jsx global>{`
        /* Chrome, Safari, Edge, Opera */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Neue Rechnung</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isErechnung}
              onClick={() => setIsErechnung(!isErechnung)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isErechnung ? 'bg-[#FF5A1F]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`${
                  isErechnung ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            <label 
              htmlFor="erechnung" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              E-Rechnung
            </label>
          </div>
          <Button 
            variant="default" 
            size="default"
            className="bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 rounded-lg"
            onClick={handlePreview}
          >
            Rechnung ansehen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
        {/* Linke Spalte - Empfänger */}
        <div className={`mb-8 ${validationErrors.recipient ? 'border-red-500 border-2 p-4 rounded-md' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">Empfänger</h2>
          
          <div className="space-y-4">
            {/* Kontaktauswahl */}
            <div>
              <Label>
                Kontakt
                <span className="text-red-500 ml-1">*</span>
              </Label>
  
              {validationErrors.recipient && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.recipient}</p>
              )}
            </div>

            {/* 
              WICHTIG: Dieser Bereich enthält kritische Kontaktinformationen.
              Die folgenden Felder und deren Funktionalität dürfen NICHT verändert werden,
              es sei denn, dies wurde explizit über Cascade angefordert:
              - Kontaktauswahl (Select)
              - Straße (Input)
              - PLZ (Input)
              - Stadt (Input)
              - Land (Select)
　　            　
              Jede nicht autorisierte Änderung könnte zu Datenverlust oder 
              Inkonsistenzen in der Kontaktverwaltung führen.
            */}
            
            {/* Kontaktauswahl - NICHT ÄNDERN */}
            <div>
              <div className="flex gap-2 w-full">
                <Select
                  defaultValue={safeFormData.contactId}
                  value={safeFormData.contactId}
                  onValueChange={handleContactChange}
                >
                  <SelectTrigger className={`flex-1 ${validationErrors.recipient ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Kontakt auswählen">
                      {contacts.find(c => c.id === safeFormData.contactId)?.name || "Kontakt auswählen"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kontakt auswählen</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <NewContactDialog onContactCreated={async (contactId) => {
                  // Aktualisiere die Kontaktliste
                  const db = getDatabase();
                  const updatedContacts = await db.listContacts();
                  setContacts(updatedContacts);
                  
                  // Wähle den neuen Kontakt aus
                  handleContactChange(contactId);
                }} />
              </div>
              {validationErrors.recipient && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.recipient}</p>
              )}
            </div>

            {/* Straße - NICHT ÄNDERN */}
            <div>
              <Input
                type="text"
                placeholder="Straße *"
                className={`w-full rounded-md border border-gray-300 p-2 ${
                  validationErrors.street ? 'border-red-500' : ''
                }`}
                value={safeFormData.recipient.street}
                onChange={(e) => setFormData({
                  ...formData,
                  recipient: {
                    ...formData.recipient!,
                    street: e.target.value
                  }
                })}
              />
            </div>

            {/* PLZ und Stadt - NICHT ÄNDERN */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="PLZ *"
                  className={`w-full rounded-md border border-gray-300 p-2 ${
                    validationErrors.zip ? 'border-red-500' : ''
                  }`}
                  value={safeFormData.recipient.zip}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipient: {
                      ...formData.recipient!,
                      zip: e.target.value
                    }
                  })}
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Stadt *"
                  className={`w-full rounded-md border border-gray-300 p-2 ${
                    validationErrors.city ? 'border-red-500' : ''
                  }`}
                  value={safeFormData.recipient.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipient: {
                      ...formData.recipient!,
                      city: e.target.value
                    }
                  })}
                />
              </div>
            </div>

            {/* Land - NICHT ÄNDERN */}
            <div>
              <Select
                value={safeFormData.recipient.country || 'DE'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  recipient: {
                    ...formData.recipient!,
                    country: value
                  }
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Land auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {/* Hauptländer */}
                  <SelectItem value="DE">Deutschland</SelectItem>
                  <SelectItem value="GB">Großbritannien</SelectItem>
                  <SelectItem value="US">Vereinigte Staaten</SelectItem>
                  
                  {/* EU-Länder */}
                  <SelectItem value="AT">Österreich</SelectItem>
                  <SelectItem value="BE">Belgien</SelectItem>
                  <SelectItem value="CH">Schweiz</SelectItem>
                  <SelectItem value="CZ">Tschechien</SelectItem>
                  <SelectItem value="DK">Dänemark</SelectItem>
                  <SelectItem value="FR">Frankreich</SelectItem>
                  <SelectItem value="IT">Italien</SelectItem>
                  <SelectItem value="LI">Liechtenstein</SelectItem>
                  <SelectItem value="LU">Luxemburg</SelectItem>
                  <SelectItem value="NL">Niederlande</SelectItem>
                  <SelectItem value="PL">Polen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Rechte Spalte - Rechnungsinformationen */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Rechnungsinformationen</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="w-[240px]">
                <Label className="mb-2 block">
                  Rechnungsdatum
                  <span className="text-red-500">*</span>
                </Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !safeFormData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {safeFormData.date ? format(new Date(safeFormData.date), "P", { locale: de }) : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={safeFormData.date ? new Date(safeFormData.date) : new Date()}
                      onSelect={(date) => {
                        setFormData({ ...formData, date: date || new Date() });
                        setDatePopoverOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>
                  Lieferdatum
                  <span className="text-red-500">*</span>
                </Label>
                <Popover open={deliveryDatePopoverOpen} onOpenChange={setDeliveryDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !safeFormData.deliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {safeFormData.deliveryDate ? format(new Date(safeFormData.deliveryDate), "PPP", { locale: de }) : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={safeFormData.deliveryDate ? new Date(safeFormData.deliveryDate) : new Date()}
                      onSelect={(date) => {
                        setFormData({ ...formData, deliveryDate: date || new Date() });
                        setDeliveryDatePopoverOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Rechnungsnummer
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={safeFormData.number}
                  onChange={(e) => setFormData({
                    ...formData,
                    number: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>
                  Referenznummer
                </Label>
                <Input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={safeFormData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>
                Zahlungsziel
              </Label>
              <div className="flex items-center gap-2">
                <Popover open={dueDatePopoverOpen} onOpenChange={setDueDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !safeFormData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {safeFormData.dueDate ? format(new Date(safeFormData.dueDate), "PPP", { locale: de }) : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={safeFormData.dueDate ? new Date(safeFormData.dueDate) : new Date()}
                      onSelect={(date) => {
                        setFormData({ ...formData, dueDate: date || new Date() });
                        setDueDatePopoverOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span>in</span>
                <Input
                  type="number"
                  className="w-16 rounded-md border border-gray-300 p-2"
                  value={paymentDays}
                  onChange={(e) => setPaymentDays(Number(e.target.value))}
                />
                <span>Tagen</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kopftext */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Kopftext</h2>
        <div>
          <Label>
            Betreff
          </Label>
          <Input
            type="text"
            className="w-full rounded-md border border-gray-300 p-2"
            value={safeFormData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
        </div>
      </div>

      {/* Positionen */}
      <div className={`mt-8 ${validationErrors.positions ? 'border-red-500 border-2 p-4 rounded-md' : ''}`}>
        <h2 className="text-xl font-semibold mb-4">Positionen</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 font-normal pr-2">Beschreibung</th>
              <th className="text-right py-2 font-normal w-24 px-2">Menge</th>
              <th className="text-right py-2 font-normal w-32 px-2">Preis (€)</th>
              <th className="text-right py-2 font-normal w-32 px-2">MwSt (%)</th>
              <th className="text-right py-2 font-normal w-32 pl-2">Gesamt (€)</th>
              <th className="py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {safeFormData.positions?.map((position, index) => (
              <tr key={index}>
                <td className="py-2 pr-2">
                  <Input
                    type="text"
                    className={`w-full ${!position.description ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                    value={position.description}
                    onChange={(e) => handlePositionChange(index, 'description', e.target.value)}
                  />
                </td>
                <td className="py-2 px-2">
                  <div className="flex justify-end">
                    <div className="relative w-24">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={position.quantity}
                        onChange={(e) => handlePositionChange(index, 'quantity', e.target.value)}
                        className="text-right pr-8"
                      />
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-px">
                        <button 
                          onClick={() => handlePositionChange(index, 'quantity', String(Number(position.quantity) + 1))}
                          className="hover:bg-gray-100 rounded p-0.5"
                        >
                          <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handlePositionChange(index, 'quantity', String(Math.max(0, Number(position.quantity) - 1)))}
                          className="hover:bg-gray-100 rounded p-0.5"
                        >
                          <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex justify-end">
                    <div className="relative w-32">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={typeof position.unitPrice === 'number' && position.unitPrice > 0 ? position.unitPrice : ''}
                        onChange={(e) => handlePositionChange(index, 'unitPrice', e.target.value)}
                        className="text-right pr-6"
                        placeholder="0.00"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    </div>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex justify-end">
                    <Select
                      value={String(position.taxRate || 19)}
                      onValueChange={(value) => handlePositionChange(index, 'taxRate', value)}
                    >
                      <SelectTrigger className="w-32 text-right rounded-md">
                        <SelectValue placeholder="MwSt. wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="19">19%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
                <td className="py-2 pl-2 text-right font-medium whitespace-nowrap">
                  {formatCurrency(position.totalGross || 0)}
                </td>
                <td className="py-2 pl-2 w-10">
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 rounded-md"
                    onClick={() => removePosition(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex gap-4">
          <Button
            variant="outline"
            onClick={addPosition}
            className="rounded-md"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Position hinzufügen
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleAddDiscount}
          >
            <PercentIcon className="w-4 h-4" />
            Rabatt hinzufügen
          </Button>
        </div>

        {validationErrors.positions && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.positions}</p>
        )}
      </div>

      {/* Summen */}
      <div className="flex flex-col gap-2 items-end mt-8">
        {/* Zwischensumme (Summe aller Positionen) */}
        <div className="flex gap-4 items-center justify-end w-full max-w-md">
          <span className="text-sm text-gray-600">Zwischensumme:</span>
          <span className="font-medium">{formatCurrency(totals.netTotal)}</span>
        </div>

        {/* Rabatt */}
        {safeFormData.discount && (
          <div className="flex gap-4 items-center justify-end w-full max-w-md">
            <span className="text-sm text-gray-600">
              Rabatt ({safeFormData.discount.type === 'percentage' ? `${safeFormData.discount.value}%` : 'Fixbetrag'}):
            </span>
            <span className="font-medium text-red-600">-{formatCurrency(totals.discountAmount)}</span>
          </div>
        )}

        {/* Gesamtsumme Netto (nach Rabatt) */}
        <div className="flex gap-4 items-center justify-end w-full max-w-md">
          <span className="text-sm text-gray-600">Gesamtsumme Netto:</span>
          <span className="font-medium">{formatCurrency(totals.netAfterDiscount)}</span>
        </div>

        {/* MwSt Aufschlüsselung */}
        {Object.entries(totals.vatAmounts).map(([rate, amount]) => (
          <div key={rate} className="flex gap-4 items-center justify-end w-full max-w-md">
            <span className="text-sm text-gray-600">MwSt. {rate}%:</span>
            <span className="font-medium">{formatCurrency(amount)}</span>
          </div>
        ))}

        {/* Gesamtsumme Brutto */}
        <div className="flex gap-4 items-center justify-end w-full max-w-md border-t border-gray-200 pt-2 mt-2">
          <span className="text-sm font-medium">Gesamtsumme Brutto:</span>
          <span className="font-bold text-lg">{formatCurrency(totals.grossTotal)}</span>
        </div>
      </div>

      {/* Rabatt-Dialog */}
      {showDiscountDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Rabatt hinzufügen</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={discountType === 'percentage' ? 'default' : 'outline'}
                  onClick={() => setDiscountType('percentage')}
                >
                  Prozent
                </Button>
                <Button
                  type="button"
                  variant={discountType === 'fixed' ? 'default' : 'outline'}
                  onClick={() => setDiscountType('fixed')}
                >
                  Festbetrag
                </Button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder={discountType === 'percentage' ? 'z.B. 10' : 'z.B. 100'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-px">
                  <button 
                    onClick={() => setDiscountValue(String(Number(discountValue) + 1))}
                    className="hover:bg-gray-100 rounded p-0.5"
                  >
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setDiscountValue(String(Math.max(0, Number(discountValue) - 1)))}
                    className="hover:bg-gray-100 rounded p-0.5"
                  >
                    <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </span>
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-500">
                  {discountType === 'percentage' ? '%' : '€'}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDiscountDialog(false)}
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                onClick={() => handleDiscountSubmit(discountType, Number(discountValue))}
              >
                Hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fußtext */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Fußtext</h2>
        <Textarea
          className="w-full rounded-md border border-gray-300 p-2"
          rows={4}
          value={safeFormData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Vielen Dank für Ihren Auftrag!\n\nBitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten angegebene Konto."
        />
      </div>

      {/* 
        WICHTIG: Dieser Bereich darf nicht verändert werden!
        Die Position und das Aussehen der "Rechnung ansehen" Buttons wurde speziell 
        für die optimale Benutzerführung gestaltet und darf nur auf explizite 
        Anforderung angepasst werden.
      */}
      <div className="mt-8 flex justify-end gap-4">
        <Button 
          className="bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 rounded-lg"
          onClick={handleSubmit}
          type="button"
        >
          Rechnung ansehen
        </Button>
      </div>
    </div>
  );
}

interface InvoicePosition {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalNet: number;
  totalGross: number;
}
