import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf-generator';
import { calculateInvoiceTotals } from '@/lib/invoice-utils';
import { formatCurrency, formatDate } from '@/lib/format-utils';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { invoice, settings } = data;

    // Debug: Eingehende Daten
    console.log('Verarbeite Rechnungsdaten:', {
      invoice: {
        id: invoice.id,
        number: invoice.number,
        date: invoice.date,
        deliveryDate: invoice.deliveryDate,
        recipient: invoice.recipient,
        positions: invoice.positions?.map(pos => ({
          description: pos.description,
          quantity: pos.quantity,
          unitPrice: pos.unitPrice
        }))
      },
      settings: {
        companyName: settings.companyName,
        logo: settings.logo ? 'vorhanden' : 'nicht vorhanden',
        address: `${settings.street}, ${settings.zip} ${settings.city}`,
        owner: settings.owner
      }
    });

    // Berechne die Summen
    const totals = calculateInvoiceTotals(invoice);

    // Generiere PDF
    const pdfBuffer = await generatePDF({
      content: [
        // Logo
        ...(settings.logo ? [{
          type: 'image',
          imageData: settings.logo.startsWith('data:') ? settings.logo : `data:image/png;base64,${settings.logo}`,
          x: 120,
          y: 15,
          width: 70,
          height: 12
        }] : []),

        // Absenderzeile
        {
          text: `${settings.companyName || ''} - ${settings.street || ''} - ${settings.zip || ''} ${settings.city || ''}`.trim(),
          x: 20,
          y: 25,
          fontSize: 8,
          color: '#666666'
        },

        // QR-Code
        ...(invoice.id ? [{
          type: 'image',
          imageData: await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=https://example.com/invoices/${invoice.id}&format=png`)
            .then(res => res.arrayBuffer())
            .then(buffer => `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`)
            .catch(() => {
              console.error('Fehler beim Laden des QR-Codes');
              return '';
            }),
          x: 170,
          y: 15,
          width: 10,
          height: 10
        }] : []),

        // Empfänger
        {
          text: (invoice.recipient?.name || '').trim(),
          x: 20,
          y: 45,
          fontSize: 11
        },
        {
          text: (invoice.recipient?.street || '').trim(),
          x: 20,
          y: 55,
          fontSize: 11
        },
        {
          text: `${invoice.recipient?.zip || ''} ${invoice.recipient?.city || ''}`.trim(),
          x: 20,
          y: 65,
          fontSize: 11
        },
        {
          text: (invoice.recipient?.country || 'Deutschland').trim(),
          x: 20,
          y: 75,
          fontSize: 11
        },

        // Rechnungsinformationen rechts
        {
          text: 'Rechnungs-Nr.',
          x: 120,
          y: 45,
          fontSize: 11
        },
        {
          text: (invoice.number?.toString() || '').trim(),
          x: 190,
          y: 45,
          fontSize: 11,
          textAlign: 'right'
        },
        {
          text: 'Rechnungsdatum',
          x: 120,
          y: 55,
          fontSize: 11
        },
        {
          text: formatDate(invoice.date),
          x: 190,
          y: 55,
          fontSize: 11,
          textAlign: 'right'
        },
        {
          text: 'Lieferdatum',
          x: 120,
          y: 65,
          fontSize: 11
        },
        {
          text: formatDate(invoice.deliveryDate || invoice.date),
          x: 190,
          y: 65,
          fontSize: 11,
          textAlign: 'right'
        },
        {
          text: 'Ihr Ansprechpartner',
          x: 120,
          y: 75,
          fontSize: 11
        },
        {
          text: (settings.owner || '').trim(),
          x: 190,
          y: 75,
          fontSize: 11,
          textAlign: 'right'
        },

        // Rechnungstitel
        {
          text: `Rechnung Nr. ${invoice.number}`,
          x: 20,
          y: 100,
          fontSize: 14,
          fontWeight: 600
        },

        // Tabellenkopf
        {
          text: 'Pos.',
          x: 20,
          y: 120,
          fontSize: 11,
          fontWeight: 600
        },
        {
          text: 'Beschreibung',
          x: 35,
          y: 120,
          fontSize: 11,
          fontWeight: 600
        },
        {
          text: 'Menge',
          x: 120,
          y: 120,
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'right'
        },
        {
          text: 'Einzelpreis',
          x: 150,
          y: 120,
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'right'
        },
        {
          text: 'Gesamtpreis',
          x: 190,
          y: 120,
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'right'
        },

        // Trennlinie
        {
          type: 'line',
          x1: 20,
          y1: 125,
          x2: 190,
          y2: 125,
          lineWidth: 0.1
        },

        // Positionen
        ...(invoice.positions || []).flatMap((pos, index) => {
          const y = 135 + (index * 12);
          const quantity = pos.quantity ? parseFloat(pos.quantity.toString()) : 0;
          const price = pos.unitPrice ? parseFloat(pos.unitPrice.toString()) : 0;
          const total = quantity * price;

          return [
            {
              text: `${index + 1}.`,
              x: 20,
              y,
              fontSize: 10
            },
            {
              text: (pos.description || '').trim(),
              x: 35,
              y,
              fontSize: 10,
              maxWidth: 80
            },
            {
              text: quantity.toFixed(2),
              x: 120,
              y,
              fontSize: 10,
              textAlign: 'right'
            },
            {
              text: formatCurrency(price),
              x: 150,
              y,
              fontSize: 10,
              textAlign: 'right'
            },
            {
              text: formatCurrency(total),
              x: 190,
              y,
              fontSize: 10,
              textAlign: 'right'
            }
          ];
        }),

        // Trennlinie vor Summen
        {
          type: 'line',
          x1: 120,
          y1: 135 + (invoice.positions?.length || 0) * 12 + 5,
          x2: 190,
          y2: 135 + (invoice.positions?.length || 0) * 12 + 5,
          lineWidth: 0.1
        },

        // Summen
        {
          text: 'Zwischensumme:',
          x: 120,
          y: 135 + (invoice.positions?.length || 0) * 12 + 15,
          fontSize: 10
        },
        {
          text: formatCurrency(totals.netTotal),
          x: 190,
          y: 135 + (invoice.positions?.length || 0) * 12 + 15,
          fontSize: 10,
          textAlign: 'right'
        },
        {
          text: 'Gesamtbetrag netto:',
          x: 120,
          y: 135 + (invoice.positions?.length || 0) * 12 + 25,
          fontSize: 10
        },
        {
          text: formatCurrency(totals.netTotal),
          x: 190,
          y: 135 + (invoice.positions?.length || 0) * 12 + 25,
          fontSize: 10,
          textAlign: 'right'
        },
        {
          text: 'MwSt. 19%:',
          x: 120,
          y: 135 + (invoice.positions?.length || 0) * 12 + 35,
          fontSize: 10
        },
        {
          text: formatCurrency(totals.totalVat),
          x: 190,
          y: 135 + (invoice.positions?.length || 0) * 12 + 35,
          fontSize: 10,
          textAlign: 'right'
        },

        // Trennlinie vor Gesamtbetrag
        {
          type: 'line',
          x1: 120,
          y1: 135 + (invoice.positions?.length || 0) * 12 + 45,
          x2: 190,
          y2: 135 + (invoice.positions?.length || 0) * 12 + 45,
          lineWidth: 0.1
        },

        // Gesamtbetrag
        {
          text: 'Gesamtbetrag:',
          x: 120,
          y: 135 + (invoice.positions?.length || 0) * 12 + 55,
          fontSize: 11,
          fontWeight: 600
        },
        {
          text: formatCurrency(totals.grossTotal),
          x: 190,
          y: 135 + (invoice.positions?.length || 0) * 12 + 55,
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'right'
        },

        // Zahlungshinweis
        {
          text: 'Bitte überweisen Sie den Gesamtbetrag innerhalb von 14 Tagen.',
          x: 20,
          y: 135 + (invoice.positions?.length || 0) * 12 + 70,
          fontSize: 10
        },

        // Footer mit Trennlinie
        {
          type: 'line',
          x1: 20,
          y1: 135 + (invoice.positions?.length || 0) * 12 + 90,
          x2: 190,
          y2: 135 + (invoice.positions?.length || 0) * 12 + 90,
          lineWidth: 0.5,
          color: '#eeeeee'
        },

        // Footer-Informationen in 4 Spalten
        {
          text: [
            settings.companyName || '',
            settings.street || '',
            `${settings.zip || ''} ${settings.city || ''}`,
            settings.country || 'Deutschland'
          ].filter(Boolean).join('\n'),
          x: 20,
          y: 135 + (invoice.positions?.length || 0) * 12 + 100,
          fontSize: 8,
          color: '#666666',
          lineHeight: 1.2
        },
        {
          text: [
            settings.phone ? `Tel.: ${settings.phone}` : '',
            settings.email ? `E-Mail: ${settings.email}` : '',
            settings.website ? `Web: ${settings.website}` : ''
          ].filter(Boolean).join('\n'),
          x: 65,
          y: 135 + (invoice.positions?.length || 0) * 12 + 100,
          fontSize: 8,
          color: '#666666',
          lineHeight: 1.2
        },
        {
          text: [
            settings.taxId ? `USt-ID: ${settings.taxId}` : '',
            settings.vatId ? `Steuer-Nr.: ${settings.vatId}` : '',
            settings.owner ? `Inhaber/-in: ${settings.owner}` : ''
          ].filter(Boolean).join('\n'),
          x: 110,
          y: 135 + (invoice.positions?.length || 0) * 12 + 100,
          fontSize: 8,
          color: '#666666',
          lineHeight: 1.2
        },
        {
          text: [
            settings.bankDetails?.bankName ? `Bank: ${settings.bankDetails.bankName}` : '',
            settings.bankDetails?.iban ? `IBAN: ${settings.bankDetails.iban}` : '',
            settings.bankDetails?.bic ? `BIC: ${settings.bankDetails.bic}` : ''
          ].filter(Boolean).join('\n'),
          x: 155,
          y: 135 + (invoice.positions?.length || 0) * 12 + 100,
          fontSize: 8,
          color: '#666666',
          lineHeight: 1.2
        }
      ],
      orientation: 'portrait',
      width: 210,
      height: 297
    });

    // Sende PDF als Response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung_${invoice.number}.pdf"`
      }
    });

  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
    return NextResponse.json({ error: 'PDF konnte nicht generiert werden' }, { status: 500 });
  }
}
