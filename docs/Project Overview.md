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
