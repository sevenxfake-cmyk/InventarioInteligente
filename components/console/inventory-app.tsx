'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Check, Database, Layers3, Plus, X } from 'lucide-react';
import { capacity, revise, validatePlacement, validateProduct, validateRack, validateWarehouse, type Company, type Draft, type Product, type Rack, type Warehouse, type Placement } from '@/lib/console/model';
import { createSeed } from '@/lib/console/seed';
import { readDraft, writeDraft } from '@/lib/console/storage';
import { CompanyEditor, Companies } from './companies';
import { ProductEditor, Products } from './products';
import { WarehouseEditor, Warehouses } from './warehouses';
import { Drawer, Empty } from './ui';
import ConsoleShell, { modules } from './shell';
import Dashboard from './dashboard';
import { Branches, BranchEditor } from './branches';
import { validateBranch, validateWarehouseBranch, warehousesInContext, type Branch } from '@/lib/console/model';
type Editor = {
    kind: 'company';
    value: Company | null;
} | {
    kind: 'product';
    value: Product | null;
} | {
    kind: 'warehouse';
    value: Warehouse | null;
} | {
    kind: 'branch';
    value: Branch | null;
} | null;
export default function InventoryApp() {
    const [data, setData] = useState<Draft>(createSeed), [loaded, setLoaded] = useState(false), [storageError, setStorageError] = useState(''), [section, setSection] = useState('overview'), [companyId, setCompanyId] = useState('company-norte'), [branchId, setBranchId] = useState('all'), [editor, setEditor] = useState<Editor>(null), [toast, setToast] = useState(''), [busy, setBusy] = useState(false), [savedAt, setSavedAt] = useState(''), [confirm, setConfirm] = useState<{
        title: string;
        body: string;
        action: () => Promise<void>;
    } | null>(null), [confirmError, setConfirmError] = useState('');
    const dataRef = useRef(data), pending = useRef(false);
    useEffect(() => {
        let active = true;
        readDraft().then(d => {
            if (!active)
                return;
            if (d) {
                setData(d);
                dataRef.current = d;
                setCompanyId(d.companies[0]?.id ?? 'company-norte');
                setSavedAt(d.changes[0]?.at ?? '');
            }
            setLoaded(true);
        }).catch(() => {
            if (active) {
                setStorageError('El navegador no permite guardar borradores. Puedes explorar; habilita el almacenamiento para editar.');
                setLoaded(true);
            }
        });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (!toast)
            return;
        const t = setTimeout(() => setToast(''), 4500);
        return () => clearTimeout(t);
    }, [toast]);
    useEffect(() => {
        if (!busy)
            return;
        const prevent = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', prevent);
        return () => window.removeEventListener('beforeunload', prevent);
    }, [busy]);
    const company = data.companies.find(c => c.id === companyId) ?? data.companies[0], products = data.products.filter(p => p.companyId === company?.id && !p.archived), warehouses = warehousesInContext(data, company?.id, branchId);
    function navigate(id: string) { setSection(id); setEditor(null); window.location.hash = id; window.scrollTo({ top: 0, behavior: 'auto' }); }
    useEffect(() => { const sync = () => { const id = window.location.hash.slice(1); if (modules.some(m => m.id === id))
        setSection(id);
    else
        setSection('overview'); }; sync(); window.addEventListener('hashchange', sync); return () => window.removeEventListener('hashchange', sync); }, []);
    async function commit(update: (d: Draft) => Draft, description: string, target = company.id) {
        if (storageError)
            throw new Error(storageError);
        if (pending.current)
            throw new Error('Hay un guardado en curso. Espera un momento.');
        pending.current = true;
        setBusy(true);
        try {
            const current = dataRef.current, next = revise(update(current), description, target);
            await writeDraft(next, current.revision);
            dataRef.current = next;
            setData(next);
            setSavedAt(next.changes[0].at);
            setToast(description);
        }
        finally {
            pending.current = false;
            setBusy(false);
        }
    }
    async function saveCompany(c: Company) { await commit(d => { const exists = d.companies.some(x => x.id === c.id); return { ...d, companies: exists ? d.companies.map(x => x.id === c.id ? c : x) : [...d.companies, c], branches: exists ? d.branches : [...d.branches, { id: `branch-${c.id}-principal`, companyId: c.id, name: 'Principal', code: 'PRIN', address: c.address }] }; }, `Empresa ${c.name} guardada`, c.id); setCompanyId(c.id); setBranchId('all'); }
    async function saveBranch(b: Branch) { await commit(d => { validateBranch(b, d); return { ...d, branches: d.branches.some(x => x.id === b.id) ? d.branches.map(x => x.id === b.id ? b : x) : [...d.branches, b] }; }, `Sucursal ${b.name} guardada`, b.companyId); }
    async function saveProduct(p: Product) { await commit(d => { validateProduct(p, d.products); return { ...d, products: d.products.some(x => x.id === p.id) ? d.products.map(x => x.id === p.id ? p : x) : [...d.products, p] }; }, `Producto ${p.name} guardado`, p.companyId); }
    async function saveWarehouse(w: Warehouse) { await commit(d => { validateWarehouse(w, d.warehouses); validateWarehouseBranch(w, d); return { ...d, warehouses: d.warehouses.some(x => x.id === w.id) ? d.warehouses.map(x => x.id === w.id ? w : x) : [...d.warehouses, w] }; }, `Almacén ${w.name} actualizado`, w.companyId); }
    async function savePlacement(p: Placement) { await commit(d => { validatePlacement(p, d); return { ...d, placements: [...d.placements, p] }; }, 'Ubicación de producto guardada'); }
    function archive(p: Product) { setConfirmError(''); setConfirm({ title: p.archived ? 'Restaurar producto' : 'Eliminar del catálogo activo', body: p.archived ? `“${p.name}” volverá a estar disponible en el catálogo.` : `“${p.name}” se enviará a Archivados. Sus ubicaciones se conservan y puedes restaurarlo cuando lo necesites.`, action: () => commit(d => ({ ...d, products: d.products.map(x => x.id === p.id ? { ...x, archived: !x.archived } : x) }), `Producto ${p.archived ? 'restaurado' : 'archivado'}: ${p.name}`) }); }
    function removeWarehouse(w: Warehouse) { setConfirmError(''); const count = data.placements.filter(p => p.warehouseId === w.id).length; setConfirm({ title: `Eliminar almacén ${w.name}`, body: `Se quitarán el almacén, sus andamios y ${count} ubicaciones de este borrador. Los productos se conservan en el catálogo.`, action: () => commit(d => ({ ...d, warehouses: d.warehouses.filter(x => x.id !== w.id), placements: d.placements.filter(p => p.warehouseId !== w.id) }), `Almacén ${w.name} eliminado`, w.companyId) }); }
    function removeRack(w: Warehouse, r: Rack) { setConfirmError(''); const count = data.placements.filter(p => p.rackId === r.id).length; setConfirm({ title: `Eliminar andamio ${r.code}`, body: `Se quitará el andamio del plano${count ? ` y sus ${count} ubicaciones` : ''}. Las fichas de los productos seguirán en el catálogo y podrán ubicarse nuevamente.`, action: () => commit(d => ({ ...d, warehouses: d.warehouses.map(x => x.id === w.id ? { ...x, racks: x.racks.filter(a => a.id !== r.id) } : x), placements: d.placements.filter(p => p.rackId !== r.id) }), `Andamio ${r.code} eliminado`, w.companyId) }); }
    function exportDraft() { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'inventario-borrador.json'; a.click(); URL.revokeObjectURL(url); setToast('Copia del borrador descargada'); }
    const action = section === 'branches' ? () => setEditor({ kind: 'branch', value: null }) : section === 'companies' ? () => setEditor({ kind: 'company', value: null }) : section === 'warehouses' ? () => setEditor({ kind: 'warehouse', value: null }) : () => setEditor({ kind: 'product', value: null });
    const actionLabel = section === 'branches' ? 'Nueva sucursal' : section === 'companies' ? 'Nueva empresa' : section === 'warehouses' ? 'Nuevo almacén' : 'Nuevo producto';
    const headings: Record<string, {
        title: string;
        description: string;
    }> = {
        overview: { title: 'Estadísticas generales', description: 'Tu inventario, organizado por empresa y sucursal.' },
        companies: { title: 'Gestión de empresas', description: 'Identidad, datos y estructura de cada empresa.' },
        products: { title: 'Productos del catálogo', description: 'El catálogo es compartido por las sucursales de esta empresa.' },
        warehouses: { title: 'Almacenes y andamios', description: 'Diseña el plano y organiza niveles, espacios y productos.' },
        branches: { title: 'Sucursales de la empresa', description: 'Cada sede con su propia dirección y almacenes.' },
        activity: { title: 'Actividad del borrador', description: 'Cambios guardados en este navegador.' }
    };
    if (!loaded)
        return <main className="flex min-h-screen items-center justify-center gap-3 bg-[#f5f7fa] text-sm font-semibold text-emerald-800"><Layers3 size={23} className="animate-pulse"/>Preparando tu espacio de trabajo…</main>;
    return <><ConsoleShell company={company} companies={data.companies} branches={data.branches.filter(b => b.companyId === company.id)} branchId={branchId} section={section} busy={busy} savedAt={savedAt} productCount={products.length} onCompanyChange={id => { setCompanyId(id); setBranchId('all'); setEditor(null); }} onBranchChange={setBranchId} onNavigate={navigate} onEditCompany={() => setEditor({ kind: 'company', value: company })}>
 <div className="erp-page-heading"><div><p className="eyebrow">{section === 'overview' ? 'CENTRO DE OPERACIONES' : modules.find(m => m.id === section)?.name.toUpperCase()}</p><h1>{headings[section]?.title}</h1><p>{headings[section]?.description}</p></div>{section !== 'activity' && section !== 'overview' && <button className="primary-button" onClick={action}><Plus size={17}/>{actionLabel}</button>}</div>
 <div className="erp-draft-strip"><span className="status-dot"/><span>Espacio de prueba · Cambios guardados en este navegador</span><span className="draft-strip-right">{busy ? 'Guardando…' : savedAt ? 'Guardado local' : 'Datos de ejemplo'}</span></div>
 {storageError && <p role="alert" className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{storageError}</p>}
 {section === 'overview' && <Dashboard data={data} company={company} products={products} warehouses={warehouses} branchId={branchId} onNavigate={navigate} onEditCompany={() => setEditor({ kind: 'company', value: company })} onEditProduct={p => setEditor({ kind: 'product', value: p })}/>}
 {section === 'companies' && <Companies data={data} onEdit={c => setEditor({ kind: 'company', value: c })} onNew={() => setEditor({ kind: 'company', value: null })} onSelect={id => { setCompanyId(id); setBranchId('all'); navigate('overview'); }}/>}
 {section === 'branches' && <Branches data={data} companyId={company.id} onEdit={b => setEditor({ kind: 'branch', value: b })} onNew={() => setEditor({ kind: 'branch', value: null })} onOpen={id => { setBranchId(id); navigate('warehouses'); }}/>}
 {section === 'products' && <Products key={company.id} data={data} companyId={company.id} onEdit={p => setEditor({ kind: 'product', value: p })} onNew={() => setEditor({ kind: 'product', value: null })} onArchive={archive}/>}
 {section === 'warehouses' && <Warehouses key={company.id + '-' + branchId} data={{ ...data, warehouses }} companyId={company.id} onEditWarehouse={w => setEditor({ kind: 'warehouse', value: w })} onNewWarehouse={() => setEditor({ kind: 'warehouse', value: null })} onSaveWarehouse={saveWarehouse} onSavePlacement={savePlacement} onRemovePlacement={p => commit(d => ({ ...d, placements: d.placements.filter(x => x.id !== p.id) }), 'Ubicación retirada; producto conservado')} onRemoveRack={removeRack} onRemoveWarehouse={removeWarehouse}/>}
 {section === 'activity' && <section className="panel"><div className="panel-heading"><div><h2>Cambios de {company.name}</h2><p>Historial local de prueba; no es una auditoría autenticada del servidor.</p></div><button className="secondary-button text-xs" onClick={exportDraft}><ArrowDownToLine size={15}/>Descargar borrador</button></div>{data.changes.filter(c => c.companyId === company.id).length ? <div className="divide-y divide-slate-100">{data.changes.filter(c => c.companyId === company.id).map(c => <div className="flex items-center gap-4 p-5" key={c.id}><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-700"><Check size={16}/></div><div><p className="text-sm font-semibold">{c.description}</p><p className="mt-1 text-xs text-slate-400">{new Date(c.at).toLocaleString('es-PE')} · Administrador de prueba</p></div></div>)}</div> : <Empty title="Todavía no hay cambios" description="Las ediciones guardadas de esta empresa aparecerán aquí."/>}</section>}
 <footer className="erp-footer"><span>Inventario Inteligente · v0.3</span><span><Database size={12}/>Datos operativos compartidos pendientes</span></footer>
 </ConsoleShell>
 {editor?.kind === 'branch' && <BranchEditor key={editor.value?.id ?? 'new-branch'} value={editor.value} companyId={company.id} data={data} onSave={saveBranch} onClose={() => setEditor(null)}/>}
 {editor?.kind === 'company' && <CompanyEditor key={editor.value?.id ?? 'new-company'} value={editor.value} onSave={saveCompany} onClose={() => setEditor(null)}/>}
 {editor?.kind === 'product' && <ProductEditor key={editor.value?.id ?? 'new-product'} value={editor.value} companyId={company.id} data={data} onSave={saveProduct} onClose={() => setEditor(null)}/>}
 {editor?.kind === 'warehouse' && <WarehouseEditor defaultBranchId={branchId} key={editor.value?.id ?? 'new-warehouse'} value={editor.value} companyId={company.id} data={data} onSave={saveWarehouse} onClose={() => setEditor(null)}/>}
 {confirm && <Drawer title={confirm.title} onClose={() => {
                if (!busy)
                    setConfirm(null);
            }}><div className="space-y-5 p-7"><p className="text-sm leading-7 text-slate-500">{confirm.body}</p>{confirmError && <p role="alert" className="text-sm text-rose-600">{confirmError}</p>}<div className="flex justify-end gap-3"><button className="secondary-button" disabled={busy} onClick={() => setConfirm(null)}>Cancelar</button><button className="danger-button" disabled={busy} onClick={async () => {
                try {
                    await confirm.action();
                    setConfirm(null);
                }
                catch (e) {
                    setConfirmError(e instanceof Error ? e.message : 'No se pudo completar.');
                }
            }}>{busy ? 'Guardando…' : 'Confirmar'}</button></div></div></Drawer>}
 {toast && <div role="status" className="console-toast"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={16}/></div><div><p className="text-xs font-bold">{toast}</p><p className="mt-1 text-[10px] text-slate-400">Borrador de este navegador</p></div><button onClick={() => setToast('')} aria-label="Cerrar aviso" className="ml-4"><X size={15}/></button></div>}
 </>;
}
