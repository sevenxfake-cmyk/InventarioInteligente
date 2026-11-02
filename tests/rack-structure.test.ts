import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../lib/console/seed.ts';
import { applyRackStructure, nextPosition, moveToLevel, removeEmptyLevel, reorderPlacement } from '../lib/console/rack-structure.ts';
import type { Placement } from '../lib/console/model.ts';
function fixture() {
    const data = createSeed(), warehouse = data.warehouses[0], rack = warehouse.racks[0];
    const rows = data.placements.filter(p => p.rackId === rack.id);
    return { data, warehouse, rack, rows, structure: { levels: rack.levels, placements: rows } };
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
    const row = { ...rows[0], id: 'new-row', level: 1, position: 2 };
    for (const productId of ['', 'p7']) assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [{ ...row, productId }] }), /activo de esta empresa/);
    data.products.find(p => p.id === row.productId)!.archived = true;
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [row] }), /activo de esta empresa/);
    // Archiving a product must not block later edits of its existing location.
    assert.doesNotThrow(() => applyRackStructure(data, warehouse.id, rack.id, structure));
});
test('colisiones, IDs repetidos y cambios de ámbito se rechazan antes del guardado', () => {
    const { data, warehouse, rack, rows, structure } = fixture(), row = rows[0];
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [row, { ...row, id: 'new' }] }), /mismo orden/);
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [row, row] }), /identificadores/);
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [{ ...row, warehouseId: 'other' }] }), /este andamio/);
    const other = data.placements.find(p => p.rackId !== rack.id)!;
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [{ ...row, id: other.id }] }), /identificadores/);
    assert.throws(() => applyRackStructure(data, warehouse.id, 'missing', structure), /ya no existe/);
});
test('límites y reducción ocupada fallan; reubicación y reducción se pueden guardar juntas', () => {
    const { data, warehouse, rack, rows, structure } = fixture();
    const top = { ...rows[0], level: rack.levels, position: 1 };
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, levels: 1, placements: [top] }), /válido/);
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, levels: 13 }), /1 a 12/);
    assert.doesNotThrow(() => applyRackStructure(data, warehouse.id, rack.id, { levels: 1, placements: [{ ...top, level: 1, position: 1 }] }));
    assert.throws(() => applyRackStructure(data, warehouse.id, rack.id, { ...structure, placements: [{ ...top, position: 1.5 }] }), /válido/);
});
test('mover a un nivel con muchos productos agrega al final sin exigir espacio libre', () => {
    const rows: Placement[] = [{ id: 'source', productId: 'p1', warehouseId: 'w', rackId: 'r', level: 1, position: 1 }, ...Array.from({length: 30}, (_, i) => ({ id: `p-${i}`, productId: `product-${i}`, warehouseId: 'w', rackId: 'r', level: 2, position: i + 1 }))];
    assert.equal(nextPosition(rows, 2), 31);
    const moved = moveToLevel(rows, 'source', 2);
    assert.deepEqual(moved[0], { ...rows[0], level: 2, position: 31 });
    assert.equal(rows[0].level, 1);
    assert.equal(moved.filter(p=>p.level===2).length, 31);
});
test('reordenar cambia el orden de la lista preservando IDs y productos, sin pasar los extremos', () => {
    const { rows } = fixture();
    const first = { ...rows[0], id: 'first', level: 1, position: 1 }, second = { ...rows[0], id: 'second', level: 1, position: 3 };
    const ordered = reorderPlacement([first, second], first.id, 1);
    assert.equal(ordered[0].position, 3); assert.equal(ordered[1].position, 1);
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

test('un nivel admite 60 productos distintos y conserva todas sus imágenes e identificadores', () => {
    const { data, warehouse, rack } = fixture();
    const products = Array.from({length:60}, (_,i)=>({...data.products[0],id:`bulk-${i}`,sku:`MANY-${i}`,image:`image-${i}`}));
    const draft = {...data, products:[...data.products,...products]};
    const placements = products.map((p,i)=>({id:`location-${i}`,productId:p.id,warehouseId:warehouse.id,rackId:rack.id,level:1,position:i+1}));
    const saved=applyRackStructure(draft,warehouse.id,rack.id,{levels:rack.levels,placements});
    assert.equal(saved.placements.filter(p=>p.rackId===rack.id&&p.level===1).length,60);
    assert.deepEqual(saved.products,draft.products);
    assert.deepEqual(JSON.parse(JSON.stringify(saved)).placements.filter((p:Placement)=>p.rackId===rack.id),placements);
});
