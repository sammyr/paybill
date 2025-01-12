import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { DatabaseInterface } from '@/lib/db/interfaces';

// Server-side: Dynamischer Import von SQLite
const { SQLiteDatabase } = require('@/lib/db/sqlite');
const db: DatabaseInterface = new SQLiteDatabase();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  try {
    switch (action) {
      case 'listContacts': {
        const contacts = await db.listContacts();
        return NextResponse.json(contacts);
      }
      case 'getContact': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json({ error: 'No id provided' }, { status: 400 });
        }
        const contact = await db.getContact(id);
        return NextResponse.json(contact);
      }
      case 'listInvoices': {
        const invoices = await db.listInvoices();
        return NextResponse.json(invoices);
      }
      case 'getInvoice': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json({ error: 'No id provided' }, { status: 400 });
        }
        const invoice = await db.getInvoice(id);
        return NextResponse.json(invoice);
      }
      case 'listOffers': {
        const offers = await db.listOffers();
        return NextResponse.json(offers);
      }
      case 'getOffer': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json({ error: 'No id provided' }, { status: 400 });
        }
        const offer = await db.getOffer(id);
        return NextResponse.json(offer);
      }
      case 'getSettings': {
        const settings = await db.getSettings();
        return NextResponse.json(settings || {});
      }
      case 'listTaxes': {
        const taxes = await db.listTaxes();
        return NextResponse.json(taxes);
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const now = new Date().toISOString();
  
  try {
    const body = await request.json();
    const { action, data } = body;
    console.log('API POST request:', { action, data });

    switch (action) {
      case 'createContact': {
        const contact = await db.createContact(data);
        return NextResponse.json(contact);
      }
      case 'updateContact': {
        const { id, ...contactData } = data;
        const contact = await db.updateContact(id, contactData);
        return NextResponse.json(contact);
      }
      case 'deleteContact': {
        await db.deleteContact(data.id);
        return NextResponse.json({ success: true });
      }
      case 'createInvoice': {
        const invoice = await db.createInvoice(data);
        return NextResponse.json(invoice);
      }
      case 'updateInvoice': {
        const { id, ...invoiceData } = data;
        const invoice = await db.updateInvoice(id, invoiceData);
        return NextResponse.json(invoice);
      }
      case 'deleteInvoice': {
        await db.deleteInvoice(data.id);
        return NextResponse.json({ success: true });
      }
      case 'createOffer': {
        const offer = await db.createOffer(data);
        return NextResponse.json(offer);
      }
      case 'updateOffer': {
        const { id, ...offerData } = data;
        const offer = await db.updateOffer(id, offerData);
        return NextResponse.json(offer);
      }
      case 'deleteOffer': {
        await db.deleteOffer(data.id);
        return NextResponse.json({ success: true });
      }
      case 'updateSettings': {
        console.log('Updating settings with data:', data);
        
        // Normalisiere die Daten vor dem Speichern
        const normalizedData = { ...data };
        console.log('Initial normalized data:', normalizedData);
        
        // Entferne nicht benötigte Felder
        delete normalizedData.owner;
        
        // Verarbeite bankDetails
        if (normalizedData.bankDetails) {
          console.log('Raw bankDetails:', normalizedData.bankDetails);
          
          const bankDetails = typeof normalizedData.bankDetails === 'string'
            ? JSON.parse(normalizedData.bankDetails)
            : normalizedData.bankDetails;
            
          console.log('Parsed bankDetails:', bankDetails);
          
          // Speichere die einzelnen Felder
          normalizedData.accountHolder = bankDetails.accountHolder || '';
          normalizedData.bankName = bankDetails.bankName || '';
          normalizedData.bankIban = bankDetails.iban || '';
          normalizedData.bankBic = bankDetails.bic || '';
          normalizedData.bankSwift = bankDetails.swift || '';
          
          console.log('Extracted bank fields:', {
            accountHolder: normalizedData.accountHolder,
            bankName: normalizedData.bankName,
            bankIban: normalizedData.bankIban,
            bankBic: normalizedData.bankBic,
            bankSwift: normalizedData.bankSwift
          });
        }
        
        // Entferne das bankDetails-Objekt
        delete normalizedData.bankDetails;
        
        console.log('Final normalized data:', normalizedData);
        
        // Aktualisiere die Einstellungen
        const updatedSettings = await db.updateSettings(normalizedData);
        console.log('Settings updated in DB:', updatedSettings);
        
        return NextResponse.json(updatedSettings);
      }
      case 'createTax': {
        const id = randomUUID();
        const stmt = db.prepare(`
          INSERT INTO taxes (id, name, rate, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(
          id,
          data.name,
          data.rate,
          now,
          now
        );
        return NextResponse.json({ ...data, id, createdAt: now, updatedAt: now });
      }
      case 'updateTax': {
        const updates = Object.entries(data)
          .filter(([key]) => key !== 'id')
          .map(([key]) => `${key} = ?`)
          .join(', ');
        const values = [...Object.entries(data)
          .filter(([key]) => key !== 'id')
          .map(([, value]) => value), now, data.id];
        
        const stmt = db.prepare(`
          UPDATE taxes 
          SET ${updates}, updatedAt = ?
          WHERE id = ?
        `);
        stmt.run(...values);
        return NextResponse.json({ ...data, updatedAt: now });
      }
      case 'deleteTax': {
        db.prepare('DELETE FROM taxes WHERE id = ?').run(data.id);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
