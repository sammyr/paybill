import { DatabaseInterface } from './interfaces';
import MemoryDatabase from './memory';

// Singleton instance
let db: DatabaseInterface | null = null;

export function getDatabase(): DatabaseInterface {
  if (!db) {
    db = new MemoryDatabase();
  }
  return db;
}

export class Database implements DatabaseInterface {
  private db: IDBDatabase | null = null;
  private dbName = 'paybill_db';
  private version = 1;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Fehler beim Öffnen der Datenbank'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Contacts Store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactsStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactsStore.createIndex('email', 'email', { unique: false });
          contactsStore.createIndex('type', 'type', { unique: false });
        }

        // Invoices Store
        if (!db.objectStoreNames.contains('invoices')) {
          const invoicesStore = db.createObjectStore('invoices', { keyPath: 'id' });
          invoicesStore.createIndex('number', 'number', { unique: true });
          invoicesStore.createIndex('status', 'status', { unique: false });
        }

        // Offers Store
        if (!db.objectStoreNames.contains('offers')) {
          const offersStore = db.createObjectStore('offers', { keyPath: 'id' });
          offersStore.createIndex('number', 'number', { unique: true });
          offersStore.createIndex('status', 'status', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Taxes Store
        if (!db.objectStoreNames.contains('taxes')) {
          const taxesStore = db.createObjectStore('taxes', { keyPath: 'id' });
          taxesStore.createIndex('year', 'year', { unique: false });
          taxesStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  // Offer Methods
  async createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offers'], 'readwrite');
      const store = transaction.objectStore('offers');

      const newOffer: Offer = {
        ...offer,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const request = store.add(newOffer);

      request.onsuccess = () => resolve(newOffer);
      request.onerror = () => reject(new Error('Fehler beim Erstellen des Angebots'));
    });
  }

  async getOffer(id: string): Promise<Offer | null> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offers'], 'readonly');
      const store = transaction.objectStore('offers');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Fehler beim Laden des Angebots'));
    });
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
    await this.initDB();
    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['offers'], 'readwrite');
      const store = transaction.objectStore('offers');
      
      // Lade das existierende Angebot
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existingOffer = getRequest.result;
        if (!existingOffer) {
          reject(new Error('Angebot nicht gefunden'));
          return;
        }

        const updatedOffer = {
          ...existingOffer,
          ...offer,
          updatedAt: new Date()
        };

        const putRequest = store.put(updatedOffer);
        putRequest.onsuccess = () => resolve(updatedOffer);
        putRequest.onerror = () => reject(new Error('Fehler beim Aktualisieren des Angebots'));
      };

      getRequest.onerror = () => reject(new Error('Fehler beim Laden des existierenden Angebots'));
    });
  }

  async deleteOffer(id: string): Promise<void> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offers'], 'readwrite');
      const store = transaction.objectStore('offers');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Löschen des Angebots'));
    });
  }

  async listOffers(): Promise<Offer[]> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offers'], 'readonly');
      const store = transaction.objectStore('offers');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Fehler beim Laden der Angebote'));
    });
  }

  async resetOffers(): Promise<void> {
    await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offers'], 'readwrite');
      const store = transaction.objectStore('offers');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Fehler beim Zurücksetzen der Angebote'));
    });
  }
}

// Export interfaces
export * from './interfaces';
