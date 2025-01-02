import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/favicon.svg"
                alt="PayBill Logo"
                width={32}
                height={32}
                className="brightness-0 invert"
              />
              <span className="text-2xl font-bold">PayBill</span>
            </div>
            <p className="text-gray-400">
              Ihre moderne Lösung für digitale Buchhaltung und Rechnungsverwaltung.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Produkt</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#benefits" className="text-gray-400 hover:text-white transition-colors">Vorteile</a></li>
              <li><a href="/preise" className="text-gray-400 hover:text-white transition-colors">Preise</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Unternehmen</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Über uns</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Karriere</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kontakt</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Rechtliches</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Datenschutz</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">AGB</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Impressum</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} PayBill. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}
