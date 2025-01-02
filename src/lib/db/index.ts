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

// Export interfaces
export * from './interfaces';
