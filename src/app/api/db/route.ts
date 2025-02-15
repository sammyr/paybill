import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { DatabaseInterface } from '@/lib/db/interfaces';
import { getDatabase } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  try {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Datenbank ist nicht verfügbar' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'listContacts': {
        const contacts = await db.listContacts();
        return NextResponse.json(contacts);
      }
      case 'getContact': {
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        const contact = await db.getContact(id);
        return NextResponse.json(contact);
      }
      case 'listInvoices': {
        const invoices = await db.listInvoices();
        return NextResponse.json(invoices);
      }
      case 'getInvoice': {
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        const invoice = await db.getInvoice(id);
        return NextResponse.json(invoice);
      }
      case 'listOffers': {
        const offers = await db.listOffers();
        return NextResponse.json(offers);
      }
      case 'getOffer': {
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        const offer = await db.getOffer(id);
        return NextResponse.json(offer);
      }
      case 'getSettings': {
        try {
          const settings = await db.getSettings();
          return NextResponse.json(settings);
        } catch (error) {
          console.error('Fehler beim Laden der Einstellungen:', error);
          return NextResponse.json(
            { error: 'Einstellungen konnten nicht geladen werden' },
            { status: 500 }
          );
        }
      }
      case 'listTaxes': {
        const taxes = await db.listTaxes();
        return NextResponse.json(taxes);
      }
      default:
        return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Fehler bei der Datenbankabfrage:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDatabase();
    if (!db) {
      return NextResponse.json(
        { error: 'Datenbank ist nicht verfügbar' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'createContact': {
        const contact = await db.createContact(body);
        return NextResponse.json(contact);
      }
      case 'updateContact': {
        const { id, ...data } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        const contact = await db.updateContact(id, data);
        return NextResponse.json(contact);
      }
      case 'deleteContact': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        await db.deleteContact(id);
        return NextResponse.json({ success: true });
      }
      case 'createInvoice': {
        const invoice = await db.createInvoice(body);
        return NextResponse.json(invoice);
      }
      case 'updateInvoice': {
        const { id, ...data } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        const invoice = await db.updateInvoice(id, data);
        return NextResponse.json(invoice);
      }
      case 'deleteInvoice': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        await db.deleteInvoice(id);
        return NextResponse.json({ success: true });
      }
      case 'createOffer': {
        const offer = await db.createOffer(body);
        return NextResponse.json(offer);
      }
      case 'updateOffer': {
        const { id, ...data } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        const offer = await db.updateOffer(id, data);
        return NextResponse.json(offer);
      }
      case 'deleteOffer': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        await db.deleteOffer(id);
        return NextResponse.json({ success: true });
      }
      case 'updateSettings': {
        try {
          const settings = await db.updateSettings(body);
          return NextResponse.json(settings);
        } catch (error) {
          console.error('Fehler beim Speichern der Einstellungen:', error);
          return NextResponse.json(
            { error: 'Die Einstellungen konnten nicht gespeichert werden: ' + error.message },
            { status: 500 }
          );
        }
      }
      case 'createTax': {
        const tax = await db.createTax(body);
        return NextResponse.json(tax);
      }
      case 'updateTax': {
        const { id, ...data } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        const tax = await db.updateTax(id, data);
        return NextResponse.json(tax);
      }
      case 'deleteTax': {
        const { id } = body;
        if (!id) {
          return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 });
        }
        await db.deleteTax(id);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Fehler bei der Datenbankoperation:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
