'use client';

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { getDatabase } from '@/lib/db';
import { 
  BanknoteIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  TrendingUpIcon,
  UsersIcon,
  BarChart3Icon,
  CalendarIcon,
  ArrowUpIcon
} from 'lucide-react';
import type { Invoice } from '@/lib/db/interfaces';

interface DashboardData {
  totalRevenue: number;
  openInvoices: number;
  paidInvoices: number;
  recentInvoices: Invoice[];
  topCustomers: [string, number][];
  monthlyRevenue: { month: string; revenue: number }[];
  averageInvoiceAmount: number;
}

// Memoized Hilfsfunktionen
const calculateInvoiceTotal = (invoice: Invoice): number => {
  if (!invoice.positions || !Array.isArray(invoice.positions)) return 0;
  return invoice.positions.reduce((sum, pos) => {
    if (!pos || typeof pos.totalGross !== 'number') return sum;
    return sum + pos.totalGross;
  }, 0);
};

const getMonthlyRevenue = (invoices: Invoice[]): { month: string; revenue: number }[] => {
  const monthlyData = invoices.reduce((acc, inv) => {
    const date = new Date(inv.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + calculateInvoiceTotal(inv);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(monthlyData)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Letzte 6 Monate
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    openInvoices: 0,
    paidInvoices: 0,
    recentInvoices: [],
    topCustomers: [],
    monthlyRevenue: [],
    averageInvoiceAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setError(null);
        const db = getDatabase();
        const invoices = await db.listInvoices();
        
        // Berechne Statistiken
        const totalRevenue = invoices.reduce((sum, inv) => sum + calculateInvoiceTotal(inv), 0);
        const openInvoices = invoices.filter(inv => !inv.paid).length;
        const paidInvoices = invoices.filter(inv => inv.paid).length;
        const averageInvoiceAmount = totalRevenue / (openInvoices + paidInvoices || 1);
        
        // Neueste Rechnungen
        const recentInvoices = [...invoices]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        // Top-Kunden
        const customerRevenue = invoices.reduce((acc, inv) => {
          if (!inv.recipient?.name) return acc;
          const customerId = inv.recipient.name;
          acc[customerId] = (acc[customerId] || 0) + calculateInvoiceTotal(inv);
          return acc;
        }, {} as Record<string, number>);
        
        const topCustomers = Object.entries(customerRevenue)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5);

        // Monatliche Umsätze
        const monthlyRevenue = getMonthlyRevenue(invoices);

        setData({
          totalRevenue,
          openInvoices,
          paidInvoices,
          recentInvoices,
          topCustomers,
          monthlyRevenue,
          averageInvoiceAmount
        });
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
        setError('Beim Laden der Daten ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-red-600">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Übersichtskarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamtumsatz</p>
              <h3 className="text-2xl font-bold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.totalRevenue)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BanknoteIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Offene Rechnungen</p>
              <h3 className="text-2xl font-bold">{data.openInvoices}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bezahlte Rechnungen</p>
              <h3 className="text-2xl font-bold">{data.paidInvoices}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ø Rechnungsbetrag</p>
              <h3 className="text-2xl font-bold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.averageInvoiceAmount)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUpIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Neueste Rechnungen */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Neueste Rechnungen</h2>
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          {data.recentInvoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">{invoice.recipient?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(invoice.date).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${invoice.paid ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {invoice.paid ? 'Bezahlt' : 'Offen'}
                </span>
                <span className="font-medium">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(calculateInvoiceTotal(invoice))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Kunden */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Top Kunden</h2>
          <UsersIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          {data.topCustomers.map(([name, revenue], index) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="font-medium">{name}</span>
              </div>
              <span className="font-medium">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(revenue)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Monatliche Umsätze */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Monatliche Umsätze</h2>
          <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="h-64 space-y-4">
          {data.monthlyRevenue.map(({ month, revenue }) => {
            const maxRevenue = Math.max(...data.monthlyRevenue.map(m => m.revenue));
            const percentage = (revenue / maxRevenue) * 100;
            const isHighest = revenue === maxRevenue;
            
            return (
              <div key={month} className="flex items-center gap-4">
                <span className="w-20 text-sm text-muted-foreground">
                  {new Date(month + '-01').toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}
                </span>
                <div className="flex-1 h-4 bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${isHighest ? 'bg-primary' : 'bg-primary/60'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-32 flex items-center justify-end gap-2">
                  <span className="font-medium">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(revenue)}
                  </span>
                  {isHighest && <ArrowUpIcon className="h-4 w-4 text-primary" />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
