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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 space-y-6">
      <div className="container mx-auto relative">
        {/* Hintergrund-Blur-Effekte */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <h1 className="text-3xl font-bold mb-8 text-gray-800 relative">Dashboard</h1>
        
        {/* Übersichtskarten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/30 shadow-xl p-6 transition-all duration-300 hover:transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
                <h3 className="text-2xl font-bold text-gray-800">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.totalRevenue)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                <BanknoteIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/30 shadow-xl p-6 transition-all duration-300 hover:transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offene Rechnungen</p>
                <h3 className="text-2xl font-bold text-gray-800">{data.openInvoices}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100/50 backdrop-blur-sm flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/30 shadow-xl p-6 transition-all duration-300 hover:transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bezahlte Rechnungen</p>
                <h3 className="text-2xl font-bold text-gray-800">{data.paidInvoices}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100/50 backdrop-blur-sm flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/30 shadow-xl p-6 transition-all duration-300 hover:transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ø Rechnungsbetrag</p>
                <h3 className="text-2xl font-bold text-gray-800">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.averageInvoiceAmount)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100/50 backdrop-blur-sm flex items-center justify-center">
                <TrendingUpIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Neueste Rechnungen */}
        <div className="mt-8">
          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Neueste Rechnungen</h2>
            </div>
            <div className="space-y-4">
              {data.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/50 transition-all duration-300 hover:bg-white/70">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100/50 flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{invoice.recipient?.name || 'Unbekannter Kunde'}</p>
                      <p className="text-sm text-gray-500">Rechnung #{invoice.number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(calculateInvoiceTotal(invoice))}
                    </p>
                    <p className="text-sm text-gray-500">{new Date(invoice.date).toLocaleDateString('de-DE')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistiken Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Top Kunden */}
          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Top Kunden</h2>
            </div>
            <div className="space-y-4">
              {data.topCustomers.map(([customer, revenue], index) => (
                <div key={customer} className="flex items-center justify-between p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/50">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100/50 flex items-center justify-center">
                      <UsersIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-800">{customer}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monatliche Umsätze */}
          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Monatliche Umsätze</h2>
            </div>
            <div className="space-y-4">
              {data.monthlyRevenue.map(({ month, revenue }) => (
                <div key={month} className="flex items-center justify-between p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/50">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100/50 flex items-center justify-center">
                      <BarChart3Icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-800">{new Date(month).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
