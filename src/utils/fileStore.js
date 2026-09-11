// Attachment storage.
//
// The records themselves live in localStorage (see storage.js), but files
// cannot: localStorage holds strings only, so a PDF would have to be base64'd
// — a ~33% size penalty against a quota that is typically 5 MB for the whole
// origin. Two or three CVs would fill it, and the failure mode is an
// exception mid-save with the records half-written.
//
// IndexedDB stores Blobs natively, with no encoding penalty and a quota
// measured in hundreds of MB, so the binaries go here and the record keeps
// only a small metadata stub pointing at them. Still no server, still
// nothing leaving the machine.

const DB_NAME = 'vc-application-tracker';
const DB_VERSION = 1;
const STORE = 'attachments';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf',
  'text/plain',
];

// Some browsers hand over an empty `type` for .doc/.odt, so the extension is
// the fallback check rather than the primary one.
const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt'];

export const ACCEPT_ATTR = [...ACCEPTED_TYPES, ...ACCEPTED_EXTENSIONS].join(',');

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    // Fires when another tab holds an older version open.
    request.onblocked = () => reject(new Error('Close other tabs of this app and try again.'));
  });

  // A failed open should not poison every later call.
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

function run(mode, work) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let result;
        // Resolve on transaction completion, not request success — that is
        // the point at which a write is actually durable.
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('Storage transaction aborted.'));
        work(store, (value) => {
          result = value;
        });
      })
  );
}

export function describeFile(file) {
  const name = file.name ?? '';
  const dot = name.lastIndexOf('.');
  const extension = dot === -1 ? '' : name.slice(dot).toLowerCase();

  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: `That file is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_FILE_BYTES)}.` };
  }
  if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(extension)) {
    return { ok: false, reason: 'Attach a PDF, Word, ODT, RTF or plain-text document.' };
  }
  return { ok: true };
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function makeFileId() {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Writes the blob and returns the metadata stub to store on the record.
export async function putFile(file) {
  const meta = {
    id: makeFileId(),
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    addedAt: new Date().toISOString(),
  };

  await run('readwrite', (store) => {
    store.put({ ...meta, blob: file });
  });

  return meta;
}

// Used by the restore path, which already has a decoded blob and an id it
// must preserve so the records keep pointing at the right file.
export async function putRawFile(record) {
  await run('readwrite', (store) => {
    store.put(record);
  });
}

export async function getFile(id) {
  if (!id) return null;
  return run('readonly', (store, setResult) => {
    const request = store.get(id);
    request.onsuccess = () => setResult(request.result ?? null);
  });
}

export async function deleteFile(id) {
  if (!id) return;
  await run('readwrite', (store) => {
    store.delete(id);
  });
}

export async function deleteFiles(ids) {
  const wanted = ids.filter(Boolean);
  if (wanted.length === 0) return;
  await run('readwrite', (store) => {
    wanted.forEach((id) => store.delete(id));
  });
}

export async function getAllFiles() {
  return run('readonly', (store, setResult) => {
    const request = store.getAll();
    request.onsuccess = () => setResult(request.result ?? []);
  });
}

export async function clearFiles() {
  await run('readwrite', (store) => {
    store.clear();
  });
}

// Drops blobs no record points at any more — runs after a restore, and after
// a delete that could not reach the store at the time.
export async function pruneOrphans(keepIds) {
  const keep = new Set(keepIds.filter(Boolean));
  const all = await getAllFiles();
  const dead = all.map((entry) => entry.id).filter((id) => !keep.has(id));
  await deleteFiles(dead);
  return dead.length;
}

// Opens a stored file in a new tab. Word documents will download rather than
// render, which is the browser's decision and the expected behaviour.
export async function openFile(meta) {
  const record = await getFile(meta?.id);
  if (!record?.blob) throw new Error('That file is missing from this browser.');

  const url = URL.createObjectURL(record.blob);
  const tab = window.open(url, '_blank', 'noopener');
  if (!tab) {
    // Popup blocked — fall back to a download so the click still does
    // something.
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = record.name || 'attachment';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
  // The new tab needs the URL to survive its own load, so this cannot be
  // revoked synchronously.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
