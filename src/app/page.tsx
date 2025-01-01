/**
 * WICHTIG: KEINE FUNKTIONALITÄT ENTFERNEN!
 * 
 * Diese Datei enthält wichtige Funktionen für die Hauptseite.
 * Es darf keine bestehende Funktionalität entfernt werden.
 * Nur Hinzufügungen und Änderungen sind erlaubt, wenn diese ausdrücklich
 * vom Benutzer gewünscht oder verlangt werden.
 * 
 * Folgende Funktionen müssen erhalten bleiben:
 * - Navigation
 * - Dashboard-Übersicht
 * - Schnellzugriff auf wichtige Funktionen
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { getDatabase } from '@/lib/db';
import { Euro } from 'lucide-react';
import type { Invoice } from '@/lib/db/interfaces';

interface DashboardData {
  totalRevenue: number;
  openInvoices: number;
  paidInvoices: number;
  recentInvoices: Invoice[];
  topCustomers: [string, number][];
}

export default function Home() {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    openInvoices: 0,
    paidInvoices: 0,
    recentInvoices: [],
    topCustomers: []
  });
  const [loading, setLoading] = useState(true);

  // Hilfsfunktion zum Berechnen des Gesamtbetrags einer Rechnung
  const calculateInvoiceTotal = (invoice: Invoice): number => {
    if (!invoice.positions || !Array.isArray(invoice.positions)) return 0;
    return invoice.positions.reduce((sum, pos) => {
      if (!pos || typeof pos.totalGross !== 'number') return sum;
      return sum + pos.totalGross;
    }, 0);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const db = getDatabase();
        
        // Lade alle Rechnungen
        const invoices = await db.listInvoices();
        
        // Berechne Gesamtumsatz und Rechnungsstatus
        const totalRevenue = invoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv), 0);
        const openInvoices = invoices.filter(inv => !inv.paid).length;
        const paidInvoices = invoices.filter(inv => inv.paid).length;
        
        // Sortiere nach Datum für neueste Rechnungen
        const recentInvoices = [...invoices]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        // Gruppiere nach Kunden für Top-Kunden
        const customerRevenue = invoices.reduce((acc, inv) => {
          if (!inv.recipient?.name) return acc;
          const customerId = inv.recipient.name;
          acc[customerId] = (acc[customerId] || 0) + calculateInvoiceTotal(inv);
          return acc;
        }, {} as Record<string, number>);
        
        const topCustomers = Object.entries(customerRevenue)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        setData({
          totalRevenue,
          openInvoices,
          paidInvoices,
          recentInvoices,
          topCustomers
        });
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-6">
          <Card className="p-4">
            <div className="h-32 flex items-center justify-center">
              <p className="text-gray-500">Daten werden geladen...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Euro className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
              <p className="text-2xl font-bold">{data.totalRevenue.toLocaleString('de-DE')} €</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Euro className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bezahlte Rechnungen</p>
              <p className="text-2xl font-bold">{data.paidInvoices}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Euro className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Offene Rechnungen</p>
              <p className="text-2xl font-bold">{data.openInvoices}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top 5 Kunden */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top 5 Kunden</h2>
          {data.topCustomers.length > 0 ? (
            <div className="space-y-4">
              {data.topCustomers.map(([customerId, revenue], index) => (
                <div key={customerId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    <span>{customerId}</span>
                  </div>
                  <span className="font-medium">{revenue.toLocaleString('de-DE')} €</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Noch keine Kundendaten verfügbar</p>
          )}
        </Card>

        {/* Neueste Rechnungen */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Neueste Rechnungen</h2>
          {data.recentInvoices.length > 0 ? (
            <div className="space-y-4">
              {data.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{invoice.recipient?.name || 'Unbekannter Kunde'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{calculateInvoiceTotal(invoice).toLocaleString('de-DE')} €</p>
                    <p className={`text-sm ${invoice.paid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {invoice.paid ? 'Bezahlt' : 'Offen'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Noch keine Rechnungen vorhanden</p>
          )}
        </Card>
      </div>
    </div>
  );
}
