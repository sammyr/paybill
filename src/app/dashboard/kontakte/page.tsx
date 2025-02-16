/**
 * WICHTIG: Diese Datei enthält kritische Geschäftslogik für die Kontaktverwaltung.
 * 
 * WARNUNG: Die folgenden Felder und deren Funktionalität dürfen NICHT verändert werden,
 * es sei denn, dies wurde explizit über Cascade angefordert:
 * - Straße (street)
 * - Postleitzahl (zip)
 * - Ort (city)
 * - Land (country)
 * - E-Mail-Adresse (email)
 * - Telefonnummer (phone)
 * - Kommentar (notes)
 * 
 * Jede nicht autorisierte Änderung könnte zu Datenverlust oder Inkonsistenzen führen.
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Contact } from '@/lib/db/interfaces';
import { getDatabase } from '@/lib/db';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, MapPin, Phone, Mail, FileText } from 'lucide-react';

// Liste der verfügbaren Länder
const countries = [
  // Hauptländer
  { code: 'DE', name: 'Deutschland' },
  { code: 'GB', name: 'Großbritannien' },
  { code: 'US', name: 'Vereinigte Staaten' },
  
  // EU-Länder
  { code: 'AT', name: 'Österreich' },
  { code: 'BE', name: 'Belgien' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'CZ', name: 'Tschechien' },
  { code: 'DK', name: 'Dänemark' },
  { code: 'FR', name: 'Frankreich' },
  { code: 'IT', name: 'Italien' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LU', name: 'Luxemburg' },
  { code: 'NL', name: 'Niederlande' },
  { code: 'PL', name: 'Polen' }
].sort((a, b) => {
  // Hauptländer immer zuerst
  const mainCountries = ['DE', 'GB', 'US'];
  const aIsMain = mainCountries.includes(a.code);
  const bIsMain = mainCountries.includes(b.code);
  
  if (aIsMain && !bIsMain) return -1;
  if (!aIsMain && bIsMain) return 1;
  
  // Dann alphabetisch nach Namen
  return a.name.localeCompare(b.name);
});

interface ContactFormData {
  id?: string;
  name: string;
  type: 'customer' | 'supplier' | 'partner';
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}

export default function KontaktePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactFormData | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      const db = getDatabase();
      const loadedContacts = await db.listContacts();
      setContacts(loadedContacts);
    };
    loadContacts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    const db = getDatabase();
    
    try {
      if (editingContact.id) {
        // Bearbeiten
        const updatedContact = await db.updateContact(editingContact.id, editingContact);
        setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
      } else {
        // Neu erstellen
        const contact = await db.createContact({
          name: editingContact.name,
          type: editingContact.type,
          email: editingContact.email,
          phone: editingContact.phone,
          address: editingContact.address,
          taxId: editingContact.taxId,
          street: editingContact.street,
          zip: editingContact.zip,
          city: editingContact.city,
          country: editingContact.country,
          notes: editingContact.notes,
        });
        setContacts([...contacts, contact]);
      }
      
      setIsOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Fehler beim Speichern des Kontakts:', error);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact({
      id: contact.id,
      name: contact.name,
      type: contact.type,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      taxId: contact.taxId,
      street: contact.street,
      zip: contact.zip,
      city: contact.city,
      country: contact.country,
      notes: contact.notes,
    });
    setIsOpen(true);
  };

  const handleNewContact = () => {
    setEditingContact({
      name: '',
      type: 'customer',
    });
    setIsOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const types = {
      customer: 'Kunde',
      supplier: 'Lieferant',
      partner: 'Partner'
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kontakte</h1>
        <Button onClick={handleNewContact}>Neuer Kontakt</Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingContact?.id ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basis Informationen */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={editingContact?.name || ''}
                    onChange={(e) => setEditingContact(prev => prev ? {...prev, name: e.target.value} : null)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Typ *</Label>
                  <Select
                    value={editingContact?.type}
                    onValueChange={(value: 'customer' | 'supplier' | 'partner') => 
                      setEditingContact(prev => prev ? {...prev, type: value} : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Kunde</SelectItem>
                      <SelectItem value="supplier">Lieferant</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={editingContact?.email || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {...prev, email: e.target.value} : null)}
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={editingContact?.phone || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {...prev, phone: e.target.value} : null)}
                      className="pl-10"
                    />
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Adresse und weitere Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="street">Straße</Label>
                  <Input
                    id="street"
                    value={editingContact?.street || ''}
                    onChange={(e) => setEditingContact(prev => prev ? {...prev, street: e.target.value} : null)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="zip">PLZ</Label>
                    <Input
                      id="zip"
                      value={editingContact?.zip || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {...prev, zip: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ort</Label>
                    <Input
                      id="city"
                      value={editingContact?.city || ''}
                      onChange={(e) => setEditingContact(prev => prev ? {...prev, city: e.target.value} : null)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Land</Label>
                  <Select
                    value={editingContact?.country || 'DE'}
                    onValueChange={(value) => setEditingContact(prev => prev ? {...prev, country: value} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="taxId">USt-IdNr.</Label>
                  <Input
                    id="taxId"
                    value={editingContact?.taxId || ''}
                    onChange={(e) => setEditingContact(prev => prev ? {...prev, taxId: e.target.value} : null)}
                  />
                </div>
              </div>
            </div>

            {/* Kommentar */}
            <div>
              <Label htmlFor="notes">Kommentar</Label>
              <div className="relative">
                <Textarea
                  id="notes"
                  value={editingContact?.notes || ''}
                  onChange={(e) => setEditingContact(prev => prev ? {...prev, notes: e.target.value} : null)}
                  className="min-h-[100px] pl-10"
                />
                <FileText className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit">
                {editingContact?.id ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>USt-IdNr.</TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>
                  {contact.type === 'customer' && 'Kunde'}
                  {contact.type === 'supplier' && 'Lieferant'}
                  {contact.type === 'partner' && 'Partner'}
                </TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>
                  {contact.street && contact.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.street}, {contact.zip} {contact.city}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>{contact.taxId}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
