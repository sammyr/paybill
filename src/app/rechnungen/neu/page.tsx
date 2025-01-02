/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function NeueRechnungPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
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
        discount: 0,
        unit: 'Std.',
        amount: 1800
      },
      {
        description: 'UI/UX Design',
        quantity: 15,
        price: 85,
        vat: 19,
        discount: 0,
        unit: 'Std.',
        amount: 1275
      },
      {
        description: 'Projektmanagement',
        quantity: 8,
        price: 95,
        vat: 19,
        discount: 0,
        unit: 'Std.',
        amount: 760
      }
    ],
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    deliveryDate: new Date().toISOString().split('T')[0],
    invoiceNumber: `RE${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}001`,
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

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const handlePositionChange = (index: number, field: string, value: string | number) => {
    const positions = [...(formData.positions || [])];
    positions[index] = {
      ...positions[index],
      [field]: value
    };

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
    const positions = [...(formData.positions || [])];
    positions.push({
      description: '',
      quantity: '1',
      price: '0',
      unit: 'Tag(e)',
      vat: '19',
      amount: '0'
    });
    updateFormData({
      ...formData,
      positions
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

  const totals = calculateTotals();

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

  const handleSave = async (preview: boolean = false) => {
    console.log('Validiere Formular...');
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      console.log('Validierungsfehler:', errors);
      setValidationErrors(errors);
      alert('Bitte füllen Sie alle erforderlichen Felder aus.');
      return;
    }

    try {
      console.log('Speichere Rechnung...');
      const db = getDatabase();
      
      // Erstelle neue Rechnung
      const invoice: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'> = {
        date: formData.date ? new Date(formData.date) : new Date(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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
          amount: Number(pos.quantity) * Number(pos.price),
          totalNet: Number(pos.quantity) * Number(pos.price),
          totalGross: Number(pos.quantity) * Number(pos.price) * (1 + Number(pos.vat) / 100)
        })) || [],
        notes: formData.notes,
        status: 'draft'
      };

      const savedInvoice = await db.createInvoice(invoice);
      console.log('Rechnung gespeichert:', savedInvoice);

      // Navigiere zuerst
      if (preview) {
        await router.push(`/rechnungen/${savedInvoice.id}`);
      } else {
        await router.push('/rechnungen');
      }

      // Warte einen Moment und lösche dann die Formulardaten
      setTimeout(() => {
        clearFormData();
      }, 500);
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Rechnung. Bitte versuchen Sie es erneut.');
    }
  };

  const validateForm = () => {
    const errors: {
      recipient?: string;
      street?: string;
      positions?: string;
    } = {};

    // Kontakt-Validierung
    if (!formData.recipient?.name) {
      errors.recipient = "Bitte wählen Sie einen Kontakt aus";
    }

    // Adress-Validierung
    if (!formData.recipient?.street || !formData.recipient?.zip || !formData.recipient?.city) {
      errors.street = "Bitte geben Sie eine vollständige Anschrift ein";
    }

    // Positionen-Validierung
    if (!formData.positions?.length) {
      errors.positions = "Bitte fügen Sie mindestens eine Position hinzu";
    } else {
      const invalidPositions = formData.positions.some(pos => 
        !pos.description || 
        !pos.quantity || 
        !pos.price || 
        Number(pos.quantity) <= 0 || 
        Number(pos.price) <= 0
      );
      if (invalidPositions) {
        errors.positions = "Bitte füllen Sie alle Positionsfelder korrekt aus";
      }
    }

    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Zeige Fehlermeldungen an
      const errorMessages = Object.values(errors).join('\n');
      alert(errorMessages);
    }
    
    return Object.keys(errors).length === 0;
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Neue Rechnung</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isEInvoice"
              className="w-4 h-4"
              checked={formData.isEInvoice}
              onChange={(e) => updateFormData({ ...formData, isEInvoice: e.target.checked })}
            />
            <label htmlFor="isEInvoice">E-Rechnung</label>
          </div>
          <Button variant="outline" onClick={() => router.push('/rechnungen')}>
            Vorschau
          </Button>
          <Button variant="outline" onClick={() => handleSave(true)}>
            Speichern
          </Button>
          <Button variant="default" className="bg-orange-500 hover:bg-orange-600">
            Versenden / Drucken / Herunterladen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Linke Spalte - Empfänger */}
        <div className={`mb-8 ${validationErrors.recipient ? 'border-red-500 border-2 p-4 rounded-md' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">Empfänger</h2>
          
          <div className="space-y-4">
            {/* Kontaktauswahl */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Empfänger</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>
                    Kontakt
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="flex gap-2">
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
                    <Button variant="outline" onClick={() => setShowContactDialog(true)}>
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {validationErrors.recipient && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.recipient}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Straße */}
            <div>
              <Label>
                Straße
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                className={`w-full rounded-md border p-2 ${
                  validationErrors.street ? 'border-red-500' : 'border-gray-300'
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
                  className={`w-full rounded-md border p-2 ${
                    validationErrors.street ? 'border-red-500' : 'border-gray-300'
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
                  className={`w-full rounded-md border p-2 ${
                    validationErrors.street ? 'border-red-500' : 'border-gray-300'
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
                  className="w-full rounded-md border border-gray-300 p-2"
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
                  className="w-full rounded-md border border-gray-300 p-2"
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
                  className="flex-1 rounded-md border border-gray-300 p-2"
                  value={formData.dueDate}
                  onChange={(e) => updateFormData({ ...formData, dueDate: e.target.value })}
                />
                <span>in</span>
                <Input
                  type="number"
                  className="w-16 rounded-md border border-gray-300 p-2"
                  value="14"
                  readOnly
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
            <tr className="border-b">
              <th className="text-left py-2 pr-2">Beschreibung</th>
              <th className="text-right py-2 px-2">Menge</th>
              <th className="text-right py-2 px-2">Preis (€)</th>
              <th className="text-right py-2 px-2">MwSt (%)</th>
              <th className="text-right py-2 px-2">Rabatt (%)</th>
              <th className="text-right py-2 pl-2 pr-10">Gesamt (€)</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {formData.positions?.map((position, index) => (
              <tr key={index}>
                <td className="py-2 pr-2">
                  <Input
                    type="text"
                    className={`w-full ${!position.description ? 'border-red-500' : 'border-gray-300'}`}
                    value={position.description}
                    onChange={(e) => handlePositionChange(index, 'description', e.target.value)}
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    className={`w-full text-right ${!position.quantity || Number(position.quantity) <= 0 ? 'border-red-500' : 'border-gray-300'}`}
                    value={position.quantity}
                    onChange={(e) => handlePositionChange(index, 'quantity', e.target.value)}
                  />
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    className={`w-full text-right ${!position.price || Number(position.price) <= 0 ? 'border-red-500' : 'border-gray-300'}`}
                    value={position.price}
                    onChange={(e) => handlePositionChange(index, 'price', e.target.value)}
                  />
                </td>
                <td className="py-2 px-2">
                  <Select
                    value={position.vat.toString()}
                    onValueChange={(value) => handlePositionChange(index, 'vat', value)}
                  >
                    <SelectTrigger className="w-full text-right">
                      <SelectValue placeholder="MwSt. wählen" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="19">19%</SelectItem>
                      <SelectItem value="7">7%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2 px-2">
                  <Input
                    type="number"
                    className="w-full text-right"
                    value={position.discount}
                    onChange={(e) => handlePositionChange(index, 'discount', e.target.value)}
                  />
                </td>
                <td className="py-2 pl-2 pr-10 text-right font-medium whitespace-nowrap">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(position.amount)}
                </td>
                <td className="py-2 pl-2">
                  <Button
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      const newPositions = [...formData.positions || []];
                      newPositions.splice(index, 1);
                      updateFormData({ ...formData, positions: newPositions });
                    }}
                  >
                    ✕
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex gap-4">
          <Button
            variant="outline"
            onClick={() => {
              const newPositions = [...(formData.positions || [])];
              newPositions.push({
                description: '',
                quantity: 1,
                price: 0,
                vat: 19,
                discount: 0,
                amount: 0
              });
              updateFormData({ ...formData, positions: newPositions });
            }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Position hinzufügen
          </Button>
        </div>

        {validationErrors.positions && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.positions}</p>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between pr-10">
            <span>Gesamtsumme Netto:</span>
            <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.netTotal)}</span>
          </div>
          <div className="flex justify-between pr-10">
            <span>Umsatzsteuer 19%:</span>
            <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.vatTotal)}</span>
          </div>
          <div className="flex justify-between font-semibold pr-10">
            <span>Gesamt:</span>
            <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.grossTotal)}</span>
          </div>
        </div>
      </div>

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

      <div className="mt-8 flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={() => {
            // Nicht clearFormData aufrufen beim Zurückgehen
            router.push('/rechnungen');
          }}
        >
          Abbrechen
        </Button>
        <Button 
          variant="default" 
          onClick={() => handleSave(true)}
          type="button"
        >
          Speichern & Vorschau
        </Button>
      </div>
    </div>
  );
}
