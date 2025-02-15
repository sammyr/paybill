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

  private getLocalStorage() {
    if (typeof window !== 'undefined') {
      return window.localStorage;
    }
    return null;
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
      throw new Error(`Fehler beim Speichern von ${key}: ${error.message}`);
    }
  }

  private getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const storage = this.getStorage();
      const data = storage[key];
      if (!data) return defaultValue;
      
      const parsed = JSON.parse(data);
      return parsed || defaultValue;
    } catch (error) {
      console.warn(`Fehler beim Laden von ${key}:`, error);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, data: T): void {
    if (!data) {
      console.warn(`Ungültige Daten für ${key}`);
      throw new Error('Ungültige Daten');
    }

    try {
      const storage = this.getStorage();
      const jsonData = JSON.stringify(data);
      storage[key] = jsonData;

      // Validiere, dass die Daten korrekt gespeichert wurden
      const savedData = storage[key];
      if (!savedData) {
        throw new Error('Daten konnten nicht gespeichert werden');
      }

      const parsedData = JSON.parse(savedData);
      if (!parsedData) {
        throw new Error('Gespeicherte Daten sind ungültig');
      }
    } catch (error) {
      console.error(`Fehler beim Speichern von ${key}:`, error);
      throw new Error(`Die Daten konnten nicht gespeichert werden: ${error.message}`);
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
    try {
      const settings = this.getCollection<Settings>('settings')[0];
      if (!settings) {
        // Wenn keine Einstellungen gefunden wurden, verwende die Standardeinstellungen
        const defaultSettingsCopy = { ...defaultSettings };
        this.setCollection('settings', [defaultSettingsCopy]);
        return defaultSettingsCopy;
      }
      return settings;
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
      return { ...defaultSettings };
    }
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    try {
      // Hole aktuelle Einstellungen
      const currentSettings = await this.getSettings();
      
      // Aktualisiere die Einstellungen
      const updatedSettings: Settings = {
        ...currentSettings,
        ...settings,
        updatedAt: new Date()
      };

      // Validiere die Daten vor dem Speichern
      if (!updatedSettings.id) {
        updatedSettings.id = '1';
      }

      // Speichere die aktualisierten Einstellungen
      this.setCollection('settings', [updatedSettings]);
      return updatedSettings;
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      throw error;
    }
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
