import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../lib/console/seed.ts';
import { upgradeDraft } from '../lib/console/migrations.ts';
import { validateWarehouseBranch } from '../lib/console/model.ts';
function legacy() {
    const seed = createSeed();
    return { ...seed, version: 3, revision: 9, companies: seed.companies.map(c => ({ ...c, logo: 'data:image/webp;base64,example' })), products: seed.products.map(p => ({ ...p, image: `image-${p.id}` })), warehouses: seed.warehouses.map(w => ({ ...w, racks: w.racks.map(r => ({ ...r, slots: 3 })) })), placements: seed.placements.map(({ position, ...p }) => ({ ...p, slot: position })) };
}
test('v3 pasa a listas por nivel preservando datos, imágenes, IDs, revisión y sucursales', () => {
    const old = legacy(), before = structuredClone(old), next = upgradeDraft(old)!;
    assert.equal(next.version, 4); assert.equal(next.revision, 9);
    assert.deepEqual(next.companies, old.companies); assert.deepEqual(next.products, old.products);
    assert.deepEqual(next.branches, old.branches); assert.deepEqual(next.changes, old.changes);
    assert.deepEqual(next.placements, old.placements.map(({ slot, ...p }) => ({ ...p, position: slot })));
    assert.equal('slots' in next.warehouses[0].racks[0], false);
    assert.equal('slot' in next.placements[0], false);
    assert.deepEqual(next.warehouses.map(w => [w.id, w.branchId, w.racks.map(r => r.id)]), old.warehouses.map(w => [w.id, w.branchId, w.racks.map(r => r.id)]));
    assert.deepEqual(old, before);
});
test('v2 recibe sucursales y listas sin perder sus ubicaciones o revisión', () => {
    const { branches: _branches, ...old } = legacy();
    const v2 = { ...old, version: 2, warehouses: old.warehouses.map(({ branchId: _branch, ...w }) => w) }, previous = structuredClone(v2);
    const next = upgradeDraft(v2)!;
    assert.equal(next.version, 4); assert.equal(next.revision, 9);
    assert.equal(next.placements.length, old.placements.length);
    assert.deepEqual(next.products, old.products); assert.deepEqual(next.companies, old.companies);
    for (const w of next.warehouses) assert.doesNotThrow(() => validateWarehouseBranch(w, next));
    assert.deepEqual(v2, previous);
});
test('el orden anterior se conserva aunque haya huecos, sin tratarlos como casillas', () => {
    const old = legacy(); old.placements[0].slot = 7;
    const next = upgradeDraft(old)!;
    assert.equal(next.placements[0].position, 7);
    assert.equal(next.placements[0].productId, old.placements[0].productId);
});
test('v4 es idempotente y rechaza borradores desconocidos o incompletos', () => {
    const d = createSeed(); assert.equal(upgradeDraft(d), d); assert.equal(upgradeDraft(null), null);
    assert.throws(() => upgradeDraft({ ...d, version: 99 }), /otra versión/);
    assert.throws(() => upgradeDraft({ version: 3, revision: 0 }), /incompleto/);
    assert.throws(() => upgradeDraft({ ...legacy(), branches: undefined }), /sucursales/);
});
test('ubicaciones antiguas inválidas se rechazan sin borrar ni sustituir el borrador', () => {
    const old = legacy(); old.placements[0].slot = -1; const previous = structuredClone(old);
    assert.throws(() => upgradeDraft(old), /no es válido/); assert.deepEqual(old, previous);
});
