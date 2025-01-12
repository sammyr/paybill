# Technische Dokumentation: Rechnungsnummernvergabe

## Übersicht
Diese Dokumentation beschreibt das System zur Vergabe und Verwaltung von Rechnungsnummern in der Paybill-Anwendung.

## Grundprinzipien

### 1. Rechnungsnummern-Format
- Rechnungsnummern sind reine Zahlen ohne führende Nullen
- Beispiel: "123", "124", "125"
- Keine Präfixe oder Suffixe
- Keine speziellen Zeichen oder Trennzeichen

### 2. Automatische Nummerierung
- Jede neue Rechnung erhält die nächsthöhere verfügbare Nummer
- Basis ist immer die höchste existierende Rechnungsnummer + 1
- Beispiel: Wenn die letzte Nummer "123" war, ist die nächste "124"
- Neue Nummern werden nur bei der Erstellung neuer Rechnungen vergeben
- Bei der Bearbeitung bestehender Rechnungen bleibt die ursprüngliche Nummer erhalten

### 3. Speicherung und Validierung
- Rechnungsnummern werden in der Datenbank als reine Zahlen gespeichert
- Bei der Eingabe werden alle nicht-numerischen Zeichen entfernt
- Führende Nullen werden automatisch entfernt
- Duplikate werden verhindert durch Prüfung auf Existenz

## Rechnungsnummern-System

### Grundprinzipien
- Rechnungsnummern sind fortlaufende Zahlen ohne führende Nullen
- Jede Rechnungsnummer darf nur einmal existieren
- Entwürfe verwenden die gleiche Nummerierung wie finale Rechnungen
- Die Rechnungsnummer wird beim ersten Speichern festgelegt
- Beim Bearbeiten einer Rechnung wird die ursprüngliche Nummer beibehalten
- Neue Nummern werden ausschließlich für neue Rechnungen generiert

### Bearbeitung bestehender Rechnungen
- Die ursprüngliche Rechnungsnummer bleibt während des gesamten Lebenszyklus erhalten
- Auch bei mehrfacher Bearbeitung wird die Nummer nicht geändert
- Die Nummer ist unveränderlich, sobald sie einmal vergeben wurde
- Dies gewährleistet die Nachverfolgbarkeit und Konsistenz der Rechnungen

### Technische Implementierung

#### 1. Rechnungsnummer-Format
- Rechnungsnummern sind reine Zahlen ohne führende Nullen
- Beispiel: "123", "124", "125"
- Keine Präfixe oder Suffixe
- Keine speziellen Zeichen oder Trennzeichen

#### 2. URL-basierte Rechnungsnummern
- Rechnungsnummern werden in der URL als Query-Parameter mitgeführt (`?number=123`)
- Dies ermöglicht das Bearbeiten und Vorschauen unter der gleichen Nummer
- Beispiel: `/rechnungen/neu?number=123` und `/rechnungen/draft_temp/preview?number=123`

#### 3. Automatische Nummerierung
- Jede neue Rechnung erhält die nächsthöhere verfügbare Nummer
- Basis ist immer die höchste existierende Rechnungsnummer + 1
- Bei Konflikten wird automatisch die nächste freie Nummer vergeben

#### 4. Validierung und Fehlerbehandlung
- Rechnungsnummern werden vor dem Speichern validiert
- Führende Nullen werden automatisch entfernt
- Bei Duplikaten wird automatisch eine neue Nummer generiert
- Der Benutzer wird über Änderungen informiert

#### 5. Persistenz
- Rechnungsnummern werden in der Datenbank als reine Zahlen gespeichert
- Entwürfe und finale Rechnungen teilen den gleichen Nummernkreis
- Eine Nummer kann nicht doppelt vergeben werden

### Eindeutigkeit der Rechnungsnummern
1. **Strenge Eindeutigkeit**
   - Eine Rechnungsnummer darf systemweit nur EINMAL existieren
   - Dies gilt über alle Status hinweg (Entwurf, Final, etc.)
   - Keine Duplikate, auch nicht temporär

