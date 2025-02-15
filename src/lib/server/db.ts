import { Contact, Invoice, Settings, Tax, Offer } from '../db/interfaces';

let db: Storage | null = null;

export function getDatabase() {
  if (typeof window !== 'undefined' && !db) {
    db = window.localStorage;
    initDatabase(db);
  }
  return db;
}

function initDatabase(storage: Storage) {
  // Initialisiere Collections, wenn sie nicht existieren
  if (!storage.getItem('contacts')) {
    storage.setItem('contacts', '[]');
  }
  if (!storage.getItem('invoices')) {
    storage.setItem('invoices', '[]');
  }
  if (!storage.getItem('offers')) {
    storage.setItem('offers', '[]');
  }
  if (!storage.getItem('taxes')) {
    storage.setItem('taxes', '[]');
  }
  if (!storage.getItem('settings')) {
    storage.setItem('settings', '{}');
  }
}

export function resetDatabase() {
  if (typeof window === 'undefined') {
    throw new Error('Diese Aktion ist nur im Browser verfügbar');
  }

  try {
    const storage = window.localStorage;
    
    // Lösche alle Daten
    storage.clear();
    
    // Initialisiere mit leeren Arrays
    storage.setItem('contacts', '[]');
    storage.setItem('invoices', '[]');
    storage.setItem('taxes', '[]');
    storage.setItem('offers', '[]');
    storage.setItem('settings', '{}');
    
    return { success: true, message: 'Datenbank erfolgreich zurückgesetzt' };
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Datenbank:', error);
    throw error;
  }
}
