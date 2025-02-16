export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
            <p>
              [Firmenname]<br />
              [Straße Nr.]<br />
              [PLZ Stadt]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
            <p>
              Telefon: [Telefonnummer]<br />
              E-Mail: [E-Mail-Adresse]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Handelsregister</h2>
            <p>
              Registergericht: [Registergericht]<br />
              Registernummer: [Registernummer]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
              [USt-IdNr]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              [Name]<br />
              [Straße Nr.]<br />
              [PLZ Stadt]
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
