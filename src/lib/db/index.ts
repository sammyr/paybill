import { DatabaseInterface } from './interfaces';
import { LocalStorageDatabase } from './localstorage';

// Singleton instance
let database: DatabaseInterface | null = null;

export function getDatabase(): DatabaseInterface {
  if (!database) {
    database = new LocalStorageDatabase();
  }
  return database;
}

export class Database implements DatabaseInterface {
  private db: Storage | null = null;

  constructor() {
    this.db = localStorage;
  }

  // Offer Methods
  async createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
    const newOffer: Offer = {
      ...offer,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.db!.setItem('offer-' + newOffer.id, JSON.stringify(newOffer));

    return newOffer;
  }

  async getOffer(id: string): Promise<Offer | null> {
    const offer = this.db!.getItem('offer-' + id);
    if (!offer) return null;

    return JSON.parse(offer);
  }

  async updateOffer(id: string, offer: Partial<Offer>): Promise<Offer> {
    const existingOffer = await this.getOffer(id);
    if (!existingOffer) {
      throw new Error('Angebot nicht gefunden');
    }

    const updatedOffer = {
      ...existingOffer,
      ...offer,
      updatedAt: new Date()
    };

    this.db!.setItem('offer-' + updatedOffer.id, JSON.stringify(updatedOffer));

    return updatedOffer;
  }

  async deleteOffer(id: string): Promise<void> {
    this.db!.removeItem('offer-' + id);
  }

  async listOffers(): Promise<Offer[]> {
    const offers: Offer[] = [];

    for (let i = 0; i < this.db!.length; i++) {
      const key = this.db!.key(i);
      if (key && key.startsWith('offer-')) {
        const offer = this.db!.getItem(key);
        if (offer) {
          offers.push(JSON.parse(offer));
        }
      }
    }

    return offers;
  }

  async resetOffers(): Promise<void> {
    for (let i = 0; i < this.db!.length; i++) {
      const key = this.db!.key(i);
      if (key && key.startsWith('offer-')) {
        this.db!.removeItem(key);
      }
    }
  }
}

// Export interfaces
export * from './interfaces';
