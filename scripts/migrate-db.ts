import 'fake-indexeddb/auto';
import { migrateToSQLite } from '../src/lib/db/migrate-to-sqlite';

async function main() {
  try {
    console.log('Starte Datenbank-Migration...');
    await migrateToSQLite();
    console.log('Migration erfolgreich abgeschlossen');
    process.exit(0);
  } catch (error) {
    console.error('Fehler bei der Migration:', error);
    process.exit(1);
  }
}

main();
