export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-lg font-medium mb-2">Allgemeine Hinweise</h3>
            <p className="text-gray-600 mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, 
              wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert 
              werden können.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Cookies und Local Storage</h2>
            <h3 className="text-lg font-medium mb-2">Technisch notwendige Cookies</h3>
            <p className="text-gray-600 mb-4">
              Wir verwenden für den Betrieb der Website notwendige Cookies. Diese speichern keine personenbezogenen Daten.
            </p>
            <h3 className="text-lg font-medium mb-2">Analyse-Cookies</h3>
            <p className="text-gray-600 mb-4">
              Mit Ihrer Einwilligung verwenden wir Analyse-Cookies, um die Qualität unserer Website und ihre Inhalte zu verbessern.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. Datenerfassung auf dieser Website</h2>
            <h3 className="text-lg font-medium mb-2">Kontaktformular</h3>
            <p className="text-gray-600 mb-4">
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive 
              der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen 
              bei uns gespeichert.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Ihre Rechte</h2>
            <p className="text-gray-600 mb-4">
              Sie haben jederzeit das Recht:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Auskunft über Ihre gespeicherten personenbezogenen Daten zu erhalten</li>
              <li>Die Berichtigung oder Löschung dieser Daten zu verlangen</li>
              <li>Die Verarbeitung einzuschränken</li>
              <li>Der Verarbeitung zu widersprechen</li>
              <li>Ihre Daten in einem strukturierten Format zu erhalten</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
