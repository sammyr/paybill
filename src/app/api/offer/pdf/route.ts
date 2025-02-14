import { NextRequest, NextResponse } from 'next/server';
import pdf from 'html-pdf';
import { calculateInvoiceTotals } from '@/lib/invoice-utils';
import { promisify } from 'util';

// Funktion zum Ermitteln des Browser-Pfads
function getBrowserExecutablePath() {
  switch (process.platform) {
    case 'win32':
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    case 'linux': {
      // Prüfe verschiedene mögliche Pfade
      const paths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium'
      ];
      const existingPath = paths.find(path => existsSync(path));
      if (!existingPath) {
        throw new Error('Kein unterstützter Browser gefunden. Bitte installieren Sie Google Chrome oder Chromium.');
      }
      return existingPath;
    }
    default:
      throw new Error('Nicht unterstütztes Betriebssystem');
  }
}

// Promisify the pdf.create function
const createPdf = promisify(pdf.create);

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { offer, settings } = data;

    // Debug-Ausgabe
    console.log('Empfangene Angebotsdaten:', {
      offer: {
        ...offer,
      },
      settings
    });

    // Berechne die korrekten Totals
    const totals = calculateInvoiceTotals(offer);

    // Debug-Ausgabe
    console.log('Berechnete Totals:', totals);

    // HTML für das Angebot
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 15mm 20mm;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 10pt;
              color: #333;
              line-height: 1.4;
              font-weight: 300;
              width: 100%;
              box-sizing: border-box;
            }
            .logo-container {
              text-align: right;
              margin-bottom: 1rem;
            }
            .logo {
              max-width: 70%;
              height: auto;
              object-fit: contain;
            }
            .header-address {
              color: #666;
              font-size: 9pt;
              font-weight: 300;
            }
            .header-container {
              margin-bottom: 2rem;
            }
            .header-flex {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .qr-code {
              width: 56px;
              height: 56px;
              margin-left: auto;
            }
            .recipient-meta-container {
              display: flex;
              justify-content: space-between;
              margin: 2rem 0 3rem 0;
            }
            .recipient {
              line-height: 1.2;
              flex: 1;
            }
            .recipient p {
              margin: 0 0 2px 0;
            }
            .meta-info {
              width: 300px;
              border-collapse: collapse;
            }
            .meta-info td {
              padding: 4px 0;
              vertical-align: top;
            }
            .meta-info td:first-child {
              color: #666;
              padding-right: 2rem;
              font-weight: 300;
            }
            .meta-info td:last-child {
              text-align: right;
              font-weight: 400;
            }
            .offer-title {
              font-size: 14pt;
              font-weight: 600;
              margin: 2rem 0;
            }
            .positions {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0 2rem 0;
            }
            .positions th {
              text-align: left;
              border-bottom: 1px solid #ddd;
              padding: 8px 16px 8px 0;
              font-weight: 600;
            }
            .positions th:first-child {
              width: 5%;
            }
            .positions th:nth-child(2) {
              width: 45%;
            }
            .positions th:nth-child(3) {
              width: 15%;
            }
            .positions th:nth-child(4) {
              width: 15%;
              text-align: right;
            }
            .positions th:last-child {
              width: 20%;
              text-align: right;
              padding-right: 0;
            }
            .positions td {
              padding: 8px 4px;
              vertical-align: top;
            }
            .positions td.price {
              text-align: right;
              padding-right: 0;
            }
            .totals {
              margin-top: 2rem;
              text-align: right;
              width: 100%;
            }
            .totals-table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals td:first-child {
              text-align: left;
              padding-right: 16px;
              font-weight: 400;
              width: 85%;
            }
            .totals td:last-child {
              text-align: right;
              font-weight: 400;
              width: 15%;
            }
            .totals tr.total-line {
              border-top: 1px solid #ddd;
            }
            .totals tr.total-line td {
              padding-top: 8px;
              font-weight: 600;
            }
            .offer-note {
              margin: 2rem 0;
            }
            .footer {
              position: fixed;
              bottom: 15mm;
              left: 20mm;
              right: 20mm;
              display: grid;
              grid-template-columns: minmax(auto, 1.5fr) minmax(auto, 2fr) minmax(auto, 2fr) minmax(auto, 1.5fr);
              gap: 20px;
              font-size: 8pt;
              color: #666;
              padding-top: 10px;
              border-top: 1px solid #eee;
              font-weight: 300;
              line-height: 1.2;
            }
            .footer p {
              margin: 0 0 2px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-container">
              <!-- Logo -->
              <div class="logo-container">
                <img class="logo" src="${settings.logo || 'data:image/png;base64,iVBORw...'}" alt="Logo">
              </div>

              <!-- Absender und QR-Code -->
              <div class="header-flex">
                <div class="header-address">
                  ${settings.companyName} - ${settings.street} - ${settings.zip} ${settings.city}
                </div>
                <img 
                  class="qr-code"
                  src="https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=https://example.com/offers/${offer.id}"
                  alt="QR Code"
                />
              </div>
            </div>

            <!-- Empfänger und Meta-Informationen -->
            <div class="recipient-meta-container">
              <!-- Empfänger -->
              <div class="recipient">
                ${offer.recipient?.name ? `<p>${offer.recipient.name}</p>` : ''}
                ${offer.recipient?.street ? `<p>${offer.recipient.street}</p>` : ''}
                ${offer.recipient?.zip || offer.recipient?.city ? `<p>${offer.recipient?.zip || ''} ${offer.recipient?.city || ''}</p>` : ''}
                ${offer.recipient?.country ? `<p>${offer.recipient.country}</p>` : ''}
              </div>

              <!-- Angebotsinformationen -->
              <table class="meta-info">
                ${offer.number ? `
                <tr>
                  <td><strong>Angebots-Nr.</strong></td>
                  <td><strong>${offer.number.padStart(4, '0')}</strong></td>
                </tr>` : ''}
                ${offer.date ? `
                <tr>
                  <td>Angebotsdatum</td>
                  <td>${new Date(offer.date).toLocaleDateString('de-DE')}</td>
                </tr>` : ''}
                ${offer.validUntil ? `
                <tr>
                  <td>Gültig bis</td>
                  <td>${new Date(offer.validUntil).toLocaleDateString('de-DE')}</td>
                </tr>` : ''}
                ${settings.owner ? `
                <tr>
                  <td>Ihr Ansprechpartner</td>
                  <td>${settings.owner}</td>
                </tr>` : ''}
              </table>
            </div>

            <h1 class="offer-title">Angebot Nr. ${offer.number?.padStart(4, '0')}</h1>

            <!-- Positionen -->
            <table class="positions">
              <tr>
                <th>Pos.</th>
                <th>Beschreibung</th>
                <th>Menge</th>
                <th class="price">Einzelpreis</th>
                <th class="price">Gesamtpreis</th>
              </tr>
              <tbody>
                ${offer.positions.map((pos, index) => `
                  <tr>
                    <td>${index + 1}.</td>
                    <td>${pos.description}</td>
                    <td>${pos.quantity} Tag(e)</td>
                    <td class="price">${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(pos.unitPrice)}</td>
                    <td class="price">${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(pos.quantity * pos.unitPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Summen -->
            <div class="totals">
              <table class="totals-table">
                <tr>
                  <td>Gesamtbetrag netto:</td>
                  <td>${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.netTotal)}</td>
                </tr>
                ${Object.entries(totals.vatAmounts).map(([rate, amount]) => `
                  <tr>
                    <td>Umsatzsteuer ${rate}%:</td>
                    <td>${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)}</td>
                  </tr>
                `).join('')}
                <tr class="total-line">
                  <td>Gesamtbetrag brutto:</td>
                  <td>${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.grossTotal)}</td>
                </tr>
              </table>
            </div>

            <!-- Angebotshinweis -->
            <div class="offer-note">
              ${offer.notes || 'Vielen Dank für Ihr Interesse! Dieses Angebot ist freibleibend und unverbindlich.'}
            </div>

            <!-- Footer -->
            <div class="footer">
              <div>
                ${settings.companyName ? `<p>${settings.companyName}</p>` : ''}
                ${settings.street ? `<p>${settings.street}</p>` : ''}
                ${settings.zip || settings.city ? `<p>${settings.zip || ''} ${settings.city || ''}</p>` : ''}
                ${settings.country ? `<p>${settings.country}</p>` : ''}
              </div>
              <div>
                ${settings.phone ? `<p>Tel.: ${settings.phone}</p>` : ''}
                ${settings.email ? `<p>E-Mail: ${settings.email}</p>` : ''}
                ${settings.website ? `<p>Web: ${settings.website}</p>` : ''}
              </div>
              <div>
                ${settings.taxId ? `<p>USt-ID: ${settings.taxId}</p>` : ''}
                ${settings.vatId ? `<p>Steuer-Nr.: ${settings.vatId}</p>` : ''}
                ${settings.owner ? `<p>Inhaber/-in: ${settings.owner}</p>` : ''}
              </div>
              <div>
                ${settings.bankDetails?.bankName ? `<p>Bank: ${settings.bankDetails.bankName}</p>` : ''}
                ${settings.bankDetails?.iban ? `<p>IBAN: ${settings.bankDetails.iban}</p>` : ''}
                ${settings.bankDetails?.bic ? `<p>BIC: ${settings.bankDetails.bic}</p>` : ''}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // PDF-Optionen
    const options = {
      format: 'A4',
      border: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    };

    // Generiere PDF
    const buffer = await createPdf(html, options);

    // Sende PDF als Response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Angebot_${offer.number}.pdf"`
      }
    });

  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
    return NextResponse.json({ error: 'PDF konnte nicht generiert werden' }, { status: 500 });
  }
}
