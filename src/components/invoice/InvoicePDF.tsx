/**
 * @component InvoicePDF
 * @description Komponente zur Anzeige und zum Druck von Rechnungen
 * 
 * @important
 * WARNUNG: Diese Komponente wurde am 02.01.2025 finalisiert.
 * Änderungen an Design, Layout oder Funktionalität sind NICHT erlaubt,
 * es sei denn, es wird ausdrücklich danach gefragt.
 * 
 * Grund: Die Komponente wurde sorgfältig gestaltet, um eine konsistente
 * Darstellung der Rechnungen zu gewährleisten. Unbeabsichtigte Änderungen
 * könnten die Formatierung und Berechnung der Rechnungen beeinflussen.
 */

/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

'use client';

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  calculateInvoiceTotals, 
  formatCurrency, 
  type Invoice, 
  type InvoiceTotals, 
  calculatePositionTotals 
} from '@/lib/invoice-utils';

interface InvoicePDFProps {
  invoice: Invoice;
  settings: any;
  mode?: 'preview' | 'print';
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, settings, mode = 'preview' }) => {
  const totals: InvoiceTotals = calculateInvoiceTotals(invoice);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        margin: '0 auto',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        boxSizing: 'border-box'
      }}>
        <div className="max-w-none">
          {/* Hauptcontainer mit fester DIN A4 Höhe */}
          <div className="bg-white w-full min-h-[297mm] relative">
            {/* Header mit Logo und QR-Code */}
            <div className="p-0">
              <div className="mb-16">
                {/* Logo */}
                <div className="text-right mb-4">
                  <img 
                    src={settings.logo || '/default-logo.svg'} 
                    alt="Firmenlogo" 
                    className="w-96 h-auto ml-auto" 
                    style={{
                      maxWidth: '70%',
                      objectFit: 'contain'
                    }}
                  />
                </div>

                {/* Absender und QR-Code */}
                <div className="flex justify-between items-end">
                  {/* Absenderzeile */}
                  <div className="text-xs">
                    {settings.companyName} - {settings.street} - {settings.zip} {settings.city}
                  </div>
                  
                  {/* QR Code */}
                  <QRCodeCanvas
                    value={`https://example.com/invoices/${invoice.id}`}
                    size={56}
                    level="L"
                  />
                </div>
              </div>

              {/* Empfänger und Rechnungsinformationen */}
              <div className="flex justify-between mb-16">
                {/* Empfänger */}
                <div className="w-1/2">
                  <div className="text-sm">
                    <p>{invoice.recipient.name}</p>
                    <p>{invoice.recipient.street}</p>
                    <p>{invoice.recipient.zip} {invoice.recipient.city}</p>
                    <p>{invoice.recipient.country}</p>
                  </div>
                </div>

                {/* Rechnungsinformationen */}
                <div className="w-1/2">
                  <table className="w-full text-sm">
                    <tbody>
                      {/* 
                        @ai-protected-section
                        @warning KEINE ÄNDERUNGEN AN DIESEM ABSCHNITT!
                        Die Anzeige der Rechnungsnummer folgt einem streng definierten Format.
                        Format: XXXX (4-stellige Zahl)
                        @example "5183"
                        @reason Rechnungsnummern müssen für Buchhaltung und Archivierung konsistent sein
                      */}
                      <tr>
                        <td className="py-1"><strong>Rechnungs-Nr.</strong></td>
                        <td className="text-right"><strong>{invoice.number?.padStart(4, '0')}</strong></td>
                      </tr>
                      <tr>
                        <td className="py-1">Rechnungsdatum</td>
                        <td className="text-right">{invoice?.date ? new Date(invoice.date).toLocaleDateString('de-DE') : ''}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Lieferdatum</td>
                        <td className="text-right">{new Date(invoice.date).toLocaleDateString('de-DE')}</td>
                      </tr>
                      {invoice.customerNumber && (
                        <tr>
                          <td className="py-1">Ihre Kundennummer</td>
                          <td className="text-right">{invoice.customerNumber}</td>
                        </tr>
                      )}
                      {settings.owner && (
                        <tr>
                          <td className="py-1">Ihr Ansprechpartner</td>
                          <td className="text-right">{settings.owner}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rechnungsnummer und Tabelle */}
              <div className="mb-16">
                <h1 className="text-2xl font-bold mb-4">
                  Rechnung Nr. {invoice.number?.padStart(4, '0')}
                </h1>
                
                {/* Rechnungspositionen */}
                <table className="w-full mb-8">
                  <thead>
                    <tr>
                      <th className="text-left py-2">Pos.</th>
                      <th className="text-left py-2">Beschreibung</th>
                      <th className="text-right py-2">Menge</th>
                      <th className="text-right py-2">Einzelpreis</th>
                      <th className="text-right py-2">Gesamtpreis</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {invoice.positions?.map((position, index) => (
                      <React.Fragment key={position.id || index}>
                        <tr>
                          <td className="py-2">{index + 1}.</td>
                          <td className="py-2">{position.description}</td>
                          <td className="text-right py-2">{position.quantity.toFixed(2)} Tag(e)</td>
                          <td className="text-right py-2">{formatCurrency(position.unitPrice)}</td>
                          <td className="text-right py-2">{formatCurrency(calculatePositionTotals(position).totalNet)}</td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {/* Summentabelle */}
                <table className="w-full mt-8">
                  <tbody className="text-sm">
                    {/* Zwischensumme */}
                    <tr>
                      <td className="py-1">Zwischensumme:</td>
                      <td className="text-right py-1">{formatCurrency(totals.netTotal)}</td>
                    </tr>

                    {/* Netto */}
                    <tr>
                      <td className="py-1">Gesamtbetrag netto:</td>
                      <td className="text-right py-1">{formatCurrency(totals.netTotal)}</td>
                    </tr>

                    {/* MwSt */}
                    {totals.vatAmounts && Object.entries(totals.vatAmounts).map(([rate, amount]) => (
                      <React.Fragment key={rate}>
                        <tr>
                          <td className="py-1">MwSt. {rate}%:</td>
                          <td className="text-right py-1">{formatCurrency(amount)}</td>
                        </tr>
                      </React.Fragment>
                    ))}

                    {/* Brutto */}
                    <tr className="border-t border-gray-200">
                      <td className="py-2 font-semibold">Gesamtbetrag:</td>
                      <td className="text-right py-2 font-semibold">
                        {formatCurrency(totals.grossTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Zahlungsbedingungen */}
                <div className="mt-8 text-sm">
                  <p>Bitte überweisen Sie den Gesamtbetrag innerhalb von 14 Tagen.</p>
                </div>

                {/* Fußtext */}
                <div className="text-sm">
                  <p>{invoice.notes}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-8 left-8 right-8 border-t pt-4">
                <div className="flex justify-between text-[10px] mt-16">
                  <div>
                    {settings.companyName}<br />
                    {settings.street}<br />
                    {settings.zip} {settings.city}<br />
                    {settings.country}
                  </div>
                  <div>
                    Tel.: {settings.phone}<br />
                    E-Mail: {settings.email}<br />
                    Web: {settings.website && settings.website.replace(/^https?:\/\//, '')}
                  </div>
                  <div>
                    USt.-ID: {settings.vatId}<br />
                    Steuer-Nr.: {settings.taxId}<br />
                    Inhaber/-in: {settings.owner}
                  </div>
                  <div>
                    {settings.bankDetails?.bankName && <p>Bank: {settings.bankDetails.bankName}</p>}
                    {settings.bankDetails?.iban && <p>IBAN: {settings.bankDetails.iban}</p>}
                    {settings.bankDetails?.bic && <p>BIC: {settings.bankDetails.bic}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};