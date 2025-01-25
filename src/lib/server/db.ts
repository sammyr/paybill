import Database from 'better-sqlite3';
import { Contact, Invoice, Settings, Tax, Offer } from '../db/interfaces';
import { join } from 'path';
import { randomUUID } from 'crypto';

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    const dbPath = join(process.cwd(), 'data', 'paybill.db');
    db = new Database(dbPath);
    initDatabase(db);
  }
  return db;
}

function initDatabase(db: Database.Database) {
  // Aktiviere Foreign Keys
  db.pragma('foreign_keys = ON');

  // Contacts Tabelle
  db.exec(`
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
  db.exec(`
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
      discount TEXT,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    )
  `);

  // Offers Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      number TEXT UNIQUE NOT NULL,
      date TEXT,
      validUntil TEXT,
      status TEXT,
      recipient TEXT,
      positions TEXT,
      totalNet REAL,
      totalGross REAL,
      discount TEXT,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    )
  `);

  // Settings Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      companyName TEXT,
      logo TEXT,
      address TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      taxId TEXT,
      bankName TEXT,
      bankIban TEXT,
      bankBic TEXT,
      invoicePrefix TEXT,
      invoiceNextNumber INTEGER,
      offerPrefix TEXT,
      offerNextNumber INTEGER,
      createdAt DATETIME,
      updatedAt DATETIME
    )
  `);

  // Taxes Tabelle
  db.exec(`
    CREATE TABLE IF NOT EXISTS taxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      createdAt DATETIME NOT NULL,
      updatedAt DATETIME NOT NULL
    )
  `);
}

export function resetDatabase() {
  const db = getDatabase();
  
  // Lösche alle existierenden Tabellen
  db.exec(`
    DROP TABLE IF EXISTS contacts;
    DROP TABLE IF EXISTS invoices;
    DROP TABLE IF EXISTS offers;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS taxes;
  `);

  // Initialisiere die Datenbank neu
  initDatabase(db);
  
  return { success: true, message: 'Datenbank wurde zurückgesetzt' };
}
