import { validateRack, type Draft, type Placement } from './model.ts';
export type RackStructure = { levels: number; placements: Placement[] };
/** Replace one rack's level lists atomically, preserving other records. */
export function applyRackStructure(data: Draft, warehouseId: string, rackId: string, structure: RackStructure): Draft {
    const warehouse = data.warehouses.find(w => w.id === warehouseId), rack = warehouse?.racks.find(r => r.id === rackId);
    if (!warehouse || !rack) throw new Error('El andamio ya no existe. Cierra el editor y vuelve a abrirlo.');
    const updated = { ...rack, levels: structure.levels }, others = data.placements.filter(p => p.rackId !== rackId);
    const ids = new Set(others.map(p => p.id)), positions = new Set<string>();
    for (const p of structure.placements) {
        if (!p.id || ids.has(p.id)) throw new Error('Hay ubicaciones con identificadores repetidos.');
        ids.add(p.id);
        if (p.warehouseId !== warehouseId || p.rackId !== rackId) throw new Error('Todas las ubicaciones deben pertenecer a este andamio.');
        const product = data.products.find(x => x.id === p.productId && x.companyId === warehouse.companyId);
        const previous = data.placements.find(x => x.id === p.id && x.rackId === rackId && x.productId === p.productId);
        if (!product || (product.archived && !previous)) throw new Error('Selecciona un producto activo de esta empresa.');
        if (!Number.isInteger(p.level) || p.level < 1 || p.level > updated.levels || !Number.isSafeInteger(p.position) || p.position < 1)
            throw new Error('El nivel o el orden de un producto no es válido.');
        const position = `${p.level}:${p.position}`;
        if (positions.has(position)) throw new Error('Dos productos no pueden compartir el mismo orden dentro del nivel.');
        positions.add(position);
    }
    validateRack(updated, warehouse, structure.placements);
    return { ...data, warehouses: data.warehouses.map(w => w.id === warehouseId ? { ...w, racks: w.racks.map(r => r.id === rackId ? updated : r) } : w), placements: [...others, ...structure.placements] };
}
/** Internal list order, independent of physical size or product quantity. */
export function nextPosition(placements: Placement[], level: number): number {
    return placements.reduce((max, p) => p.level === level ? Math.max(max, p.position) : max, 0) + 1;
}
export function moveToLevel(placements: Placement[], id: string, level: number): Placement[] {
    const current = placements.find(p => p.id === id);
    if (!current || current.level === level) return placements;
    return placements.map(p => p.id === id ? { ...p, level, position: nextPosition(placements, level) } : p);
}
export function reorderPlacement(placements: Placement[], id: string, direction: -1 | 1): Placement[] {
    const current = placements.find(p => p.id === id);
    if (!current) return placements;
    const rows = placements.filter(p => p.level === current.level).sort((a, b) => a.position - b.position);
    const other = rows[rows.findIndex(p => p.id === id) + direction];
    if (!other) return placements;
    return placements.map(p => p.id === id ? { ...p, position: other.position } : p.id === other.id ? { ...p, position: current.position } : p);
}
export function removeEmptyLevel(placements: Placement[], level: number): Placement[] {
    if (placements.some(p => p.level === level)) throw new Error('Mueve o quita los productos de este nivel antes de eliminarlo.');
    return placements.map(p => p.level > level ? { ...p, level: p.level - 1 } : p);
}
