/**
 * WICHTIG: KEINE FUNKTIONALITÄT ENTFERNEN!
 * 
 * Diese Datei enthält wichtige TypeScript Interfaces für die gesamte Anwendung.
 * Es darf keine bestehende Funktionalität entfernt werden.
 * Nur Hinzufügungen und Änderungen sind erlaubt, wenn diese ausdrücklich
 * vom Benutzer gewünscht oder verlangt werden.
 * 
 * Folgende Interfaces müssen erhalten bleiben:
 * - DatabaseInterface
 * - Contact
 * - Invoice
 * - Settings
 * - InvoiceItem
 */

export interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}

export interface Contact {
  id: string;
  name: string;
  type: 'customer' | 'supplier' | 'partner';
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  recipient: {
    name: string;
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
    taxId?: string;
  };
  positions: InvoiceItem[];
  notes?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalNet: number;
  totalGross: number;
}

export interface Settings {
  id: string;
  language: string;
  timezone: string;
  currency: string;
  paymentTermDays: number;
  companyName?: string;
  taxId?: string;
  address?: Address;
  logo?: string; // Base64-kodiertes Bild
  updatedAt: Date;
}

export interface Tax {
  id: string;
  year: number;
  quarter: number;
  taxableAmount: number;
  taxAmount: number;
  status: 'draft' | 'submitted' | 'paid';
  dueDate: Date;
  submissionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseInterface {
  // Contacts
  createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact>;
  getContact(id: string): Promise<Contact | null>;
  updateContact(id: string, contact: Partial<Contact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  listContacts(): Promise<Contact[]>;
  getAllContacts(): Promise<Contact[]>;
  getContacts(): Promise<Contact[]>;

  // Invoices
  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  listInvoices(): Promise<Invoice[]>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;

  // Taxes
  createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax>;
  getTax(id: string): Promise<Tax | null>;
  updateTax(id: string, tax: Partial<Tax>): Promise<Tax>;
  deleteTax(id: string): Promise<void>;
  listTaxes(): Promise<Tax[]>;
}
