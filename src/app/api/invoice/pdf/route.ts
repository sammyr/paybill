import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { calculateInvoiceTotals } from '@/lib/invoice-utils';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { invoice, settings } = data;

    // Debug-Ausgabe
    console.log('Empfangene Rechnungsdaten:', {
      invoice: {
        ...invoice,
        discount: invoice.discount
      },
      settings
    });

    // Berechne die korrekten Totals
    const totals = calculateInvoiceTotals(invoice);

    // Debug-Ausgabe
    console.log('Berechnete Totals:', totals);

    // Starte Puppeteer mit Debug-Ausgabe
    console.log('Starte Puppeteer mit Pfad:', process.env.PUPPETEER_EXECUTABLE_PATH);
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--no-zygote',
        '--single-process'
      ]
    });
    const page = await browser.newPage();

    // Setze Viewport auf A4-Größe
    await page.setViewport({
      width: 794, // A4 Breite bei 96 DPI
      height: 1123, // A4 Höhe bei 96 DPI
      deviceScaleFactor: 2,
    });

    // HTML für die Rechnung
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
            .invoice-title {
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
            .totals tr.discount td:last-child {
              color: #dc2626;
            }
            .totals tr.total-line {
              border-top: 1px solid #ddd;
            }
            .totals tr.total-line td {
              padding-top: 8px;
              font-weight: 600;
            }
            .payment-note {
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
                  src="https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=https://example.com/invoices/${invoice.id}"
                  alt="QR Code"
                />
              </div>
            </div>

            <!-- Empfänger und Meta-Informationen -->
            <div class="recipient-meta-container">
              <!-- Empfänger -->
              <div class="recipient">
                ${invoice.recipient?.name ? `<p>${invoice.recipient.name}</p>` : ''}
                ${invoice.recipient?.street ? `<p>${invoice.recipient.street}</p>` : ''}
                ${invoice.recipient?.zip || invoice.recipient?.city ? `<p>${invoice.recipient?.zip || ''} ${invoice.recipient?.city || ''}</p>` : ''}
                ${invoice.recipient?.country ? `<p>${invoice.recipient.country}</p>` : ''}
              </div>

              <!-- Rechnungsinformationen -->
              <table class="meta-info">
                ${invoice.number ? `
                <tr>
                  <td><strong>Rechnungs-Nr.</strong></td>
                  <td><strong>${invoice.number.padStart(4, '0')}</strong></td>
                </tr>` : ''}
                ${invoice.date ? `
                <tr>
                  <td>Rechnungsdatum</td>
                  <td>${new Date(invoice.date).toLocaleDateString('de-DE')}</td>
                </tr>` : ''}
                ${invoice.date ? `
                <tr>
                  <td>Lieferdatum</td>
                  <td>${new Date(invoice.date).toLocaleDateString('de-DE')}</td>
                </tr>` : ''}
                ${invoice.customerNumber ? `
                <tr>
                  <td>Ihre Kundennummer</td>
                  <td>${invoice.customerNumber}</td>
                </tr>` : ''}
                ${settings.owner ? `
                <tr>
                  <td>Ihr Ansprechpartner</td>
                  <td>${settings.owner}</td>
                </tr>` : ''}

 
              </table>
            </div>

            <h1 class="invoice-title">Rechnung Nr. ${invoice.number?.padStart(4, '0')}</h1>

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
                ${invoice.positions.map((pos, index) => `
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
                  <td>Zwischensumme:</td>
                  <td>${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.netTotal)}</td>
                </tr>
                ${invoice.discount && invoice.discount.value > 0 ? `
                  <tr class="discount">
                    <td>Rabatt (${invoice.discount.value}${invoice.discount.type === 'percentage' ? '%' : ' €'}):</td>
                    <td>-${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.discountAmount)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td>Gesamtbetrag netto:</td>
                  <td>${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totals.netAfterDiscount)}</td>
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

            <!-- Zahlungshinweis -->
            <div class="payment-note">
              Vielen Dank für Ihren Auftrag! Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen
              auf das unten angegebene Konto.
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

    // Setze HTML-Inhalt
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generiere PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });

    await browser.close();

    // Sende PDF als Response
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung-${invoice.number}.pdf"`
      }
    });

  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
    return NextResponse.json({ error: 'PDF konnte nicht erstellt werden' }, { status: 500 });
  }
}
