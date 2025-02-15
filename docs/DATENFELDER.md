# Paybill Datenfelder-Dokumentation

Diese Dokumentation beschreibt detailliert die Datenfelder in der Paybill-Anwendung, ihre Speicherorte und Verwendung.

## Übersicht der Datenflüsse

1. **Eingabe**: Daten werden in der Einstellungsseite (`src/app/(dashboard)/einstellungen/page.tsx`) eingegeben
2. **Speicherung**: Daten werden in der LocalStorage-Datenbank (`src/lib/db/localstorage.ts`) gespeichert
3. **Anzeige**: Daten werden in der Rechnungsvorschau (`InvoicePDF.tsx`) und PDF-Generierung (`route.ts`) verwendet

## Detaillierte Feldbeschreibung

### Firmeninformationen

| Eingabefeld (UI) | Datenbankfeld | Verwendung in PDF/Vorschau | Beschreibung |
|------------------|---------------|---------------------------|--------------|
| Firmenname | companyName | settings.companyName | Name des Unternehmens |
| Straße | street | settings.street | Straßenadresse |
| PLZ | zipCode | settings.zipCode | Postleitzahl |
| Stadt | city | settings.city | Stadtname |
| Land | country | settings.country | Land (Dropdown: Deutschland, Österreich, Schweiz) |
| Firmeninhaber | companyOwner | settings.companyOwner | Name des Firmeninhabers |

### Kontaktinformationen

| Eingabefeld (UI) | Datenbankfeld | Verwendung in PDF/Vorschau | Beschreibung |
|------------------|---------------|---------------------------|--------------|
| Telefon | phone | settings.phone | Telefonnummer |
| E-Mail | email | settings.email | E-Mail-Adresse |
| Website | website | settings.website | Webseite (ohne http/https) |

### Steuerinformationen

| Eingabefeld (UI) | Datenbankfeld | Verwendung in PDF/Vorschau | Beschreibung |
|------------------|---------------|---------------------------|--------------|
| USt.-ID | vatId | settings.vatId | Umsatzsteuer-ID |
| Steuernummer | taxId | settings.taxId | Steuernummer |

### Bankinformationen

| Eingabefeld (UI) | Datenbankfeld | Verwendung in PDF/Vorschau | Beschreibung |
|------------------|---------------|---------------------------|--------------|
| Bank | bankName | settings.bankDetails.bankName | Name der Bank |
| IBAN | bankIban | settings.bankDetails.iban | IBAN-Nummer |
| BIC | bankBic | settings.bankDetails.bic | BIC/SWIFT-Code |

### Logo

| Eingabefeld (UI) | Datenbankfeld | Verwendung in PDF/Vorschau | Beschreibung |
|------------------|---------------|---------------------------|--------------|
| Logo | logo | settings.logo | Firmenlogo (Base64 oder URL) |

## Verwendung in verschiedenen Komponenten

### 1. Einstellungsseite (`src/app/(dashboard)/einstellungen/page.tsx`)
- Verwendet `handleChange` Funktion für Feldaktualisierungen
- Speichert Daten über `updateSettings` in der Datenbank
- Beispiel:
  ```typescript
  handleChange('companyOwner', e.target.value)
  ```

### 2. Rechnungsvorschau (`src/components/invoice/InvoicePDF.tsx`)
- Zeigt Daten in zwei Bereichen:
  1. Kopfbereich (Absenderzeile)
  ```typescript
  {settings.companyName} - {settings.street} - {settings.zipCode} {settings.city}
  ```
  2. Fußbereich (Detaillierte Firmeninformationen)
  ```typescript
  {settings.companyName}<br />
  {settings.street}<br />
  {settings.zipCode} {settings.city}
  ```

### 3. PDF-Generierung (`src/app/api/invoice/pdf/route.ts`)
- Verwendet die gleichen Felder wie die Vorschau
- Generiert statisches HTML mit den Einstellungen
- Beispiel:
  ```typescript
  ${settings.companyName} - ${settings.street} - ${settings.zipCode} ${settings.city}
  ```

## Wichtige Hinweise

1. **Feldnamen-Konsistenz**:
   - Immer die exakten Feldnamen verwenden
   - Beispiel: `companyOwner` statt `inhaber` oder `owner`

2. **Optionale Felder**:
   - Alle Felder werden mit Optional Chaining (`?.`) oder Fallback (`||`) verwendet
   - Beispiel: `settings.companyOwner || ''`

3. **Datenbank-Struktur**:
   - Definiert in `src/lib/db/interfaces.ts`
   - Verwendet TypeScript Interfaces für Typsicherheit

4. **Datenpersistenz**:
   - Alle Daten werden im LocalStorage gespeichert
   - Schlüssel: `settings`
   - Format: JSON

## Fehlerbehebung

Bei Problemen mit der Datenanzeige:
1. Überprüfen Sie den exakten Feldnamen in der Datenbank
2. Stellen Sie sicher, dass das Feld in `interfaces.ts` definiert ist
3. Überprüfen Sie die Verwendung in allen drei Komponenten (Einstellungen, Vorschau, PDF)
