/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

import { DatabaseInterface, Contact, Invoice, Settings, Tax } from './interfaces';

// Beispiel-Kontakte für die Initialisierung
const initialContacts: Contact[] = [
  {
    id: '1',
    name: 'Mustermann GmbH',
    type: 'customer',
    email: 'kontakt@mustermann-gmbh.de',
    phone: '+49 30 123456',
    address: 'Musterstraße 1, 10115 Berlin',
    taxId: 'DE123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Schmidt & Partner',
    type: 'supplier',
    email: 'info@schmidt-partner.de',
    phone: '+49 40 654321',
    address: 'Hauptstraße 25, 20095 Hamburg',
    taxId: 'DE987654321',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Weber Consulting',
    type: 'partner',
    email: 'mail@weber-consulting.de',
    phone: '+49 89 112233',
    address: 'Marienplatz 8, 80331 München',
    taxId: 'DE456789123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Beispielrechnungen für die Initialisierung
const initialInvoices: Invoice[] = [];

export class MemoryDatabase implements DatabaseInterface {
  private contacts: Contact[];
  private invoices: Invoice[];
  private settings: Settings | null = null;
  private taxes: Tax[] = [];

  constructor() {
    // Lade gespeicherte Kontakte oder verwende Beispieldaten
    let savedContacts: Contact[] | null = null;
    
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('contacts');
      if (savedData) {
        try {
          savedContacts = JSON.parse(savedData, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
        } catch (error) {
          console.error('Fehler beim Laden der Kontakte:', error);
        }
      }
    }
    
    this.contacts = savedContacts || [...initialContacts];

    // Lade gespeicherte Rechnungen oder verwende Beispieldaten
    let savedInvoices: Invoice[] | null = null;
    
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('invoices');
      if (savedData) {
        try {
          savedInvoices = JSON.parse(savedData, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
        } catch (error) {
          console.error('Fehler beim Laden der Rechnungen:', error);
        }
      }
    }
    
    this.invoices = savedInvoices || [...initialInvoices];

    // Lade gespeicherte Einstellungen
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('settings');
      if (savedSettings) {
        try {
          this.settings = JSON.parse(savedSettings, (key, value) => {
            if (key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
        } catch (error) {
          console.error('Fehler beim Laden der Einstellungen:', error);
        }
      }
    }
  }

  private saveContacts() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('contacts', JSON.stringify(this.contacts));
    }
  }

  private saveInvoices() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('invoices', JSON.stringify(this.invoices));
    }
  }

  private saveSettings() {
    if (typeof window !== 'undefined' && this.settings) {
      localStorage.setItem('settings', JSON.stringify(this.settings));
    }
  }

  // Hilfsfunktion zum Generieren der nächsten Rechnungsnummer
  private getNextInvoiceNumber(): string {
    if (this.invoices.length === 0) {
      return '1001'; // Startnummer
    }

    // Finde die höchste Rechnungsnummer
    const maxNumber = Math.max(...this.invoices.map(inv => parseInt(inv.number)));
    return (maxNumber + 1).toString();
  }

  // Contacts
  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const newContact: Contact = {
      ...contact,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contacts.push(newContact);
    this.saveContacts();
    return newContact;
  }

  async getContact(id: string): Promise<Contact | null> {
    return this.contacts.find(contact => contact.id === id) || null;
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contact not found');

    const updatedContact = {
      ...this.contacts[index],
      ...contact,
      updatedAt: new Date(),
    };
    this.contacts[index] = updatedContact;
    this.saveContacts();
    return updatedContact;
  }

  async deleteContact(id: string): Promise<void> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      this.contacts.splice(index, 1);
      this.saveContacts();
    }
  }

  async listContacts(): Promise<Contact[]> {
    return [...this.contacts];
  }

  async getContacts(): Promise<Contact[]> {
    return this.contacts;
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.contacts;
  }

  // Invoices
  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    // Generiere eine neue Rechnungsnummer
    const number = this.getNextInvoiceNumber();

    const newInvoice: Invoice = {
      ...invoice,
      id: crypto.randomUUID(),
      number: number,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.invoices.push(newInvoice);
    this.saveInvoices();
    return newInvoice;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const invoice = this.invoices.find(inv => inv.id === id);
    if (!invoice) {
      throw new Error(`Invoice with id ${id} not found`);
    }
    return invoice;
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Invoice not found');

    const updatedInvoice = {
      ...this.invoices[index],
      ...invoice,
      updatedAt: new Date(),
    };
    this.invoices[index] = updatedInvoice;
    this.saveInvoices();
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      this.invoices.splice(index, 1);
      this.saveInvoices();
    }
  }

  async listInvoices(): Promise<Invoice[]> {
    return [...this.invoices];
  }

  // Helper method to reset the database
  async resetDatabase() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('invoices');
      this.invoices = [];
    }
  }

  // Settings
  async getSettings(): Promise<Settings> {
    if (!this.settings) {
      this.settings = {
        id: crypto.randomUUID(),
        language: 'de',
        timezone: 'Europe/Berlin',
        currency: 'EUR',
        paymentTermDays: 14,
        updatedAt: new Date(),
      };
      this.saveSettings();
    }
    return this.settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    this.settings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date(),
    };
    this.saveSettings();
    return this.settings;
  }

  // Taxes
  async createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    const newTax: Tax = {
      ...tax,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.taxes.push(newTax);
    return newTax;
  }

  async getTax(id: string): Promise<Tax | null> {
    return this.taxes.find(tax => tax.id === id) || null;
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    const index = this.taxes.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tax not found');

    const updatedTax = {
      ...this.taxes[index],
      ...tax,
      updatedAt: new Date(),
    };
    this.taxes[index] = updatedTax;
    return updatedTax;
  }

  async deleteTax(id: string): Promise<void> {
    const index = this.taxes.findIndex(t => t.id === id);
    if (index !== -1) {
      this.taxes.splice(index, 1);
    }
  }

  async listTaxes(): Promise<Tax[]> {
    return [...this.taxes];
  }
}
