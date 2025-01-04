/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
    price: number;
    vat: number;
    amount: number;
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
      price: 90,
      vat: 19,
      amount: 1800
    },
    {
      description: 'UI/UX Design',
      quantity: 15,
      price: 85,
      vat: 19,
      amount: 1275
    },
    {
      description: 'Projektmanagement',
      quantity: 8,
      price: 95,
      vat: 19,
      amount: 760
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
  }
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
  const [isClient, setIsClient] = useState(false);
  const [paymentDays, setPaymentDays] = useState(14);
  const [isErechnung, setIsErechnung] = useState(false);
  const { toast } = useToast();
  const [formData, updateFormData, clearFormData] = useInvoiceFormStorage();
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
      updateFormData({
        ...formData,
        dueDate: dueDate
      });
    }
  }, [formData.date, paymentDays]);

  useEffect(() => {
    const loadContacts = async () => {
      const db = getDatabase();
      const loadedContacts = await db.listContacts();
      setContacts(loadedContacts);
    };
    loadContacts();
  }, []); // Keine Dependencies, da wir die Kontakte nur einmal laden müssen

  useEffect(() => {
    if (!formData.contactId) return;
    
    const contact = contacts.find(c => c.id === formData.contactId);
    if (!contact) {
      // Kontakt nicht gefunden, setze zurück
      updateFormData({
        ...formData,
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
        }
      });
    }
  }, [contacts, formData.contactId]); // Nur prüfen wenn sich die Kontakte oder die contactId ändert

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      updateFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: newValue
        }
      });
    } else {
      updateFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handlePositionChange = (index: number, field: string, value: string) => {
    const positions = [...formData.positions];
    const position = { ...positions[index] };

    if (field === 'price') {
      // Entferne zuerst alle Tausendertrennzeichen
      const cleanValue = value.replace(/\./g, '');
      // Ersetze Komma durch Punkt für die Berechnung
      const numericValue = cleanValue.replace(',', '.');
      // Parse als Nummer
      position[field] = parseFloat(numericValue) || 0;
    } else if (field === 'quantity') {
      position[field] = parseInt(value) || 0;
    } else {
      position[field] = value;
    }

    // Berechne den Gesamtbetrag für die Position
    position.amount = position.quantity * position.price;

    positions[index] = position;
    updateFormData({ ...formData, positions });
  };

  const addPosition = () => {
    const newPositions = [...formData.positions, {
      description: '',
      quantity: 1,
      price: 0,
      vat: 19,
      amount: 0
    }];
    updateFormData({
      ...formData,
      positions: newPositions
    });
  };

  const removePosition = (index: number) => {
    const positions = [...formData.positions];
    positions.splice(index, 1);
    updateFormData({
      ...formData,
      positions
    });
  };

  const calculateTotals = (positions: any[], discount?: { type: 'percentage' | 'fixed', value: number }) => {
    // Netto-Summe berechnen
    const netTotal = positions.reduce((sum, pos) => sum + (pos.quantity * pos.price), 0);

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
      const positionNet = (pos.quantity * pos.price);
      // Anteiligen Rabatt für diese Position berechnen
      const positionDiscountRatio = positionNet / netTotal;
      const positionDiscount = discountAmount * positionDiscountRatio;
      const positionNetAfterDiscount = positionNet - positionDiscount;
      
      const vatRate = pos.vat;
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

  const [totals, setTotals] = useState({
    netTotal: 0,
    discountAmount: 0,
    netAfterDiscount: 0,
    vatAmounts: {},
    totalVat: 0,
    grossTotal: 0
  });

  useEffect(() => {
    if (formData.positions) {
      const totals = calculateTotals(formData.positions, formData.discount);
      setTotals(totals);
    }
  }, [formData.positions, formData.discount]);

  const calculatePositionAmount = (position: InvoicePosition) => {
    if (!position.quantity || !position.price) return 0;
    const baseAmount = position.quantity * position.price;
    return baseAmount;
  };

  const calculateDiscount = () => {
    if (!formData.discount) return 0;
    
    const subtotal = calculateTotals(formData.positions, formData.discount).netTotal;
    if (formData.discount.type === 'percentage') {
      return (subtotal * formData.discount.value) / 100;
    }
    return formData.discount.value;
  };

  const handleAddDiscount = () => {
    setShowDiscountDialog(true);
  };

  const handleDiscountSubmit = () => {
    const value = Number(discountValue);
    if (!isNaN(value) && value > 0) {
      updateFormData(prev => ({
        ...prev,
        discount: {
          type: discountType,
          value: value
        }
      }));
    }
    setShowDiscountDialog(false);
    setDiscountValue('');
  };

  const handleContactSelect = (contact: Contact) => {
    // Extrahiere Straße, PLZ und Stadt aus der Adresse
    const addressParts = contact.address?.split(',').map(part => part.trim()) || ['', ''];
    const [street = '', cityPart = ''] = addressParts;
    const [zip = '', city = ''] = cityPart.split(' ').filter(Boolean);

    updateFormData({
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
        if (position.price < 0) {
          errors[`position_${index}_price`] = 'Preis darf nicht negativ sein';
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
      const netTotal = formData.positions.reduce((sum, pos) => sum + (Number(pos.quantity) * Number(pos.price)), 0);
      const vatAmount = netTotal * 0.19;
      
      // Berechne Rabatt wenn vorhanden
      let discountAmount = 0;
      if (formData.discount) {
        if (formData.discount.type === 'percentage') {
          discountAmount = netTotal * (Number(formData.discount.value) / 100);
        } else {
          discountAmount = Number(formData.discount.value);
        }
      }
      
      const discountedNet = netTotal - discountAmount;
      const vatAfterDiscount = discountedNet * 0.19;
      const grossTotal = discountedNet + vatAfterDiscount;

      // Erstelle neue Rechnung
      const invoice: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'> = {
        date: formData.date,
        dueDate: formData.dueDate,
        number: await db.getNextInvoiceNumber(), // Rechnungsnummer hinzugefügt
        contactId: formData.contactId,
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
          unitPrice: Number(pos.price),
          taxRate: Number(pos.vat),
          amount: Number(pos.quantity) * Number(pos.price)
        })) || [],
        notes: formData.notes,
        status: 'draft',
        // Rabatt-Informationen hinzufügen
        discount: discountAmount,
        discountType: formData.discount?.type,
        discountValue: formData.discount?.value,
        // Gesamtbeträge
        totalNet: netTotal,
        totalGross: grossTotal,
        vatAmount: vatAfterDiscount,
        vatRate: 19
      };

      const savedInvoice = await db.createInvoice(invoice);
      console.log('Rechnung gespeichert:', savedInvoice);

      // Navigiere zur Preview-Seite
      router.push(`/rechnungen/${savedInvoice.id}/preview`);
      
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
        
        updateFormData(updatedFormData);
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
        
        updateFormData(updatedFormData);
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

  const handlePreview = () => {
    // Hole aktuelle Formulardaten
    const currentFormData = formData;
    
    // Generiere eine temporäre ID für den Entwurf
    const draftId = 'draft_temp';
    
    // Berechne die Gesamtbeträge
    const totals = calculateTotals(formData.positions, formData.discount);
    
    // Bereite die Positionen mit Preisen vor
    const positionsWithPrices = formData.positions.map(pos => ({
      ...pos,
      quantity: parseFloat(pos.quantity?.toString() || '0'),
      unitPrice: parseFloat(pos.unitPrice?.toString() || '0'),
      totalNet: parseFloat(pos.quantity?.toString() || '0') * parseFloat(pos.unitPrice?.toString() || '0')
    }));
    
    // Bereite die Rechnungsdaten vor
    const invoiceData = {
      ...currentFormData,
      id: draftId,
      positions: positionsWithPrices,
      totalNet: totals.netTotal,
      totalGross: totals.grossTotal,
      vatAmount: totals.totalVat,
      vatRate: 19,
      status: 'entwurf',
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 Tage später
    };
    
    // Speichere den Entwurf
    localStorage.setItem(`invoice_draft_${draftId}`, JSON.stringify(invoiceData));
    
    // Navigiere zur Vorschau
    router.push(`/rechnungen/${draftId}/preview`);
  };

  useEffect(() => {
    // Prüfe, ob es eine zuletzt bearbeitete Rechnung gibt
    const lastEditedInvoice = localStorage.getItem('lastEditedInvoice');
    if (lastEditedInvoice) {
      const savedFormData = localStorage.getItem(`formData_${lastEditedInvoice}`);
      if (savedFormData) {
        try {
          const parsedFormData = JSON.parse(savedFormData);
          updateFormData(parsedFormData);
        } catch (error) {
          console.error('Fehler beim Laden der gespeicherten Rechnung:', error);
        }
      }
    }
  }, []);

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
                  defaultValue={formData.contactId}
                  value={formData.contactId}
                  onValueChange={handleContactChange}
                >
                  <SelectTrigger className={`flex-1 ${validationErrors.recipient ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Kontakt auswählen">
                      {contacts.find(c => c.id === formData.contactId)?.name || "Kontakt auswählen"}
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
                <Button variant="outline" onClick={() => setShowContactDialog(true)} className="rounded-md">
                  <PlusIcon className="h-4 w-4" />
                </Button>
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
                value={formData.recipient?.street || ''}
                onChange={(e) => updateFormData({
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
                  value={formData.recipient?.zip || ''}
                  onChange={(e) => updateFormData({
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
                  value={formData.recipient?.city || ''}
                  onChange={(e) => updateFormData({
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
                value={formData.recipient?.country || 'DE'}
                onValueChange={(value) => updateFormData({
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
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "P", { locale: de }) : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => {
                        updateFormData({ ...formData, date: date || new Date() });
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
                        !formData.deliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deliveryDate ? format(formData.deliveryDate, "PPP", { locale: de }) : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.deliveryDate}
                      onSelect={(date) => {
                        updateFormData({ ...formData, deliveryDate: date || new Date() });
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
                  value={formData.invoiceNumber}
                  readOnly
                />
              </div>
              <div>
                <Label>
                  Referenznummer
                </Label>
                <Input
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={formData.referenceNumber}
                  onChange={(e) => updateFormData({ ...formData, referenceNumber: e.target.value })}
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
                        !formData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? format(formData.dueDate, "PPP", { locale: de }) : <span>Datum wählen</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => {
                        updateFormData({ ...formData, dueDate: date || new Date() });
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
            value={formData.subject || `Rechnung Nr. ${formData.invoiceNumber}`}
            onChange={(e) => updateFormData({ ...formData, subject: e.target.value })}
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
            {formData.positions?.map((position, index) => (
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
                      <input
                        type="number"
                        value={position.quantity}
                        onChange={(e) => handlePositionChange(index, 'quantity', e.target.value)}
                        className="w-full text-right pr-8 p-2 border rounded"
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
                      <input
                        type="text"
                        inputMode="decimal"
                        value={position.price ? position.price.toLocaleString('de-DE', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2,
                          useGrouping: false // Deaktiviert Tausendertrennzeichen
                        }) : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handlePositionChange(index, 'price', value);
                        }}
                        className="w-full text-right pr-6 p-2 border rounded"
                        placeholder="0,00"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    </div>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <div className="flex justify-end">
                    <Select
                      value={position.vat.toString()}
                      onValueChange={(value) => handlePositionChange(index, 'vat', value)}
                    >
                      <SelectTrigger className="w-32 text-right rounded-md">
                        <SelectValue placeholder="MwSt. wählen" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="19">19%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="0">0%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
                <td className="py-2 pl-2 text-right font-medium whitespace-nowrap">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(calculatePositionAmount(position))}
                </td>
                <td className="py-2 pl-2 w-10">
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 rounded-md"
                    onClick={() => {
                      const newPositions = [...formData.positions || []];
                      newPositions.splice(index, 1);
                      updateFormData({ ...formData, positions: newPositions });
                    }}
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

      {/* 
        WICHTIG: Diese Komponente wurde am 02.01.2025 finalisiert.
        Bitte keine Änderungen vornehmen, es sei denn, es wird explizit danach gefragt.
        Änderungen könnten die Darstellung der Rechnung und die Betragsberechnungen beeinflussen.
      */}
      <div className="mt-8 text-right">
        <div className="space-y-2 w-full ">
          <div className="flex justify-between items-center">
            <span>Gesamtsumme Netto:</span>
            <span className="inline-block w-32 text-right ">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.netTotal)}</span>
          </div>
          
          {formData.discount && (
            <div className="flex justify-between items-center text-red-600">
              <span>Rabatt {formData.discount.type === 'percentage' ? `(${formData.discount.value}%)` : ''}:</span>
              <span className="inline-block w-32 text-right ">-{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.discountAmount)}</span>
            </div>
          )}
          
          {Object.keys(totals.vatAmounts).map(vatRate => (
            <div key={vatRate} className="flex justify-between items-center">
              <span>MwSt {vatRate}%:</span>
              <span className="inline-block w-32 text-right ">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.vatAmounts[vatRate])}</span>
            </div>
          ))}
          
          <div className="flex justify-between items-center font-bold border-t pt-2">
            <span>Gesamt:</span>
            <span className="inline-block w-32 text-right ">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.grossTotal)}</span>
          </div>
        </div>
      </div>

      {showDiscountDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
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
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                onClick={handleDiscountSubmit}
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
          value={formData.notes}
          onChange={(e) => updateFormData({ ...formData, notes: e.target.value })}
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
  price: number;
  vat: number;
  amount: number;
}

const calculatePositionAmount = (position: InvoicePosition) => {
  if (!position.quantity || !position.price) return 0;
  const baseAmount = position.quantity * position.price;
  return baseAmount;
};

const addPosition = () => {
  const newPositions = [...formData.positions, {
    description: '',
    quantity: 1,
    price: 0,
    vat: 19,
    amount: 0
  }];
  updateFormData({
    ...formData,
    positions: newPositions
  });
};
