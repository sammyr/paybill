/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

'use client';

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './InvoicePDF.css';
import { Invoice } from '@/lib/db/interfaces';

interface InvoicePDFProps {
  invoice: Invoice;
  settings: {
    companyName?: string;
    street?: string;
    zip?: string;
    city?: string;
    logo?: string;
  };
  mode?: 'preview' | 'print';
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, settings, mode = 'preview' }) => {
  const calculateTotals = () => {
    const netTotal = invoice.positions.reduce((sum, pos) => {
      const positionTotal = pos.quantity * pos.unitPrice;
      return sum + positionTotal;
    }, 0);

    // Berechne MwSt. für jede Position separat
    const vatTotals = invoice.positions.reduce((totals, pos) => {
      const positionNet = pos.quantity * pos.unitPrice;
      const vatRate = pos.taxRate;
      totals[vatRate] = (totals[vatRate] || 0) + (positionNet * vatRate / 100);
      return totals;
    }, {} as { [key: number]: number });

    const totalVat = Object.values(vatTotals).reduce((sum, vat) => sum + vat, 0);
    const grossTotal = netTotal + totalVat;

    return { netTotal, vatTotals, grossTotal };
  };

  const { netTotal, vatTotals, grossTotal } = calculateTotals();

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
          {/* Header mit Logo und QR-Code */}
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
                size={96}
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
                  <tr>
                    <td className="py-1">Rechnungs-Nr.</td>
                    <td className="text-right">{invoice.number}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Rechnungsdatum</td>
                    <td className="text-right">{new Date(invoice.date).toLocaleDateString('de-DE')}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Lieferdatum</td>
                    <td className="text-right">{new Date(invoice.date).toLocaleDateString('de-DE')}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Ihre Kundennummer</td>
                    <td className="text-right">1043</td>
                  </tr>
                  <tr>
                    <td className="py-1">Ihr Ansprechpartner</td>
                    <td className="text-right">Sammy Richter</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rechnungsnummer und Tabelle */}
          <div>
            <h1 className="text-2xl font-bold mb-4">Rechnung Nr. {invoice.number}</h1>
            
            {/* Rechnungspositionen */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium w-16">Pos.</th>
                  <th className="text-left py-2 font-medium">Beschreibung</th>
                  <th className="text-right py-2 font-medium w-32">Menge</th>
                  <th className="text-right py-2 font-medium w-32">Einzelpreis</th>
                  <th className="text-right py-2 font-medium w-32">Gesamtpreis</th>
                </tr>
              </thead>
              <tbody>
                {invoice.positions.map((position, index) => {
                  const positionTotal = position.quantity * position.unitPrice;
                  return (
                    <tr key={position.id || index} className="border-b">
                      <td className="py-2">{index + 1}.</td>
                      <td className="py-2">{position.description}</td>
                      <td className="text-right py-2">{position.quantity.toFixed(2)} Tag(e)</td>
                      <td className="text-right py-2">{position.unitPrice.toFixed(2)} EUR</td>
                      <td className="text-right py-2">{positionTotal.toFixed(2)} EUR</td>
                    </tr>
                  );
                })}
                
                {/* Summen direkt in der Tabelle */}
                <tr className="border-t">
                  <td className="py-2"></td>
                  <td className="py-2">Gesamtbetrag netto</td>
                  <td colSpan={2}></td>
                  <td className="text-right py-2">{netTotal.toFixed(2)} EUR</td>
                </tr>
                {Object.entries(vatTotals).map(([rate, amount]) => (
                  <tr key={rate}>
                    <td className="py-2"></td>
                    <td className="py-2">Umsatzsteuer {rate}%</td>
                    <td colSpan={2}></td>
                    <td className="text-right py-2">{amount.toFixed(2)} EUR</td>
                  </tr>
                ))}
                <tr className="border-t font-bold">
                  <td className="py-2"></td>
                  <td className="py-2">Gesamtbetrag brutto</td>
                  <td colSpan={2}></td>
                  <td className="text-right py-2">{grossTotal.toFixed(2)} EUR</td>
                </tr>
              </tbody>
            </table>

            {/* Notizen */}
            <div className="mt-8">
              <p className="mb-4">Vielen Dank für Ihr Auftrag.</p>
              <p>Bitte überweisen Sie den Rechnungsbetrag unter Angabe der Rechnungsnummer auf das unten angegebene Konto.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};