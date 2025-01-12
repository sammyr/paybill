import { DexieDatabase } from './dexie';
import { SQLiteDatabase } from './sqlite';

export async function migrateToSQLite() {
  console.log('Starte Migration zu SQLite...');
  
  const dexieDb = new DexieDatabase();
  const sqliteDb = new SQLiteDatabase();

  try {
    // Migriere Kontakte
    const contacts = await dexieDb.listContacts();
    console.log(`Migriere ${contacts.length} Kontakte...`);
    for (const contact of contacts) {
      await sqliteDb.createContact(contact);
    }
    console.log('Kontakte migriert');

    // Migriere Rechnungen
    const invoices = await dexieDb.listInvoices();
    console.log(`Migriere ${invoices.length} Rechnungen...`);
    for (const invoice of invoices) {
      try {
        await sqliteDb.createInvoice(invoice);
      } catch (error) {
        console.error(`Fehler beim Migrieren der Rechnung ${invoice.number}:`, error);
      }
    }
    console.log('Rechnungen migriert');

    // Migriere Angebote
    const offers = await dexieDb.listOffers();
    console.log(`Migriere ${offers.length} Angebote...`);
    for (const offer of offers) {
      try {
        await sqliteDb.createOffer(offer);
      } catch (error) {
        console.error(`Fehler beim Migrieren des Angebots ${offer.number}:`, error);
      }
    }
    console.log('Angebote migriert');

    // Migriere Einstellungen
    try {
      const settings = await dexieDb.getSettings();
      if (settings) {
        await sqliteDb.updateSettings(settings);
        console.log('Einstellungen migriert');
      }
    } catch (error) {
      console.error('Fehler beim Migrieren der Einstellungen:', error);
    }

    // Migriere Steuern
    const taxes = await dexieDb.listTaxes();
    console.log(`Migriere ${taxes.length} Steuereinträge...`);
    for (const tax of taxes) {
      try {
        await sqliteDb.createTax(tax);
      } catch (error) {
        console.error(`Fehler beim Migrieren des Steuereintrags ${tax.id}:`, error);
      }
    }
    console.log('Steuereinträge migriert');

    console.log('Migration zu SQLite erfolgreich abgeschlossen');
    return true;
  } catch (error) {
    console.error('Fehler bei der Migration:', error);
    throw error;
  }
}
