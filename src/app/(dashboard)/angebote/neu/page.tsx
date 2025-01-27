'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
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
import { Contact } from '@/lib/db/interfaces';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { NewContactDialog } from "@/components/contact/NewContactDialog";
import { 
  calculateInvoiceTotals, 
  formatCurrency,
  calculatePositionTotals,
} from '@/lib/invoice-utils';

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
  validUntil: Date;
  number: string;
  referenceNumber: string;
  notes: string;
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
      description: 'Position 1',
      quantity: 1,
      unitPrice: 0,
      taxRate: 19,
      totalNet: 0,
      totalGross: 0
    }
  ],
  date: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage gültig
  number: '',
  referenceNumber: '',
  notes: 'Vielen Dank für Ihre Anfrage!\n\nDieses Angebot ist 30 Tage gültig.',
  totalNet: 0,
  totalGross: 0,
  vatAmount: 0,
  vatAmounts: {}
};

const useOfferFormStorage = () => {
  const getInitialState = (): FormData => {
    if (typeof window === 'undefined') return defaultFormData;
    
    try {
      const savedState = localStorage.getItem('offerFormData');
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
      localStorage.setItem('offerFormData', JSON.stringify(formData));
    } catch (error) {
      console.error('Fehler beim Speichern des Formularzustands:', error);
    }
  }, [formData]);

  return [formData, setFormData] as const;
};

// Wrapper-Komponente für useSearchParams
function SearchParamsWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  return children;
}

function OfferForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [showNewContactDialog, setShowNewContactDialog] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useOfferFormStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadContacts();
    loadNextNumber();
  }, []);

  const loadContacts = async () => {
    try {
      const db = getDatabase();
      const loadedContacts = await db.listContacts();
      setContacts(loadedContacts);
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
      toast({
        title: "Fehler",
        description: "Kontakte konnten nicht geladen werden",
        variant: "destructive",
      });
    }
  };

  const loadNextNumber = async () => {
    try {
      const db = getDatabase();
      const offers = await db.listOffers();
      
      // Finde die höchste Nummer
      let highestNumber = 0;
      offers.forEach(offer => {
        const num = parseInt(offer.number);
        if (!isNaN(num) && num > highestNumber) {
          highestNumber = num;
        }
      });
      
      // Setze die nächste Nummer
      const nextNumber = (highestNumber + 1).toString();
      setFormData(prev => ({
        ...prev,
        number: nextNumber
      }));
    } catch (error) {
      console.error('Fehler beim Laden der nächsten Angebotsnummer:', error);
      toast({
        title: "Fehler",
        description: "Nächste Angebotsnummer konnte nicht geladen werden",
        variant: "destructive",
      });
    }
  };

  const handleContactSelect = async (contactId: string) => {
    try {
      const db = getDatabase();
      const contact = await db.getContact(contactId);
      
      if (contact) {
        setFormData({
          ...formData,
          contactId,
          recipient: {
            name: contact.name || '',
            street: contact.street || '',
            zip: contact.zip || '',
            city: contact.city || '',
            country: contact.country || 'Deutschland',
            email: contact.email || '',
            phone: contact.phone || '',
            taxId: contact.taxId || ''
          }
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden des Kontakts:', error);
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht geladen werden",
        variant: "destructive",
      });
    }
  };

  const calculatePositionTotals = (position: any) => {
    const quantity = parseFloat(position.quantity?.toString() || '0');
    const unitPrice = parseFloat(position.unitPrice?.toString() || '0');
    const taxRate = parseFloat(position.taxRate?.toString() || '0');
    
    const totalNet = quantity * unitPrice;
    const totalGross = totalNet * (1 + taxRate / 100);
    
    return {
      ...position,
      totalNet,
      totalGross
    };
  };

  const calculateTotals = (positions: any[]) => {
    const totals = positions.reduce((acc, position) => {
      const totalNet = position.totalNet || 0;
      const taxRate = position.taxRate || 0;
      const vatAmount = totalNet * (taxRate / 100);
      
      acc.totalNet += totalNet;
      acc.vatAmount += vatAmount;
      acc.vatAmounts[taxRate] = (acc.vatAmounts[taxRate] || 0) + vatAmount;
      
      return acc;
    }, { totalNet: 0, vatAmount: 0, vatAmounts: {} });
    
    totals.totalGross = totals.totalNet + totals.vatAmount;
    return totals;
  };

  const handlePositionChange = (index: number, field: string, value: any) => {
    const newPositions = [...formData.positions];
    newPositions[index] = {
      ...newPositions[index],
      [field]: value
    };
    
    // Neuberechnung der Position
    newPositions[index] = calculatePositionTotals(newPositions[index]);
    
    // Neuberechnung der Gesamtsummen
    const totals = calculateTotals(newPositions);
    
    setFormData({
      ...formData,
      positions: newPositions,
      totalNet: totals.totalNet,
      totalGross: totals.totalGross,
      vatAmount: totals.vatAmount,
      vatAmounts: totals.vatAmounts
    });
  };

  const addPosition = () => {
    setFormData({
      ...formData,
      positions: [
        ...formData.positions,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 19,
          totalNet: 0,
          totalGross: 0
        }
      ]
    });
  };

  const removePosition = (index: number) => {
    const newPositions = formData.positions.filter((_, i) => i !== index);
    const totals = calculateTotals(newPositions);
    
    setFormData({
      ...formData,
      positions: newPositions,
      totalNet: totals.totalNet,
      totalGross: totals.totalGross,
      vatAmount: totals.vatAmount,
      vatAmounts: totals.vatAmounts
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const db = getDatabase();
      
      const offerData = {
        ...formData,
        status: 'offen',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.createOffer(offerData);
      
      toast({
        title: "Erfolg",
        description: "Angebot wurde erstellt",
      });
      
      router.push('/angebote');
    } catch (error) {
      console.error('Fehler beim Erstellen des Angebots:', error);
      toast({
        title: "Fehler",
        description: "Angebot konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    const offerData = {
      ...formData,
      status: 'entwurf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(`offer_draft_${formData.number}`, JSON.stringify(offerData));
    return offerData;
  };

  const handlePreview = async () => {
    try {
      // Validiere die Angebotsnummer
      if (!formData.number) {
        toast({
          title: "Fehler",
          description: "Keine Angebotsnummer vorhanden",
          variant: "destructive"
        });
        return;
      }

      // Speichere den Entwurf
      await saveDraft();
      
      // Navigiere zur Vorschau (mit absolutem Pfad)
      window.location.href = `/angebote/draft_temp/preview?number=${formData.number}`;
    } catch (error) {
      console.error('Fehler beim Anzeigen der Vorschau:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Erstellen der Vorschau",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Neues Angebot</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="default" 
            size="default"
            className="bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 rounded-lg"
            onClick={handlePreview}
          >
            Angebot ansehen
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Neues Angebot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Linke Spalte */}
            <div className="space-y-4">
              <div>
                <Label>Kunde</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.contactId}
                    onValueChange={handleContactSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kunde auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewContactDialog(true)}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Angebotsnummer</Label>
                <Input
                  value={formData.number}
                  onChange={(e) => {
                    // Entferne alle nicht-numerischen Zeichen
                    const cleanNumber = e.target.value.replace(/\D/g, '');
                    // Entferne führende Nullen
                    const finalNumber = cleanNumber.replace(/^0+/, '') || '';
                    setFormData({ ...formData, number: finalNumber });
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Referenznummer</Label>
                <Input
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP", { locale: de }) : <span>Datum wählen</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({ ...formData, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Gültig bis</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.validUntil && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.validUntil ? format(formData.validUntil, "PPP", { locale: de }) : <span>Datum wählen</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.validUntil}
                        onSelect={(date) => date && setFormData({ ...formData, validUntil: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Rechte Spalte - Empfänger */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.recipient.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipient: { ...formData.recipient, name: e.target.value }
                  })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Straße</Label>
                <Input
                  value={formData.recipient.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipient: { ...formData.recipient, street: e.target.value }
                  })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PLZ</Label>
                  <Input
                    value={formData.recipient.zip}
                    onChange={(e) => setFormData({
                      ...formData,
                      recipient: { ...formData.recipient, zip: e.target.value }
                    })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ort</Label>
                  <Input
                    value={formData.recipient.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      recipient: { ...formData.recipient, city: e.target.value }
                    })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Land</Label>
                <Input
                  value={formData.recipient.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipient: { ...formData.recipient, country: e.target.value }
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={formData.recipient.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      recipient: { ...formData.recipient, email: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={formData.recipient.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      recipient: { ...formData.recipient, phone: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positionen */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Positionen</CardTitle>
            <Button type="button" variant="outline" onClick={addPosition}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Position hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.positions.map((position, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end border-b pb-4">
                <div className="col-span-6">
                  <Label>Beschreibung</Label>
                  <Input
                    value={position.description}
                    onChange={(e) => handlePositionChange(index, 'description', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Menge</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={position.quantity}
                    onChange={(e) => handlePositionChange(index, 'quantity', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Einzelpreis (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={position.unitPrice}
                    onChange={(e) => handlePositionChange(index, 'unitPrice', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Label>MwSt. %</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={position.taxRate}
                    onChange={(e) => handlePositionChange(index, 'taxRate', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div className="col-span-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removePosition(index)}
                      className="h-10 w-10 p-0"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notizen */}
      <Card>
        <CardHeader>
          <CardTitle>Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Zusammenfassung */}
      <Card>
        <CardHeader>
          <CardTitle>Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Netto:</span>
              <span>{formatCurrency(formData.totalNet)}</span>
            </div>
            {Object.entries(formData.vatAmounts).map(([rate, amount]) => (
              <div key={rate} className="flex justify-between">
                <span>MwSt. {rate}%:</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold">
              <span>Gesamt:</span>
              <span>{formatCurrency(formData.totalGross)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aktionen */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/angebote')}
        >
          Abbrechen
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
        >
          Angebot ansehen
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Speichere...' : 'Angebot erstellen'}
        </Button>
      </div>

      {showNewContactDialog && (
        <NewContactDialog
          open={showNewContactDialog}
          onOpenChange={setShowNewContactDialog}
          onSuccess={(newContact) => {
            loadContacts();
            handleContactSelect(newContact.id);
          }}
        />
      )}
    </form>
  );
}

export default function NeuesAngebotPage() {
  return (
    <Suspense fallback={<div>Lade...</div>}>
      <SearchParamsWrapper>
        <OfferForm />
      </SearchParamsWrapper>
    </Suspense>
  );
}
