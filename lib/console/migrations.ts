import type { Draft, Branch, Company, Warehouse } from './model.ts';
/** Preserve browser drafts from v2, including images, ids and revision. */
export function upgradeDraft(value: unknown): Draft | null {
    if (value == null)
        return null;
    if (typeof value !== 'object')
        throw new Error('El borrador guardado no tiene un formato válido.');
    const raw = value as Record<string, unknown>;
    if (![2, 3].includes(Number(raw.version)))
        throw new Error('Este borrador pertenece a otra versión. No se modificó.');
    for (const name of ['companies', 'products', 'warehouses', 'placements', 'changes'])
        if (!Array.isArray(raw[name]))
            throw new Error('El borrador está incompleto. No se reemplazó.');
    if (!Number.isInteger(raw.revision) || Number(raw.revision) < 0)
        throw new Error('La revisión del borrador no es válida.');
    if (raw.version === 3) {
        if (!Array.isArray(raw.branches))
            throw new Error('Falta la información de sucursales.');
        return raw as unknown as Draft;
    }
    const companies = raw.companies as Company[];
    const branches: Branch[] = companies.map(c => ({ id: `branch-${c.id}-principal`, companyId: c.id, name: 'Principal', code: 'PRIN', address: c.address }));
    return { ...raw, version: 3, branches, warehouses: (raw.warehouses as Warehouse[]).map(w => ({ ...w, branchId: `branch-${w.companyId}-principal` })) } as Draft;
}
