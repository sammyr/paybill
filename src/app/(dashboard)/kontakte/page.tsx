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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from 'lucide-react';

interface ContactFormData {
  id?: string;
  name: string;
  type: 'customer' | 'supplier' | 'partner';
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kontakte</h1>
        <Button onClick={handleNewContact}>Kontakt erstellen</Button>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setEditingContact(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact?.id ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editingContact?.name || ''}
                  onChange={e => setEditingContact({ ...editingContact!, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="type">Typ</Label>
                <Select
                  value={editingContact?.type || 'customer'}
                  onValueChange={(value) => setEditingContact({ ...editingContact!, type: value as 'customer' | 'supplier' | 'partner' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ wählen" />
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
                <Input
                  id="email"
                  type="email"
                  value={editingContact?.email || ''}
                  onChange={e => setEditingContact({ ...editingContact!, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={editingContact?.phone || ''}
                  onChange={e => setEditingContact({ ...editingContact!, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={editingContact?.address || ''}
                  onChange={e => setEditingContact({ ...editingContact!, address: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="taxId">Steuernummer</Label>
                <Input
                  id="taxId"
                  value={editingContact?.taxId || ''}
                  onChange={e => setEditingContact({ ...editingContact!, taxId: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              {editingContact?.id ? 'Speichern' : 'Erstellen'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Adresse</TableHead>
            <TableHead>Steuernummer</TableHead>
            <TableHead className="w-[50px]">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>{contact.name}</TableCell>
              <TableCell>{getTypeLabel(contact.type)}</TableCell>
              <TableCell>{contact.email}</TableCell>
              <TableCell>{contact.phone}</TableCell>
              <TableCell>{contact.address}</TableCell>
              <TableCell>{contact.taxId}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleEdit(contact)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
