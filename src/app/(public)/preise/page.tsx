import { Check } from 'lucide-react';
import Navigation from '@/components/navigation/Navigation';
import Footer from '@/components/footer/Footer';

const pricingPlans = [
  {
    name: 'Kostenlos',
    price: '0',
    period: 'für immer',
    description: 'Ideal für Einzelunternehmer und Kleingewerbetreibende',
    features: [
      'Bis zu 5 Rechnungen pro Monat',
      'Grundlegende Buchhaltungsfunktionen',
      'Digitale Belegerfassung',
      'Einfache Kontaktverwaltung',
      'Mobile App (iOS & Android)',
      'E-Mail Support',
    ],
    buttonText: 'Kostenlos starten',
    buttonLink: '/dashboard',
    highlighted: false
  },
  {
    name: 'Buchhaltung',
    price: '19,90',
    period: 'pro Monat',
    description: 'Die komplette Buchhaltungslösung für Ihr Unternehmen',
    features: [
      'Unbegrenzte Rechnungen',
      'Automatische Zahlungszuordnung',
      'DATEV-Export',
      'ELSTER-Integration',
      'Digitale Belegerfassung',
      'Erweiterte Buchhaltung',
      'Mahnwesen',
      'Angebote & Aufträge',
      'Vorlagen anpassbar',
      'API-Zugang',
      'Premium Support',
    ],
    buttonText: '30 Tage kostenlos testen',
    buttonLink: '/dashboard',
    highlighted: true,
    badge: 'Beliebteste Wahl'
  },
  {
    name: 'Buchhaltung Plus',
    price: '39,90',
    period: 'pro Monat',
    description: 'Zusätzliche Features für mehr Effizienz',
    features: [
      'Alles aus Buchhaltung, plus:',
      'Mehrere Benutzer',
      'Erweiterte Berechtigungen',
      'Automatische OCR-Erkennung',
      'Erweiterte Auswertungen',
      'Schnittstelle zu Online-Shops',
      'Individuelle Anpassungen',
      'Priorisierter Support',
      'Persönlicher Account Manager',
    ],
    buttonText: '30 Tage kostenlos testen',
    buttonLink: '/dashboard',
    highlighted: false
  }
];

const faqs = [
  {
    question: 'Was kostet PayBill?',
    answer: 'PayBill bietet verschiedene Tarife an, beginnend mit einem kostenlosen Starter-Tarif. Der Professional-Tarif kostet 19,90€ pro Monat und der Business-Tarif 39,90€ pro Monat. Alle Preise verstehen sich zzgl. MwSt.'
  },
  {
    question: 'Gibt es eine Mindestvertragslaufzeit?',
    answer: 'Nein, bei PayBill gibt es keine Mindestvertragslaufzeit. Sie können monatlich kündigen und sind somit maximal flexibel.'
  },
  {
    question: 'Kann ich meinen Tarif später ändern?',
    answer: 'Ja, Sie können Ihren Tarif jederzeit upgraden oder downgraden. Die Änderung wird zum nächsten Abrechnungszeitraum wirksam.'
  },
  {
    question: 'Welche Zahlungsmethoden werden akzeptiert?',
    answer: 'Wir akzeptieren alle gängigen Zahlungsmethoden wie SEPA-Lastschrift, Kreditkarte und Überweisung.'
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Der passende Tarif für Ihr Unternehmen
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            30 Tage kostenlos testen. Keine Kreditkarte erforderlich.
            Jederzeit kündbar.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg overflow-hidden relative ${
                plan.highlighted ? 'ring-2 ring-primary' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-gray-600"> {plan.period}</span>
                </div>
                <a
                  href={plan.buttonLink}
                  className={`block text-center py-3 px-6 rounded-lg font-semibold mb-8 ${
                    plan.highlighted
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  } transition-colors`}
                >
                  {plan.buttonText}
                </a>
                <div className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center text-gray-600">
          <p>Alle Preise zzgl. MwSt. Jährliche Zahlung möglich (2 Monate sparen).</p>
          <p className="mt-2">Bei Fragen zur Preisgestaltung kontaktieren Sie uns gerne.</p>
        </div>
      </div>

      {/* FAQs */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Häufig gestellte Fragen
        </h2>
        <div className="max-w-3xl mx-auto space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Starten Sie noch heute mit PayBill
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Testen Sie alle Funktionen 14 Tage lang kostenlos und unverbindlich.
            Keine Kreditkarte erforderlich.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Kostenlos testen
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
