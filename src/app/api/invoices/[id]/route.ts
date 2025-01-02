import { NextResponse, Request } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  const invoice = await db.getInvoice(params.id);
  
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  
  return NextResponse.json(invoice);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  await db.deleteInvoice(params.id);
  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = getDatabase();
  const data = await request.json();
  const invoice = await db.updateInvoice(params.id, data);
  return NextResponse.json(invoice);
}
