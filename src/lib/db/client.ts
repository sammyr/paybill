import { Contact, DatabaseInterface, Invoice, Offer, Settings, Tax } from './interfaces';

export class DatabaseClient implements DatabaseInterface {
  private async fetchApi(method: 'GET' | 'POST', action: string, data?: any, id?: string) {
    const url = new URL('/api/db', window.location.origin);
    if (method === 'GET') {
      url.searchParams.set('action', action);
      if (id) url.searchParams.set('id', id);
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify({ action, data }) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Contacts
  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    return this.fetchApi('POST', 'createContact', contact);
  }

  async getContact(id: string): Promise<Contact | null> {
    return this.fetchApi('GET', 'getContact', undefined, id);
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    return this.fetchApi('POST', 'updateContact', { ...contact, id });
  }

  async deleteContact(id: string): Promise<void> {
    await this.fetchApi('POST', 'deleteContact', { id });
  }

  async listContacts(): Promise<Contact[]> {
    return this.fetchApi('GET', 'listContacts');
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.listContacts();
  }

  async getContacts(): Promise<Contact[]> {
    return this.listContacts();
  }

  // Invoices
  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    return this.fetchApi('POST', 'createInvoice', invoice);
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.fetchApi('GET', 'getInvoice', undefined, id);
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    return this.fetchApi('POST', 'updateInvoice', { ...invoice, id });
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.fetchApi('POST', 'deleteInvoice', { id });
  }

  async listInvoices(): Promise<Invoice[]> {
    return this.fetchApi('GET', 'listInvoices');
  }

  // Offers
  async createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
    return this.fetchApi('POST', 'createOffer', offer);
  }

  async getOffer(id: string): Promise<Offer | null> {
    return this.fetchApi('GET', 'getOffer', undefined, id);
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
    return this.fetchApi('POST', 'updateOffer', { ...offer, id });
  }

  async deleteOffer(id: string): Promise<void> {
    await this.fetchApi('POST', 'deleteOffer', { id });
  }

  async listOffers(): Promise<Offer[]> {
    return this.fetchApi('GET', 'listOffers');
  }

  async resetOffers(): Promise<void> {
    // Not implemented
  }

  // Settings
  async getSettings(): Promise<Settings> {
    return this.fetchApi('GET', 'getSettings');
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return this.fetchApi('POST', 'updateSettings', settings);
  }

  // Taxes
  async createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    return this.fetchApi('POST', 'createTax', tax);
  }

  async getTax(id: string): Promise<Tax | null> {
    return this.fetchApi('GET', 'getTax', undefined, id);
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    return this.fetchApi('POST', 'updateTax', { ...tax, id });
  }

  async deleteTax(id: string): Promise<void> {
    await this.fetchApi('POST', 'deleteTax', { id });
  }

  async listTaxes(): Promise<Tax[]> {
    return this.fetchApi('GET', 'listTaxes');
  }
}
