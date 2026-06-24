/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = "musiclog_music_db";
const DB_VERSION = 1;
const STORE_NAME = "tracks";

export interface DBTrack {
  id: string;
  name: string;
  duration: number;
  fileData: Blob; // Raw file blob (MP3/WAV/M4A)
  coverUrl?: string;
  uploadedAt: number;
  artist?: string;
  album?: string;
}

/**
 * Open the IndexedDB database connection
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Save a new track to IndexedDB
 */
export async function saveTrackToDB(track: DBTrack): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(store.transaction?.error || new Error("Failed to save track"));
    };
  });
}

/**
 * Delete a track from IndexedDB
 */
export async function deleteTrackFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(store.transaction?.error || new Error("Failed to delete track"));
    };
  });
}

/**
 * Load all tracks from IndexedDB
 */
export async function loadTracksFromDB(): Promise<DBTrack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by newest uploaded first
      const results = request.result as DBTrack[];
      results.sort((a, b) => b.uploadedAt - a.uploadedAt);
      resolve(results);
    };

    request.onerror = () => {
      reject(store.transaction?.error || new Error("Failed to load tracks"));
    };
  });
}
