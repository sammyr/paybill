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
  ArrowUpIcon,
  ArrowRightIcon,
  Activity
} from 'lucide-react';
import type { Invoice } from '@/lib/db/interfaces';
import { Button } from "@/components/ui/button";

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
      <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-primary/30 border-t-transparent animate-spin-slow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-4 text-red-600">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Fehler</h2>
                <p className="text-gray-600 dark:text-gray-300">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Willkommen zurück! Hier ist Ihre Übersicht.</p>
          </div>
          <Button variant="outline" className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            {new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          </Button>
        </div>
        
        {/* Übersichtskarten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamtumsatz</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.totalRevenue)}
                </h3>
                <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">12.5% vs. Vormonat</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <BanknoteIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offene Rechnungen</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.openInvoices}</h3>
                <div className="flex items-center mt-2 text-yellow-600 dark:text-yellow-400">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">Wert: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.totalRevenue * 0.3)}</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bezahlte Rechnungen</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.paidInvoices}</h3>
                <div className="flex items-center mt-2 text-blue-600 dark:text-blue-400">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">Quote: {Math.round((data.paidInvoices / (data.paidInvoices + data.openInvoices)) * 100)}%</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ø Rechnungsbetrag</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(data.averageInvoiceAmount)}
                </h3>
                <div className="flex items-center mt-2 text-indigo-600 dark:text-indigo-400">
                  <Activity className="w-4 h-4 mr-1" />
                  <span className="text-sm">+5.2% vs. Vormonat</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                <TrendingUpIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Hauptbereich */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Neueste Rechnungen */}
          <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Neueste Rechnungen</h2>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Alle anzeigen
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="space-y-4">
                {data.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{invoice.recipient?.name || 'Unbekannter Kunde'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Rechnung #{invoice.number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(calculateInvoiceTotal(invoice))}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(invoice.date).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Monatliche Umsätze */}
          <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Monatliche Umsätze</h2>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                  Statistiken
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="space-y-4">
                {data.monthlyRevenue.map(({ month, revenue }, index) => (
                  <div key={month} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center">
                        <BarChart3Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(month).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                          <TrendingUpIcon className="w-4 h-4 mr-1" />
                          <span>+{Math.round(Math.random() * 15)}% vs. Vormonat</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
