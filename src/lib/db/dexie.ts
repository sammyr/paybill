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
    const contact = await this.db.contacts.get(id);
    if (contact) {
      contact.createdAt = new Date(contact.createdAt);
      contact.updatedAt = new Date(contact.updatedAt);
    }
    return contact || null;
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
    const contacts = await this.db.contacts.toArray();
    return contacts.map(contact => ({
      ...contact,
      createdAt: new Date(contact.createdAt),
      updatedAt: new Date(contact.updatedAt)
    }));
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
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
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
      updatedAt: now.toISOString()
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
    const offer = await this.db.offers.get(id);
    if (offer) {
      offer.createdAt = new Date(offer.createdAt);
      offer.updatedAt = new Date(offer.updatedAt);
      if (offer.date) offer.date = new Date(offer.date);
      if (offer.validUntil) offer.validUntil = new Date(offer.validUntil);
    }
    return offer || null;
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
    const offers = await this.db.offers.toArray();
    return offers.map(offer => ({
      ...offer,
      createdAt: new Date(offer.createdAt),
      updatedAt: new Date(offer.updatedAt),
      date: offer.date ? new Date(offer.date) : undefined,
      validUntil: offer.validUntil ? new Date(offer.validUntil) : undefined
    }));
  }

  async resetOffers(): Promise<void> {
    await this.db.offers.clear();
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const settings = await this.db.settings.toArray();
    return settings[0] || {};
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const now = new Date();
    const updates = {
      ...settings,
      updatedAt: now.toISOString()
    };

    const existing = await this.db.settings.toArray();
    if (existing.length > 0) {
      await this.db.settings.update(existing[0].id!, updates);
      return this.getSettings();
    } else {
      const newSettings = {
        id: crypto.randomUUID(),
        ...updates,
        createdAt: now.toISOString()
      };
      await this.db.settings.add(newSettings);
      return newSettings;
    }
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
    const tax = await this.db.taxes.get(id);
    if (tax) {
      tax.createdAt = new Date(tax.createdAt);
      tax.updatedAt = new Date(tax.updatedAt);
      if (tax.dueDate) tax.dueDate = new Date(tax.dueDate);
      if (tax.submissionDate) tax.submissionDate = new Date(tax.submissionDate);
    }
    return tax || null;
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
    const taxes = await this.db.taxes.toArray();
    return taxes.map(tax => ({
      ...tax,
      createdAt: new Date(tax.createdAt),
      updatedAt: new Date(tax.updatedAt),
      dueDate: tax.dueDate ? new Date(tax.dueDate) : undefined,
      submissionDate: tax.submissionDate ? new Date(tax.submissionDate) : undefined
    }));
  }
}
