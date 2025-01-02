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
import { useInvoiceFormStorage } from '@/hooks/useInvoiceFormStorage';

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
  date: string;
  dueDate: string;
  deliveryDate: string;
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

export default function NeueRechnungPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [paymentDays, setPaymentDays] = useState(14);
  const [isErechnung, setIsErechnung] = useState(false);
  const { toast } = useToast();
  const [formData, updateFormData, clearFormData] = useInvoiceFormStorage({
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
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
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
  });

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
        dueDate: dueDate.toISOString().split('T')[0]
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

  const handlePositionChange = (index: number, field: keyof InvoicePosition, value: string) => {
    const positions = [...(formData.positions || [])];
    if (field === 'price') {
      // Entferne alle Nicht-Zahlen außer Punkt und Komma
      const sanitizedValue = value.replace(/[^\d.,]/g, '');
      // Ersetze Komma durch Punkt für die interne Verarbeitung
      const numberValue = sanitizedValue.replace(',', '.');
      // Begrenze auf 2 Dezimalstellen
      const formattedValue = Number(numberValue).toFixed(2);
      positions[index][field] = formattedValue;
    } else {
      positions[index][field] = value;
    }

    if (field === 'quantity' || field === 'price') {
      const quantity = Number(positions[index].quantity) || 0;
      const price = Number(positions[index].price) || 0;
      positions[index].amount = quantity * price;
    }

    updateFormData({
      ...formData,
      positions
    });
  };

  const addPosition = () => {
    const newPositions = [...(formData.positions || []), {
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
    const positions = [...(formData.positions || [])];
    positions.splice(index, 1);
    updateFormData({
      ...formData,
      positions
    });
  };

  const calculateTotals = () => {
    const positions = formData.positions || [];
    let netTotal = 0;
    let vatTotal = 0;

    positions.forEach(pos => {
      const amount = Number(pos.amount) || 0;
      const vat = Number(pos.vat) || 0;
      netTotal += amount;
      vatTotal += amount * (vat / 100);
    });

    return {
      netTotal,
      vatTotal,
      grossTotal: netTotal + vatTotal
    };
  };

  const calculatePositionAmount = (position: InvoicePosition) => {
    if (!position.quantity || !position.price) return 0;
    const baseAmount = position.quantity * position.price;
    return baseAmount;
  };

  const calculateDiscount = () => {
    if (!formData.discount) return 0;
    
    const subtotal = calculateTotals().netTotal;
    if (formData.discount.type === 'percentage') {
      return (subtotal * formData.discount.value) / 100;
    }
    return formData.discount.value;
  };

  const totals = useMemo(() => {
    const netTotal = formData.positions.reduce((sum, pos) => {
      return sum + (Number(pos.quantity) || 0) * (Number(pos.price) || 0);
    }, 0);

    const discount = calculateDiscount();
    const discountedTotal = netTotal - discount;
    
    const vatAmount = formData.positions.reduce((sum, pos) => {
      const positionNet = (Number(pos.quantity) || 0) * (Number(pos.price) || 0);
      return sum + (positionNet * (Number(pos.vat) || 0)) / 100;
    }, 0);

    return {
      netTotal,
      discount,
      discountedTotal,
      vatAmount,
      grossTotal: discountedTotal + vatAmount
    };
  }, [formData.positions, formData.discount]);

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Rechnung');
      }

      const result = await response.json();
      // Nach erfolgreicher Speicherung zur Preview-Seite navigieren
      router.push(`/rechnungen/${result.id}/preview`);
    } catch (error) {
      console.error('Fehler:', error);
      // Hier könnte eine Fehlerbehandlung erfolgen
    }
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

    return errors;
  };

  const handleContactChange = async (contactId: string) => {
    try {
      if (contactId === 'none') {
        const emptyRecipient = {
          name: '',
          street: '',
          zip: '',
          city: '',
          country: 'Deutschland',
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
        
        let street = '';
        let zip = '';
        let city = '';
        
        if (addressMatch) {
          [, street, zip, city] = addressMatch;
        }

        const updatedFormData = {
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
        };
        
        updateFormData(updatedFormData);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Kontakts:', error);
    }
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
            onClick={handleSubmit}
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

            {/* Straße */}
            <div>
              <Label>
                Straße
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
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

            {/* PLZ und Stadt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  PLZ
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
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
                <Label>
                  Stadt
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
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

            {/* Land */}
            <div>
              <Label>
                Land
              </Label>
              <Input
                type="text"
                className="w-full rounded-md border border-gray-300 p-2"
                value={formData.recipient?.country || 'Deutschland'}
                onChange={(e) => updateFormData({
                  ...formData,
                  recipient: {
                    ...formData.recipient!,
                    country: e.target.value
                  }
                })}
              />
            </div>
          </div>
        </div>

        {/* Rechte Spalte - Rechnungsinformationen */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Rechnungsinformationen</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Rechnungsdatum
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  className={`w-full rounded-md border border-gray-300 p-2 ${
                    validationErrors.date ? 'border-red-500' : ''
                  }`}
                  value={formData.date}
                  onChange={(e) => updateFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label>
                  Lieferdatum
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  className={`w-full rounded-md border border-gray-300 p-2 ${
                    validationErrors.deliveryDate ? 'border-red-500' : ''
                  }`}
                  value={formData.deliveryDate}
                  onChange={(e) => updateFormData({ ...formData, deliveryDate: e.target.value })}
                />
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
                <Input
                  type="date"
                  className={`flex-1 rounded-md border border-gray-300 p-2 ${
                    validationErrors.dueDate ? 'border-red-500' : ''
                  }`}
                  value={formData.dueDate}
                  onChange={(e) => updateFormData({ ...formData, dueDate: e.target.value })}
                />
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
                        value={position.price ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(position.price)) : ''}
                        onChange={(e) => handlePositionChange(index, 'price', e.target.value)}
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

      <div className="mt-8">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Gesamtsumme Netto:</span>
          <span className="font-medium pr-[42px]">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.netTotal)}</span>
        </div>
        {formData.discount && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-600">
              Rabatt {formData.discount.type === 'percentage' ? `(${formData.discount.value}%)` : ''}:
            </span>
            <span className="font-medium text-red-600 pr-[42px]">
              -{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.discount)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-600">Umsatzsteuer {totals.vatAmount}%:</span>
          <span className="font-medium pr-[42px]">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.vatAmount)}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="font-semibold">Gesamt:</span>
          <span className="font-semibold pr-[42px]">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.grossTotal)}</span>
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
          placeholder="Vielen Dank für Ihren Auftrag. Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten angegebene Konto."
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
  const newPositions = [...(formData.positions || []), {
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