2. **Validierung**
   - Bei jeder Speicherung wird die Eindeutigkeit geprüft
   - Prüfung erfolgt über:
     - Datenbank-Einträge
     - Aktive Entwürfe
     - Temporäre Rechnungen
   - Bei Konflikt: Automatische Vergabe der nächsten freien Nummer

3. **Behandlung von Duplikaten**
   - System verhindert das Speichern von Duplikaten
   - Bei Konflikt wird die nächste freie Nummer vergeben
   - Benutzer wird über Änderung der Nummer informiert
   - Ursprüngliche Nummer bleibt beim ersten Dokument

4. **Technische Umsetzung**
```typescript
// Prüfung auf Eindeutigkeit
const isNumberUnique = (number: string, invoices: Invoice[]): boolean => {
  return !invoices.some(inv => inv.number === number);
};

// Bereinigung der Nummer
const cleanNumber = (number: string): string => {
  return number.replace(/\D/g, '').replace(/^0+/, '');
};

// Nächste freie Nummer finden
const getNextNumber = (invoices: Invoice[]): string => {
  const highest = Math.max(...invoices.map(inv => 
    parseInt(cleanNumber(inv.number)) || 0
  ));
  return (highest + 1).toString();
};
```

### Workflow-Beispiel
1. Letzte Rechnung: #124
2. Neuer Entwurf wird gespeichert
3. System vergibt #125
4. Entwurf kann bearbeitet werden
5. Nummer #125 ist reserviert
6. Nächster Entwurf erhält #126

### Wichtige Hinweise
- Einmal vergebene Nummern werden nie wiederverwendet
- Auch gelöschte Rechnungen/Entwürfe geben ihre Nummer nicht frei
- Die Nummer ist permanent, sobald sie vergeben wurde

## Projektstruktur und Datenbank

### Verzeichnisstruktur
```
paybill/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── einstellungen/
│   │   │   │   └── page.tsx      # Einstellungen-Seite
│   │   │   └── layout.tsx        # Dashboard Layout
│   │   └── api/
│   │       └── db/
│   │           └── route.ts       # API-Endpunkte
│   ├── lib/
│   │   └── db/
│   │       ├── index.ts          # Datenbank-Initialisierung
│   │       ├── interfaces.ts     # TypeScript Interfaces
│   │       ├── sqlite.ts         # SQLite Implementation
│   │       └── dexie.ts         # Dexie/IndexedDB Implementation
│   └── components/
│       └── ui/                   # UI-Komponenten
└── data/
    └── paybill.db               # SQLite Datenbank
```

### Datenbank-Schema

#### Settings Tabelle
```sql
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  companyName TEXT,
  logo TEXT,
  street TEXT,
  number TEXT,
  zipCode TEXT,
  city TEXT,
  country TEXT,
  state TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  fax TEXT,
  website TEXT,
  taxId TEXT,
  vatId TEXT,
  accountHolder TEXT,
  bankName TEXT,
  bankIban TEXT,
  bankBic TEXT,
  bankSwift TEXT,
  invoicePrefix TEXT,
  invoiceNextNumber INTEGER,
  offerPrefix TEXT,
  offerNextNumber INTEGER,
  defaultTaxRate REAL,
  defaultPaymentTerms TEXT,
  defaultNotes TEXT,
  defaultFooter TEXT,
  defaultTerms TEXT,
  currency TEXT,
  language TEXT,
  dateFormat TEXT,
  createdAt TEXT,
  updatedAt TEXT
)
```

### Datenverarbeitung

#### Frontend zu Backend
1. Frontend speichert Daten in einem strukturierten Format:
   ```typescript
   interface Settings {
     bankDetails?: {
       accountHolder: string;
       bankName: string;
       iban: string;
       bic: string;
       swift: string;
     };
     // ... andere Felder
   }
   ```

2. API-Route (`/api/db`) verarbeitet die Daten:
   - Normalisiert komplexe Objekte (z.B. bankDetails)
   - Konvertiert Daten in das DB-Schema
   - Entfernt nicht benötigte Felder

