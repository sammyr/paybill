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

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Download, 
  Printer, 
  Copy, 
  Trash2, 
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  Pencil
} from 'lucide-react';
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { getDatabase } from '@/lib/db';
import { Invoice } from '@/lib/db/interfaces';

// Status-Typen für Rechnungen
type InvoiceStatus = 'Entwurf' | 'Offen' | 'Fällig' | 'Bezahlt' | 'Teilbezahlt' | 'Storno' | 'Festgeschrieben' | 'Wiederkehrend';

interface Invoice {
  id: string;
  status: InvoiceStatus;
  dueDate: string;
  number: string;
  contactId: string;
  invoiceNumber: string;
  date: string;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  isLocked?: boolean;
  positions: any[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'paid':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'cancelled':
      return <Ban className="w-4 h-4 text-red-500" />;
    case 'draft':
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    paid: 'Bezahlt',
    pending: 'Ausstehend',
    cancelled: 'Storniert',
    draft: 'Entwurf'
  };
  return labels[status] || status;
};

export default function RechnungenPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [entriesPerPage, setEntriesPerPage] = useState<string>('10');

  const loadInvoices = async () => {
    const db = getDatabase();
    const loadedInvoices = await db.listInvoices();
    
    // Berechne die Gesamtbeträge für jede Rechnung
    const processedInvoices = loadedInvoices.map(invoice => {
      // Stelle sicher, dass positions ein Array ist
      const positions = Array.isArray(invoice.positions) ? invoice.positions : [];
      
      // Berechne die Summen aus den vorberechneten Werten
      const netTotal = positions.reduce((sum, pos) => sum + (pos.totalNet || 0), 0);
      const grossTotal = positions.reduce((sum, pos) => sum + (pos.totalGross || 0), 0);
      const vatTotal = grossTotal - netTotal;
      
      return {
        ...invoice,
        netTotal: netTotal || 0,
        vatTotal: vatTotal || 0,
        grossTotal: grossTotal || 0,
        number: invoice.number || invoice.invoiceNumber || '-',
        status: invoice.status || 'draft',
        dueDate: invoice.dueDate instanceof Date ? invoice.dueDate.toISOString() : invoice.dueDate,
        positions: positions
      };
    });
    
    setInvoices(processedInvoices);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleReset = async () => {
    if (confirm('Möchten Sie wirklich alle Rechnungen löschen? Dies kann nicht rückgängig gemacht werden.')) {
      const db = getDatabase();
      await db.resetDatabase();
      await loadInvoices();
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    // Implementierung für Download
    console.log('Download invoice:', invoice.id);
  };

  const handlePrint = async (invoice: Invoice) => {
    // Implementierung für Druck
    console.log('Print invoice:', invoice.id);
  };

  const handleDuplicate = async (invoice: Invoice) => {
    // Implementierung für Duplizieren
    console.log('Duplicate invoice:', invoice.id);
  };

  const handleDelete = async (invoice: Invoice) => {
    if (confirm('Möchten Sie diese Rechnung wirklich löschen?')) {
      try {
        const db = getDatabase();
        await db.deleteInvoice(invoice.id);
        await loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  };

  const filteredInvoices = selectedStatus === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === selectedStatus);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Rechnungen</h1>
        <div className="flex gap-4">
          <Button variant="destructive" onClick={handleReset}>
            Datenbank zurücksetzen
          </Button>
          <Button onClick={() => router.push('/rechnungen/neu')}>
            <Plus className="w-4 h-4 mr-2" />
            Neue Rechnung
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="paid">Bezahlt</SelectItem>
              <SelectItem value="pending">Ausstehend</SelectItem>
              <SelectItem value="cancelled">Storniert</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Select
            value={entriesPerPage}
            onValueChange={setEntriesPerPage}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Einträge pro Seite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 Einträge</SelectItem>
              <SelectItem value="25">25 Einträge</SelectItem>
              <SelectItem value="50">50 Einträge</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Fällig am</TableHead>
              <TableHead>Nummer</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead className="text-right">Netto</TableHead>
              <TableHead className="text-right">USt.</TableHead>
              <TableHead className="text-right">Gesamt</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(invoice.status)}
                    <span>{getStatusLabel(invoice.status)}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                <TableCell>{invoice.number}</TableCell>
                <TableCell>{invoice.contactId}</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.netTotal)} €</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.vatTotal)} €</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.grossTotal)} €</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/rechnungen/${invoice.id}`)}
                      title="Anzeigen"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/rechnungen/neu?id=${invoice.id}`)}
                      title="Bearbeiten"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(invoice)}
                      title="Herunterladen"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrint(invoice)}
                      title="Drucken"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(invoice)}
                      title="Duplizieren"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(invoice)}
                      className="text-red-500 hover:text-red-700"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
