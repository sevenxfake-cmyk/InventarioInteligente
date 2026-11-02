import type { Draft, Branch, Company, Warehouse } from './model.ts';
/** Keep old browser drafts and their revision; physical slots become list order. */
export function upgradeDraft(value: unknown): Draft | null {
    if (value == null) return null;
    if (typeof value !== 'object') throw new Error('El borrador guardado no tiene un formato válido.');
    const raw = value as Record<string, unknown>;
    if (![2, 3, 4].includes(Number(raw.version))) throw new Error('Este borrador pertenece a otra versión. No se modificó.');
    for (const name of ['companies', 'products', 'warehouses', 'placements', 'changes'])
        if (!Array.isArray(raw[name])) throw new Error('El borrador está incompleto. No se reemplazó.');
    if (!Number.isInteger(raw.revision) || Number(raw.revision) < 0) throw new Error('La revisión del borrador no es válida.');
    if (raw.version === 4) {
        if (!Array.isArray(raw.branches)) throw new Error('Falta la información de sucursales.');
        return raw as unknown as Draft;
    }
    const companies = raw.companies as Company[];
    const branches: Branch[] = raw.version === 2 ? companies.map(c => ({ id: `branch-${c.id}-principal`, companyId: c.id, name: 'Principal', code: 'PRIN', address: c.address })) : raw.branches as Branch[];
    if (!Array.isArray(branches)) throw new Error('Falta la información de sucursales.');
    type OldWarehouse = Omit<Warehouse, 'racks'> & { racks: Array<Warehouse['racks'][number] & { slots?: number }> };
    const warehouses = (raw.warehouses as OldWarehouse[]).map(w => ({ ...w, branchId: raw.version === 2 ? `branch-${w.companyId}-principal` : w.branchId, racks: w.racks.map(({ slots: _oldCapacity, ...rack }) => rack) }));
    const placements = (raw.placements as Record<string, unknown>[]).map(({ slot, ...p }) => {
        const position = p.position ?? slot;
        if (!Number.isSafeInteger(position) || Number(position) < 1) throw new Error('El orden de una ubicación no es válido. El borrador no se reemplazó.');
        return { ...p, position };
    });
    return { ...raw, version: 4, branches, warehouses, placements } as unknown as Draft;
}
