'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { getDatabase } from '@/lib/db';
import { formatCurrency } from '@/lib/invoice-utils';
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Printer, Copy, Trash2, ArrowLeft, CheckCircle2, Ban } from 'lucide-react';

interface OfferParams {
  params: {
    id: string;
  };
}

export default function OfferDetailPage({ params }: OfferParams) {
  const router = useRouter();
  const { toast } = useToast();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffer();
  }, [params.id]);

  const loadOffer = async () => {
    try {
      const db = getDatabase();
      const loadedOffer = await db.getOffer(params.id);
      setOffer(loadedOffer);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Angebot konnte nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    try {
      const db = getDatabase();
      await db.updateOfferStatus(params.id, 'angenommen');
      toast({
        title: "Erfolg",
        description: "Angebot wurde angenommen",
      });
      loadOffer();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleRejectOffer = async () => {
    try {
      const db = getDatabase();
      await db.updateOfferStatus(params.id, 'abgelehnt');
      toast({
        title: "Erfolg",
        description: "Angebot wurde abgelehnt",
      });
      loadOffer();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Möchten Sie dieses Angebot wirklich löschen?')) return;
    
    try {
      const db = getDatabase();
      await db.deleteOffer(params.id);
      toast({
        title: "Erfolg",
        description: "Angebot wurde gelöscht",
      });
      router.push('/angebote');
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Angebot konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Lade...</div>;
  }

  if (!offer) {
    return <div>Angebot nicht gefunden</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => router.push('/angebote')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Drucken
          </Button>
          {offer.status === 'offen' && (
            <>
              <Button variant="outline" onClick={handleAcceptOffer}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Annehmen
              </Button>
              <Button variant="outline" onClick={handleRejectOffer}>
                <Ban className="mr-2 h-4 w-4" /> Ablehnen
              </Button>
            </>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Löschen
          </Button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Angebotsinformationen</h3>
            <p><strong>Angebotsnummer:</strong> {offer.offerNumber}</p>
            <p><strong>Datum:</strong> {formatDate(offer.date)}</p>
            <p><strong>Gültig bis:</strong> {formatDate(offer.validUntil)}</p>
            <p><strong>Status:</strong> {offer.status}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Kunde</h3>
            <p>{offer.recipient?.name}</p>
            <p>{offer.recipient?.address}</p>
            <p>{offer.recipient?.zip} {offer.recipient?.city}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Positionen</h3>
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Beschreibung</th>
                <th className="text-right py-2">Menge</th>
                <th className="text-right py-2">Einzelpreis</th>
                <th className="text-right py-2">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {offer.positions?.map((position: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{position.description}</td>
                  <td className="text-right">{position.quantity}</td>
                  <td className="text-right">{formatCurrency(position.price)}</td>
                  <td className="text-right">{formatCurrency(position.quantity * position.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right py-2"><strong>Netto:</strong></td>
                <td className="text-right">{formatCurrency(offer.netTotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-right py-2"><strong>MwSt.:</strong></td>
                <td className="text-right">{formatCurrency(offer.vatTotal)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="text-right py-2"><strong>Gesamt:</strong></td>
                <td className="text-right">{formatCurrency(offer.grossTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
