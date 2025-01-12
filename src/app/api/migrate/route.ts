import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server/db';

export async function POST() {
  const db = getDatabase();

  try {
    // Lösche alle existierenden Tabellen
    db.exec(`
      DROP TABLE IF EXISTS contacts;
      DROP TABLE IF EXISTS invoices;
      DROP TABLE IF EXISTS offers;
      DROP TABLE IF EXISTS settings;
      DROP TABLE IF EXISTS taxes;
    `);

    // Erstelle die Tabellen neu
    db.exec(`
      CREATE TABLE contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        company TEXT,
        department TEXT,
        title TEXT,
        firstName TEXT,
        lastName TEXT,
        email TEXT,
        phone TEXT,
        mobile TEXT,
        fax TEXT,
        website TEXT,
        street TEXT,
        number TEXT,
        zipCode TEXT,
        city TEXT,
        country TEXT,
        state TEXT,
        address TEXT,
        taxId TEXT,
        vatId TEXT,
        notes TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );

      CREATE TABLE invoices (
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
        notes TEXT,
        footer TEXT,
        terms TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );

      CREATE TABLE offers (
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
        notes TEXT,
        footer TEXT,
        terms TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );

      CREATE TABLE settings (
        id TEXT PRIMARY KEY,
        companyName TEXT,
        logo TEXT,
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
        bankName TEXT,
        bankIban TEXT,
        bankBic TEXT,
        bankSwift TEXT,
        bankDetails TEXT,
        invoicePrefix TEXT,
        invoiceNextNumber INTEGER,
        offerPrefix TEXT,
        offerNextNumber INTEGER,
        defaultTaxRate REAL,
        defaultPaymentTerms TEXT,
        defaultNotes TEXT,
        defaultFooter TEXT,
        defaultTerms TEXT,
        currency TEXT,
        language TEXT,
        dateFormat TEXT,
        createdAt DATETIME,
        updatedAt DATETIME
      );

      CREATE TABLE taxes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rate REAL NOT NULL,
        description TEXT,
        isDefault BOOLEAN,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
