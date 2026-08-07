import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

let _dbPromise: Promise<SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLiteDatabase> {
  if (!_dbPromise) {
    _dbPromise = openDatabaseAsync('objectpass.db');
  }
  return _dbPromise;
}
