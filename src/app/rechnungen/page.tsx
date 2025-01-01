/**
 * WARNUNG: Diese Datei enthält wichtige Funktionalität für das Rechnungssystem.
 * Keine Funktionen oder Komponenten dürfen entfernt werden, da dies die Anwendung beschädigen könnte.
 * Bitte seien Sie bei Änderungen besonders vorsichtig.
 */

/**
 * WICHTIG: KEINE FUNKTIONALITÄT ENTFERNEN!
 * 
 * Diese Datei enthält wichtige Funktionen für die Rechnungsübersicht.
 * Es darf keine bestehende Funktionalität entfernt werden.
 * Nur Hinzufügungen und Änderungen sind erlaubt, wenn diese ausdrücklich
 * vom Benutzer gewünscht oder verlangt werden.
 * 
 * Folgende Funktionen müssen erhalten bleiben:
 * - Anzeige aller Rechnungen
 * - Filterfunktionen
 * - Sortierung
 * - Navigation zu Details/Vorschau
 */

'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from 'next/navigation';

// Status-Typen für Rechnungen
type InvoiceStatus = 'Entwurf' | 'Offen' | 'Fällig' | 'Bezahlt' | 'Teilbezahlt' | 'Storno' | 'Festgeschrieben' | 'Wiederkehrend';

interface Invoice {
  id: string;
  status: InvoiceStatus;
  dueDate: string;
  number: string;
  customer: string;
  invoiceNumber: string;
  date: string;
  netAmount: number;
  grossAmount: number;
  isLocked?: boolean;
}

// Beispiel-Rechnungen
const sampleInvoices: Invoice[] = [
  {
    id: '1',
    status: 'Offen',
    dueDate: 'In 14 Tagen',
    number: '286',
    customer: 'Schoene Gruesse UG',
    invoiceNumber: 'Rechnung Nr. 286',
    date: '18.12.24',
    netAmount: 840.00,
    grossAmount: 999.60
  },
  {
    id: '2',
    status: 'Fällig',
    dueDate: 'Seit 3 Tagen',
    number: '285',
    customer: 'Haushaltsfee LLC',
    invoiceNumber: 'Rechnung Nr. 285',
    date: '15.12.24',
    netAmount: 420.00,
    grossAmount: 420.00
  },
  {
    id: '3',
    status: 'Entwurf',
    dueDate: '-',
    number: '-',
    customer: 'Schoene Gruesse UG',
    invoiceNumber: 'Rechnung Nr. 285',
    date: '22.11.24',
    netAmount: 0.00,
    grossAmount: 0.00
  }
];

export default function RechnungenPage() {
  const router = useRouter();
  const [invoices] = useState<Invoice[]>(sampleInvoices);
  const [selectedStatus, setSelectedStatus] = useState<string>('Alle');

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'Offen':
        return 'bg-yellow-100 text-yellow-800';
      case 'Fällig':
        return 'bg-red-100 text-red-800';
      case 'Entwurf':
        return 'bg-blue-100 text-blue-800';
      case 'Bezahlt':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalOpenAmount = invoices
    .filter(inv => inv.status === 'Offen' || inv.status === 'Fällig')
    .reduce((sum, inv) => sum + inv.grossAmount, 0);

  const statusOptions: InvoiceStatus[] = [
    'Entwurf',
    'Offen',
    'Fällig',
    'Bezahlt',
    'Teilbezahlt',
    'Storno',
    'Festgeschrieben',
    'Wiederkehrend'
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Rechnungen</h1>
          <p className="text-sm text-gray-600">
            Offene Rechnungen: {formatCurrency(totalOpenAmount)} EUR
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline">Rechnung hochladen</Button>
          <Button onClick={() => router.push('/rechnungen/neu')}>
            Rechnung schreiben
            <span className="ml-2">▼</span>
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        <Button
          variant={selectedStatus === 'Alle' ? 'default' : 'outline'}
          onClick={() => setSelectedStatus('Alle')}
        >
          Alle
        </Button>
        {statusOptions.map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            onClick={() => setSelectedStatus(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Exportieren
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Fälligkeit</TableHead>
            <TableHead>Rechnungsnr.</TableHead>
            <TableHead>Kunde</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead className="text-right">Betrag (netto)</TableHead>
            <TableHead className="text-right">Offen (brutto)</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
                {invoice.isLocked && <span className="ml-2">🔒</span>}
              </TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
              <TableCell>{invoice.number}</TableCell>
              <TableCell>
                <div>{invoice.customer}</div>
                <div className="text-sm text-gray-500">{invoice.invoiceNumber}</div>
              </TableCell>
              <TableCell>{invoice.date}</TableCell>
              <TableCell className="text-right">{formatCurrency(invoice.netAmount)} €</TableCell>
              <TableCell className="text-right">{formatCurrency(invoice.grossAmount)} €</TableCell>
              <TableCell>
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="ghost" size="sm">📧</Button>
                  <Button variant="ghost" size="sm">⬇️</Button>
                  <Button variant="ghost" size="sm">⋮</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">←</Button>
          <span>1 - 25 von 185</span>
          <Button variant="outline" size="sm">→</Button>
        </div>
        <select className="border rounded p-1">
          <option>25 pro Seite</option>
          <option>50 pro Seite</option>
          <option>100 pro Seite</option>
        </select>
      </div>
    </div>
  );
}
