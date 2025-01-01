# Datenbankstruktur und Migration

## Aktuelle Implementierung: SQLite

Die Anwendung verwendet aktuell SQLite als lokale Datenbank. Dies ermöglicht:
- Schnelle Entwicklung ohne Server-Setup
- Lokale Datenspeicherung
- Einfache Datensicherung

## Migration zu Firebase

### Vorbereitungen

1. Firebase-Projekt erstellen:
```bash
# Firebase CLI installieren
npm install -g firebase-tools

# Firebase initialisieren
firebase init
```

2. Firebase-Konfiguration in `.env` anlegen:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Migrationsprozess

1. Neue Firebase-Implementierung erstellen:
```typescript
// src/lib/db/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { DatabaseInterface } from './interfaces';

export class FirebaseDatabase implements DatabaseInterface {
  // Implementiere alle Methoden aus DatabaseInterface
  // Nutze Firestore-Methoden statt SQLite
}
```

2. Datenbank-Provider aktualisieren:
```typescript
// src/lib/db/index.ts
import { DatabaseInterface } from './interfaces';
import { SQLiteDatabase } from './sqlite';
import { FirebaseDatabase } from './firebase';

const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true';

export function getDatabase(): DatabaseInterface {
  if (USE_FIREBASE) {
    return new FirebaseDatabase();
  }
  return new SQLiteDatabase();
}
```

3. Daten migrieren:
```typescript
async function migrateToFirebase() {
  const sqliteDb = new SQLiteDatabase();
  const firebaseDb = new FirebaseDatabase();

  // Migriere Einstellungen
  const settings = await sqliteDb.getSettings();
  await firebaseDb.updateSettings(settings);

  // Migriere Kontakte
  const contacts = await sqliteDb.listContacts();
  for (const contact of contacts) {
    await firebaseDb.createContact(contact);
  }

  // Migriere Rechnungen
  const invoices = await sqliteDb.listInvoices();
  for (const invoice of invoices) {
    await firebaseDb.createInvoice(invoice);
  }

  // Migriere Steuerdaten
  const taxes = await sqliteDb.listTaxes();
  for (const tax of taxes) {
    await firebaseDb.createTax(tax);
  }
}
```

### Datenbankstruktur in Firebase

#### Firestore Collections

```
/settings
  - global (document)
    • language: string
    • timezone: string
    • currency: string
    • paymentTermDays: number

/contacts
  - {contactId}
    • name: string
    • type: string
    • email: string
    • phone: string
    • address: string
    • taxId: string
    • createdAt: timestamp
    • updatedAt: timestamp

/invoices
  - {invoiceId}
    • number: string
    • contactId: string
    • status: string
    • issueDate: timestamp
    • dueDate: timestamp
    • totalNet: number
    • totalGross: number
    • currency: string
    • notes: string
    • createdAt: timestamp
    • updatedAt: timestamp
    /items (subcollection)
      - {itemId}
        • description: string
        • quantity: number
        • unitPrice: number
        • taxRate: number
        • totalNet: number
        • totalGross: number

/taxes
  - {taxId}
    • year: number
    • quarter: number
    • taxableAmount: number
    • taxAmount: number
    • status: string
    • dueDate: timestamp
    • submissionDate: timestamp
    • createdAt: timestamp
    • updatedAt: timestamp
```

### Sicherheitsregeln

Firestore-Sicherheitsregeln (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Nur authentifizierte Benutzer haben Zugriff
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Spezifische Regeln für jede Collection
    match /settings/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /contacts/{contactId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /invoices/{invoiceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        resource.data.status != 'paid';
      allow delete: if request.auth != null && 
        resource.data.status == 'draft';
    }
    
    match /taxes/{taxId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

### Vorteile der Migration zu Firebase

1. **Skalierbarkeit**
   - Automatische Skalierung
   - Globale Verfügbarkeit
   - Echtzeit-Synchronisation

2. **Sicherheit**
   - Integrierte Authentifizierung
   - Granulare Zugriffsrechte
   - Automatische Backups

3. **Features**
   - Offline-Unterstützung
   - Echtzeit-Updates
   - Cloud Functions für Backend-Logik

4. **Wartung**
   - Keine Server-Wartung erforderlich
   - Automatische Updates
   - Monitoring und Analytics
