# Dokumentation der Rechnungsfunktionen

## Inhaltsverzeichnis
1. [Rechnungserstellung](#rechnungserstellung)
2. [Rechnungsbearbeitung](#rechnungsbearbeitung)
3. [Rechnungsnummern-System](#rechnungsnummern-system)
4. [Speichern und Entwürfe](#speichern-und-entwürfe)
5. [Validierung und Fehlerbehandlung](#validierung-und-fehlerbehandlung)

## Rechnungserstellung

### Neue Rechnung erstellen
1. **Zugang**
   - Klicken Sie auf "Neue Rechnung" im Dashboard
   - Die nächste verfügbare Rechnungsnummer wird automatisch generiert
   - Sie werden zur Seite `/rechnungen/neu` weitergeleitet

2. **Formularfelder**
   - **Rechnungsnummer**: Automatisch vergeben, unveränderlich
   - **Empfänger-Informationen**:
     - Name (Pflichtfeld)
     - Straße
     - PLZ
     - Ort
     - Land (Standard: Deutschland)
     - E-Mail
     - Telefon
     - Steuernummer
   - **Rechnungspositionen**:
     - Beschreibung
     - Menge
     - Einzelpreis
     - Steuersatz
     - Gesamtpreis (automatisch berechnet)
   - **Rabatt** (optional):
     - Prozentual oder Festbetrag
     - Wird automatisch vom Gesamtbetrag abgezogen
   - **Notizen** (optional)

3. **Automatische Berechnungen**
   - Netto-Gesamtbetrag
   - Mehrwertsteuer (nach Steuersätzen aufgeschlüsselt)
   - Brutto-Gesamtbetrag
   - Rabattberechnung

## Rechnungsbearbeitung

### Bestehende Rechnung bearbeiten
1. **Zugang**
   - In der Rechnungsübersicht auf "Bearbeiten" klicken
   - Weiterleitung zu `/rechnungen/neu` mit bestehender Rechnungsnummer
   - Gleiche Funktionalität wie bei neuer Rechnung

2. **Besonderheiten**
   - Rechnungsnummer bleibt unverändert
   - Alle anderen Felder können bearbeitet werden
   - Vorhandene Daten werden automatisch geladen

3. **Speicherverhalten**
   - Automatische Speicherung als Entwurf
   - Finale Speicherung bei "Speichern" oder "Festschreiben"
   - Keine Duplikate möglich

## Rechnungsnummern-System

### Format und Regeln
1. **Nummernformat**
   - Reine Zahlen ohne führende Nullen
   - Keine Präfixe oder Suffixe
   - Keine Sonderzeichen

2. **Automatische Nummerierung**
   - Nächste Nummer = Höchste existierende Nummer + 1
   - Lücken werden nicht automatisch gefüllt
   - Keine manuelle Vergabe möglich

3. **Technische Verarbeitung**
   ```typescript
   // Bereinigung der Nummer
   const cleanNumber = number.replace(/\D/g, '').replace(/^0+/, '');
   ```

## Speichern und Entwürfe

### Automatische Speicherung
1. **Entwurfsspeicherung**
   - Automatisch alle 30 Sekunden
   - Bei wichtigen Änderungen
   - Vor dem Verlassen der Seite

2. **Lokale Speicherung**
   ```typescript
   localStorage.setItem(`invoice_draft_${number}`, JSON.stringify(formData));
   ```

3. **Datenbank-Speicherung**
   - Bei explizitem Speichern
   - Bei Festschreiben der Rechnung
   - Bei PDF-Export

### Wiederherstellung
1. **Priorität der Daten**
   - Zuerst Datenbank prüfen
   - Dann lokalen Speicher prüfen
   - Fallback auf leeres Formular

2. **Konfliktbehandlung**
   - Neuere Version hat Vorrang
   - Benutzerbenachrichtigung bei Konflikten
   - Option zum manuellen Zusammenführen

## Validierung und Fehlerbehandlung

### Formularvalidierung
1. **Pflichtfelder**
   - Rechnungsnummer (automatisch)
   - Empfängername
   - Mindestens eine Position

2. **Formatvalidierung**
   - Zahlen: Nur numerische Werte
   - E-Mail: Gültiges Format
   - Datum: Gültiges Format

3. **Geschäftsregeln**
   - Rechnungsdatum nicht in der Zukunft
   - Positive Beträge
   - Gültige Mehrwertsteuersätze

### Fehlerbehandlung
1. **Benutzerbenachrichtigungen**
   ```typescript
   toast({
     title: "Fehler",
     description: "Detaillierte Fehlerbeschreibung",
     variant: "destructive"
   });
   ```

2. **Fehlerszenarien**
   - Netzwerkfehler
   - Validierungsfehler
   - Datenbank-Fehler
   - Berechtigungsfehler

3. **Wiederherstellung**
   - Automatische Wiederherstellung von Entwürfen
   - Manuelle Speicherung ermöglichen
   - Konfliktlösung anbieten

## Best Practices

### Neue Rechnung erstellen
1. Auf "Neue Rechnung" klicken
2. Empfängerdaten eingeben
3. Positionen hinzufügen
4. Optional Rabatt hinzufügen
5. Vorschau prüfen
6. Speichern oder Festschreiben

### Rechnung bearbeiten
1. In der Übersicht "Bearbeiten" wählen
2. Änderungen vornehmen
3. Vorschau prüfen
4. Speichern
5. Bei Bedarf PDF exportieren

### Tipps und Tricks
- Regelmäßig speichern
- Vorschau nutzen
- Entwürfe für wiederkehrende Rechnungen
- Kontakte für häufige Empfänger pflegen
