import Database from 'better-sqlite3';
import { DatabaseInterface, Contact, Invoice, Settings, Tax, Offer, OfferItem } from './interfaces';
import { join } from 'path';
import { randomUUID } from 'crypto';

interface Row {
  [key: string]: any;
}

export class SQLiteDatabase implements DatabaseInterface {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Verwende den App-Datenordner für die Datenbank
    this.dbPath = join(process.cwd(), 'data', 'paybill.db');
    console.log('Initializing database at:', this.dbPath);
    this.db = new Database(this.dbPath);
    this.initDatabase();
  }

  private initDatabase() {
    try {
      console.log('Starting database initialization...');
      
      // Aktiviere Foreign Keys
      this.db.pragma('foreign_keys = ON');
      console.log('Foreign keys enabled');

      // Lösche existierende Tabellen
      console.log('Dropping existing tables...');
      this.db.exec('DROP TABLE IF EXISTS settings');
      
      console.log('Creating tables...');
      
      // Settings Tabelle
      console.log('Creating settings table...');
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          companyName TEXT,
          logo TEXT,
          companyOwner TEXT,
          street TEXT,
          number TEXT,
          zipCode TEXT,
          city TEXT,
          country TEXT,
          state TEXT,
          address TEXT,
          email TEXT,
          phone TEXT,
          mobile TEXT,
          fax TEXT,
          website TEXT,
          taxId TEXT,
          vatId TEXT,
          accountHolder TEXT,
          bankName TEXT,
          bankIban TEXT,
          bankBic TEXT,
          bankSwift TEXT,
          defaultTaxRate REAL,
          defaultPaymentTerms TEXT,
          defaultNotes TEXT,
          defaultFooter TEXT,
          defaultTerms TEXT,
          currency TEXT,
          dateFormat TEXT,
          timezone TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )
      `);

      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Error during database initialization:', error);
      throw error;
    }
  }

  private rowToSettings(row: Row): Settings {
    if (!row) return {};
    
    // Erstelle das bankDetails-Objekt aus den einzelnen Feldern
    const bankDetails = {
      accountHolder: row.accountHolder || '',
      bankName: row.bankName || '',
      iban: row.bankIban || '',
      bic: row.bankBic || '',
      swift: row.bankSwift || ''
    };

    return {
      id: row.id,
      companyName: row.companyName,
      logo: row.logo,
      companyOwner: row.companyOwner,
      street: row.street,
      number: row.number,
      zipCode: row.zipCode,
      city: row.city,
      country: row.country,
      state: row.state,
      address: row.address,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      fax: row.fax,
      website: row.website,
      taxId: row.taxId,
      vatId: row.vatId,
      bankDetails,
      defaultTaxRate: row.defaultTaxRate,
      defaultPaymentTerms: row.defaultPaymentTerms,
      defaultNotes: row.defaultNotes,
      defaultFooter: row.defaultFooter,
      defaultTerms: row.defaultTerms,
      currency: row.currency,
      dateFormat: row.dateFormat,
      timezone: row.timezone,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  // Contacts
  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const id = randomUUID();
    const now = new Date();
    
    const stmt = this.db.prepare(`
      INSERT INTO contacts (id, name, type, email, phone, address, taxId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      contact.name,
      contact.type,
      contact.email || null,
      contact.phone || null,
      contact.address || null,
      contact.taxId || null,
      now.toISOString(),
      now.toISOString()
    );

    return {
      id,
      ...contact,
      createdAt: now,
      updatedAt: now
    };
  }

  async getContact(id: string): Promise<Contact | null> {
    const stmt = this.db.prepare('SELECT * FROM contacts WHERE id = ?');
    const row = stmt.get(id) as Row;
    
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      type: row.type as Contact['type'],
      email: row.email,
      phone: row.phone,
      address: row.address,
      taxId: row.taxId,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const now = new Date();
    const current = await this.getContact(id);
    
    if (!current) throw new Error('Contact not found');

    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(contact).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    updates.push('updatedAt = ?');
    values.push(now.toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE contacts 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.getContact(id) as Promise<Contact>;
  }

  async deleteContact(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM contacts WHERE id = ?');
    stmt.run(id);
  }

  async listContacts(): Promise<Contact[]> {
    const stmt = this.db.prepare('SELECT * FROM contacts');
    const rows = stmt.all() as Row[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type as Contact['type'],
      email: row.email,
      phone: row.phone,
      address: row.address,
      taxId: row.taxId,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
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
    const id = randomUUID();
    const now = new Date();
    
    const stmt = this.db.prepare(`
      INSERT INTO invoices (
        id, number, date, dueDate, status, recipient, positions,
        totalNet, totalGross, vatAmounts, totalVat, discount, notes,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      invoice.number,
      invoice.date,
      invoice.dueDate,
      invoice.status,
      JSON.stringify(invoice.recipient),
      JSON.stringify(invoice.positions),
      invoice.totalNet,
      invoice.totalGross,
      JSON.stringify(invoice.vatAmounts),
      invoice.totalVat,
      JSON.stringify(invoice.discount),
      invoice.notes,
      now.toISOString(),
      now.toISOString()
    );

    return {
      id,
      ...invoice,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }

  async getInvoice(id: string): Promise<Invoice> {
    const stmt = this.db.prepare('SELECT * FROM invoices WHERE id = ?');
    const row = stmt.get(id) as Row;
    
    if (!row) throw new Error('Invoice not found');

    return {
      id: row.id,
      number: row.number,
      date: row.date,
      dueDate: row.dueDate,
      status: row.status,
      recipient: JSON.parse(row.recipient),
      positions: JSON.parse(row.positions),
      totalNet: row.totalNet,
      totalGross: row.totalGross,
      vatAmounts: JSON.parse(row.vatAmounts),
      totalVat: row.totalVat,
      discount: JSON.parse(row.discount),
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const now = new Date();
    const current = await this.getInvoice(id);
    
    if (!current) throw new Error('Invoice not found');

    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(invoice).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(
          ['recipient', 'positions', 'vatAmounts', 'discount'].includes(key)
            ? JSON.stringify(value)
            : value
        );
      }
    });

    updates.push('updatedAt = ?');
    values.push(now.toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE invoices 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.getInvoice(id);
  }

  async deleteInvoice(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM invoices WHERE id = ?');
    stmt.run(id);
  }

  async listInvoices(): Promise<Invoice[]> {
    const stmt = this.db.prepare('SELECT * FROM invoices');
    const rows = stmt.all() as Row[];
    
    return rows.map(row => ({
      id: row.id,
      number: row.number,
      date: row.date,
      dueDate: row.dueDate,
      status: row.status,
      recipient: JSON.parse(row.recipient),
      positions: JSON.parse(row.positions),
      totalNet: row.totalNet,
      totalGross: row.totalGross,
      vatAmounts: JSON.parse(row.vatAmounts),
      totalVat: row.totalVat,
      discount: JSON.parse(row.discount),
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  }

  // Offers
  async createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
    const id = randomUUID();
    const now = new Date();
    
    const stmt = this.db.prepare(`
      INSERT INTO offers (
        id, number, date, validUntil, status, recipient,
        positions, totalNet, totalGross, vatAmount, vatRate,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      offer.number,
      offer.date?.toISOString(),
      offer.validUntil?.toISOString(),
      offer.status,
      JSON.stringify(offer.recipient),
      JSON.stringify(offer.positions),
      offer.totalNet,
      offer.totalGross,
      offer.vatAmount,
      offer.vatRate,
      now.toISOString(),
      now.toISOString()
    );

    return {
      id,
      ...offer,
      createdAt: now,
      updatedAt: now
    };
  }

  async getOffer(id: string): Promise<Offer | null> {
    const stmt = this.db.prepare('SELECT * FROM offers WHERE id = ?');
    const row = stmt.get(id) as Row;
    
    if (!row) return null;

    return {
      id: row.id,
      number: row.number,
      date: row.date ? new Date(row.date) : undefined,
      validUntil: row.validUntil ? new Date(row.validUntil) : undefined,
      status: row.status as Offer['status'],
      recipient: JSON.parse(row.recipient),
      positions: JSON.parse(row.positions) as OfferItem[],
      totalNet: row.totalNet,
      totalGross: row.totalGross,
      vatAmount: row.vatAmount,
      vatRate: row.vatRate,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
    const now = new Date();
    const current = await this.getOffer(id);
    
    if (!current) throw new Error('Offer not found');

    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(offer).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(
          ['recipient', 'positions'].includes(key)
            ? JSON.stringify(value)
            : ['date', 'validUntil'].includes(key) && value
            ? (value as Date).toISOString()
            : value
        );
      }
    });

    updates.push('updatedAt = ?');
    values.push(now.toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE offers 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.getOffer(id) as Promise<Offer>;
  }

  async deleteOffer(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM offers WHERE id = ?');
    stmt.run(id);
  }

  async listOffers(): Promise<Offer[]> {
    const stmt = this.db.prepare('SELECT * FROM offers');
    const rows = stmt.all() as Row[];
    
    return rows.map(row => ({
      id: row.id,
      number: row.number,
      date: row.date ? new Date(row.date) : undefined,
      validUntil: row.validUntil ? new Date(row.validUntil) : undefined,
      status: row.status as Offer['status'],
      recipient: JSON.parse(row.recipient),
      positions: JSON.parse(row.positions) as OfferItem[],
      totalNet: row.totalNet,
      totalGross: row.totalGross,
      vatAmount: row.vatAmount,
      vatRate: row.vatRate,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  async resetOffers(): Promise<void> {
    this.db.prepare('DELETE FROM offers').run();
  }

  // Settings
  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    console.log('SQLite updateSettings called with:', settings);
    
    const now = new Date().toISOString();
    const id = randomUUID();

    try {
      // Normalisiere die Daten für die Datenbank
      const normalizedData = { ...settings };
      
      // Verarbeite bankDetails
      if (settings.bankDetails) {
        normalizedData.accountHolder = settings.bankDetails.accountHolder || '';
        normalizedData.bankName = settings.bankDetails.bankName || '';
        normalizedData.bankIban = settings.bankDetails.iban || '';
        normalizedData.bankBic = settings.bankDetails.bic || '';
        normalizedData.bankSwift = settings.bankDetails.swift || '';
        delete normalizedData.bankDetails;
      }
      
      console.log('Normalized data for DB:', normalizedData);

      // Prüfe, ob bereits Einstellungen existieren
      const existingSettings = this.db.prepare('SELECT id FROM settings LIMIT 1').get();

      if (existingSettings) {
        console.log('Updating existing settings with ID:', existingSettings.id);
        
        const entries = Object.entries(normalizedData)
          .filter(([key]) => key !== 'id')
          .filter(([, value]) => value !== undefined);

        if (entries.length > 0) {
          const updates = entries.map(([key]) => `${key} = ?`).join(', ');
          const values = entries.map(([, value]) => value);

          console.log('Update SQL:', `UPDATE settings SET ${updates}, updatedAt = ? WHERE id = ?`);
          console.log('Update values:', [...values, now, existingSettings.id]);

          this.db.prepare(`
            UPDATE settings 
            SET ${updates}, updatedAt = ?
            WHERE id = ?
          `).run(...values, now, existingSettings.id);
        }
      } else {
        console.log('Creating new settings with ID:', id);
        
        const entries = Object.entries(normalizedData)
          .filter(([key]) => key !== 'id')
          .filter(([, value]) => value !== undefined);

        const keys = entries.map(([key]) => key);
        const values = entries.map(([, value]) => value);

        console.log('Insert SQL:', `INSERT INTO settings (${[...keys, 'id', 'updatedAt'].join(', ')}) VALUES (${Array(keys.length + 2).fill('?').join(', ')})`);
        console.log('Insert values:', [...values, id, now]);

        this.db.prepare(`
          INSERT INTO settings (${[...keys, 'id', 'updatedAt'].join(', ')})
          VALUES (${Array(keys.length + 2).fill('?').join(', ')})
        `).run(...values, id, now);
      }

      // Hole die aktualisierten Einstellungen
      const updatedSettings = await this.getSettings();
      console.log('Settings after update:', updatedSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error('Error in updateSettings:', error);
      throw error;
    }
  }

  async getSettings(): Promise<Settings> {
    console.log('SQLite getSettings called');
    
    try {
      const row = this.db.prepare('SELECT * FROM settings LIMIT 1').get();
      console.log('Raw settings from DB:', row);
      
      if (!row) {
        console.log('No settings found, returning empty object');
        return {};
      }

      // Konvertiere die Bankdaten in das bankDetails-Objekt
      const bankDetails = {
        accountHolder: row.accountHolder || '',
        bankName: row.bankName || '',
        iban: row.bankIban || '',
        bic: row.bankBic || '',
        swift: row.bankSwift || ''
      };

      const settings: Settings = {
        id: row.id,
        companyName: row.companyName,
        logo: row.logo,
        companyOwner: row.companyOwner,
        street: row.street,
        number: row.number,
        zipCode: row.zipCode,
        city: row.city,
        country: row.country,
        state: row.state,
        address: row.address,
        email: row.email,
        phone: row.phone,
        mobile: row.mobile,
        fax: row.fax,
        website: row.website,
        taxId: row.taxId,
        vatId: row.vatId,
        bankDetails,
        defaultTaxRate: row.defaultTaxRate,
        defaultPaymentTerms: row.defaultPaymentTerms,
        defaultNotes: row.defaultNotes,
        defaultFooter: row.defaultFooter,
        defaultTerms: row.defaultTerms,
        currency: row.currency,
        dateFormat: row.dateFormat,
        timezone: row.timezone,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };

      console.log('Converted settings with bankDetails:', settings);
      return settings;
    } catch (error) {
      console.error('Error in getSettings:', error);
      throw error;
    }
  }

  // Taxes
  async createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    const id = randomUUID();
    const now = new Date();
    
    const stmt = this.db.prepare(`
      INSERT INTO taxes (
        id, year, quarter, taxableAmount, taxAmount,
        status, dueDate, submissionDate, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      tax.year,
      tax.quarter,
      tax.taxableAmount,
      tax.taxAmount,
      tax.status,
      tax.dueDate?.toISOString(),
      tax.submissionDate?.toISOString(),
      now.toISOString(),
      now.toISOString()
    );

    return {
      id,
      ...tax,
      createdAt: now,
      updatedAt: now
    };
  }

  async getTax(id: string): Promise<Tax | null> {
    const stmt = this.db.prepare('SELECT * FROM taxes WHERE id = ?');
    const row = stmt.get(id) as Row;
    
    if (!row) return null;

    return {
      id: row.id,
      year: row.year,
      quarter: row.quarter,
      taxableAmount: row.taxableAmount,
      taxAmount: row.taxAmount,
      status: row.status as Tax['status'],
      dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
      submissionDate: row.submissionDate ? new Date(row.submissionDate) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    const now = new Date();
    const current = await this.getTax(id);
    
    if (!current) throw new Error('Tax not found');

    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(tax).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(
          ['dueDate', 'submissionDate'].includes(key) && value
            ? (value as Date).toISOString()
            : value
        );
      }
    });

    updates.push('updatedAt = ?');
    values.push(now.toISOString());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE taxes 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.getTax(id) as Promise<Tax>;
  }

  async deleteTax(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM taxes WHERE id = ?');
    stmt.run(id);
  }

  async listTaxes(): Promise<Tax[]> {
    const stmt = this.db.prepare('SELECT * FROM taxes');
    const rows = stmt.all() as Row[];
    
    return rows.map(row => ({
      id: row.id,
      year: row.year,
      quarter: row.quarter,
      taxableAmount: row.taxableAmount,
      taxAmount: row.taxAmount,
      status: row.status as Tax['status'],
      dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
      submissionDate: row.submissionDate ? new Date(row.submissionDate) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }
}
