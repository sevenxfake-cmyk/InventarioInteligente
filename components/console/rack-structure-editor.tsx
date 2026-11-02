'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, Layers3, Package, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { uid, type Draft, type Placement, type Rack, type Warehouse } from '@/lib/console/model';
import { applyRackStructure, freeSlot, moveToLevel, removeEmptyLevel, reorderPlacement, type RackStructure } from '@/lib/console/rack-structure';
import { Drawer, FormError, ProductImage, useGuardedClose } from './ui';

export function RackStructureEditor({ rack, warehouse, data, onSave, onClose }: {
    rack: Rack;
    warehouse: Warehouse;
    data: Draft;
    onSave: (structure: RackStructure) => Promise<void>;
    onClose: () => void;
}) {
    const [initial] = useState<RackStructure>(() => ({ levels: rack.levels, slots: rack.slots, placements: data.placements.filter(p => p.rackId === rack.id).map(p => ({ ...p })) }));
    const [structure, setStructure] = useState(initial);
    const [collapsed, setCollapsed] = useState<number[]>(() => Array.from({ length: rack.levels }, (_, i) => i + 1).filter(level => !initial.placements.some(p => p.level === level) && (initial.placements.length > 0 || level !== rack.levels)));
    const [pickerId, setPickerId] = useState<string | null>(null), [query, setQuery] = useState('');
    const [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const errorRef = useRef<HTMLDivElement>(null);
    useEffect(() => { if (error) errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, [error]);
    const dirty = JSON.stringify(initial) !== JSON.stringify(structure);
    const guard = useGuardedClose(dirty, onClose);
    const products = data.products.filter(p => p.companyId === warehouse.companyId && !p.archived);
    const search = query.trim().toLocaleLowerCase('es');
    const matches = products.filter(p => `${p.name} ${p.sku} ${p.barcode}`.toLocaleLowerCase('es').includes(search));
    // Also guard browser refresh/close; the dialog guard handles in-app navigation.
    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    function updateRows(action: (rows: Placement[]) => Placement[]) {
        setError('');
        try { setStructure({ ...structure, placements: action(structure.placements) }); }
        catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar la estructura.'); }
    }
    function addProduct(level: number) {
        const slot = freeSlot(structure.placements, level, structure.slots);
        if (slot === undefined) { setError(`El nivel ${level} está completo. Amplía los espacios por nivel para agregar otro producto.`); return; }
        const id = uid();
        setStructure({ ...structure, placements: [...structure.placements, { id, warehouseId: warehouse.id, rackId: rack.id, level, slot, productId: '' }] });
        setPickerId(id); setQuery(''); setError('');
    }
    function removeLevel(level: number) {
        try {
            const placements = removeEmptyLevel(structure.placements, level);
            setStructure({ ...structure, levels: structure.levels - 1, placements });
            setCollapsed(collapsed.filter(n => n !== level).map(n => n > level ? n - 1 : n));
            setError('');
        } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo quitar el nivel.'); }
    }
    async function save() {
        setError(''); setBusy(true);
        try {
            applyRackStructure(data, warehouse.id, rack.id, structure);
            await onSave(structure);
            onClose();
        } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar. Tus cambios siguen en el editor.'); }
        finally { setBusy(false); }
    }
    return <Drawer wide title={`${rack.code} · ${rack.name}`} eyebrow="EDITOR DE ANDAMIOS Y ESPACIOS" subtitle={`${warehouse.name} · Prepara la distribución y guarda la estructura al terminar.`} onClose={busy ? () => {} : guard.close}>
        <fieldset disabled={busy} className="structure-fieldset">
            <div className="structure-toolbar"><div><span className={`structure-status ${dirty ? 'pending' : ''}`}><span/>{dirty ? 'Cambios sin guardar' : 'Estructura guardada'}</span><small>Borrador local de prueba</small></div><button type="button" className="secondary-button" onClick={guard.close}><ArrowLeft size={15}/>Volver al plano</button></div>
            <div className="structure-body">
                <div className="structure-summary"><div className="structure-summary-title"><div><Layers3 size={24}/></div><span><strong>Organiza cada nivel</strong><small>Busca en tu catálogo, asigna y ordena los productos.</small></span></div><div className="structure-stats"><span><strong>{structure.levels}</strong> niveles</span><span><strong>{structure.placements.length} / {structure.levels * structure.slots}</strong> espacios</span></div></div>
                <div className="structure-note"><Package size={17}/><p>Las cantidades quedan <strong>por contar</strong>. Este editor guarda ubicaciones; el conteo físico se realizará por separado.</p></div>
                <div className="structure-options"><label>Espacios por nivel<select className="field" value={structure.slots} onChange={e => {
                    const slots = Number(e.target.value);
                    if (structure.placements.some(p => p.slot > slots)) { setError('Hay productos en los espacios que intentas quitar. Reordénalos o muévelos antes de reducirlos.'); return; }
                    setStructure({ ...structure, slots }); setError('');
                }}>{Array.from({ length: 8 }, (_, i) => <option key={i} value={i + 1}>{i + 1} espacios</option>)}</select></label><span>Orden visual: nivel superior primero. Las flechas cambian el orden dentro de un nivel.</span></div>
                <div ref={errorRef}><FormError message={error}/></div>
                <div className="structure-levels">{Array.from({ length: structure.levels }, (_, i) => structure.levels - i).map(level => {
                    const rows = structure.placements.filter(p => p.level === level).sort((a, b) => a.slot - b.slot), closed = collapsed.includes(level);
                    return <section className="structure-level" key={level} aria-label={`Nivel ${level}`}>
                        <div className="structure-level-heading"><button type="button" className="level-toggle" aria-label={`Nivel ${level}, ${rows.length} productos`} aria-expanded={!closed} aria-controls={`level-content-${level}`} onClick={() => setCollapsed(closed ? collapsed.filter(n => n !== level) : [...collapsed, level])}><span className="level-symbol"><Layers3 size={19}/></span><span><strong>Nivel {level}</strong><small>{rows.length} de {structure.slots} espacios ocupados</small></span><ChevronDown size={19} className={closed ? '' : 'rotated'}/></button><button type="button" className="icon-button text-rose-500" disabled={structure.levels === 1 || rows.length > 0} title={rows.length ? 'Reubica los productos antes de eliminar este nivel' : 'Eliminar nivel vacío'} aria-label={`Eliminar nivel ${level} vacío`} onClick={() => removeLevel(level)}><Trash2 size={16}/></button></div>
                        {!closed && <div id={`level-content-${level}`} className="structure-level-content">{rows.length === 0 && <div className="level-empty"><Package size={23}/><span>Este nivel está listo para recibir productos.</span></div>}{rows.map((row, index) => {
                            const product = data.products.find(p => p.id === row.productId), choosing = pickerId === row.id;
                            return <article className={`structure-product ${choosing ? 'choosing' : ''}`} key={row.id} aria-label={`Espacio ${row.slot} del nivel ${level}`}>
                                <span className="placement-number">E{row.slot}</span>
                                <div className="structure-product-main">{choosing ? <div className="product-search"><label htmlFor={`product-search-${row.id}`}><span>Buscar producto para el espacio {row.slot}</span></label><div className="product-search-input"><Search size={17}/><input id={`product-search-${row.id}`} autoFocus type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre, código o código de barras…" onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setPickerId(null); } }}/><button type="button" aria-label="Cerrar búsqueda" onClick={() => setPickerId(null)}><X size={16}/></button></div><div className="product-search-results" aria-label="Resultados de productos">{matches.slice(0, 12).map(p => <button type="button" key={p.id} onClick={() => { updateRows(rows => rows.map(r => r.id === row.id ? { ...r, productId: p.id } : r)); setPickerId(null); }}><ProductImage src={p.image} name={p.name} category={p.category}/><span><strong>{p.name}</strong><small>{p.sku} · {p.category || 'Sin categoría'}</small></span><Plus size={16}/></button>)}{matches.length === 0 && <p>No se encontraron productos activos. Prueba otro nombre o código.</p>}{matches.length > 12 && <p>Mostrando 12 de {matches.length}. Escribe más para afinar la búsqueda.</p>}</div></div> : product ? <div className="assigned-product"><ProductImage src={product.image} name={product.name} category={product.category}/><span><strong>{product.name}</strong><small>{product.sku}{product.archived ? ' · Archivado' : ''}</small></span></div> : <button type="button" className="choose-product" onClick={() => { setPickerId(row.id); setQuery(''); }}><Search size={18}/>Seleccionar un producto del catálogo</button>}</div>
                                <div className="structure-product-actions">{!choosing && <button type="button" className="change-product" onClick={() => { setPickerId(row.id); setQuery(''); }}>{product ? 'Cambiar' : 'Buscar'}</button>}<label className="placement-level">Nivel<select className="field" aria-label={`Nivel del espacio ${row.slot}, nivel ${level}`} value={row.level} onChange={e => { const target = Number(e.target.value); updateRows(rows => moveToLevel(rows, row.id, target, structure.slots)); setCollapsed(collapsed.filter(n => n !== target)); }}>{Array.from({ length: structure.levels }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><span className="count-pending">Por contar</span><div className="placement-order"><button type="button" className="icon-button" aria-label={`Subir producto del espacio ${row.slot}, nivel ${level}`} disabled={index === 0} onClick={() => updateRows(rows => reorderPlacement(rows, row.id, -1))}><ArrowUp size={16}/></button><button type="button" className="icon-button" aria-label={`Bajar producto del espacio ${row.slot}, nivel ${level}`} disabled={index === rows.length - 1} onClick={() => updateRows(rows => reorderPlacement(rows, row.id, 1))}><ArrowDown size={16}/></button></div><button type="button" className="remove-placement" aria-label={`Quitar ubicación del espacio ${row.slot}, nivel ${level}`} onClick={() => { updateRows(rows => rows.filter(r => r.id !== row.id)); if (pickerId === row.id) setPickerId(null); }}><Trash2 size={14}/><span>Quitar</span></button></div>
                            </article>;
                        })}<button type="button" className="add-level-product" disabled={rows.length >= structure.slots} onClick={() => addProduct(level)}><Plus size={16}/>{rows.length >= structure.slots ? 'Nivel completo' : 'Agregar producto'}</button></div>}
                    </section>;
                })}</div>
                <div className="structure-add-level"><button type="button" className="secondary-button" disabled={structure.levels >= 12} onClick={() => { setStructure({ ...structure, levels: structure.levels + 1 }); setError(''); }}><Plus size={17}/>Agregar nivel</button><span>{structure.levels >= 12 ? 'Límite de 12 niveles alcanzado' : 'Se agrega arriba · Máximo 12 niveles'}</span></div>
            </div>
            <div className="editor-footer structure-footer"><span><Check size={15}/>{dirty ? 'Guarda para aplicar la distribución' : 'Sin cambios pendientes'}</span><button type="button" className="secondary-button" onClick={guard.close}>Cancelar</button><button type="button" className="primary-button" disabled={!dirty || busy} onClick={() => void save()}><Save size={16}/>{busy ? 'Guardando…' : 'Guardar estructura'}</button></div>
        </fieldset>{guard.confirmation}
    </Drawer>;
}