3. SQLite-Klasse speichert die Daten:
   - Extrahiert Felder aus komplexen Objekten
   - Führt INSERT/UPDATE Operationen durch
   - Konvertiert Daten zurück in das Frontend-Format

#### Backend zu Frontend
1. SQLite-Klasse liest Daten:
   - Liest alle Felder aus der Datenbank
   - Konvertiert Datenbankfelder in Objekte
   - Erstellt komplexe Objekte (z.B. bankDetails)

2. API-Route sendet Daten:
   - Validiert die Daten
   - Konvertiert Datentypen wenn nötig
   - Sendet strukturierte Antwort

3. Frontend verarbeitet Daten:
   - Initialisiert State mit den Daten
   - Rendert UI-Komponenten
   - Verwaltet lokale Änderungen

## Datenbankstruktur

### Einstellungen (settings)

Die Einstellungen werden in der SQLite-Datenbank in der Tabelle `settings` gespeichert. Hier ist die vollständige Struktur:

#### Hauptfelder
- `id` (TEXT, PRIMARY KEY): Eindeutige ID des Einstellungssatzes
- `companyName` (TEXT): Name des Unternehmens
- `logo` (TEXT): URL oder Pfad zum Firmenlogo

#### Adressfelder
- `street` (TEXT): Straßenname
- `number` (TEXT): Hausnummer
- `zipCode` (TEXT): Postleitzahl
- `city` (TEXT): Stadt
- `country` (TEXT): Land
- `state` (TEXT): Bundesland
- `address` (TEXT): Zusätzliche Adressinformationen

#### Kontaktdaten
- `email` (TEXT): E-Mail-Adresse
- `phone` (TEXT): Telefonnummer
- `mobile` (TEXT): Mobilnummer
- `fax` (TEXT): Faxnummer
- `website` (TEXT): Webseite

#### Steuerliche Informationen
- `taxId` (TEXT): Steuernummer
- `vatId` (TEXT): Umsatzsteuer-ID
- `defaultTaxRate` (REAL): Standard-Steuersatz

#### Bankverbindung
- `accountHolder` (TEXT): Name des Kontoinhabers
- `bankName` (TEXT): Name der Bank
- `bankIban` (TEXT): IBAN
- `bankBic` (TEXT): BIC
- `bankSwift` (TEXT): SWIFT-Code

#### Standardtexte
- `defaultPaymentTerms` (TEXT): Standard-Zahlungsbedingungen
- `defaultNotes` (TEXT): Standard-Notizen
- `defaultFooter` (TEXT): Standard-Fußzeile
- `defaultTerms` (TEXT): Standard-AGB

#### Formatierung und Lokalisierung
- `currency` (TEXT): Währung
- `dateFormat` (TEXT): Datumsformat
- `timezone` (TEXT): Zeitzone

#### Metadaten
- `createdAt` (TEXT): Erstellungsdatum
- `updatedAt` (TEXT): Letztes Änderungsdatum

### Datenverarbeitung

#### Speicherung
1. Alle Textfelder werden als UTF-8 kodiert gespeichert
2. Zahlen werden als REAL (Gleitkommazahlen) gespeichert
3. Datumsangaben werden im ISO-8601 Format gespeichert
4. Bankdaten werden normalisiert (Leerzeichen entfernt, Großbuchstaben)

#### Validierung
1. IBAN und BIC werden vor der Speicherung normalisiert (Großbuchstaben, keine Leerzeichen)
2. Steuersätze werden als Dezimalzahlen gespeichert (z.B. 19.0 für 19%)
3. Pflichtfelder werden vor der Speicherung geprüft

#### Datenabruf
1. Bankdaten werden in ein strukturiertes `bankDetails`-Objekt umgewandelt
2. Leere Felder werden als `undefined` zurückgegeben
3. Zahlen werden als native JavaScript-Zahlen zurückgegeben

### TypeScript Interface

