import type { Draft } from './model';
const NAME = 'inventario-inteligente-draft-v2';
function openDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const request = indexedDB.open(NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore('drafts'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(new Error('No se pudo abrir el almacenamiento del navegador.')); }); }
export async function readDraft(): Promise<Draft | null> { const db = await openDB(); try {
    return await new Promise((resolve, reject) => { const req = db.transaction('drafts').objectStore('drafts').get('workspace'); req.onsuccess = () => resolve(req.result?.version === 2 ? req.result : null); req.onerror = () => reject(req.error); });
}
finally {
    db.close();
} }
export async function writeDraft(next: Draft, expectedRevision: number) { const db = await openDB(); try {
    await new Promise<void>((resolve, reject) => { const tx = db.transaction('drafts', 'readwrite'), store = tx.objectStore('drafts'), req = store.get('workspace'); let conflict = false; req.onsuccess = () => { if (req.result && req.result.revision !== expectedRevision) {
        conflict = true;
        tx.abort();
        return;
    } store.put(next, 'workspace'); }; tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('No se pudo guardar el borrador. Revisa el espacio disponible.')); tx.onabort = () => reject(new Error(conflict ? 'Este borrador cambió en otra pestaña. Recarga la página antes de editar.' : 'El navegador no pudo guardar los cambios.')); });
}
finally {
    db.close();
} }
