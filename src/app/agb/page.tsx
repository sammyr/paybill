export default function AGBPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">§1 Geltungsbereich</h2>
            <p className="text-gray-600 mb-4">
              Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle Verträge zwischen 
              [Firmenname] (nachfolgend "Anbieter") und seinen Kunden (nachfolgend "Nutzer") über die Nutzung 
              der PayBill Software.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§2 Vertragsgegenstand</h2>
            <p className="text-gray-600 mb-4">
              Gegenstand des Vertrages ist die Nutzung der PayBill Software zur Erstellung und Verwaltung von 
              Rechnungen, Angeboten und Kontakten. Der genaue Funktionsumfang ergibt sich aus der jeweiligen 
              Produktbeschreibung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§3 Vertragsschluss</h2>
            <p className="text-gray-600 mb-4">
              Der Vertrag kommt durch die Registrierung des Nutzers und die Annahme dieser AGB zustande. 
              Der Anbieter behält sich das Recht vor, Registrierungen ohne Angabe von Gründen abzulehnen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§4 Preise und Zahlung</h2>
            <p className="text-gray-600 mb-4">
              Die Preise ergeben sich aus der aktuellen Preisliste. Alle Preise verstehen sich zzgl. der 
              gesetzlichen Mehrwertsteuer. Die Zahlung erfolgt im Voraus für den jeweiligen Abrechnungszeitraum.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§5 Pflichten des Nutzers</h2>
            <p className="text-gray-600 mb-4">
              Der Nutzer ist verpflichtet:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Seine Zugangsdaten geheim zu halten</li>
              <li>Die Software nur im Rahmen der geltenden Gesetze zu nutzen</li>
              <li>Keine schädlichen oder illegalen Inhalte zu erstellen oder zu speichern</li>
              <li>Regelmäßige Datensicherungen durchzuführen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§6 Gewährleistung und Haftung</h2>
            <p className="text-gray-600 mb-4">
              Der Anbieter gewährleistet eine Verfügbarkeit der Software von 99% im Jahresmittel. 
              Die Haftung des Anbieters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§7 Datenschutz</h2>
            <p className="text-gray-600 mb-4">
              Der Anbieter verarbeitet personenbezogene Daten gemäß seiner Datenschutzerklärung und 
              den geltenden Datenschutzgesetzen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">§8 Schlussbestimmungen</h2>
            <p className="text-gray-600 mb-4">
              Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist, soweit gesetzlich zulässig, 
              der Sitz des Anbieters.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
