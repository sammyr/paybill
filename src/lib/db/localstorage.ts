import { DatabaseInterface, Contact, Invoice, Settings, Tax, Offer } from './interfaces';

export class LocalStorageDatabase implements DatabaseInterface {
  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Fehler beim Laden von ${key}:`, e);
      return null;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Fehler beim Speichern von ${key}:`, e);
    }
  }

  private getCollection<T>(name: string): T[] {
    return this.getItem<T[]>(`paybill_${name}`) || [];
  }

  private setCollection<T>(name: string, items: T[]): void {
    this.setItem(`paybill_${name}`, items);
  }

  // Contacts
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

  async getContact(id: string): Promise<Contact | null> {
    const contacts = this.getCollection<Contact>('contacts');
    return contacts.find(c => c.id === id) || null;
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const contacts = this.getCollection<Contact>('contacts');
    const index = contacts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contact not found');
    
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
    this.setCollection('contacts', contacts.filter(c => c.id !== id));
  }

  async listContacts(): Promise<Contact[]> {
    return this.getCollection<Contact>('contacts');
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.listContacts();
  }

  async getContacts(): Promise<Contact[]> {
    return this.listContacts();
  }

  // Invoices
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

  async getInvoice(id: string): Promise<Invoice> {
    const invoices = this.getCollection<Invoice>('invoices');
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const invoices = this.getCollection<Invoice>('invoices');
    const index = invoices.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Invoice not found');
    
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
    this.setCollection('invoices', invoices.filter(i => i.id !== id));
  }

  async listInvoices(): Promise<Invoice[]> {
    return this.getCollection<Invoice>('invoices');
  }

  // Offers
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

  async getOffer(id: string): Promise<Offer | null> {
    const offers = this.getCollection<Offer>('offers');
    return offers.find(o => o.id === id) || null;
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
    const offers = this.getCollection<Offer>('offers');
    const index = offers.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Offer not found');
    
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
    this.setCollection('offers', offers.filter(o => o.id !== id));
  }

  async listOffers(): Promise<Offer[]> {
    return this.getCollection<Offer>('offers');
  }

  async resetOffers(): Promise<void> {
    this.setCollection('offers', []);
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.getItem<Settings>('paybill_settings') || {};
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const now = new Date();
    const currentSettings = await this.getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: now
    };
    
    if (!currentSettings.id) {
      updatedSettings.id = crypto.randomUUID();
      updatedSettings.createdAt = now;
    }
    
    this.setItem('paybill_settings', updatedSettings);
    return updatedSettings;
  }

  // Taxes
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

  async getTax(id: string): Promise<Tax | null> {
    const taxes = this.getCollection<Tax>('taxes');
    return taxes.find(t => t.id === id) || null;
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    const taxes = this.getCollection<Tax>('taxes');
    const index = taxes.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tax not found');
    
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
    this.setCollection('taxes', taxes.filter(t => t.id !== id));
  }

  async listTaxes(): Promise<Tax[]> {
    return this.getCollection<Tax>('taxes');
  }
}
