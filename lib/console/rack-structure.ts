import { validateRack, type Draft, type Placement } from './model.ts';

export type RackStructure = { levels: number; slots: number; placements: Placement[] };

/** Replace one rack's structure atomically, preserving all other records. */
export function applyRackStructure(data: Draft, warehouseId: string, rackId: string, structure: RackStructure): Draft {
    const warehouse = data.warehouses.find(w => w.id === warehouseId);
    const rack = warehouse?.racks.find(r => r.id === rackId);
    if (!warehouse || !rack) throw new Error('El andamio ya no existe. Cierra el editor y vuelve a abrirlo.');
    const updated = { ...rack, levels: structure.levels, slots: structure.slots };
    const others = data.placements.filter(p => p.rackId !== rackId);
    const ids = new Set(others.map(p => p.id)), cells = new Set<string>();
    for (const p of structure.placements) {
        if (!p.id || ids.has(p.id)) throw new Error('Hay ubicaciones con identificadores repetidos.');
        ids.add(p.id);
        if (p.warehouseId !== warehouseId || p.rackId !== rackId) throw new Error('Todas las ubicaciones deben pertenecer a este andamio.');
        const product = data.products.find(x => x.id === p.productId && x.companyId === warehouse.companyId);
        const previous = data.placements.find(x => x.id === p.id && x.rackId === rackId && x.productId === p.productId);
        if (!product || (product.archived && !previous)) throw new Error('Selecciona un producto activo de esta empresa para cada fila.');
        if (!Number.isInteger(p.level) || !Number.isInteger(p.slot) || p.level < 1 || p.level > updated.levels || p.slot < 1 || p.slot > updated.slots)
            throw new Error('Una ubicación está fuera de los niveles o espacios disponibles.');
        const cell = `${p.level}:${p.slot}`;
        if (cells.has(cell)) throw new Error('Dos productos no pueden ocupar el mismo espacio.');
        cells.add(cell);
    }
    validateRack(updated, warehouse, structure.placements);
    return { ...data, warehouses: data.warehouses.map(w => w.id === warehouseId ? { ...w, racks: w.racks.map(r => r.id === rackId ? updated : r) } : w), placements: [...others, ...structure.placements] };
}

export function freeSlot(placements: Placement[], level: number, slots: number): number | undefined {
    return Array.from({ length: slots }, (_, i) => i + 1).find(slot => !placements.some(p => p.level === level && p.slot === slot));
}
export function moveToLevel(placements: Placement[], id: string, level: number, slots: number): Placement[] {
    const current = placements.find(p => p.id === id);
    if (!current || current.level === level) return placements;
    const slot = freeSlot(placements, level, slots);
    if (slot === undefined) throw new Error(`El nivel ${level} está completo. Amplía los espacios por nivel o libera una ubicación.`);
    return placements.map(p => p.id === id ? { ...p, level, slot } : p);
}
export function reorderPlacement(placements: Placement[], id: string, direction: -1 | 1): Placement[] {
    const current = placements.find(p => p.id === id);
    if (!current) return placements;
    const rows = placements.filter(p => p.level === current.level).sort((a, b) => a.slot - b.slot);
    const other = rows[rows.findIndex(p => p.id === id) + direction];
    if (!other) return placements;
    return placements.map(p => p.id === id ? { ...p, slot: other.slot } : p.id === other.id ? { ...p, slot: current.slot } : p);
}
export function removeEmptyLevel(placements: Placement[], level: number): Placement[] {
    if (placements.some(p => p.level === level)) throw new Error('Mueve o quita los productos de este nivel antes de eliminarlo.');
    return placements.map(p => p.level > level ? { ...p, level: p.level - 1 } : p);
}
