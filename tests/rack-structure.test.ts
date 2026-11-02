import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../lib/console/seed.ts';
import { applyRackStructure, freeSlot, moveToLevel, removeEmptyLevel, reorderPlacement } from '../lib/console/rack-structure.ts';
import type { Placement } from '../lib/console/model.ts';
function fixture() {
    const data = createSeed(), warehouse = data.warehouses[0], rack = warehouse.racks[0];
    const rows = data.placements.filter(p => p.rackId === rack.id);
    return { data, warehouse, rack, rows, structure: { levels: rack.levels, slots: rack.slots, placements: rows } };
}
test('guardar estructura reemplaza un único andamio sin mutar catálogo, historial ni otros almacenes', () => {
    const { data, warehouse, rack, rows, structure } = fixture();
    const before = structuredClone(data);
    const next = applyRackStructure(data, warehouse.id, rack.id, { ...structure, levels: 5, placements: rows.slice(1) });
    assert.deepEqual(data, before);
    assert.equal(next.warehouses[0].racks[0].levels, 5);
    assert.deepEqual(next.products, data.products);
    assert.deepEqual(next.placements.filter(p => p.rackId !== rack.id), data.placements.filter(p => p.rackId !== rack.id));
    assert.deepEqual(next.warehouses.slice(1), data.warehouses.slice(1));
    assert.deepEqual(next.warehouses[0].racks.slice(1), warehouse.racks.slice(1));
    assert.equal(next.changes, data.changes);
});
test('asignación por lote rechaza productos ajenos, filas sin elegir y nuevos archivados', () => {
    const { data, warehouse, rack, rows, structure } = fixture();
    const row = { ...rows[0], id: 'new-row', level: 1, slot: 2 };
    for (const productId of ['', 'p7']) assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [{ ...row, productId }] }), /activo de esta empresa/);
    data.products.find(p => p.id === row.productId)!.archived = true;
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [row] }), /activo de esta empresa/);
    // Archiving a product must not block later edits of its existing location.
    assert.doesNotThrow(() => applyRackStructure(data, warehouse.id, rack.id, structure));
});
test('colisiones, IDs repetidos y cambios de ámbito se rechazan antes del guardado', () => {
    const { data, warehouse, rack, rows, structure } = fixture(), row = rows[0];
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [row, { ...row, id: 'new' }] }), /mismo espacio/);
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [row, row] }), /identificadores/);
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [{ ...row, warehouseId: 'other' }] }), /este andamio/);
    const other = data.placements.find(p => p.rackId !== rack.id)!;
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [{ ...row, id: other.id }] }), /identificadores/);
    assert.throws(() => applyRackStructure(data, warehouse.id, 'missing', structure), /ya no existe/);
});
test('límites y reducción ocupada fallan; reubicación y reducción se pueden guardar juntas', () => {
    const { data, warehouse, rack, rows, structure } = fixture();
    const top = { ...rows[0], level: rack.levels, slot: rack.slots };
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, levels: 1, placements: [top] }), /fuera/);
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, levels: 13 }), /1 a 12/);
    assert.doesNotThrow(() => applyRackStructure(data, warehouse.id, rack.id, { levels: 1, slots: 1, placements: [{ ...top, level: 1, slot: 1 }] }));
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [{ ...top, slot: 1.5 }] }), /fuera/);
});
test('mover a otro nivel elige el primer hueco y rechaza el destino completo', () => {
    const rows: Placement[] = [
        { id: 'a', productId: 'p1', warehouseId: 'w', rackId: 'r', level: 1, slot: 1 },
        { id: 'b', productId: 'p2', warehouseId: 'w', rackId: 'r', level: 2, slot: 2 }
    ];
    assert.equal(freeSlot(rows, 2, 2), 1);
    const moved = moveToLevel(rows, 'a', 2, 2);
    assert.deepEqual(moved.find(p => p.id === 'a'), { ...rows[0], level: 2, slot: 1 });
    assert.equal(rows[0].level, 1);
    assert.throws(() => moveToLevel([...rows, { ...rows[1], id: 'c', slot: 1 }], 'a', 2, 2), /completo/);
});
test('reordenar intercambia espacios preservando IDs y productos, sin pasar los extremos', () => {
    const { rows } = fixture();
    const first = { ...rows[0], id: 'first', level: 1, slot: 1 }, second = { ...rows[0], id: 'second', level: 1, slot: 3 };
    const ordered = reorderPlacement([first, second], first.id, 1);
    assert.equal(ordered[0].slot, 3); assert.equal(ordered[1].slot, 1);
    assert.equal(ordered[0].productId, first.productId);
    assert.deepEqual(reorderPlacement([first, second], first.id, -1), [first, second]);
});
test('eliminar nivel solo admite niveles vacíos y renumera las ubicaciones superiores', () => {
    const { rows } = fixture();
    const row = { ...rows[0], level: 3 };
    assert.throws(() => removeEmptyLevel([row], 3), /Mueve o quita/);
    assert.equal(removeEmptyLevel([row], 2)[0].level, 2);
    assert.equal(row.level, 3);
});
