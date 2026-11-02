import type { Draft } from './model.ts';
export function createSeed(): Draft {
    return {
        version: 4, revision: 0,
        branches: [
            { id: 'branch-norte-principal', companyId: 'company-norte', name: 'Principal', code: 'PRIN', address: 'Lima · Zona norte' },
            { id: 'branch-norte-recepcion', companyId: 'company-norte', name: 'Centro de recepción', code: 'RECEP', address: 'Lima · Recepción' },
            { id: 'branch-sur-principal', companyId: 'company-sur', name: 'Principal', code: 'PRIN', address: 'Arequipa' }
        ],
        companies: [
            { id: 'company-norte', name: 'Norte Distribuciones', legalName: 'Distribuidora Norte · Ejemplo', ruc: '', industry: 'Limpieza y cuidado', address: 'Lima, Perú', email: '', phone: '', color: '#137c66', logo: '', cover: '', notes: 'Empresa ficticia para explorar los editores.' },
            { id: 'company-sur', name: 'Sur Comercial', legalName: 'Comercial Sur · Ejemplo', ruc: '', industry: 'Accesorios automotrices', address: 'Arequipa, Perú', email: '', phone: '', color: '#5768bd', logo: '', cover: '', notes: 'Empresa de ejemplo independiente.' }
        ],
        products: [
            { id: 'p1', companyId: 'company-norte', sku: 'MIC-001', barcode: '', name: 'Paño de microfibra', category: 'Microfibras', brand: 'Sin marca', unit: 'Unidad', presentation: '40 × 40 cm · Azul', description: 'Paño para limpieza de superficies y acabado automotriz.', image: '', archived: false },
            { id: 'p2', companyId: 'company-norte', sku: 'CEP-002', barcode: '', name: 'Cepillo para llantas', category: 'Herramientas', brand: 'Sin marca', unit: 'Unidad', presentation: 'Mango ergonómico', description: 'Cepillo de cerdas resistentes para limpieza de llantas.', image: '', archived: false },
            { id: 'p3', companyId: 'company-norte', sku: 'DET-003', barcode: '', name: 'Detergente multiusos', category: 'Químicos', brand: 'Sin marca', unit: 'Litro', presentation: 'Envase de 1 litro', description: 'Producto de ejemplo para el catálogo.', image: '', archived: false },
            { id: 'p4', companyId: 'company-norte', sku: 'GUA-004', barcode: '', name: 'Guantes de limpieza', category: 'Protección', brand: 'Sin marca', unit: 'Par', presentation: 'Talla M · Reutilizable', description: 'Guantes de protección para limpieza general.', image: '', archived: false },
            { id: 'p5', companyId: 'company-norte', sku: 'MOP-005', barcode: '', name: 'Mopa plana de microfibra', category: 'Herramientas', brand: 'Sin marca', unit: 'Unidad', presentation: 'Base de 40 cm', description: 'Mopa con base articulada y paño intercambiable.', image: '', archived: false },
            { id: 'p6', companyId: 'company-norte', sku: 'ESP-006', barcode: '', name: 'Esponja de doble cara', category: 'Accesorios', brand: 'Sin marca', unit: 'Paquete', presentation: 'Paquete de 12 unidades', description: 'Esponja de uso doméstico y comercial.', image: '', archived: false },
            { id: 'p7', companyId: 'company-sur', sku: 'AUT-001', barcode: '', name: 'Manopla para lavado', category: 'Microfibras', brand: 'Sin marca', unit: 'Unidad', presentation: 'Microfibra · Verde', description: 'Producto de demostración de Sur Comercial.', image: '', archived: false }
        ],
        warehouses: [
            { id: 'wh-norte', companyId: 'company-norte', branchId: 'branch-norte-principal', name: 'Almacén principal', code: 'ALM-01', address: 'Lima · Zona norte', manager: 'Responsable por asignar', rows: 3, columns: 4, racks: [
                    { id: 'rack-a', name: 'Microfibras', code: 'A-01', row: 0, column: 0, levels: 4, color: '#137c66' },
                    { id: 'rack-b', name: 'Herramientas', code: 'A-02', row: 0, column: 1, levels: 3, color: '#137c66' },
                    { id: 'rack-c', name: 'Químicos', code: 'B-01', row: 2, column: 0, levels: 3, color: '#c38336' },
                    { id: 'rack-d', name: 'Protección', code: 'B-02', row: 2, column: 1, levels: 4, color: '#5768bd' }
                ] },
            { id: 'wh-reserva', companyId: 'company-norte', branchId: 'branch-norte-recepcion', name: 'Almacén de reserva', code: 'ALM-02', address: 'Lima · Zona de recepción', manager: 'Responsable por asignar', rows: 2, columns: 3, racks: [{ id: 'rack-e', name: 'Reserva', code: 'R-01', row: 0, column: 0, levels: 3, color: '#137c66' }] },
            { id: 'wh-sur', companyId: 'company-sur', branchId: 'branch-sur-principal', name: 'Almacén Sur', code: 'SUR-01', address: 'Arequipa', manager: 'Responsable por asignar', rows: 3, columns: 3, racks: [] }
        ],
        placements: [{ id: 'loc1', productId: 'p1', warehouseId: 'wh-norte', rackId: 'rack-a', level: 1, position: 1 }, { id: 'loc2', productId: 'p2', warehouseId: 'wh-norte', rackId: 'rack-b', level: 1, position: 1 }, { id: 'loc3', productId: 'p3', warehouseId: 'wh-norte', rackId: 'rack-c', level: 1, position: 1 }, { id: 'loc4', productId: 'p4', warehouseId: 'wh-norte', rackId: 'rack-d', level: 1, position: 1 }], changes: []
    };
}