```typescript
interface Settings {
  id?: string;
  companyName?: string;
  logo?: string;
  street?: string;
  number?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  state?: string;
  address?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  taxId?: string;
  vatId?: string;
  bankDetails?: BankDetails;
  defaultTaxRate?: number;
  defaultPaymentTerms?: string;
  defaultNotes?: string;
  defaultFooter?: string;
  defaultTerms?: string;
  currency?: string;
  dateFormat?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BankDetails {
  accountHolder: string;
  bankName: string;
  iban: string;
  bic: string;
  swift: string;
}
```

### Beispiel

```typescript
// Beispiel für einen Einstellungsdatensatz
const settings = {
  id: "1",
  companyName: "Musterfirma GmbH",
  street: "Musterstraße",
  number: "123",
  zipCode: "12345",
  city: "Musterstadt",
  country: "Deutschland",
  email: "info@musterfirma.de",
  phone: "+49 123 456789",
  taxId: "12/345/67890",
  vatId: "DE123456789",
  bankDetails: {
    accountHolder: "Musterfirma GmbH",
    bankName: "Musterbank",
    iban: "DE89370400440532013000",
    bic: "DEUTDEDBXXX",
    swift: "DEUTDEFF"
  },
  defaultTaxRate: 19,
  currency: "EUR",
  dateFormat: "DD.MM.YYYY",
  timezone: "Europe/Berlin"
};
```

## Technische Implementierung

### 1. Datenbank-Layer (memory.ts)
```typescript
async createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
  // 1. Hole alle existierenden Rechnungen
  const allInvoices = await this.listInvoices();
  
  // 2. Finde die höchste existierende Nummer
  let highestNumber = 0;
  allInvoices.forEach(inv => {
    const numberOnly = inv.number.replace(/\D/g, '').replace(/^0+/, '');
    const currentNumber = parseInt(numberOnly);
    if (!isNaN(currentNumber) && currentNumber > highestNumber) {
      highestNumber = currentNumber;
    }
  });

  // 3. Generiere die nächste Nummer
  const nextNumber = (highestNumber + 1).toString();
  
  // 4. Validiere übergebene Nummer oder verwende neue
  const cleanNumber = data.number 
    ? data.number.replace(/\D/g, '').replace(/^0+/, '')
    : nextNumber;

  // 5. Prüfe auf Duplikate
  const numberExists = allInvoices.some(inv => 
    inv.number.replace(/\D/g, '').replace(/^0+/, '') === cleanNumber
  );
  
  // 6. Verwende nächste Nummer bei Duplikat
  const finalNumber = numberExists ? nextNumber : cleanNumber;

  return {
    ...data,
    number: finalNumber,
    // ... weitere Invoice-Eigenschaften
  };
}
```

### 2. Neue Rechnung (neu/page.tsx)
```typescript
// Bei Initialisierung einer neuen Rechnung
useEffect(() => {
  const loadData = async () => {
    // 1. Lösche alte Draft-Daten
    localStorage.removeItem('lastEditedInvoice');
    localStorage.removeItem(`invoice_draft_${draftId}`);

    // 2. Generiere neue Nummer
    const db = getDatabase();
    const tempInvoice = await db.createInvoice({
      ...defaultFormData,
      status: 'entwurf'
    });
    
    // 3. Aktualisiere Formular
    updateFormData(prev => ({
      ...prev,
      number: tempInvoice.number
    }));
  };

  loadData();
}, []);
```

### 3. Vorschau (preview/page.tsx)
```typescript
// Beim Laden der Vorschau
const loadInvoiceData = async () => {
  const draftData = localStorage.getItem(`invoice_draft_${invoiceId}`);
  if (draftData) {
    const parsedDraft = JSON.parse(draftData);
    // Bereinige Nummer
    if (parsedDraft.number) {
      parsedDraft.number = parsedDraft.number.replace(/^0+/, '');
    }
    setInvoice(parsedDraft);
  }
};
```

## Geschäftsregeln

1. **Eindeutigkeit**
   - Jede Rechnungsnummer darf nur einmal existieren
   - Bei Duplikaten wird automatisch die nächste verfügbare Nummer verwendet

