'use client';

import { useState } from 'react';
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

interface TaxEntry {
  id: string;
  label: string;
  kennziffer: string;
  bemessungsgrundlage: number;
  steuerbetrag: number;
}

const taxEntries: TaxEntry[] = [
  {
    id: '1',
    label: 'Steuerpflichtige Umsätze',
    kennziffer: '',
    bemessungsgrundlage: 1102.50,
    steuerbetrag: 209.48,
  },
  {
    id: '2',
    label: 'Steuerfreie Umsätze mit Vorsteuerabzug',
    kennziffer: '',
    bemessungsgrundlage: 0,
    steuerbetrag: 0,
  },
  {
    id: '3',
    label: 'Steuerfreie Umsätze ohne Vorsteuerabzug',
    kennziffer: '',
    bemessungsgrundlage: 420.00,
    steuerbetrag: 0,
  },
  {
    id: '4',
    label: 'Innergemeinschaftliche Erwerbe',
    kennziffer: '',
    bemessungsgrundlage: 0,
    steuerbetrag: 0,
  },
  {
    id: '5',
    label: 'Leistungsempfänger als Steuerschuldner (§ 13b UStG)',
    kennziffer: '',
    bemessungsgrundlage: 0,
    steuerbetrag: 0,
  },
  {
    id: '6',
    label: 'Ergänzende Angaben zu Umsätzen',
    kennziffer: '',
    bemessungsgrundlage: 0,
    steuerbetrag: 0,
  },
  {
    id: '7',
    label: 'Abziehbare Vorsteuerbeträge',
    kennziffer: '',
    bemessungsgrundlage: 0,
    steuerbetrag: 0,
  },
  {
    id: '8',
    label: 'Andere Steuerbeträge',
    kennziffer: '',
    bemessungsgrundlage: 0,
    steuerbetrag: 0,
  },
];

export default function SteuernPage() {
  const [zeitraum, setZeitraum] = useState('Vierteljährlich');
  const [jahr, setJahr] = useState('2024');
  const [entries] = useState<TaxEntry[]>(taxEntries);

  const zahllast = entries.reduce((sum, entry) => sum + entry.steuerbetrag, 0);
  const kennziffer = '83';

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
        <div className="border rounded p-4 text-center">
          <div className="text-sm">Jan - Mär</div>
          <div className="text-xs">2024</div>
        </div>
        <div className="border rounded p-4 text-center bg-green-100">
          <div className="text-sm">Apr - Jun</div>
          <div className="text-xs">2024 ✓</div>
        </div>
        <div className="border rounded p-4 text-center bg-green-100">
          <div className="text-sm">Jul - Sept</div>
          <div className="text-xs">2024 ✓</div>
        </div>
        <div className="border rounded p-4 text-center">
          <div className="text-sm">Okt - Dez</div>
          <div className="text-xs">2024</div>
        </div>
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
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.label}</TableCell>
              <TableCell>{entry.kennziffer}</TableCell>
              <TableCell className="text-right">{entry.bemessungsgrundlage.toFixed(2)} €</TableCell>
              <TableCell className="text-right">{entry.steuerbetrag.toFixed(2)} €</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={2} className="font-bold">Zahllast</TableCell>
            <TableCell className="text-right">{kennziffer}</TableCell>
            <TableCell className="text-right font-bold">{zahllast.toFixed(2)} €</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
