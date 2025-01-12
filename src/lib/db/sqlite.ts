import Database from 'better-sqlite3';
import { DatabaseInterface, Contact, Invoice, Settings, Tax, Offer } from './interfaces';
import { join } from 'path';
import { app } from '@tauri-apps/api';

export class SQLiteDatabase implements DatabaseInterface {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Verwende den App-Datenordner für die Datenbank
    this.dbPath = join(process.cwd(), 'data', 'paybill.db');
    this.db = new Database(this.dbPath);
    this.initDatabase();
  }

  private initDatabase() {
    // Aktiviere Foreign Keys
    this.db.pragma('foreign_keys = ON');

    // Contacts Tabelle
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        taxId TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    // Invoices Tabelle
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        number TEXT UNIQUE NOT NULL,
        date TEXT,
        dueDate TEXT,
        status TEXT,
        recipient TEXT,
        positions TEXT,
        totalNet REAL,
        totalGross REAL,
        vatAmount REAL,
        discount TEXT,
        notes TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    // Offers Tabelle
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS offers (
        id TEXT PRIMARY KEY,
        number TEXT UNIQUE NOT NULL,
        date DATETIME,
        validUntil DATETIME,
        status TEXT NOT NULL,
        recipient TEXT,
        positions TEXT,
        totalNet REAL,
        totalGross REAL,
        vatAmount REAL,
        vatRate REAL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    // Settings Tabelle
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        companyName TEXT,
        street TEXT,
        zip TEXT,
        city TEXT,
        country TEXT,
        phone TEXT,
        email TEXT,
        website TEXT,
        vatId TEXT,
        taxId TEXT,
        bankDetails TEXT
      )
    `);

    // Taxes Tabelle
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS taxes (
        id TEXT PRIMARY KEY,
        year INTEGER NOT NULL,
        quarter INTEGER NOT NULL,
        taxableAmount REAL NOT NULL,
        taxAmount REAL NOT NULL,
        status TEXT NOT NULL,
        dueDate DATETIME NOT NULL,
        submissionDate DATETIME,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);
  }

  // Contacts
  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const id = Math.random().toString(36).substring(7);
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
    const row = stmt.get(id);
    
    if (!row) return null;

    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const now = new Date();
    const current = await this.getContact(id);
    
    if (!current) throw new Error('Contact not found');

    const updates = [];
    const values = [];
    
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
    const rows = stmt.all();
    
    return rows.map(row => ({
      ...row,
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
    const id = Math.random().toString(36).substring(7);
    const now = new Date();
    
    const stmt = this.db.prepare(`
      INSERT INTO invoices (
        id, number, date, dueDate, status, recipient, positions,
        totalNet, totalGross, vatAmount, discount, notes,
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
      invoice.vatAmount,
      JSON.stringify(invoice.discount),
      invoice.notes,
      now.toISOString(),
      now.toISOString()
    );

    return {
      id,
      ...invoice,
      createdAt: now,
      updatedAt: now
    };
  }

  async getInvoice(id: string): Promise<Invoice> {
    const stmt = this.db.prepare('SELECT * FROM invoices WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) throw new Error('Invoice not found');

    return {
      ...row,
      recipient: JSON.parse(row.recipient),
      positions: JSON.parse(row.positions),
      discount: JSON.parse(row.discount),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    const now = new Date();
    const current = await this.getInvoice(id);
    
    if (!current) throw new Error('Invoice not found');

    const updates = [];
    const values = [];
    
    Object.entries(invoice).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(
          ['recipient', 'positions', 'discount'].includes(key)
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
    const rows = stmt.all();
    
    return rows.map(row => ({
      ...row,
      recipient: JSON.parse(row.recipient),
      positions: JSON.parse(row.positions),
      discount: JSON.parse(row.discount),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  // Offers
  async createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
    const id = Math.random().toString(36).substring(7);
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
      offer.date.toISOString(),
      offer.validUntil.toISOString(),
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
    const row = stmt.get(id);
    
    if (!row) return null;

    return {
      ...row,
      recipient: JSON.parse(row.recipient),
      positions: JSON.parse(row.positions),
      date: new Date(row.date),
      validUntil: new Date(row.validUntil),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
    const now = new Date();
    const current = await this.getOffer(id);
    
    if (!current) throw new Error('Offer not found');

    const updates = [];
    const values = [];
    
    Object.entries(offer).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(
          ['recipient', 'positions'].includes(key)
            ? JSON.stringify(value)
            : ['date', 'validUntil'].includes(key)
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
    const rows = stmt.all();
    
    return rows.map(row => ({
      ...row,
      recipient: JSON.parse(row.recipient),
      positions: JSON.parse(row.positions),
      date: new Date(row.date),
      validUntil: new Date(row.validUntil),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  async resetOffers(): Promise<void> {
    this.db.prepare('DELETE FROM offers').run();
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const stmt = this.db.prepare('SELECT * FROM settings LIMIT 1');
    const row = stmt.get();
    
    if (!row) return {};

    return {
      ...row,
      bankDetails: row.bankDetails ? JSON.parse(row.bankDetails) : undefined
    };
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const id = current.id || 'default';

    const updates = [];
    const values = [];
    
    Object.entries(settings).forEach(([key, value]) => {
      if (key !== 'id') {
        updates.push(`${key} = ?`);
        values.push(
          key === 'bankDetails' ? JSON.stringify(value) : value
        );
      }
    });

    values.push(id);

    if (current.id) {
      const stmt = this.db.prepare(`
        UPDATE settings 
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
      stmt.run(...values);
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO settings (${Object.keys(settings).join(', ')}, id)
        VALUES (${Array(Object.keys(settings).length).fill('?').join(', ')}, ?)
      `);
      stmt.run(...values);
    }

    return this.getSettings();
  }

  // Taxes
  async createTax(tax: Omit<Tax, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tax> {
    const id = Math.random().toString(36).substring(7);
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
      tax.dueDate.toISOString(),
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
    const row = stmt.get(id);
    
    if (!row) return null;

    return {
      ...row,
      dueDate: new Date(row.dueDate),
      submissionDate: row.submissionDate ? new Date(row.submissionDate) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async updateTax(id: string, tax: Partial<Tax>): Promise<Tax> {
    const now = new Date();
    const current = await this.getTax(id);
    
    if (!current) throw new Error('Tax not found');

    const updates = [];
    const values = [];
    
    Object.entries(tax).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updates.push(`${key} = ?`);
        values.push(
          ['dueDate', 'submissionDate'].includes(key)
            ? (value as Date)?.toISOString()
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
    const rows = stmt.all();
    
    return rows.map(row => ({
      ...row,
      dueDate: new Date(row.dueDate),
      submissionDate: row.submissionDate ? new Date(row.submissionDate) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }
}
