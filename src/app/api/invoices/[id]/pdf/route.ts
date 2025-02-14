import { NextRequest, NextResponse } from 'next/server'
import { DatabaseClient } from '@/lib/db/client'
import { generatePDF } from '@/lib/pdf-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = new DatabaseClient()
    const invoice = await db.getInvoice(params.id)
    
    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Erstelle die PDF-Inhalte basierend auf den Rechnungsdaten
    const content = [
      {
        text: `Rechnung #${invoice.number}`,
        x: 50,
        y: 10,
        fontSize: 24,
        fontWeight: 700,
        textAlign: 'center'
      },
      // Weitere Textblöcke für Rechnungsdetails hier...
    ]

    // Generiere die PDF
    const pdfBuffer = await generatePDF({
      orientation: 'portrait',
      content
    })

    // Sende die PDF als Response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung_${invoice.number}.pdf"`
      }
    })
  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error)
    return NextResponse.json(
      { error: 'Fehler bei der PDF-Generierung' },
      { status: 500 }
    )
  }
}
