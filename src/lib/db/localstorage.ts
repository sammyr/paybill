import { DatabaseInterface, Contact, Invoice, Settings, Tax, Offer } from './interfaces';

const isServer = typeof window === 'undefined';
const memoryStorage: { [key: string]: any } = {};

const defaultSettings: Settings = {
  id: '1',
  companyName: '',
  companyAddress: '',
  companyZip: '',
  companyCity: '',
  companyCountry: '',
  companyEmail: '',
  companyPhone: '',
  companyWebsite: '',
  companyTaxId: '',
  companyVatId: '',
  companyRegistrationNumber: '',
  bankName: '',
  bankIban: '',
  bankBic: '',
  createdAt: new Date(),
  updatedAt: new Date()
};

export class LocalStorageDatabase implements DatabaseInterface {
  private getStorage(): Storage | typeof memoryStorage {
    return isServer ? memoryStorage : window.localStorage;
  }

  private getCollection<T>(key: string): T[] {
    try {
      const storage = this.getStorage();
      const data = storage[key];
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn(`Fehler beim Laden von ${key}:`, error);
      return [];
    }
  }

  private setCollection<T>(key: string, data: T[]): void {
    try {
      const storage = this.getStorage();
      storage[key] = JSON.stringify(data);
    } catch (error) {
      console.warn(`Fehler beim Speichern von ${key}:`, error);
    }
  }

  private getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const storage = this.getStorage();
      const data = storage[key];
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.warn(`Fehler beim Laden von ${key}:`, error);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, data: T): void {
    try {
      const storage = this.getStorage();
      storage[key] = JSON.stringify(data);
    } catch (error) {
      console.warn(`Fehler beim Speichern von ${key}:`, error);
    }
  }

  // Kontakte
  async listContacts(): Promise<Contact[]> {
    return this.getCollection<Contact>('contacts');
  }

  async getContact(id: string): Promise<Contact | null> {
    const contacts = this.getCollection<Contact>('contacts');
    return contacts.find(contact => contact.id === id) || null;
  }

  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const contacts = this.getCollection<Contact>('contacts');
    const now = new Date();
    const newContact: Contact = {
      id: crypto.randomUUID(),
      ...contact,
      createdAt: now,
      updatedAt: now
    };
    contacts.push(newContact);
    this.setCollection('contacts', contacts);
    return newContact;
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const contacts = this.getCollection<Contact>('contacts');
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Kontakt nicht gefunden');
    }
    const now = new Date();
    contacts[index] = {
      ...contacts[index],
      ...contact,
      updatedAt: now
    };
    this.setCollection('contacts', contacts);
    return contacts[index];
  }

  async deleteContact(id: string): Promise<void> {
    const contacts = this.getCollection<Contact>('contacts');
    const filtered = contacts.filter(contact => contact.id !== id);
    this.setCollection('contacts', filtered);
  }

  // Rechnungen
  async listInvoices(): Promise<Invoice[]> {
    return this.getCollection<Invoice>('invoices');
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const invoices = this.getCollection<Invoice>('invoices');
    return invoices.find(invoice => invoice.id === id) || null;
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoices = this.getCollection<Invoice>('invoices');
    const now = new Date();
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      ...invoice,
      createdAt: now,
      updatedAt: now
    };
    invoices.push(newInvoice);
    this.setCollection('invoices', invoices);
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const invoices = this.getCollection<Invoice>('invoices');
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error('Rechnung nicht gefunden');
    }
    const now = new Date();
    invoices[index] = {
      ...invoices[index],
      ...invoice,
      updatedAt: now
    };
    this.setCollection('invoices', invoices);
    return invoices[index];
  }

  async deleteInvoice(id: string): Promise<void> {
    const invoices = this.getCollection<Invoice>('invoices');
    const filtered = invoices.filter(invoice => invoice.id !== id);
    this.setCollection('invoices', filtered);
  }

  // Angebote
  async listOffers(): Promise<Offer[]> {
    return this.getCollection<Offer>('offers');
  }

  async getOffer(id: string): Promise<Offer | null> {
    const offers = this.getCollection<Offer>('offers');
    return offers.find(offer => offer.id === id) || null;
  }

  async createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
    const offers = this.getCollection<Offer>('offers');
    const now = new Date();
    const newOffer: Offer = {
      id: crypto.randomUUID(),
      ...offer,
      createdAt: now,
      updatedAt: now
    };
    offers.push(newOffer);
    this.setCollection('offers', offers);
    return newOffer;
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
    const offers = this.getCollection<Offer>('offers');
    const index = offers.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Angebot nicht gefunden');
    }
    const now = new Date();
    offers[index] = {
      ...offers[index],
      ...offer,
      updatedAt: now
    };
    this.setCollection('offers', offers);
    return offers[index];
  }

  async deleteOffer(id: string): Promise<void> {
    const offers = this.getCollection<Offer>('offers');
    const filtered = offers.filter(offer => offer.id !== id);
    this.setCollection('offers', filtered);
  }

  // Einstellungen
  async getSettings(): Promise<Settings> {
    const settings = this.getItem<Settings>('settings', defaultSettings);
    return settings || defaultSettings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const updatedSettings: Settings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date()
    };
    this.setItem('settings', updatedSettings);
    return updatedSettings;
  }

  // Steuern
  async listTaxes(): Promise<Tax[]> {
    return this.getCollection<Tax>('taxes');
  }

  async createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    const taxes = this.getCollection<Tax>('taxes');
    const now = new Date();
    const newTax: Tax = {
      id: crypto.randomUUID(),
      ...tax,
      createdAt: now,
      updatedAt: now
    };
    taxes.push(newTax);
    this.setCollection('taxes', taxes);
    return newTax;
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    const taxes = this.getCollection<Tax>('taxes');
    const index = taxes.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Steuer nicht gefunden');
    }
    const now = new Date();
    taxes[index] = {
      ...taxes[index],
      ...tax,
      updatedAt: now
    };
    this.setCollection('taxes', taxes);
    return taxes[index];
  }

  async deleteTax(id: string): Promise<void> {
    const taxes = this.getCollection<Tax>('taxes');
    const filtered = taxes.filter(tax => tax.id !== id);
    this.setCollection('taxes', filtered);
  }
}
