export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
            <p>
              Shell GmbH<br />
              Musterstraße 123<br />
              12345 Musterstadt
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Kontakt</h2>
            <p>
              Telefon: +49 (0) 123 456789<br />
              Telefax: +49 (0) 123 456789<br />
              E-Mail: info@shell-gmbh.de
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Handelsregister</h2>
            <p>
              Registergericht: Amtsgericht Musterstadt<br />
              Registernummer: HRB 123456
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:<br />
              DE 123456789
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Max Mustermann<br />
              Musterstraße 123<br />
              12345 Musterstadt
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Streitschlichtung</h2>
            <p className="mb-4">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
              <a href="https://ec.europa.eu/consumers/odr" className="text-blue-600 hover:text-blue-800 ml-1" target="_blank" rel="noopener noreferrer">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </main>

    </div>
  );
}
