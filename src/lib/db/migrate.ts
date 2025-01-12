import { DexieDatabase } from './dexie';

export async function migrateFromLocalStorage() {
  const db = new DexieDatabase();

  // Migrate contacts
  const savedContactsData = localStorage.getItem('contacts');
  if (savedContactsData) {
    try {
      const contacts = JSON.parse(savedContactsData, (key, value) => {
        if (key === 'createdAt' || key === 'updatedAt' || key === 'date' || key === 'validUntil') {
          return new Date(value);
        }
        return value;
      });
      
      for (const contact of contacts) {
        await db.createContact(contact);
      }
      console.log(`Migrated ${contacts.length} contacts`);
    } catch (error) {
      console.error('Error migrating contacts:', error);
    }
  }

  // Migrate invoices
  const savedInvoicesData = localStorage.getItem('invoices');
  if (savedInvoicesData) {
    try {
      const invoices = JSON.parse(savedInvoicesData, (key, value) => {
        if (key === 'createdAt' || key === 'updatedAt') {
          return new Date(value);
        }
        return value;
      });
      
      for (const invoice of invoices) {
        await db.createInvoice(invoice);
      }
      console.log(`Migrated ${invoices.length} invoices`);
    } catch (error) {
      console.error('Error migrating invoices:', error);
    }
  }

  // Migrate offers
  const savedOffersData = localStorage.getItem('offers');
  if (savedOffersData) {
    try {
      const offers = JSON.parse(savedOffersData, (key, value) => {
        if (key === 'createdAt' || key === 'updatedAt' || key === 'date' || key === 'validUntil') {
          return new Date(value);
        }
        return value;
      });
      
      for (const offer of offers) {
        await db.createOffer(offer);
      }
      console.log(`Migrated ${offers.length} offers`);
    } catch (error) {
      console.error('Error migrating offers:', error);
    }
  }

  // Migrate settings
  const savedSettings = localStorage.getItem('settings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings, (key, value) => {
        if (key === 'updatedAt') {
          return new Date(value);
        }
        return value;
      });
      
      await db.updateSettings(settings);
      console.log('Migrated settings');
    } catch (error) {
      console.error('Error migrating settings:', error);
    }
  }

  // Clear localStorage after successful migration
  localStorage.clear();
  console.log('Migration complete');
}
