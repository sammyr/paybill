import { NextResponse } from 'next/server';
import { getInvoiceById } from '@/lib/db/memory';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await getInvoiceById(params.id);
    
    if (!invoice) {
      return new NextResponse(JSON.stringify({ error: 'Rechnung nicht gefunden' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new NextResponse(JSON.stringify(invoice), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Interner Server-Fehler' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