2. **Fortlaufende Nummerierung**
   - Neue Rechnungen erhalten immer die nächsthöhere Nummer
   - Keine Lücken in der Nummerierung
   - Keine Zurücksetzung der Nummerierung

3. **Datenbereinigung**
   - Entfernung aller nicht-numerischen Zeichen
   - Entfernung führender Nullen
   - Konvertierung in reinen Zahlenstring

## Beispiel-Workflow

1. Letzte gespeicherte Rechnung hat Nummer "123"
2. Benutzer erstellt neue Rechnung
3. System findet "123" als höchste Nummer
4. Neue Rechnung erhält automatisch "124"
5. Benutzer speichert Rechnung
6. Nächste neue Rechnung erhält "125"

## Fehlerbehandlung

1. **Ungültige Eingaben**
   - Nicht-numerische Zeichen werden entfernt
   - Leere Eingaben führen zur Generierung einer neuen Nummer

2. **Duplikate**
   - Automatische Verwendung der nächsten verfügbaren Nummer
   - Keine Fehlermeldung an den Benutzer

3. **Systemfehler**
   - Bei Datenbankfehlern: Fallback auf Standardnummerierung
   - Logging aller Fehler für Debugging

## Wichtige Hinweise

1. Die Rechnungsnummer wird bereits bei der Erstellung festgelegt
2. Änderungen der Nummer sind möglich, solange keine Duplikate entstehen
3. Gespeicherte Rechnungen behalten ihre Nummer permanent
4. Das System verhindert automatisch doppelte Nummern

### Workflow
1. **Neue Rechnung**
   - System generiert nächste freie Nummer
   - Prüfung auf Eindeutigkeit
   - Speicherung mit garantiert eindeutiger Nummer

2. **Bearbeitung**
   - Nummer kann nicht mehr geändert werden
   - Eindeutigkeit bleibt erhalten
   - Keine temporären Duplikate

3. **Anzeige**
   - In der Übersicht erscheint jede Nummer nur einmal
   - Sortierung nach Rechnungsnummer möglich
   - Filterung berücksichtigt Eindeutigkeit

### Wichtige Hinweise
- Rechnungsnummern sind unveränderlich nach Erstellung
- Keine manuelle Vergabe von Nummern möglich
- System garantiert Eindeutigkeit zu jedem Zeitpunkt
- Keine temporären oder permanenten Duplikate erlaubt

### Fehlerfälle und Behandlung

#### 1. Doppelte Nummern
- System erkennt doppelte Nummern automatisch
- Generiert eine neue, freie Nummer
- Aktualisiert URL und Formular
- Informiert den Benutzer

#### 2. Ungültige Nummern
- System bereinigt Nummern automatisch
- Entfernt führende Nullen
- Entfernt nicht-numerische Zeichen
- Validiert vor dem Speichern

#### 3. Fehlende Nummern
- System verhindert das Speichern ohne Nummer
- Generiert automatisch eine neue Nummer
- Informiert den Benutzer über Fehler

### Best Practices

1. **Konsistenz**
   - Immer die gleiche Nummer während des gesamten Bearbeitungsprozesses verwenden
   - Nummer in URL und Formular synchron halten
   - Änderungen transparent kommunizieren

2. **Validierung**
   - Nummern vor dem Speichern validieren
   - Duplikate verhindern
   - Format-Regeln durchsetzen

3. **Benutzerführung**
   - Klare Fehlermeldungen anzeigen
   - Automatische Korrekturen kommunizieren
   - Einfache Navigation zwischen Bearbeitung und Vorschau

## PDF-Generierung und Rabattberechnung

### Beteiligte Dateien

#### 1. PDF-Generierung
- `src/app/api/invoice/pdf/route.ts`
  - Hauptdatei für die PDF-Generierung
  - Verwendet Puppeteer für die HTML-zu-PDF-Konvertierung
  - Enthält das HTML-Template und CSS-Styles für das PDF-Layout
  - Verarbeitet die Rabattberechnung und -darstellung im PDF

