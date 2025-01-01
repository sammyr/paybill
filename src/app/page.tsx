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

import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Top 5 Kunden */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Top 5 Kunden</h2>
          <div className="relative">
            {/* Hier kommt das Kunden-Diagramm */}
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Kundenübersicht wird geladen...</p>
            </div>
          </div>
        </Card>

        {/* Top 5 Ausgaben */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Top 5 Ausgaben</h2>
          <div className="relative">
            {/* Hier kommt das Ausgaben-Diagramm */}
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Ausgabenübersicht wird geladen...</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Produkte & Dienstleistungen */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Produkte & Dienstleistungen</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Höchste Umsätze (Netto)</span>
              <span>0,00 €</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Geringster Umsatz (Netto)</span>
              <span>0,00 €</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
