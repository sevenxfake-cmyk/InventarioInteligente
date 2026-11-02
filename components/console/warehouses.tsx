'use client';
import { useState } from 'react';
import { ArrowDown, ChevronRight, Copy, Grip, Layers3, MapPin, Move, Pencil, Plus, Trash2, Warehouse as WarehouseIcon, X } from 'lucide-react';
import { capacity, uid, validateRack, validateWarehouse, type Draft, type Rack, type Warehouse } from '@/lib/console/model';
import { RackStructureEditor } from './rack-structure-editor';
import type { RackStructure } from '@/lib/console/rack-structure';
import { Drawer, Empty, Field, FormError, useGuardedClose } from './ui';
export function WarehouseEditor({ value, companyId, data, onSave, onClose, defaultBranchId }: {
    value: Warehouse | null;
    defaultBranchId?: string;
    companyId: string;
    data: Draft;
    onSave: (w: Warehouse) => Promise<void>;
    onClose: () => void;
}) {
    const [initial] = useState<Warehouse>(() => value ?? { id: uid(), companyId, branchId: data.branches.some(b => b.companyId === companyId && b.id === defaultBranchId) ? defaultBranchId! : data.branches.find(b => b.companyId === companyId)?.id ?? '', name: '', code: '', address: '', manager: '', rows: 3, columns: 4, racks: [] });
    const [form, setForm] = useState(initial), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const guard = useGuardedClose(JSON.stringify(form) !== JSON.stringify(initial), onClose);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            validateWarehouse(form, data.warehouses);
            await onSave({ ...form, name: form.name.trim(), code: form.code.trim() });
            onClose();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        }
        finally {
            setBusy(false);
        }
    }
    return <Drawer title={value ? 'Configurar almacén' : 'Nuevo almacén'} subtitle="Define su información y el tamaño del plano de distribución." onClose={guard.close}><form onSubmit={submit}><div className="space-y-6 p-7"><FormError message={error}/><Field label="Nombre del almacén *"><input required className="field" maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Almacén principal"/></Field><Field label="Sucursal *"><select required className="field" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })}>{data.branches.filter(b => b.companyId === companyId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field><Field label="Código *"><input required className="field font-mono" maxLength={30} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="ALM-01"/></Field><Field label="Dirección"><input className="field" maxLength={200} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/></Field><Field label="Responsable (referencia del borrador)"><input className="field" maxLength={100} value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })}/></Field><div className="rounded-2xl bg-emerald-50 p-5"><h3 className="flex items-center gap-2 text-sm font-bold text-emerald-900"><Grip size={18}/>Tamaño del plano</h3><p className="my-3 text-xs leading-6 text-emerald-800/70">Cada casilla admite un andamio. Las casillas libres representan zonas disponibles; no son medidas físicas.</p><div className="grid grid-cols-2 gap-4"><Field label="Filas (2–8)"><input type="number" required min={2} max={8} className="field" value={form.rows} onChange={e => setForm({ ...form, rows: Number(e.target.value) })}/></Field><Field label="Columnas (2–8)"><input type="number" required min={2} max={8} className="field" value={form.columns} onChange={e => setForm({ ...form, columns: Number(e.target.value) })}/></Field></div></div></div><div className="editor-footer"><button type="button" className="secondary-button" onClick={guard.close}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Guardar almacén'}</button></div></form>{guard.confirmation}</Drawer>;
}
export function Warehouses({ data, companyId, onEditWarehouse, onNewWarehouse, onSaveWarehouse, onSaveRackStructure, onRemoveRack, onRemoveWarehouse }: {
    data: Draft;
    companyId: string;
    onEditWarehouse: (w: Warehouse) => void;
    onNewWarehouse: () => void;
    onSaveWarehouse: (w: Warehouse) => Promise<void>;
    onSaveRackStructure: (warehouseId: string, rackId: string, structure: RackStructure) => Promise<void>;
    onRemoveRack: (w: Warehouse, r: Rack) => void;
    onRemoveWarehouse: (w: Warehouse) => void;
}) {
    const warehouses = data.warehouses.filter(w => w.companyId === companyId);
    const [selectedId, setSelectedId] = useState(warehouses[0]?.id ?? ''), [rackId, setRackId] = useState(''), [editingRack, setEditingRack] = useState<Rack | null>(null), [moving, setMoving] = useState<string | null>(null), [error, setError] = useState(''), [editingContents, setEditingContents] = useState(false);
    const warehouse = warehouses.find(w => w.id === selectedId) ?? warehouses[0], rack = warehouse?.racks.find(r => r.id === rackId) ?? null;
    function newRack(row?: number, column?: number) {
        if (!warehouse)
            return;
        let cell: {
            row: number;
            column: number;
        } | undefined;
        if (row !== undefined && column !== undefined)
            cell = { row, column };
        else
            for (let r = 0; r < warehouse.rows; r++)
                for (let c = 0; c < warehouse.columns; c++)
                    if (!cell && !warehouse.racks.some(a => a.row === r && a.column === c))
                        cell = { row: r, column: c };
        if (!cell) {
            setError('El plano está completo. Amplía las filas o columnas para añadir andamios.');
            return;
        }
        setEditingRack({ id: uid(), code: '', name: '', row: cell.row, column: cell.column, levels: 4, slots: 3, color: '#137c66' });
    }
    async function moveRack(id: string, row: number, column: number) {
        if (!warehouse)
            return;
        setError('');
        const target = warehouse.racks.find(r => r.id === id);
        if (!target)
            return;
        try {
            const updated = { ...target, row, column };
            validateRack(updated, warehouse, data.placements);
            await onSaveWarehouse({ ...warehouse, racks: warehouse.racks.map(r => r.id === id ? updated : r) });
            setMoving(null);
            setRackId(id);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo mover.');
        }
    }
    async function duplicate(r: Rack) {
        if (!warehouse)
            return;
        let cell: {
            row: number;
            column: number;
        } | undefined;
        for (let row = 0; row < warehouse.rows; row++)
            for (let column = 0; column < warehouse.columns; column++)
                if (!cell && !warehouse.racks.some(a => a.row === row && a.column === column))
                    cell = { row, column };
        if (!cell) {
            setError('No hay una casilla libre para duplicar este andamio.');
            return;
        }
        setEditingRack({ ...r, id: uid(), name: r.name + ' · copia', code: r.code + '-C', ...cell });
    }
    if (!warehouse)
        return <section className="panel"><Empty title="Diseña tu primer almacén" description="Crea un almacén y distribuye sus andamios y niveles en un plano visual." action={<button className="primary-button" onClick={onNewWarehouse}><Plus size={16}/>Crear almacén</button>}/></section>;
    return <><div className="warehouse-workbench grid items-start gap-6 xl:grid-cols-[255px_minmax(0,1fr)]"><aside className="warehouse-list space-y-3"><p className="eyebrow mb-4">{warehouses.length} ALMACENES EN ESTE CONTEXTO</p>{warehouses.map(w => <button key={w.id} onClick={() => { setSelectedId(w.id); setRackId(''); setMoving(null); setError(''); }} className={`w-full rounded-2xl border p-4 text-left transition ${w.id === warehouse.id ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-300'}`}><div className="flex items-center justify-between"><div className={`grid h-10 w-10 place-items-center rounded-xl ${w.id === warehouse.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}><WarehouseIcon size={20}/></div><ChevronRight size={16} className="text-slate-400"/></div><p className="mt-4 text-sm font-bold">{w.name}</p><p className="mt-1 font-mono text-[11px] text-slate-400">{w.code}</p><div className="mt-4 flex items-center gap-3 text-xs text-slate-500"><span>{w.racks.length} andamios</span><span>·</span><span>{capacity(w)} espacios</span></div></button>)}<button className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-4 text-xs font-bold text-slate-500 hover:border-emerald-500" onClick={onNewWarehouse}><Plus size={16}/>Nuevo almacén</button><div className="rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-800">Las ubicaciones organizan productos. No modifican las existencias ni registran conteos físicos.</div></aside>
 <section className="panel min-w-0 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5"><div><div className="mb-1 flex items-center gap-2"><h2 className="text-lg font-bold">{warehouse.name}</h2><span className="category-tag">{warehouse.code}</span></div><p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12}/>{warehouse.address || 'Sin dirección'} · {warehouse.rows} × {warehouse.columns} casillas</p></div><div className="flex gap-2 warehouse-actions"><button aria-label="Eliminar almacén" className="icon-button text-rose-500" onClick={() => onRemoveWarehouse(warehouse)}><Trash2 size={17}/></button><button aria-label="Configurar almacén" className="icon-button" onClick={() => onEditWarehouse(warehouse)}><Pencil size={17}/></button><button className="primary-button text-xs" onClick={() => newRack()}><Plus size={15}/>Andamio</button></div></div><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-3"><p className="flex items-center gap-2 text-xs font-semibold text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Plano de distribución</p><span className="text-[11px] text-slate-400">Haz clic en un andamio para abrir sus niveles</span></div>{rack && <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-indigo-50/40 px-6 py-3"><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">{rack.code} · {rack.name}</span><button aria-label={`Abrir niveles de ${rack.code}`} className="primary-button text-xs" onClick={() => setEditingContents(true)}><Layers3 size={15}/>Abrir niveles</button><button aria-label={`Configurar andamio ${rack.code}`} className="secondary-button text-xs" onClick={() => setEditingRack({ ...rack })}><Pencil size={14}/>Configurar</button><button aria-label={`Mover andamio ${rack.code}`} className="secondary-button text-xs" onClick={() => setMoving(rack.id)}><Move size={14}/>Mover</button></div>}<div className="p-4 md:p-6"><FormError message={error}/>{moving && <div className="mb-4 flex items-center justify-between rounded-xl bg-sky-50 p-3 text-xs text-sky-800"><span>Selecciona una casilla vacía para mover el andamio.</span><button aria-label="Cancelar movimiento" onClick={() => setMoving(null)}><X size={16}/></button></div>}<div className="floorplan overflow-x-auto rounded-2xl border border-slate-200 p-4 md:p-6"><div className="grid min-w-[430px] gap-3 md:gap-4" style={{ gridTemplateColumns: `repeat(${warehouse.columns},minmax(95px,1fr))` }}>{Array.from({ length: warehouse.rows * warehouse.columns }, (_, index) => {
            const row = Math.floor(index / warehouse.columns), column = index % warehouse.columns, placed = warehouse.racks.find(r => r.row === row && r.column === column);
            return <div key={index} className="min-h-[105px]" onDragOver={e => {
                    if (!placed)
                        e.preventDefault();
                }} onDrop={e => {
                    e.preventDefault();
                    if (!placed)
                        void moveRack(e.dataTransfer.getData('text/plain'), row, column);
                }}>{placed ? <button draggable onDragStart={e => e.dataTransfer.setData('text/plain', placed.id)} aria-label={`Abrir andamio ${placed.code}: ${placed.name}`} aria-haspopup="dialog" onClick={() => { setRackId(placed.id); setMoving(null); setEditingContents(true); }} className={`rack-tile relative flex h-full min-h-[105px] w-full flex-col items-center justify-center rounded-xl border-2 p-3 transition hover:-translate-y-1 hover:shadow-md ${rackId === placed.id ? 'ring-4 ring-emerald-500/15' : ''}`} style={{ borderColor: placed.color, background: `${placed.color}0c` }}><span className="absolute right-2 top-2 text-[9px] font-semibold text-slate-400">{row + 1}.{column + 1}</span><div className="mb-1.5 flex gap-1" aria-hidden>{Array.from({ length: Math.min(placed.slots, 5) }, (_, n) => <div key={n} className="h-5 w-3 rounded-sm border" style={{ background: `${placed.color}22`, borderColor: `${placed.color}55` }}/>)}</div><span className="font-mono text-xs font-extrabold" style={{ color: placed.color }}>{placed.code}</span><span className="mt-1 max-w-full truncate text-[10px] font-medium text-slate-500">{placed.name}</span><span className="mt-1 text-[9px] text-slate-400">{placed.levels} niveles · {placed.slots} esp.</span><span className="mt-2 flex items-center gap-1 text-[10px] font-bold" style={{ color: placed.color }}>Abrir niveles<ChevronRight size={12}/></span></button> : <button onClick={() => moving ? void moveRack(moving, row, column) : newRack(row, column)} aria-label={`Añadir andamio en fila ${row + 1}, columna ${column + 1}`} className={`flex h-full min-h-[105px] w-full flex-col items-center justify-center rounded-xl border border-dashed text-slate-400 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 ${moving ? 'border-sky-400 bg-sky-50' : 'border-slate-300 bg-white/60'}`}><Plus size={18}/><span className="mt-2 text-[9px]">{moving ? 'Mover aquí' : 'Espacio libre'}</span></button>}</div>;
        })}</div><div className="mt-5 flex items-center justify-center gap-2 text-[10px] font-semibold tracking-widest text-slate-400"><ArrowDown size={13}/>ACCESO / ZONA DE CIRCULACIÓN</div></div><div className="mt-5 grid grid-cols-3 gap-3"><div className="mini-metric"><strong>{warehouse.racks.length}</strong><span>Andamios</span></div><div className="mini-metric"><strong>{warehouse.racks.reduce((n, r) => n + r.levels, 0)}</strong><span>Niveles totales</span></div><div className="mini-metric"><strong>{data.placements.filter(p => p.warehouseId === warehouse.id).length} / {capacity(warehouse)}</strong><span>Espacios ubicados</span></div></div></div></section></div>
 {rack ? <RackInspector key={rack.id} rack={rack} warehouse={warehouse} data={data} onEdit={() => setEditingRack({ ...rack })} onMove={() => setMoving(rack.id)} onDuplicate={() => void duplicate(rack)} onDelete={() => onRemoveRack(warehouse, rack)} onEditContents={() => setEditingContents(true)}/> : <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 p-7 text-sm text-slate-500"><Layers3 size={20}/>Haz clic en un andamio del plano para abrir sus niveles y ubicar productos.</div>}
 {editingContents && rack && <RackStructureEditor key={`${warehouse.id}-${rack.id}`} rack={rack} warehouse={warehouse} data={data} onSave={structure => onSaveRackStructure(warehouse.id, rack.id, structure)} onClose={() => setEditingContents(false)}/>}
 {editingRack && <RackEditor value={editingRack} warehouse={warehouse} data={data} onClose={() => setEditingRack(null)} onSave={async (r) => { validateRack(r, warehouse, data.placements); await onSaveWarehouse({ ...warehouse, racks: warehouse.racks.some(a => a.id === r.id) ? warehouse.racks.map(a => a.id === r.id ? r : a) : [...warehouse.racks, r] }); setRackId(r.id); }}/>}</>;
}
function RackEditor({ value, warehouse, data, onSave, onClose }: {
    value: Rack;
    warehouse: Warehouse;
    data: Draft;
    onSave: (r: Rack) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState(value), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const guard = useGuardedClose(JSON.stringify(form) !== JSON.stringify(value), onClose);
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            validateRack(form, warehouse, data.placements);
            await onSave(form);
            onClose();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        }
        finally {
            setBusy(false);
        }
    }
    return <Drawer title={warehouse.racks.some(r => r.id === value.id) ? 'Editar andamio' : 'Nuevo andamio'} subtitle={`${warehouse.name} · Fila ${form.row + 1}, columna ${form.column + 1}`} onClose={guard.close}><form onSubmit={submit}><div className="space-y-6 p-7"><FormError message={error}/><div className="grid gap-5 sm:grid-cols-2"><Field label="Código del andamio *"><input className="field font-mono" maxLength={30} required placeholder="A-03" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}/></Field><Field label="Nombre o sección *"><input className="field" maxLength={80} required placeholder="Accesorios" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></Field></div><div className="grid grid-cols-2 gap-5"><Field label="Niveles (1–12)"><input type="number" className="field" required min={1} max={12} value={form.levels} onChange={e => setForm({ ...form, levels: Number(e.target.value) })}/></Field><Field label="Espacios por nivel (1–8)"><input type="number" required className="field" min={1} max={8} value={form.slots} onChange={e => setForm({ ...form, slots: Number(e.target.value) })}/></Field></div><Field label="Color de la sección"><input aria-label="Color del andamio" type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-12 w-20 cursor-pointer rounded-lg border border-slate-200"/></Field><div className="rounded-2xl bg-slate-50 p-5"><p className="eyebrow mb-4">VISTA FRONTAL · {Math.max(0, form.levels * form.slots)} ESPACIOS</p><div className="space-y-2 border-x-4 border-slate-300 px-3 py-2">{Array.from({ length: Math.min(12, Math.max(1, form.levels)) }, (_, i) => <div key={i} className="flex items-center gap-2 border-b-4 border-slate-300 pb-1"><span className="w-6 font-mono text-[9px] text-slate-400">N{Math.max(1, form.levels) - i}</span>{Array.from({ length: Math.min(8, Math.max(1, form.slots)) }, (_, n) => <div key={n} className="h-7 flex-1 rounded-t border border-emerald-200 bg-emerald-100/70"/>)}</div>)}</div></div></div><div className="editor-footer"><button type="button" className="secondary-button" onClick={guard.close}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Guardar andamio'}</button></div></form>{guard.confirmation}</Drawer>;
}
function RackInspector({ rack, data, onEdit, onMove, onDuplicate, onDelete, onEditContents }: {
    rack: Rack;
    warehouse: Warehouse;
    data: Draft;
    onEdit: () => void;
    onMove: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onEditContents: () => void;
}) {
    const placements = data.placements.filter(p => p.rackId === rack.id);
    return <section className="panel mt-6 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${rack.color}15`, color: rack.color }}><Layers3 size={23}/></div><div><h2 className="text-base font-bold">{rack.code} · {rack.name}</h2><p className="mt-1 text-xs text-slate-500">{rack.levels} niveles · {placements.length} productos ubicados</p></div></div><div className="flex flex-wrap gap-2"><button className="primary-button text-xs" onClick={onEditContents}><Pencil size={14}/>Editar contenido</button><button className="secondary-button text-xs" onClick={onEdit}>Configurar</button><button className="secondary-button text-xs" onClick={onMove}><Move size={14}/>Mover</button><button className="icon-button" aria-label="Duplicar andamio" onClick={onDuplicate}><Copy size={16}/></button><button className="icon-button text-rose-600" aria-label="Eliminar andamio" onClick={onDelete}><Trash2 size={16}/></button></div></div><div className="rack-readonly p-5"><div className="flex items-center justify-between gap-3 mb-4"><p className="eyebrow">VISTA FRONTAL</p><span className="text-xs text-slate-400">De arriba hacia abajo · Sin conteo físico</span></div>{Array.from({ length: rack.levels }, (_, i) => rack.levels - i).map(level => <div key={level} className="rack-shelf-preview"><span>N{level}</span><div>{Array.from({ length: rack.slots }, (_, i) => { const p = placements.find(p => p.level === level && p.slot === i + 1); const product = data.products.find(x => x.id === p?.productId); return <button key={i} onClick={onEditContents} aria-label={`Editar nivel ${level}, espacio ${i + 1}`} className={product ? 'occupied' : ''}><small>E{i + 1}</small><strong>{product ? product.name + (product.archived ? ' (archivado)' : '') : 'Espacio libre'}</strong></button>; })}</div></div>)}</div></section>;
}
