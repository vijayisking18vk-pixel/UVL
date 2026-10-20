import { supabase } from './supabase';

const DB_NAME = 'UVL_Document_Store';
const STORE_NAME = 'document_blobs';

/**
 * Initializes IndexedDB for high-capacity local blob storage fallback
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores file blob into IndexedDB fallback
 */
export async function storeBlobLocally(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Local indexedDB write fallback failure:', err);
  }
}

/**
 * Retrieves file blob from IndexedDB fallback
 */
export async function getBlobLocally(key: string): Promise<Blob | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Uploads a document to Supabase storage with automatic fallback to local IndexedDB
 */
export async function uploadDocumentStorage(
  workspaceId: string,
  documentId: string,
  versionNumber: number,
  file: File
): Promise<{ storagePath: string; isRemote: boolean }> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${workspaceId}/${documentId}/v${versionNumber}/${sanitizedName}`;

  // Always store locally in IndexedDB as immediate cache
  await storeBlobLocally(path, file);

  try {
    // 1. Attempt primary Supabase storage upload to 'documents' bucket
    const { data, error } = await supabase.storage.from('documents').upload(path, file, {
      upsert: true,
      contentType: file.type || 'application/pdf'
    });

    if (!error && data) {
      return { storagePath: path, isRemote: true };
    }

    // 2. Fallback to 'files' bucket if 'documents' bucket has any issue
    const { data: fileData, error: fileError } = await supabase.storage.from('files').upload(path, file, {
      upsert: true,
      contentType: file.type || 'application/pdf'
    });

    if (!fileError && fileData) {
      return { storagePath: path, isRemote: true };
    }
  } catch (err) {
    console.warn('Supabase remote storage upload error, using local persistent cache:', err);
  }

  return { storagePath: path, isRemote: false };
}

/**
 * Retrieves a document blob for viewing, either from Supabase Storage or local cache
 */
export async function retrieveDocumentBlob(storagePath: string): Promise<Blob | null> {
  // First check local IndexedDB
  const localBlob = await getBlobLocally(storagePath);
  if (localBlob) {
    return localBlob;
  }

  // 1. Try download from 'documents' Supabase bucket
  try {
    const { data, error } = await supabase.storage.from('documents').download(storagePath);
    if (!error && data && data.size > 0) {
      await storeBlobLocally(storagePath, data);
      return data;
    }
  } catch (err) {
    console.warn('Failed to download from documents bucket, trying files bucket:', err);
  }

  // 2. Try download from 'files' Supabase bucket fallback
  try {
    const { data, error } = await supabase.storage.from('files').download(storagePath);
    if (!error && data && data.size > 0) {
      await storeBlobLocally(storagePath, data);
      return data;
    }
  } catch (err) {
    console.warn('Failed to download from files bucket:', err);
  }

  // 3. Try fetching via Public URL as an external fetch fallback
  try {
    const { data: pubData } = supabase.storage.from('documents').getPublicUrl(storagePath);
    if (pubData?.publicUrl) {
      const res = await fetch(pubData.publicUrl);
      if (res.ok) {
        const fetchedBlob = await res.blob();
        if (fetchedBlob && fetchedBlob.size > 0) {
          await storeBlobLocally(storagePath, fetchedBlob);
          return fetchedBlob;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch via public url:', err);
  }

  return null;
}

/**
 * Secure password hashing using Web Crypto API SHA-256 with fixed salt
 */
export async function hashDocumentPassword(password: string, salt: string = 'uvl_doc_salt_'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify document password against stored hash
 */
export async function verifyDocumentPassword(password: string, expectedHash: string): Promise<boolean> {
  const computed = await hashDocumentPassword(password);
  return computed === expectedHash;
}

/**
 * Generates an unguessable cryptographically secure token for share links
 */
export function generateSecureShareToken(prefix: string = 'd_'): string {
  const array = new Uint8Array(18);
  window.crypto.getRandomValues(array);
  const randomStr = Array.from(array, byte => byte.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, 24);
  return `${prefix}${randomStr}`;
}
