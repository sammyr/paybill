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
import Image from 'next/image';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface DashboardData {
  totalRevenue: number;
  openInvoices: number;
  paidInvoices: number;
  recentInvoices: Invoice[];
  topCustomers: [string, number][];
}

const features = [
  {
    title: "Professionelle Rechnungen in Minuten",
    description: "Erstelle persönliche Angebote und gestalte individuelle Rechnungen in unter 2 Minuten - natürlich GoBD-konform.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Alles im Überblick",
    description: "Behalte deine Einnahmen, Ausgaben und offene Forderungen immer im Blick. Unser übersichtliches Dashboard macht es möglich.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Digitale Buchhaltung leicht gemacht",
    description: "Ein rechtssicheres System, das deine Buchhaltung tagtäglich vereinfacht und deine Gewinnermittlung erleichtert.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop"
  }
];

const benefits = [
  "Rechnungen in unter 2 Minuten erstellen",
  "Übersichtliches Dashboard für alle Kennzahlen",
  "GoBD-konforme Dokumentenverwaltung",
  "Automatische Zahlungszuordnung",
  "Einfache Zusammenarbeit mit dem Steuerberater",
  "Digitale Belegerfassung"
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[800px] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1702047076267-6719aadd2807?q=80&w=2074&auto=format&fit=crop"
            alt="Hero Background"
            fill
            className="object-cover brightness-[0.7]"
            priority
          />
        </div>
        <div className="container mx-auto px-4 flex flex-col items-center text-center relative z-10 text-white pt-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            PayBill
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl">
            Ihre moderne Lösung für Rechnungsverwaltung und Buchhaltung. 
            Einfach, schnell und effizient.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Jetzt starten
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Alles was Sie für Ihre digitale Buchhaltung brauchen
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Umsatzsteuer Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Image
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop"
                alt="Umsatzsteuer-Voranmeldung"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Umsatzsteuer-Voranmeldung so einfach wie noch nie
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Verschicke deine Umsatzsteuer-Voranmeldung direkt an dein Finanzamt. 
                Dank unserer integrierten Schnittstelle zu ELSTER benötigst du kein zusätzliches Zertifikat.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Direkte ELSTER-Integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Kein zusätzliches Zertifikat nötig</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Schnelle und sichere Übermittlung</span>
                </div>
              </div>
              <div className="mt-8">
                <a
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  Jetzt ausprobieren
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Ihre Vorteile mit PayBill
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 p-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bereit für den nächsten Schritt?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Starten Sie jetzt mit PayBill und erleben Sie, wie einfach moderne Buchhaltung sein kann.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Zum Dashboard
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  );
}
