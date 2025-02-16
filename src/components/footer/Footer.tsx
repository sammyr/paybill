import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Image
                src="/favicon.svg"
                alt="PayBill Logo"
                width={24}
                height={24}
                className="dark:brightness-0 dark:invert"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">PayBill</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ihre moderne Lösung für digitale Buchhaltung und Rechnungsverwaltung.
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Produkt</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#benefits" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Vorteile
                </a>
              </li>
              <li>
                <a href="/preise" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Preise
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Unternehmen</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="#about" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Über uns
                </a>
              </li>
              <li>
                <a href="/kontakt" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Kontakt
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">Rechtliches</h4>
            <ul className="space-y-1.5">
              <li>
                <a href="/datenschutz" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Datenschutz
                </a>
              </li>
              <li>
                <a href="/agb" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  AGB
                </a>
              </li>
              <li>
                <a href="/impressum" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  Impressum
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 dark:border-gray-700 mt-6 pt-6 text-center text-xs text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} PayBill. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}