#### 2. Rabattberechnung
- `src/lib/invoice-utils.ts`
  - Enthält die Logik für die Berechnung von Rabatten
  - Berechnet Zwischensummen, Rabattbeträge und Mehrwertsteuer
  - Unterstützt prozentuale und fixe Rabatte

#### 3. Vorschau und Übergabe
- `src/app/(dashboard)/rechnungen/[id]/preview/page.tsx`
  - Zeigt die Rechnungsvorschau an
  - Übergibt die Rechnungsdaten an die PDF-Generierung
  - Stellt die Rabattinformationen in der Vorschau dar

### Funktionsweise

#### 1. Rabattberechnung
- **Rabatttypen**:
  - Prozentualer Rabatt (z.B. 20%)
  - Fixer Rabatt (z.B. 100€)
- **Berechnungsablauf**:
  1. Berechnung der Zwischensumme aus allen Positionen
  2. Anwendung des Rabatts (prozentual oder fix)
  3. Berechnung des Nettobetrags nach Rabatt
  4. Berechnung der Mehrwertsteuer auf den rabattierten Nettobetrag
  5. Ermittlung des Bruttobetrags

#### 2. PDF-Generierung
- **Prozess**:
  1. Empfang der Rechnungsdaten via POST-Request
  2. Berechnung der finalen Beträge
  3. Generierung des HTML-Templates mit Styles
  4. Konvertierung zu PDF mittels Puppeteer
  5. Rückgabe des PDF-Dokuments

- **Layout-Struktur**:
  1. Kopfbereich mit Logo und Absenderinformationen
  2. Empfänger- und Rechnungsinformationen
  3. Positionstabelle mit voller Breite
  4. Summenbereich mit Rabattanzeige
  5. Fußbereich mit Zahlungsinformationen

#### 3. Darstellung des Rabatts
- **PDF-Format**:
  ```
  Zwischensumme:         3.835,00 €
  Rabatt (20%):           -767,00 €
  Gesamtbetrag netto:    3.068,00 €
  Umsatzsteuer 19%:        582,92 €
  Gesamtbetrag brutto:   3.650,92 €
  ```

### Technische Details

#### 1. CSS-Struktur
- Verwendung von flexiblen Breiten für responsive Darstellung
- Prozentuale Aufteilung der Spaltenbreiten
- Spezielle Formatierung für Rabattzeilen (rot)
- Einheitliche Ausrichtung von Zahlen und Text

#### 2. Datenübergabe
```typescript
{
  invoice: {
    ...invoice,
    discount: {
      type: 'percentage' | 'fixed',
      value: number
    },
    vatAmounts: { [rate: string]: number },
    totalVat: number,
    totalNet: number,
    totalGross: number,
    discountAmount: number,
    netAfterDiscount: number
  },
  settings: {
    // Firmeneinstellungen
  }
}
```

### Wartung und Erweiterung

#### 1. Neue Rabatttypen hinzufügen
1. Erweitern Sie den Rabatttyp in `invoice-utils.ts`
2. Aktualisieren Sie die Berechnungslogik
3. Passen Sie die Darstellung in der PDF-Vorlage an

#### 2. Layout-Anpassungen
1. Ändern Sie die CSS-Styles in `route.ts`
2. Testen Sie die Änderungen mit verschiedenen Datenkonstellationen
3. Stellen Sie sicher, dass die Darstellung konsistent bleibt

## Rabattsystem

### 1. Rabattstruktur
- Rabatte werden als Objekt gespeichert mit zwei Eigenschaften:
  ```typescript
  {
    type: 'percentage' | 'fixed',  // Art des Rabatts
    value: number                  // Wert (Prozent oder Fixbetrag)
  }
  ```

### 2. Speicherung in der Datenbank
- Rabatte werden in der Rechnung als `discount`-Objekt gespeichert
- Beispiel für einen 10% Rabatt:
  ```typescript
  discount: {
    type: 'percentage',
    value: 10
  }
  ```
