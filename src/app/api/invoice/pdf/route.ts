import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getInvoiceHtml } from './template';
import { InvoiceData } from '@/types/invoice';

export async function POST(request: Request) {
  try {
    const data: InvoiceData = await request.json();
    const html = getInvoiceHtml(data);

    // Bestimme den Chrome-Pfad basierend auf der Umgebung
    let browserOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    };

    // Nur in der Produktion den expliziten Chrome-Pfad setzen
    if (process.env.NODE_ENV === 'production') {
      browserOptions.executablePath = '/usr/bin/google-chrome';
    } else {
      // Zusätzliche Windows-spezifische Optionen für Entwicklung
      browserOptions.args.push(
        '--disable-gpu',
        '--disable-dev-shm-usage'
      );
    }

    console.log('Umgebung:', process.env.NODE_ENV);
    console.log('Browser Optionen:', browserOptions);

    // Starte Puppeteer
    const browser = await puppeteer.launch(browserOptions);
    
    try {
      const page = await browser.newPage();
      await page.setContent(html);

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await browser.close();
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=invoice.pdf'
        }
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error('Fehler bei der PDF-Generierung:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}