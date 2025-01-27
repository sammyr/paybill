'use client';

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  calculateInvoiceTotals, 
  formatCurrency, 
  calculatePositionTotals 
} from '@/lib/invoice-utils';
import type { Offer } from '@/lib/db/interfaces';

interface OfferPDFProps {
  offer: Offer;
  settings: any;
  mode?: 'preview' | 'print';
}

export const OfferPDF: React.FC<OfferPDFProps> = ({ offer, settings, mode = 'preview' }) => {
  const totals = calculateInvoiceTotals(offer);

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
                    value={`https://example.com/offers/${offer.id}`}
                    size={56}
                    level="L"
                  />
                </div>
              </div>

              {/* Empfänger und Angebotsinformationen */}
              <div className="flex justify-between mb-16">
                {/* Empfänger */}
                <div className="w-1/2">
                  <div className="text-sm">
                    <p>{offer.recipient?.name}</p>
                    <p>{offer.recipient?.street}</p>
                    <p>{offer.recipient?.zip} {offer.recipient?.city}</p>
                    <p>{offer.recipient?.country}</p>
                  </div>
                </div>

                {/* Angebotsinformationen */}
                <div className="w-1/2">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1"><strong>Angebots-Nr.</strong></td>
                        <td className="text-right"><strong>{offer.number}</strong></td>
                      </tr>
                      <tr>
                        <td className="py-1">Datum</td>
                        <td className="text-right">{offer.date ? new Date(offer.date).toLocaleDateString('de-DE') : ''}</td>
                      </tr>
                      <tr>
                        <td className="py-1">Gültig bis</td>
                        <td className="text-right">{offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('de-DE') : ''}</td>
                      </tr>
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

              {/* Angebotsnummer und Tabelle */}
              <div className="mb-16">
                <h1 className="text-2xl font-bold mb-4">
                  Angebot Nr. {offer.number}
                </h1>
                
                {/* Angebotspositionen */}
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
                    {offer.positions?.map((position, index) => (
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
                    <React.Fragment>
                      <tr>
                        <td className="py-1">Zwischensumme:</td>
                        <td className="text-right">{formatCurrency(totals.netTotal)}</td>
                      </tr>
                    </React.Fragment>

                    {/* MwSt */}
                    {Object.entries(totals.vatAmounts).map(([rate, amount]) => (
                      <React.Fragment key={rate}>
                        <tr>
                          <td className="py-1">MwSt. {rate}%:</td>
                          <td className="text-right">{formatCurrency(amount)}</td>
                        </tr>
                      </React.Fragment>
                    ))}

                    {/* Gesamtbetrag */}
                    <React.Fragment>
                      <tr className="font-bold">
                        <td className="py-1">Gesamtbetrag:</td>
                        <td className="text-right">{formatCurrency(totals.grossTotal)}</td>
                      </tr>
                    </React.Fragment>
                  </tbody>
                </table>

                {/* Gültigkeitshinweis */}
                <div className="mt-8 text-sm">
                  <p>Dieses Angebot ist gültig bis zum {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('de-DE') : ''}.</p>
                </div>

                {/* Fußtext */}
                <div className="text-sm">
                  <p>{offer.notes}</p>
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
