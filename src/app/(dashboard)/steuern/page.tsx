'use client';

import { useState, useEffect } from 'react';
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatabaseClient } from '@/lib/db/client';

interface TaxEntry {
  id: string;
  label: string;
  kennziffer: string;
  bemessungsgrundlage: number;
  steuerbetrag: number;
}

interface InvoicePosition {
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalNet: number;
  totalGross: number;
}

interface Invoice {
  id?: string;
  number?: string;
  date?: string;
  status?: string;
  positions: InvoicePosition[];
  totalNet?: number;
  totalGross?: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  vatAmounts?: { [key: string]: number };
}

export default function SteuernPage() {
  const [zeitraum, setZeitraum] = useState('Vierteljährlich');
  const [jahr, setJahr] = useState('2024');
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [taxEntries, setTaxEntries] = useState<TaxEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Lade die Rechnungsdaten
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const db = new DatabaseClient();
        const data = await db.listInvoices();
        setInvoices(data);
        calculateTaxEntries(data, selectedQuarter, parseInt(jahr));
      } catch (error) {
        console.error('Fehler beim Laden der Rechnungen:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [selectedQuarter, jahr]);

  // Berechne die Steuereinträge basierend auf den Rechnungen
  const calculateTaxEntries = (invoices: Invoice[], quarter: number, year: number) => {
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(year, quarter * 3, 0);

    console.log('\n=== Debug Informationen ===');
    console.log('Zeitraum:', quarterStart.toISOString(), 'bis', quarterEnd.toISOString());
    console.log('Alle Rechnungen:', invoices.length);

    const quarterInvoices = invoices.filter(invoice => {
      if (!invoice.date) {
        console.log(`Rechnung ohne Datum:`, invoice.number);
        return false;
      }
      const invoiceDate = new Date(invoice.date);
      const isInQuarter = invoiceDate >= quarterStart && invoiceDate <= quarterEnd;
      const isBezahlt = invoice.status === 'bezahlt';
      
      if (!isInQuarter) {
        console.log(`Rechnung ${invoice.number} außerhalb des Quartals:`, invoice.date);
      }
      if (!isBezahlt) {
        console.log(`Rechnung ${invoice.number} nicht bezahlt:`, invoice.status);
      }
      
      return isInQuarter && isBezahlt;
    });

    // Logge die gefilterten Rechnungen für das Quartal
    console.log(`\n=== Rechnungen für Q${quarter}/${year} ===`);
    console.log('Gefilterte Rechnungen:', quarterInvoices.length);
    
    if (quarterInvoices.length === 0) {
      console.log('Keine Rechnungen für diesen Zeitraum gefunden!');
    } else {
      quarterInvoices.forEach(invoice => {
        console.log(`\nRechnung ${invoice.number}:`);
        console.log(`Datum: ${invoice.date}`);
        console.log(`Status: ${invoice.status}`);
        console.log(`Netto: ${invoice.totalNet?.toFixed(2)} €`);
        console.log(`Brutto: ${invoice.totalGross?.toFixed(2)} €`);
        console.log('MwSt-Beträge:', Object.entries(invoice.vatAmounts || {})
          .map(([rate, amount]) => `${rate}%: ${amount.toFixed(2)} €`)
          .join(', '));
      });
    }

    // Initialisiere die Summen für verschiedene Steuersätze
    const taxRateTotals: { [key: string]: { net: number; vat: number } } = {
      '19': { net: 0, vat: 0 },
      '7': { net: 0, vat: 0 },
      '0': { net: 0, vat: 0 }
    };

    // Berechne die Summen für jeden Steuersatz
    quarterInvoices.forEach(invoice => {
      // Verwende die vorberechneten MwSt-Beträge aus der Datenbank
      if (invoice.vatAmounts && invoice.totalNet) {
        Object.entries(invoice.vatAmounts).forEach(([rate, vatAmount]) => {
          const netAmount = invoice.totalNet! * (vatAmount / (invoice.totalGross! - invoice.totalNet!));
          
          if (!taxRateTotals[rate]) {
            taxRateTotals[rate] = { net: 0, vat: 0 };
          }
          
          taxRateTotals[rate].net += netAmount;
          taxRateTotals[rate].vat += vatAmount;
        });
      }
    });

    const newTaxEntries: TaxEntry[] = [
      {
        id: '1',
        label: 'Steuerpflichtige Umsätze zum Steuersatz von 19%',
        kennziffer: '81',
        bemessungsgrundlage: taxRateTotals['19'].net,
        steuerbetrag: taxRateTotals['19'].vat,
      },
      {
        id: '2',
        label: 'Steuerpflichtige Umsätze zum Steuersatz von 7%',
        kennziffer: '86',
        bemessungsgrundlage: taxRateTotals['7'].net,
        steuerbetrag: taxRateTotals['7'].vat,
      },
      {
        id: '3',
        label: 'Steuerfreie Umsätze ohne Vorsteuerabzug',
        kennziffer: '89',
        bemessungsgrundlage: taxRateTotals['0'].net,
        steuerbetrag: 0,
      },
      {
        id: '4',
        label: 'Innergemeinschaftliche Erwerbe',
        kennziffer: '91',
        bemessungsgrundlage: 0,
        steuerbetrag: 0,
      },
    ];

    setTaxEntries(newTaxEntries);
  };

  const handleQuarterClick = (quarter: number) => {
    setSelectedQuarter(quarter);
  };

  const getQuarterLabel = (quarter: number) => {
    const labels = {
      1: 'Jan - Mär',
      2: 'Apr - Jun',
      3: 'Jul - Sept',
      4: 'Okt - Dez'
    };
    return labels[quarter as keyof typeof labels];
  };

  const zahllast = taxEntries.reduce((sum, entry) => sum + entry.steuerbetrag, 0);

  if (loading) {
    return <div className="p-8">Lade Steuerdaten...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Umsatzsteuervoranmeldung</h1>
        <div className="space-x-2">
          <Button variant="outline">Erinnerung</Button>
          <Button variant="outline">UStVA Protokoll</Button>
          <Button variant="default">UStVA erstellen</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Zeitraum</label>
          <select
            value={zeitraum}
            onChange={(e) => setZeitraum(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Vierteljährlich">Vierteljährlich</option>
            <option value="Monatlich">Monatlich</option>
            <option value="Jährlich">Jährlich</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jahr</label>
          <select
            value={jahr}
            onChange={(e) => setJahr(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((quarter) => (
          <div
            key={quarter}
            onClick={() => handleQuarterClick(quarter)}
            className={`border rounded p-4 text-center cursor-pointer hover:bg-gray-50 ${
              selectedQuarter === quarter ? 'bg-green-100' : ''
            }`}
          >
            <div className="text-sm">{getQuarterLabel(quarter)}</div>
            <div className="text-xs">{jahr}</div>
          </div>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Bezeichnung</TableHead>
            <TableHead>Kennziffer</TableHead>
            <TableHead className="text-right">Bemessungsgrundlage</TableHead>
            <TableHead className="text-right">Steuerbetrag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taxEntries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.label}</TableCell>
              <TableCell>{entry.kennziffer}</TableCell>
              <TableCell className="text-right">{entry.bemessungsgrundlage.toFixed(2)} €</TableCell>
              <TableCell className="text-right">{entry.steuerbetrag.toFixed(2)} €</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={2} className="font-bold">Zahllast</TableCell>
            <TableCell className="text-right">83</TableCell>
            <TableCell className="text-right font-bold">{zahllast.toFixed(2)} €</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
