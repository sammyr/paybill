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

// Status-Typen für Angebote
type OfferStatus = 'Entwurf' | 'Offen' | 'Angenommen' | 'Abgelehnt' | 'Abgelaufen';

interface Offer {
  id: string;
  status: OfferStatus;
  validUntil: string;
  number: string;
  contactId: string;
  offerNumber: string;
  date: string;
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  positions: any[];
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'angenommen':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'offen':
      return <Clock className="w-4 h-4 text-orange-500" />;
    case 'abgelehnt':
      return <Ban className="w-4 h-4 text-red-500" />;
    case 'abgelaufen':
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
    default:
      return <Clock className="w-4 h-4 text-blue-500" />;
  }
};

const getStatusLabel = (status: string) => {
  const labels: { [key: string]: string } = {
    'angenommen': 'Angenommen',
    'offen': 'Offen',
    'abgelehnt': 'Abgelehnt',
    'abgelaufen': 'Abgelaufen',
    'entwurf': 'Entwurf'
  };
  return labels[status.toLowerCase()] || status;
};

export default function AngebotePage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [entriesPerPage, setEntriesPerPage] = useState<string>('10');

  const loadOffers = async () => {
    const db = getDatabase();
    const loadedOffers = await db.listOffers();
    
    // Berechne die Gesamtbeträge für jedes Angebot
    const processedOffers = loadedOffers.map(offer => {
      // Stelle sicher, dass positions ein Array ist
      const positions = Array.isArray(offer.positions) ? offer.positions : [];
      
      // Berechne die Summen
      const netTotal = offer.totalNet || positions.reduce((sum, pos) => {
        const quantity = parseFloat(pos.quantity?.toString() || '0');
        const price = parseFloat(pos.price?.toString() || '0');
        return sum + (quantity * price);
      }, 0);

      const vatRate = offer.vatRate || 19;
      const vatAmount = offer.vatAmount || (netTotal * vatRate / 100);
      const grossTotal = offer.totalGross || (netTotal + vatAmount);
      
      return {
        ...offer,
        netTotal,
        vatTotal: vatAmount,
        grossTotal,
        number: offer.number || offer.offerNumber || '-',
        status: offer.status || 'entwurf'
      };
    });
    
    setOffers(processedOffers);
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleReset = async () => {
    if (confirm('Möchten Sie wirklich alle Angebote löschen? Dies kann nicht rückgängig gemacht werden.')) {
      const db = getDatabase();
      await db.resetOffers();
      await loadOffers();
    }
  };

  const handleDownload = async (offer: Offer) => {
    // Implementierung für Download
    console.log('Download offer:', offer.id);
  };

  const handlePrint = async (offer: Offer) => {
    // Implementierung für Druck
    console.log('Print offer:', offer.id);
  };

  const handleDuplicate = async (offer: Offer) => {
    // Implementierung für Duplizieren
    console.log('Duplicate offer:', offer.id);
  };

  const handleDelete = async (offer: Offer) => {
    if (confirm('Möchten Sie dieses Angebot wirklich löschen?')) {
      try {
        const db = getDatabase();
        await db.deleteOffer(offer.id);
        await loadOffers();
      } catch (error) {
        console.error('Error deleting offer:', error);
      }
    }
  };

  const filteredOffers = selectedStatus === 'all' 
    ? offers 
    : offers.filter(offer => offer.status.toLowerCase() === selectedStatus.toLowerCase());

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Angebote</h1>
        <div className="flex gap-4">
          <Button variant="destructive" onClick={handleReset}>
            Datenbank zurücksetzen
          </Button>
          <Button onClick={() => router.push('/angebote/neu')}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Angebot
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
              <SelectItem value="angenommen">Angenommen</SelectItem>
              <SelectItem value="offen">Offen</SelectItem>
              <SelectItem value="abgelehnt">Abgelehnt</SelectItem>
              <SelectItem value="abgelaufen">Abgelaufen</SelectItem>
              <SelectItem value="entwurf">Entwurf</SelectItem>
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
              <TableHead>Gültig bis</TableHead>
              <TableHead>Nummer</TableHead>
              <TableHead className="text-right">Netto</TableHead>
              <TableHead className="text-right">USt.</TableHead>
              <TableHead className="text-right">Gesamt</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(offer.status)}
                    <span className="text-sm font-medium">{getStatusLabel(offer.status)}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(offer.validUntil)}</TableCell>
                <TableCell>{offer.number}</TableCell>
                <TableCell className="text-right">{formatCurrency(offer.netTotal)} €</TableCell>
                <TableCell className="text-right">{formatCurrency(offer.vatTotal)} €</TableCell>
                <TableCell className="text-right">{formatCurrency(offer.grossTotal)} €</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/angebote/${offer.id}`)}
                      title="Anzeigen"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/angebote/neu?id=${offer.id}`)}
                      title="Bearbeiten"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(offer)}
                      title="Herunterladen"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrint(offer)}
                      title="Drucken"
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(offer)}
                      title="Duplizieren"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(offer)}
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
