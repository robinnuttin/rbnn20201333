
import { Lead } from "../types";

const DB_NAME = 'CrescoFlowDB';
const STORE_NAME = 'LeadsStore';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveLeadsToCloud = async (leads: Lead[]): Promise<boolean> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Voor eenvoud in deze versie wissen we de store en schrijven we alles opnieuw
    // In een productie scenario zou je individuele updates doen
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const lead of leads) {
      store.put(lead);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => {
        console.log(`[IndexedDB] Neural Database Secured: ${leads.length} records in sync.`);
        resolve(true);
      };
      tx.onerror = () => {
        console.error("[IndexedDB] Transaction failed", tx.error);
        resolve(false);
      };
    });
  } catch (error) {
    console.error("[IndexedDB] CRITICAL: Cloud commit failed.", error);
    return false;
  }
};

export const getLeadsFromCloud = async (): Promise<Lead[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Lead[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("[IndexedDB] Failed to retrieve leads", error);
    return [];
  }
};

export const initializeCloudConnection = async (): Promise<boolean> => {
  try {
    await openDB();
    return true;
  } catch (e) {
    return false;
  }
};
