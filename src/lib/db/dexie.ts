import Dexie, { Table } from 'dexie';
import { DatabaseInterface, Contact, Invoice, Settings, Tax, Offer } from './interfaces';

class PaybillDB extends Dexie {
  contacts!: Table<Contact>;
  invoices!: Table<Invoice>;
  offers!: Table<Offer>;
  settings!: Table<Settings>;
  taxes!: Table<Tax>;

  constructor() {
    super('paybill');
    
    this.version(1).stores({
      contacts: 'id, name, type, email, phone, address, taxId, createdAt, updatedAt',
      invoices: 'id, number, date, dueDate, status, totalNet, totalGross, createdAt, updatedAt',
      offers: 'id, number, date, validUntil, status, totalNet, totalGross, createdAt, updatedAt',
      settings: 'id',
      taxes: 'id, year, quarter, status, dueDate, createdAt, updatedAt'
    });
  }
}

export class DexieDatabase implements DatabaseInterface {
  private db: PaybillDB;

  constructor() {
    this.db = new PaybillDB();
  }

  // Contacts
  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const now = new Date();
    const newContact: Contact = {
      id: crypto.randomUUID(),
      ...contact,
      createdAt: now,
      updatedAt: now
    };

    await this.db.contacts.add(newContact);
    return newContact;
  }

  async getContact(id: string): Promise<Contact | null> {
    return this.db.contacts.get(id) || null;
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const now = new Date();
    const updates = {
      ...contact,
      updatedAt: now
    };

    await this.db.contacts.update(id, updates);
    const updated = await this.getContact(id);
    if (!updated) throw new Error('Contact not found');
    return updated;
  }

  async deleteContact(id: string): Promise<void> {
    await this.db.contacts.delete(id);
  }

  async listContacts(): Promise<Contact[]> {
    return this.db.contacts.toArray();
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.listContacts();
  }

  async getContacts(): Promise<Contact[]> {
    return this.listContacts();
  }

  // Invoices
  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const now = new Date();
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      ...invoice,
      createdAt: now,
      updatedAt: now
    };

    await this.db.invoices.add(newInvoice);
    return newInvoice;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const invoice = await this.db.invoices.get(id);
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const now = new Date();
    const updates = {
      ...invoice,
      updatedAt: now
    };

    await this.db.invoices.update(id, updates);
    return this.getInvoice(id);
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.db.invoices.delete(id);
  }

  async listInvoices(): Promise<Invoice[]> {
    return this.db.invoices.toArray();
  }

  // Offers
  async createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
    const now = new Date();
    const newOffer: Offer = {
      id: crypto.randomUUID(),
      ...offer,
      createdAt: now,
      updatedAt: now
    };

    await this.db.offers.add(newOffer);
    return newOffer;
  }

  async getOffer(id: string): Promise<Offer | null> {
    return this.db.offers.get(id) || null;
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
    const now = new Date();
    const updates = {
      ...offer,
      updatedAt: now
    };

    await this.db.offers.update(id, updates);
    const updated = await this.getOffer(id);
    if (!updated) throw new Error('Offer not found');
    return updated;
  }

  async deleteOffer(id: string): Promise<void> {
    await this.db.offers.delete(id);
  }

  async listOffers(): Promise<Offer[]> {
    return this.db.offers.toArray();
  }

  async resetOffers(): Promise<void> {
    await this.db.offers.clear();
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const settings = await this.db.settings.get('default');
    return settings || {};
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updates = {
      ...current,
      ...settings,
      id: 'default'
    };

    await this.db.settings.put(updates);
    return this.getSettings();
  }

  // Taxes
  async createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    const now = new Date();
    const newTax: Tax = {
      id: crypto.randomUUID(),
      ...tax,
      createdAt: now,
      updatedAt: now
    };

    await this.db.taxes.add(newTax);
    return newTax;
  }

  async getTax(id: string): Promise<Tax | null> {
    return this.db.taxes.get(id) || null;
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    const now = new Date();
    const updates = {
      ...tax,
      updatedAt: now
    };

    await this.db.taxes.update(id, updates);
    const updated = await this.getTax(id);
    if (!updated) throw new Error('Tax not found');
    return updated;
  }

  async deleteTax(id: string): Promise<void> {
    await this.db.taxes.delete(id);
  }

  async listTaxes(): Promise<Tax[]> {
    return this.db.taxes.toArray();
  }
}
