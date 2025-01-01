import { Database } from 'sqlite3';
import { 
  DatabaseInterface, 
  Contact, 
  Invoice, 
  Settings, 
  Tax 
} from './interfaces';

export class SQLiteDatabase implements DatabaseInterface {
  private db: Database;

  constructor() {
    this.db = new Database('paybill.db');
    this.initDatabase();
  }

  private initDatabase() {
    this.db.serialize(() => {
      // Contacts table
      this.db.run(`
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

      // Invoices table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          number TEXT NOT NULL,
          contactId TEXT NOT NULL,
          status TEXT NOT NULL,
          issueDate DATETIME NOT NULL,
          dueDate DATETIME NOT NULL,
          totalNet REAL NOT NULL,
          totalGross REAL NOT NULL,
          currency TEXT NOT NULL,
          notes TEXT,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (contactId) REFERENCES contacts(id)
        )
      `);

      // Invoice items table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id TEXT PRIMARY KEY,
          invoiceId TEXT NOT NULL,
          description TEXT NOT NULL,
          quantity REAL NOT NULL,
          unitPrice REAL NOT NULL,
          taxRate REAL NOT NULL,
          totalNet REAL NOT NULL,
          totalGross REAL NOT NULL,
          FOREIGN KEY (invoiceId) REFERENCES invoices(id)
        )
      `);

      // Settings table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          language TEXT NOT NULL,
          timezone TEXT NOT NULL,
          currency TEXT NOT NULL,
          paymentTermDays INTEGER NOT NULL,
          updatedAt DATETIME NOT NULL
        )
      `);

      // Taxes table
      this.db.run(`
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
    });
  }

  // Implementierung der Contact-Methoden
  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newContact: Contact = {
      ...contact,
      id,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO contacts (id, name, type, email, phone, address, taxId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newContact.id,
          newContact.name,
          newContact.type,
          newContact.email,
          newContact.phone,
          newContact.address,
          newContact.taxId,
          newContact.createdAt.toISOString(),
          newContact.updatedAt.toISOString(),
        ],
        (err) => {
          if (err) reject(err);
          else resolve(newContact);
        }
      );
    });
  }

  async getContact(id: string): Promise<Contact | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM contacts WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            resolve({
              ...row,
              createdAt: new Date(row.createdAt),
              updatedAt: new Date(row.updatedAt),
            });
          }
        }
      );
    });
  }

  // Weitere Implementierungen folgen dem gleichen Muster...
  // Hier nur Beispielimplementierungen der wichtigsten Methoden

  async updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
    const existing = await this.getContact(id);
    if (!existing) throw new Error('Contact not found');

    const updatedContact = {
      ...existing,
      ...contact,
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE contacts 
         SET name = ?, type = ?, email = ?, phone = ?, address = ?, taxId = ?, updatedAt = ?
         WHERE id = ?`,
        [
          updatedContact.name,
          updatedContact.type,
          updatedContact.email,
          updatedContact.phone,
          updatedContact.address,
          updatedContact.taxId,
          updatedContact.updatedAt.toISOString(),
          id,
        ],
        (err) => {
          if (err) reject(err);
          else resolve(updatedContact);
        }
      );
    });
  }

  async listContacts(): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM contacts', (err, rows) => {
        if (err) reject(err);
        else {
          resolve(
            rows.map((row) => ({
              ...row,
              createdAt: new Date(row.createdAt),
              updatedAt: new Date(row.updatedAt),
            }))
          );
        }
      });
    });
  }

  // Implementierung der Settings-Methoden
  async getSettings(): Promise<Settings> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM settings LIMIT 1', (err, row) => {
        if (err) reject(err);
        else if (!row) {
          // Create default settings if none exist
          const defaultSettings: Settings = {
            id: crypto.randomUUID(),
            language: 'de',
            timezone: 'Europe/Berlin',
            currency: 'EUR',
            paymentTermDays: 14,
            updatedAt: new Date(),
          };
          this.db.run(
            `INSERT INTO settings (id, language, timezone, currency, paymentTermDays, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              defaultSettings.id,
              defaultSettings.language,
              defaultSettings.timezone,
              defaultSettings.currency,
              defaultSettings.paymentTermDays,
              defaultSettings.updatedAt.toISOString(),
            ],
            (err) => {
              if (err) reject(err);
              else resolve(defaultSettings);
            }
          );
        } else {
          resolve({
            ...row,
            updatedAt: new Date(row.updatedAt),
          });
        }
      });
    });
  }

  // Weitere Methoden würden hier implementiert...
}
