import type { MediaMode } from '@/types/vikas';

const KEY = 'vikas:studio-draft:v1';
const DATABASE = 'vikas-studio-drafts';
export const DRAFT_TTL_MS = 30 * 60 * 1000;
export interface StudioDraft {
  scope: string;
  ownerId: string | null;
  mode: MediaMode;
  templateId: string;
  prompt: string;
  aspectRatio: '1:1' | '3:4' | '9:16' | '16:9';
}
type StoredDraft = StudioDraft & { expiresAt: number; photoKey?: string };

export function parseStudioDraft(
  raw: string | null,
  now = Date.now()
): StoredDraft | null {
  try {
    const value = JSON.parse(raw || 'null');
    if (
      !value ||
      !Number.isFinite(value.expiresAt) ||
      value.expiresAt <= now ||
      value.expiresAt > now + DRAFT_TTL_MS ||
      typeof value.scope !== 'string' ||
      !value.scope.startsWith('/') ||
      (value.ownerId !== null && typeof value.ownerId !== 'string') ||
      !['image', 'video'].includes(value.mode) ||
      typeof value.templateId !== 'string' ||
      typeof value.prompt !== 'string' ||
      value.prompt.length > 2000 ||
      !['1:1', '3:4', '9:16', '16:9'].includes(value.aspectRatio) ||
      (value.photoKey !== undefined && !/^[a-f0-9-]{36}$/.test(value.photoKey))
    )
      return null;
    return value;
  } catch {
    return null;
  }
}

async function photoStore<T>(
  work: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open(DATABASE, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('photos');
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('Draft storage unavailable'));
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      const store = tx.objectStore('photos');
      // Orphans from closed tabs are purged when draft storage is next used.
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        const row = cursor.result;
        if (!row) return;
        if (row.value.expiresAt <= Date.now()) row.delete();
        row.continue();
      };
      const request = work(store);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () =>
        reject(tx.error || new Error('Draft storage unavailable'));
    });
  } finally {
    db.close();
  }
}

let previousPhoto: File | null = null;
let photoKey: string | undefined;
let photoExpiresAt = 0;
let pendingPhoto: Promise<unknown> = Promise.resolve();

export function saveStudioDraft(
  draft: StudioDraft,
  photo: File | null
): Promise<void> {
  const now = Date.now();
  if (photo !== previousPhoto || (photo && photoExpiresAt <= now)) {
    const oldKey = photoKey;
    previousPhoto = photo;
    photoKey = photo ? crypto.randomUUID() : undefined;
    photoExpiresAt = now + DRAFT_TTL_MS;
    const nextKey = photoKey;
    const expiresAt = photoExpiresAt;
    pendingPhoto = pendingPhoto
      .catch(() => {})
      .then(async () => {
        if (photo && nextKey)
          await photoStore((s) => s.put({ file: photo, expiresAt }, nextKey));
        if (oldKey) await photoStore((s) => s.delete(oldKey));
      });
  }
  const expiresAt = photo ? photoExpiresAt : now + DRAFT_TTL_MS;
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ ...draft, expiresAt, photoKey })
    );
  } catch {
    return Promise.reject(new Error('Draft storage unavailable'));
  }
  return pendingPhoto.then(() => undefined);
}

export async function restoreStudioDraft(
  scope: string,
  ownerId: string | null
) {
  const raw = sessionStorage.getItem(KEY);
  const draft = parseStudioDraft(raw);
  if (!draft || (draft.ownerId !== null && draft.ownerId !== ownerId)) {
    await clearStudioDraft();
    return null;
  }
  if (draft.scope !== scope) return null;
  let photo: File | null = null;
  if (draft.photoKey) {
    // Storage restrictions may block photos while sessionStorage still works.
    // Restore the text and explain the missing photo instead of losing both.
    const stored = await photoStore<any>((s) => s.get(draft.photoKey!)).catch(
      () => null
    );
    if (stored?.expiresAt > Date.now() && stored.file instanceof Blob) {
      photo = new File([stored.file], stored.file.name || 'reference.png', {
        type: stored.file.type,
      });
      photoExpiresAt = stored.expiresAt;
    }
  }
  previousPhoto = photo;
  photoKey = photo ? draft.photoKey : undefined;
  return { ...draft, photo, photoMissing: Boolean(draft.photoKey && !photo) };
}

export async function clearStudioDraft() {
  let storedKey: string | undefined;
  try {
    storedKey = JSON.parse(sessionStorage.getItem(KEY) || '{}').photoKey;
    sessionStorage.removeItem(KEY);
  } catch {}
  previousPhoto = null;
  photoKey = undefined;
  await pendingPhoto.catch(() => {});
  if (storedKey) await photoStore((s) => s.delete(storedKey)).catch(() => {});
}
