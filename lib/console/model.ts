export type Company = {
    id: string;
    name: string;
    legalName: string;
    ruc: string;
    industry: string;
    address: string;
    email: string;
    phone: string;
    color: string;
    logo: string;
    cover: string;
    notes: string;
};
export type Product = {
    id: string;
    companyId: string;
    sku: string;
    barcode: string;
    name: string;
    category: string;
    brand: string;
    unit: string;
    presentation: string;
    description: string;
    image: string;
    archived: boolean;
};
export type Rack = {
    id: string;
    name: string;
    code: string;
    row: number;
    column: number;
    levels: number;
    color: string;
};
export type Branch = {
    id: string;
    companyId: string;
    name: string;
    code: string;
    address: string;
};
export type Warehouse = {
    branchId: string;
    id: string;
    companyId: string;
    name: string;
    code: string;
    address: string;
    manager: string;
    rows: number;
    columns: number;
    racks: Rack[];
};
export type Placement = {
    id: string;
    productId: string;
    warehouseId: string;
    rackId: string;
    level: number;
    position: number;
};
export type Change = {
    id: string;
    at: string;
    description: string;
    companyId: string;
};
export type Draft = {
    version: 4;
    branches: Branch[];
    revision: number;
    companies: Company[];
    products: Product[];
    warehouses: Warehouse[];
    placements: Placement[];
    changes: Change[];
};
export function uid() {
    if (typeof crypto.randomUUID === 'function')
        return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const h = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export function levelCount(w: Warehouse) { return w.racks.reduce((n, r) => n + r.levels, 0); }
export function validateProduct(p: Product, products: Product[]) {
    if (!p.name.trim() || !p.sku.trim())
        throw new Error('Completa el nombre y el código interno.');
    if (products.some(x => x.companyId === p.companyId && x.id !== p.id && x.sku.trim().toLowerCase() === p.sku.trim().toLowerCase()))
        throw new Error('Ese código ya existe en esta empresa, incluso entre archivados.');
}
export function validateWarehouse(w: Warehouse, warehouses: Warehouse[]) {
    if (!w.name.trim() || !w.code.trim())
        throw new Error('Completa el nombre y código del almacén.');
    if (!Number.isInteger(w.rows) || !Number.isInteger(w.columns) || w.rows < 2 || w.rows > 8 || w.columns < 2 || w.columns > 8)
        throw new Error('El plano debe tener entre 2 y 8 filas y columnas.');
    if (warehouses.some(x => x.id !== w.id && x.companyId === w.companyId && x.code.trim().toLowerCase() === w.code.trim().toLowerCase()))
        throw new Error('Ya existe un almacén con ese código.');
    if (w.racks.some(r => r.row >= w.rows || r.column >= w.columns))
        throw new Error('Hay andamios fuera del nuevo tamaño. Muévelos antes de reducir el plano.');
}
export function validateRack(r: Rack, w: Warehouse, placements: Placement[]) {
    if (!r.name.trim() || !r.code.trim())
        throw new Error('Indica un nombre y código para el andamio.');
    if (!Number.isInteger(r.levels) || r.levels < 1 || r.levels > 12)
        throw new Error('Usa de 1 a 12 niveles.');
    if (!Number.isInteger(r.row) || !Number.isInteger(r.column) || r.row < 0 || r.column < 0 || r.row >= w.rows || r.column >= w.columns)
        throw new Error('La posición está fuera del plano.');
    if (w.racks.some(x => x.id !== r.id && (x.code.toLowerCase() === r.code.toLowerCase() || (x.row === r.row && x.column === r.column))))
        throw new Error('El código o la posición ya están ocupados por otro andamio.');
    if (placements.some(p => p.rackId === r.id && p.level > r.levels))
        throw new Error('Hay productos en los niveles que intentas quitar. Reubícalos primero.');
}
export function validatePlacement(p: Placement, d: Draft) {
    const product = d.products.find(x => x.id === p.productId && !x.archived), w = d.warehouses.find(x => x.id === p.warehouseId), rack = w?.racks.find(x => x.id === p.rackId);
    if (!product || !w || !rack || product.companyId !== w.companyId)
        throw new Error('Selecciona un producto activo de esta empresa y un andamio válido.');
    if (!Number.isInteger(p.level) || !Number.isSafeInteger(p.position) || p.level < 1 || p.level > rack.levels || p.position < 1)
        throw new Error('El nivel o el orden del producto no es válido.');
    if (d.placements.some(x => x.id !== p.id && x.rackId === p.rackId && x.level === p.level && x.position === p.position))
        throw new Error('Dos productos no pueden compartir el mismo orden dentro del nivel.');
}
export function revise(d: Draft, description: string, companyId: string): Draft { return { ...d, revision: d.revision + 1, changes: [{ id: uid(), at: new Date().toISOString(), description, companyId }, ...d.changes].slice(0, 80) }; }
export function validateBranch(branch: Branch, data: Draft) {
    if (!branch.name.trim() || !branch.code.trim())
        throw new Error('Completa el nombre y código de la sucursal.');
    if (!data.companies.some(c => c.id === branch.companyId))
        throw new Error('La sucursal debe pertenecer a una empresa existente.');
    if (data.branches.some(b => b.id !== branch.id && b.companyId === branch.companyId && b.code.trim().toLowerCase() === branch.code.trim().toLowerCase()))
        throw new Error('Ese código de sucursal ya existe en esta empresa.');
}
export function validateWarehouseBranch(warehouse: Warehouse, data: Draft) {
    if (!data.branches.some(b => b.id === warehouse.branchId && b.companyId === warehouse.companyId))
        throw new Error('Selecciona una sucursal de esta empresa.');
}
export function warehousesInContext(data: Draft, companyId: string, branchId = 'all') {
    return data.warehouses.filter(w => w.companyId === companyId && (branchId === 'all' || w.branchId === branchId));
}
