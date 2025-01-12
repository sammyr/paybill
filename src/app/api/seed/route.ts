import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server/db';
import { randomUUID } from 'crypto';

export async function POST() {
  const db = getDatabase();
  const now = new Date().toISOString();

  try {
    // Standardeinstellungen
    const settingsId = randomUUID();
    const bankDetails = {
      accountHolder: 'Max Mustermann',
      bankName: 'Deutsche Bank',
      iban: 'DE12 3456 7890 1234 5678 90',
      bic: 'DEUTDEDBXXX',
      swift: 'DEUTDEDBXXX'
    };

    db.prepare(`
      INSERT OR REPLACE INTO settings (
        id, companyName, logo, street, number, zipCode, city, country, state,
        address, email, phone, mobile, fax, website, taxId, vatId,
        bankName, bankIban, bankBic, bankSwift, bankDetails, invoicePrefix, invoiceNextNumber,
        offerPrefix, offerNextNumber, defaultTaxRate, defaultPaymentTerms,
        defaultNotes, defaultFooter, defaultTerms, currency, language,
        dateFormat, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      settingsId,                                 // id
      'Meine Firma GmbH',                        // companyName
      '',                                        // logo
      'Musterstraße',                           // street
      '1',                                      // number
      '12345',                                  // zipCode
      'Musterstadt',                            // city
      'Deutschland',                            // country
      'Bayern',                                 // state
      'Musterstraße 1\n12345 Musterstadt',     // address
      'info@meinefirma.de',                    // email
      '+49 123 456789',                        // phone
      '+49 170 1234567',                       // mobile
      '+49 123 456789-99',                     // fax
      'www.meinefirma.de',                     // website
      'DE123456789',                           // taxId
      'DE123456789',                           // vatId
      bankDetails.bankName,                     // bankName
      bankDetails.iban,                         // bankIban
      bankDetails.bic,                          // bankBic
      bankDetails.swift,                        // bankSwift
      JSON.stringify(bankDetails),              // bankDetails
      'RE',                                     // invoicePrefix
      1,                                        // invoiceNextNumber
      'AN',                                     // offerPrefix
      1,                                        // offerNextNumber
      19,                                       // defaultTaxRate
      'Zahlbar innerhalb von 30 Tagen',        // defaultPaymentTerms
      'Vielen Dank für Ihren Auftrag!',        // defaultNotes
      'Vielen Dank für Ihr Vertrauen!',        // defaultFooter
      'Es gelten unsere allgemeinen Geschäftsbedingungen.\nGerichtsstand ist Musterstadt.',  // defaultTerms
      'EUR',                                    // currency
      'de',                                     // language
      'DD.MM.YYYY',                            // dateFormat
      now,                                      // createdAt
      now                                       // updatedAt
    );

    // Standard-Steuersätze
    const taxIds = [
      { name: 'Normaler Steuersatz', rate: 19, description: 'Standardmäßiger Mehrwertsteuersatz', isDefault: 1 },
      { name: 'Ermäßigter Steuersatz', rate: 7, description: 'Ermäßigter Mehrwertsteuersatz', isDefault: 0 },
      { name: 'Steuerfrei', rate: 0, description: 'Keine Mehrwertsteuer', isDefault: 0 }
    ].map(tax => {
      const id = randomUUID();
      db.prepare(`
        INSERT OR REPLACE INTO taxes (id, name, rate, description, isDefault, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, tax.name, tax.rate, tax.description, tax.isDefault, now, now);
      return id;
    });

    // Beispiel-Kontakte
    const contactIds = [
      {
        name: 'Max Mustermann',
        type: 'private',
        title: 'Herr',
        firstName: 'Max',
        lastName: 'Mustermann',
        email: 'max@example.com',
        phone: '+49 123 4567890',
        mobile: '',
        fax: '',
        website: '',
        street: 'Musterweg',
        number: '1',
        zipCode: '12345',
        city: 'Musterstadt',
        country: 'Deutschland',
        state: '',
        address: 'Musterweg 1\n12345 Musterstadt',
        taxId: 'DE123456789',
        vatId: '',
        notes: 'Beispielkontakt'
      },
      {
        name: 'Beispiel GmbH',
        type: 'business',
        company: 'Beispiel GmbH',
        department: 'Einkauf',
        title: '',
        firstName: '',
        lastName: '',
        email: 'info@beispiel.de',
        phone: '+49 987 6543210',
        mobile: '',
        fax: '',
        website: 'www.beispiel.de',
        street: 'Beispielstraße',
        number: '1',
        zipCode: '54321',
        city: 'Beispielstadt',
        country: 'Deutschland',
        state: '',
        address: 'Beispielstraße 1\n54321 Beispielstadt',
        taxId: 'DE987654321',
        vatId: 'DE987654321',
        notes: 'Wichtiger Geschäftskunde'
      }
    ].map(contact => {
      const id = randomUUID();
      db.prepare(`
        INSERT OR REPLACE INTO contacts (
          id, name, type, company, department, title, firstName, lastName,
          email, phone, mobile, fax, website, street, number, zipCode,
          city, country, state, address, taxId, vatId, notes, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        contact.name,
        contact.type,
        contact.company || '',
        contact.department || '',
        contact.title || '',
        contact.firstName || '',
        contact.lastName || '',
        contact.email,
        contact.phone,
        contact.mobile,
        contact.fax,
        contact.website,
        contact.street,
        contact.number,
        contact.zipCode,
        contact.city,
        contact.country,
        contact.state,
        contact.address,
        contact.taxId,
        contact.vatId,
        contact.notes,
        now,
        now
      );
      return id;
    });

    // Beispiel-Rechnungen
    const invoiceIds = [
      {
        number: 'RE-2025-001',
        date: '2025-01-12',
        dueDate: '2025-02-11',
        status: 'draft',
        recipient: {
          id: contactIds[0],
          name: 'Max Mustermann',
          type: 'private',
          email: 'max@example.com',
          phone: '+49 123 4567890',
          address: 'Musterweg 1\n12345 Musterstadt',
          taxId: 'DE123456789'
        },
        positions: [
          {
            description: 'Beratung',
            quantity: 5,
            unitPrice: 100,
            taxRate: 19
          }
        ],
        totalNet: 500,
        totalGross: 595,
        discount: null,
        notes: 'Beispielrechnung',
        footer: 'Vielen Dank für Ihren Auftrag!',
        terms: 'Zahlbar innerhalb von 30 Tagen'
      },
      {
        number: 'RE-2025-002',
        date: '2025-01-12',
        dueDate: '2025-02-11',
        status: 'sent',
        recipient: {
          id: contactIds[1],
          name: 'Beispiel GmbH',
          type: 'business',
          email: 'info@beispiel.de',
          phone: '+49 987 6543210',
          address: 'Beispielstraße 1\n54321 Beispielstadt',
          taxId: 'DE987654321'
        },
        positions: [
          {
            description: 'Entwicklung',
            quantity: 10,
            unitPrice: 150,
            taxRate: 19
          }
        ],
        totalNet: 1500,
        totalGross: 1785,
        discount: null,
        notes: 'Wichtiges Projekt',
        footer: 'Vielen Dank für Ihr Vertrauen!',
        terms: 'Zahlbar innerhalb von 14 Tagen'
      }
    ].map(invoice => {
      const id = randomUUID();
      db.prepare(`
        INSERT OR REPLACE INTO invoices (
          id, number, date, dueDate, status, recipient, positions,
          totalNet, totalGross, discount, notes, footer, terms,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        invoice.number,
        invoice.date,
        invoice.dueDate,
        invoice.status,
        JSON.stringify(invoice.recipient),
        JSON.stringify(invoice.positions),
        invoice.totalNet,
        invoice.totalGross,
        JSON.stringify(invoice.discount),
        invoice.notes,
        invoice.footer,
        invoice.terms,
        now,
        now
      );
      return id;
    });

    // Beispiel-Angebote
    const offerIds = [
      {
        number: 'AN-2025-001',
        date: '2025-01-12',
        validUntil: '2025-02-11',
        status: 'draft',
        recipient: {
          id: contactIds[0],
          name: 'Max Mustermann',
          type: 'private',
          email: 'max@example.com',
          phone: '+49 123 4567890',
          address: 'Musterweg 1\n12345 Musterstadt',
          taxId: 'DE123456789'
        },
        positions: [
          {
            description: 'Workshop',
            quantity: 2,
            unitPrice: 500,
            taxRate: 19
          }
        ],
        totalNet: 1000,
        totalGross: 1190,
        discount: null,
        notes: 'Beispielangebot',
        footer: 'Wir freuen uns auf Ihre Rückmeldung!',
        terms: 'Angebot gültig bis zum angegebenen Datum'
      }
    ].map(offer => {
      const id = randomUUID();
      db.prepare(`
        INSERT OR REPLACE INTO offers (
          id, number, date, validUntil, status, recipient, positions,
          totalNet, totalGross, discount, notes, footer, terms,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        offer.number,
        offer.date,
        offer.validUntil,
        offer.status,
        JSON.stringify(offer.recipient),
        JSON.stringify(offer.positions),
        offer.totalNet,
        offer.totalGross,
        JSON.stringify(offer.discount),
        offer.notes,
        offer.footer,
        offer.terms,
        now,
        now
      );
      return id;
    });

    return NextResponse.json({
      success: true,
      data: {
        settingsId,
        taxIds,
        contactIds,
        invoiceIds,
        offerIds
      }
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ 
      error: 'Seeding failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
