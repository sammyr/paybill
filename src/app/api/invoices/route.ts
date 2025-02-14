import { NextResponse } from 'next/server';
import { DatabaseClient } from '@/lib/db/client';

export async function GET() {
  try {
    const db = new DatabaseClient();
    const invoices = await db.listInvoices();
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error);
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnungen' }, { status: 500 });
  }
}
