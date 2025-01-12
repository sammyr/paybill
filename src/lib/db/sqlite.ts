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
          discountType TEXT,
          discountValue REAL,
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

  async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newInvoice: Invoice = {
      ...invoice,
      id,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        try {
          // Hauptrechnung einfügen
          this.db.run(
            `INSERT INTO invoices (
              id, number, contactId, status, issueDate, dueDate, 
              totalNet, totalGross, currency, notes, 
              discountType, discountValue,
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newInvoice.id,
              newInvoice.number,
              newInvoice.recipient?.id || '',
              newInvoice.status || 'entwurf',
              newInvoice.date,
              newInvoice.dueDate,
              newInvoice.totalNet,
              newInvoice.totalGross,
              'EUR',
              newInvoice.notes,
              newInvoice.discount?.type,
              newInvoice.discount?.value,
              newInvoice.createdAt,
              newInvoice.updatedAt
            ]
          );

          // Rechnungspositionen einfügen
          newInvoice.positions.forEach((position) => {
            const positionId = crypto.randomUUID();
            this.db.run(
              `INSERT INTO invoice_items (
                id, invoiceId, description, quantity, 
                unitPrice, taxRate, totalNet, totalGross
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                positionId,
                newInvoice.id,
                position.description,
                position.quantity,
                position.unitPrice,
                position.taxRate,
                position.totalNet,
                position.totalGross
              ]
            );
          });

          this.db.run('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(newInvoice);
            }
          });
        } catch (error) {
          this.db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  async getInvoice(id: string): Promise<Invoice> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        console.log('Loading invoice with ID:', id);
        
        // Hauptrechnung laden
        this.db.get(
          'SELECT * FROM invoices WHERE id = ?',
          [id],
          (err, invoice) => {
            if (err) {
              console.error('Error loading invoice:', err);
              reject(err);
              return;
            }

            if (!invoice) {
              console.error('Invoice not found:', id);
              reject(new Error('Invoice not found'));
              return;
            }

            console.log('Loaded invoice data:', {
              id: invoice.id,
              number: invoice.number,
              discountType: invoice.discountType,
              discountValue: invoice.discountValue
            });

            // Rechnungspositionen laden
            this.db.all(
              'SELECT * FROM invoice_items WHERE invoiceId = ?',
              [id],
              (err, positions) => {
                if (err) {
                  console.error('Error loading positions:', err);
                  reject(err);
                  return;
                }

                console.log('Loaded positions count:', positions.length);

                // Stelle sicher, dass discount immer ein Objekt ist
                const discount = {
                  type: invoice.discountType || 'fixed',
                  value: typeof invoice.discountValue === 'number' ? invoice.discountValue : 0
                };

                console.log('Final discount object:', discount);

                const fullInvoice: Invoice = {
                  ...invoice,
                  positions: positions.map(pos => ({
                    id: pos.id,
                    description: pos.description,
                    quantity: pos.quantity,
                    unitPrice: pos.unitPrice,
                    taxRate: pos.taxRate,
                    totalNet: pos.totalNet,
                    totalGross: pos.totalGross
                  })),
                  discount
                };

                resolve(fullInvoice);
              }
            );
          }
        );
      });
    });
  }

  async listInvoices(): Promise<Invoice[]> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Alle Rechnungen laden
        this.db.all('SELECT * FROM invoices', async (err, invoices) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            const fullInvoices = await Promise.all(
              invoices.map(async (invoice) => {
                // Positionen für diese Rechnung laden
                const positions = await new Promise<any[]>((resolve, reject) => {
                  this.db.all(
                    'SELECT * FROM invoice_items WHERE invoiceId = ?',
                    [invoice.id],
                    (err, positions) => {
                      if (err) reject(err);
                      else resolve(positions);
                    }
                  );
                });

                // Stelle sicher, dass discount immer ein Objekt ist
                const discount = {
                  type: invoice.discountType || 'fixed',
                  value: invoice.discountValue || 0
                };

                return {
                  ...invoice,
                  positions: positions.map(pos => ({
                    id: pos.id,
                    description: pos.description,
                    quantity: pos.quantity,
                    unitPrice: pos.unitPrice,
                    taxRate: pos.taxRate,
                    totalNet: pos.totalNet,
                    totalGross: pos.totalGross
                  })),
                  discount // Immer ein Discount-Objekt zurückgeben
                };
              })
            );

            resolve(fullInvoices);
          } catch (error) {
            reject(error);
          }
        });
      });
    });
  }

  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        try {
          // Hauptrechnung aktualisieren
          this.db.run(
            `UPDATE invoices SET 
              number = COALESCE(?, number),
              contactId = COALESCE(?, contactId),
              status = COALESCE(?, status),
              issueDate = COALESCE(?, issueDate),
              dueDate = COALESCE(?, dueDate),
              totalNet = COALESCE(?, totalNet),
              totalGross = COALESCE(?, totalGross),
              notes = COALESCE(?, notes),
              discountType = ?,
              discountValue = ?,
              updatedAt = ?
            WHERE id = ?`,
            [
              invoice.number,
              invoice.recipient?.id,
              invoice.status,
              invoice.date,
              invoice.dueDate,
              invoice.totalNet,
              invoice.totalGross,
              invoice.notes,
              invoice.discount?.type,
              invoice.discount?.value,
              new Date().toISOString(),
              id
            ]
          );

          // Wenn neue Positionen vorhanden sind, alte löschen und neue einfügen
          if (invoice.positions) {
            // Alte Positionen löschen
            this.db.run('DELETE FROM invoice_items WHERE invoiceId = ?', [id]);

            // Neue Positionen einfügen
            invoice.positions.forEach((position) => {
              const positionId = position.id || crypto.randomUUID();
              this.db.run(
                `INSERT INTO invoice_items (
                  id, invoiceId, description, quantity, 
                  unitPrice, taxRate, totalNet, totalGross
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  positionId,
                  id,
                  position.description,
                  position.quantity,
                  position.unitPrice,
                  position.taxRate,
                  position.totalNet,
                  position.totalGross
                ]
              );
            });
          }

          this.db.run('COMMIT', async (err) => {
            if (err) {
              reject(err);
            } else {
              // Lade die aktualisierte Rechnung
              const updatedInvoice = await this.getInvoice(id);
              resolve(updatedInvoice);
            }
          });
        } catch (error) {
          this.db.run('ROLLBACK');
          reject(error);
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