- Beispiel für einen Fixrabatt von 100€:
  ```typescript
  discount: {
    type: 'fixed',
    value: 100
  }
  ```

### 3. Berechnung des Rabatts
- Die Berechnung erfolgt in `invoice-utils.ts`
- Prozentrabatt: `netTotal * (rabattProzent / 100)`
- Fixrabatt: direkter Abzug des Fixbetrags
- Der Rabatt wird vor der Mehrwertsteuer abgezogen

### 4. Anzeige in der Vorschau
- Der Rabatt wird unter der Zwischensumme angezeigt
- Bei Prozentrabatt: Anzeige als "Rabatt (10%)"
- Bei Fixrabatt: Anzeige als "Rabatt (Fixbetrag)"
- Der Rabattbetrag wird in rot und mit Minuszeichen dargestellt

### 5. Technische Details
- Neue Rechnungen (`/rechnungen/neu`):
  ```typescript
  discount: formData.discount ? {
    type: formData.discount.type,
    value: Number(formData.discount.value)
  } : undefined
  ```

- Vorschau (`/rechnungen/draft_temp/preview`):
  ```typescript
  foundInvoice.discount = {
    type: foundInvoice.discountType || foundInvoice.discount?.type || 'fixed',
    value: Number(foundInvoice.discountValue || foundInvoice.discount?.value || 0)
  }
  ```

### 6. PDF-Generierung
- Der Rabatt wird in der PDF-Rechnung im Summenbereich angezeigt
- Format: "Rabatt (Art): -Betrag"
- Die Gesamtsummen werden entsprechend angepasst

### 7. Wichtige Hinweise
- Rabatte werden nur angezeigt, wenn der Wert größer als 0 ist
- Die Berechnung erfolgt immer auf Basis des Netto-Gesamtbetrags
- Alle Berechnungen werden serverseitig validiert
- Die Rabattinformationen werden beim Speichern und Laden der Rechnung automatisch konvertiert

### Workflow
1. **Neue Rechnung**
   - System generiert nächste freie Nummer
   - Prüfung auf Eindeutigkeit
   - Speicherung mit garantiert eindeutiger Nummer

2. **Bearbeitung**
   - Nummer kann nicht mehr geändert werden
   - Eindeutigkeit bleibt erhalten
   - Keine temporären Duplikate

3. **Anzeige**
   - In der Übersicht erscheint jede Nummer nur einmal
   - Sortierung nach Rechnungsnummer möglich
   - Filterung berücksichtigt Eindeutigkeit

### Wichtige Hinweise
- Rechnungsnummern sind unveränderlich nach Erstellung
- Keine manuelle Vergabe von Nummern möglich
- System garantiert Eindeutigkeit zu jedem Zeitpunkt
- Keine temporären oder permanenten Duplikate erlaubt

### Fehlerfälle und Behandlung

#### 1. Doppelte Nummern
- System erkennt doppelte Nummern automatisch
- Generiert eine neue, freie Nummer
- Aktualisiert URL und Formular
- Informiert den Benutzer

#### 2. Ungültige Nummern
- System bereinigt Nummern automatisch
- Entfernt führende Nullen
- Entfernt nicht-numerische Zeichen
- Validiert vor dem Speichern

#### 3. Fehlende Nummern
- System verhindert das Speichern ohne Nummer
- Generiert automatisch eine neue Nummer
- Informiert den Benutzer über Fehler

### Best Practices

1. **Konsistenz**
   - Immer die gleiche Nummer während des gesamten Bearbeitungsprozesses verwenden
   - Nummer in URL und Formular synchron halten
   - Änderungen transparent kommunizieren

2. **Validierung**
   - Nummern vor dem Speichern validieren
   - Duplikate verhindern
   - Format-Regeln durchsetzen

3. **Benutzerführung**
   - Klare Fehlermeldungen anzeigen
   - Automatische Korrekturen kommunizieren
   - Einfache Navigation zwischen Bearbeitung und Vorschau

```
