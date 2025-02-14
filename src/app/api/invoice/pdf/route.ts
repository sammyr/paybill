import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf-generator';
import { calculateInvoiceTotals } from '@/lib/invoice-utils';
import { formatCurrency, formatDate } from '@/lib/format-utils';
import fs from 'fs';
import path from 'path';
import { pdfSettings } from '@/config/pdf-settings';

// Lade die Schriftart
const fontPath = path.join(process.cwd(), 'src', 'fonts', 'OpenSans-Bold.ttf');
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

async function loadAndRegisterFonts() {
  // Implementieren Sie die Logik zum Laden und Registrieren der Schriftarten
}

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

    // Lade die Schriftarten
    try {
      await loadAndRegisterFonts();
      console.log('Schriftarten erfolgreich geladen');
    } catch (fontError) {
      console.error('Fehler beim Laden der Schriftarten:', fontError);
      return new NextResponse(JSON.stringify({ error: 'Fehler beim Laden der Schriftarten' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Berechne die Summen
    const totals = calculateInvoiceTotals(invoice);
    console.log('Berechnete Summen:', totals);

    // Generiere PDF
    try {
      const pdfBuffer = await generatePDF({
        content: [
          // Logo
          ...(settings.logo ? [{
            type: 'image',
            imageData: settings.logo.startsWith('data:') ? settings.logo : `data:image/png;base64,${settings.logo}`,
            x: pdfSettings.logo.x,
            y: pdfSettings.logo.y,
            width: pdfSettings.logo.width,
            height: pdfSettings.logo.height
          }] : []),

          // QR-Code
          ...(invoice.id ? [{
            type: 'image',
            imageData: await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://example.com/invoices/${invoice.id}&format=png`)
              .then(res => res.arrayBuffer())
              .then(buffer => `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`)
              .catch(() => {
                console.error('Fehler beim Laden des QR-Codes');
                return '';
              }),
            x: 500,
            y: 20,
            width: 40,
            height: 40
          }] : []),

          // Absenderzeile
          {
            text: `${settings.company} - ${settings.street} - ${settings.zip} ${settings.city}`,
            x: pdfSettings.margins.left,
            y: pdfSettings.recipient.y - 5,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },

          // Empfänger
          {
            text: (invoice.recipient?.name || '').trim(),
            x: pdfSettings.recipient.x,
            y: pdfSettings.recipient.y,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: (invoice.recipient?.street || '').trim(),
            x: pdfSettings.recipient.x,
            y: pdfSettings.recipient.y + pdfSettings.recipient.lineHeight * 1,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: `${invoice.recipient?.zip || ''} ${invoice.recipient?.city || ''}`.trim(),
            x: pdfSettings.recipient.x,
            y: pdfSettings.recipient.y + pdfSettings.recipient.lineHeight * 2,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: (invoice.recipient?.country || 'Deutschland').trim(),
            x: pdfSettings.recipient.x,
            y: pdfSettings.recipient.y + pdfSettings.recipient.lineHeight * 3,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },

          // Rechnungsinformationen rechts
          {
            text: 'Rechnungs-Nr.',
            x: pdfSettings.invoiceInfo.x,
            y: pdfSettings.invoiceInfo.y,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: (invoice.number?.toString() || '').trim(),
            x: pdfSettings.invoiceInfo.x + 50,
            y: pdfSettings.invoiceInfo.y,
            fontSize: pdfSettings.fontSize.normal,
            textAlign: 'right',
            font: 'Open Sans'
          },
          {
            text: 'Rechnungsdatum',
            x: pdfSettings.invoiceInfo.x,
            y: pdfSettings.invoiceInfo.y + pdfSettings.invoiceInfo.lineHeight * 1,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: formatDate(invoice.date),
            x: pdfSettings.invoiceInfo.x + 50,
            y: pdfSettings.invoiceInfo.y + pdfSettings.invoiceInfo.lineHeight * 1,
            fontSize: pdfSettings.fontSize.normal,
            textAlign: 'right',
            font: 'Open Sans'
          },
          {
            text: 'Lieferdatum',
            x: pdfSettings.invoiceInfo.x,
            y: pdfSettings.invoiceInfo.y + pdfSettings.invoiceInfo.lineHeight * 2,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: formatDate(invoice.deliveryDate || invoice.date),
            x: pdfSettings.invoiceInfo.x + 50,
            y: pdfSettings.invoiceInfo.y + pdfSettings.invoiceInfo.lineHeight * 2,
            fontSize: pdfSettings.fontSize.normal,
            textAlign: 'right',
            font: 'Open Sans'
          },

          // Rechnungstitel
          {
            text: `Rechnung Nr. ${invoice.number}`,
            x: pdfSettings.margins.left,
            y: pdfSettings.spacing.contentTop,
            fontSize: pdfSettings.fontSize.large,
            fontWeight: 'bold',
            font: 'Open Sans'
          },

          // Tabellenkopf
          {
            text: 'Pos.',
            x: pdfSettings.columns.position,
            y: pdfSettings.spacing.contentTop + 20,
            fontSize: pdfSettings.fontSize.normal,
            fontWeight: 'bold',
            font: 'Open Sans'
          },
          {
            text: 'Beschreibung',
            x: pdfSettings.columns.description,
            y: pdfSettings.spacing.contentTop + 20,
            fontSize: pdfSettings.fontSize.normal,
            fontWeight: 'bold',
            font: 'Open Sans'
          },
          {
            text: 'Menge',
            x: pdfSettings.columns.quantity,
            y: pdfSettings.spacing.contentTop + 20,
            fontSize: pdfSettings.fontSize.normal,
            fontWeight: 'bold',
            textAlign: 'right',
            font: 'Open Sans'
          },
          {
            text: 'Einzelpreis',
            x: pdfSettings.columns.unitPrice,
            y: pdfSettings.spacing.contentTop + 20,
            fontSize: pdfSettings.fontSize.normal,
            fontWeight: 'bold',
            textAlign: 'right',
            font: 'Open Sans'
          },
          {
            text: 'Gesamtpreis',
            x: pdfSettings.columns.total,
            y: pdfSettings.spacing.contentTop + 20,
            fontSize: pdfSettings.fontSize.normal,
            fontWeight: 'bold',
            textAlign: 'right',
            font: 'Open Sans'
          },

          // Trennlinie
          {
            type: 'line',
            x1: pdfSettings.margins.left,
            y1: pdfSettings.spacing.contentTop + 25,
            x2: pdfSettings.margins.right,
            y2: pdfSettings.spacing.contentTop + 25,
            lineWidth: 0.1
          },

          // Positionen
          ...invoice.positions?.map((pos, index) => {
            const y = pdfSettings.spacing.contentTop + 30 + index * pdfSettings.spacing.rowHeight;
            return [
              {
                text: `${index + 1}.`,
                x: pdfSettings.columns.position,
                y,
                fontSize: pdfSettings.fontSize.normal,
                font: 'Open Sans'
              },
              {
                text: (pos.description || '').trim(),
                x: pdfSettings.columns.description,
                y,
                fontSize: pdfSettings.fontSize.normal,
                font: 'Open Sans'
              },
              {
                text: `${pos.quantity.toFixed(2)} Tag(e)`,
                x: pdfSettings.columns.quantity,
                y,
                fontSize: pdfSettings.fontSize.normal,
                textAlign: 'right',
                font: 'Open Sans'
              },
              {
                text: formatCurrency(pos.unitPrice),
                x: pdfSettings.columns.unitPrice,
                y,
                fontSize: pdfSettings.fontSize.normal,
                textAlign: 'right',
                font: 'Open Sans'
              },
              {
                text: formatCurrency(pos.quantity * pos.unitPrice),
                x: pdfSettings.columns.total,
                y,
                fontSize: pdfSettings.fontSize.normal,
                textAlign: 'right',
                font: 'Open Sans'
              }
            ];
          }).flat() || [],

          // Trennlinie vor Summen
          {
            type: 'line',
            x1: pdfSettings.margins.left,
            y1: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 10,
            x2: pdfSettings.margins.right,
            y2: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 10,
            lineWidth: 0.1
          },

          // Summen
          {
            text: 'Zwischensumme:',
            x: pdfSettings.columns.quantity,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 30,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: formatCurrency(totals.netTotal),
            x: pdfSettings.columns.total,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 30,
            fontSize: pdfSettings.fontSize.normal,
            textAlign: 'right',
            font: 'Open Sans'
          },
          {
            text: 'Gesamtbetrag netto:',
            x: pdfSettings.columns.quantity,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 50,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: formatCurrency(totals.netTotal),
            x: pdfSettings.columns.total,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 50,
            fontSize: pdfSettings.fontSize.normal,
            textAlign: 'right',
            font: 'Open Sans'
          },
          {
            text: 'MwSt. 19%:',
            x: pdfSettings.columns.quantity,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 70,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: formatCurrency(totals.totalVat),
            x: pdfSettings.columns.total,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 70,
            fontSize: pdfSettings.fontSize.normal,
            textAlign: 'right',
            font: 'Open Sans'
          },

          // Trennlinie vor Gesamtbetrag
          {
            type: 'line',
            x1: pdfSettings.columns.quantity,
            y1: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 80,
            x2: pdfSettings.columns.total,
            y2: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 80,
            lineWidth: 0.1
          },

          // Gesamtbetrag
          {
            text: 'Gesamtbetrag:',
            x: pdfSettings.columns.quantity,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 100,
            fontSize: pdfSettings.fontSize.normal,
            fontWeight: 'bold',
            font: 'Open Sans'
          },
          {
            text: formatCurrency(totals.grossTotal),
            x: pdfSettings.columns.total,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 100,
            fontSize: pdfSettings.fontSize.normal,
            fontWeight: 'bold',
            textAlign: 'right',
            font: 'Open Sans'
          },

          // Zahlungshinweis
          {
            text: 'Bitte überweisen Sie den Gesamtbetrag innerhalb von 14 Tagen.',
            x: pdfSettings.margins.left,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 130,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: 'Vielen Dank für Ihren Auftrag! Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen',
            x: pdfSettings.margins.left,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 145,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },
          {
            text: 'auf das unten angegebene Konto.',
            x: pdfSettings.margins.left,
            y: pdfSettings.spacing.contentTop + 30 + (invoice.positions?.length || 0) * pdfSettings.spacing.rowHeight + 160,
            fontSize: pdfSettings.fontSize.normal,
            font: 'Open Sans'
          },

          // Footer mit Trennlinie
          {
            type: 'line',
            x1: pdfSettings.margins.left,
            y1: pdfSettings.spacing.footerTop,
            x2: pdfSettings.margins.right,
            y2: pdfSettings.spacing.footerTop,
            lineWidth: 0.1
          },

          // Footer-Informationen
          {
            text: `${settings.company}`,
            x: pdfSettings.margins.left,
            y: pdfSettings.spacing.footerTop + 10,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },
          {
            text: `Tel.: ${settings.phone}`,
            x: pdfSettings.margins.left + 100,
            y: pdfSettings.spacing.footerTop + 10,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },
          {
            text: `USt-ID: ${settings.taxId}`,
            x: pdfSettings.margins.left + 200,
            y: pdfSettings.spacing.footerTop + 10,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },
          {
            text: `${settings.street}`,
            x: pdfSettings.margins.left,
            y: pdfSettings.spacing.footerTop + 20,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },
          {
            text: `E-Mail: ${settings.email}`,
            x: pdfSettings.margins.left + 100,
            y: pdfSettings.spacing.footerTop + 20,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },
          {
            text: `Steuer-Nr.: ${settings.vatId}`,
            x: pdfSettings.margins.left + 200,
            y: pdfSettings.spacing.footerTop + 20,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },
          {
            text: `${settings.zip} ${settings.city}`,
            x: pdfSettings.margins.left,
            y: pdfSettings.spacing.footerTop + 30,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },
          {
            text: `Web: ${settings.website}`,
            x: pdfSettings.margins.left + 100,
            y: pdfSettings.spacing.footerTop + 30,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          },
          {
            text: `Inhaber/in: ${settings.owner}`,
            x: pdfSettings.margins.left + 200,
            y: pdfSettings.spacing.footerTop + 30,
            fontSize: pdfSettings.fontSize.small,
            color: pdfSettings.colors.gray,
            font: 'Open Sans'
          }
        ],
        fonts: [
          {
            name: 'Open Sans',
            data: fontBase64,
            format: 'truetype',
            weight: 'bold'
          }
        ],
        orientation: 'portrait',
        width: 210,
        height: 297,
        font: 'Open Sans'
      });

      console.log('PDF erfolgreich generiert');

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Rechnung_${invoice.number}.pdf"`
        }
      });
    } catch (pdfError) {
      console.error('Fehler bei der PDF-Generierung:', pdfError);
      return new NextResponse(JSON.stringify({ error: `Fehler bei der PDF-Generierung: ${pdfError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Allgemeiner Fehler:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
