'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronDown, Layers3, Package, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { uid, type Draft, type Placement, type Product, type Rack, type Warehouse } from '@/lib/console/model';
import { applyRackStructure, nextPosition, moveToLevel, removeEmptyLevel, reorderPlacement, type RackStructure } from '@/lib/console/rack-structure';
import { Drawer, Empty, FormError, ProductImage, useGuardedClose } from './ui';
const searchable = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
export function RackStructureEditor({ rack, warehouse, data, onSave, onClose }: {
    rack: Rack; warehouse: Warehouse; data: Draft; onSave: (structure: RackStructure) => Promise<void>; onClose: () => void;
}) {
    const [initial] = useState<RackStructure>(() => ({ levels: rack.levels, placements: data.placements.filter(p => p.rackId === rack.id).map(p => ({ ...p })) }));
    const [structure, setStructure] = useState(initial);
    const [collapsed, setCollapsed] = useState<number[]>(() => Array.from({ length: rack.levels }, (_, i) => i + 1).filter(level => !initial.placements.some(p => p.level === level) && (initial.placements.length > 0 || level !== rack.levels)));
    const [picker, setPicker] = useState<{ level: number; replacingId?: string } | null>(null);
    const [query, setQuery] = useState(''), [filter, setFilter] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const errorRef = useRef<HTMLDivElement>(null), pickerInput = useRef<HTMLInputElement>(null);
    useEffect(() => { if (error) errorRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, [error]);
    const dirty = JSON.stringify(initial) !== JSON.stringify(structure), guard = useGuardedClose(dirty, onClose);
    const products = data.products.filter(p => p.companyId === warehouse.companyId && !p.archived), productsById = new Map(data.products.map(p => [p.id, p]));
    const matches = products.filter(p => searchable(`${p.name} ${p.sku} ${p.barcode}`).includes(searchable(query.trim())));
    const matchesFilter = (p: Placement) => { const product = productsById.get(p.productId); return searchable(`${product?.name ?? ''} ${product?.sku ?? ''} ${product?.barcode ?? ''}`).includes(searchable(filter.trim())); };
    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    function updateRows(action: (rows: Placement[]) => Placement[]) {
        setError('');
        try { setStructure({ ...structure, placements: action(structure.placements) }); }
        catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar la distribución.'); }
    }
    function openPicker(level: number, replacingId?: string) {
        setPicker({ level, replacingId }); setQuery(''); setFilter(''); setError('');
        setCollapsed(collapsed.filter(n => n !== level));
    }
    function selectProduct(product: Product) {
        if (!picker) return;
        const { level, replacingId } = picker;
        if (structure.placements.some(p => p.level === level && p.productId === product.id && p.id !== replacingId)) return;
        updateRows(rows => replacingId ? rows.map(p => p.id === replacingId ? { ...p, productId: product.id } : p) : [...rows, { id: uid(), productId: product.id, warehouseId: warehouse.id, rackId: rack.id, level, position: nextPosition(rows, level) }]);
        if (replacingId) setPicker(null);
        else pickerInput.current?.focus();
    }
    function removeLevel(level: number) {
        try {
            const placements = removeEmptyLevel(structure.placements, level);
            setStructure({ ...structure, levels: structure.levels - 1, placements });
            setCollapsed(collapsed.filter(n => n !== level).map(n => n > level ? n - 1 : n)); setPicker(null); setError('');
        } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo quitar el nivel.'); }
    }
    async function save() {
        setError(''); setBusy(true);
        try { applyRackStructure(data, warehouse.id, rack.id, structure); await onSave(structure); onClose(); }
        catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar. Tus cambios siguen en el editor.'); }
        finally { setBusy(false); }
    }
    return <Drawer wide title={`${rack.code} · ${rack.name}`} eyebrow="PRODUCTOS POR NIVEL" subtitle={`${warehouse.name} · Cada nivel reúne todos los productos que encuentres en él.`} onClose={busy ? () => {} : guard.close}>
        <fieldset disabled={busy} className="structure-fieldset">
            <div className="structure-toolbar"><div><span className={`structure-status ${dirty ? 'pending' : ''}`}><span/>{dirty ? 'Cambios sin guardar' : 'Distribución guardada'}</span><small>Borrador local de prueba</small></div><button type="button" className="secondary-button" onClick={guard.close}><ArrowLeft size={15}/>Volver al plano</button></div>
            <div className="structure-body">
                <div className="structure-summary"><div className="structure-summary-title"><div><Layers3 size={24}/></div><span><strong>Productos de cada nivel</strong><small>Busca productos y agrégalos al nivel correspondiente.</small></span></div><div className="structure-stats"><span><strong>{structure.levels}</strong> niveles</span><span><strong>{structure.placements.length}</strong> productos ubicados</span></div></div>
                <div className="structure-note"><Package size={17}/><p>Las cantidades quedan <strong>por contar</strong>. Puedes incluir muchos productos distintos en un mismo nivel.</p></div>
                <label className="search-box level-list-search"><Search size={17}/><input type="search" aria-label="Buscar productos del andamio" placeholder="Buscar entre los productos de este andamio…" value={filter} onChange={e => setFilter(e.target.value)}/></label>
                <div ref={errorRef}><FormError message={error}/></div>
                <div className="structure-levels">{Array.from({ length: structure.levels }, (_, i) => structure.levels - i).map(level => {
                    const rows = structure.placements.filter(p => p.level === level).sort((a, b) => a.position - b.position), shown = rows.filter(matchesFilter), closed = !filter.trim() && collapsed.includes(level);
                    if (filter.trim() && shown.length === 0) return null;
                    return <section className="structure-level" key={level} aria-label={`Nivel ${level}`}>
                        <div className="structure-level-heading"><button type="button" className="level-toggle" aria-label={`Nivel ${level}, ${rows.length} productos`} aria-expanded={!closed} aria-controls={`level-content-${level}`} onClick={() => { setFilter(''); setCollapsed(collapsed.includes(level) ? collapsed.filter(n => n !== level) : [...collapsed, level]); }}><span className="level-symbol"><Layers3 size={19}/></span><span><strong>Nivel {level}</strong><small>{rows.length} productos{filter.trim() ? ` · ${shown.length} coincidencias` : ''}</small></span><ChevronDown size={19} className={closed ? '' : 'rotated'}/></button><button type="button" className="icon-button text-rose-500" disabled={structure.levels === 1 || rows.length > 0} title={rows.length ? 'Reubica los productos antes de eliminar este nivel' : 'Eliminar nivel vacío'} aria-label={`Eliminar nivel ${level} vacío`} onClick={() => removeLevel(level)}><Trash2 size={16}/></button></div>
                        {!closed && <div id={`level-content-${level}`} className="structure-level-content">
                            {picker?.level === level && <div className="level-catalog-picker"><div className="level-picker-heading"><strong>{picker.replacingId ? 'Cambiar producto' : `Agregar productos al nivel ${level}`}</strong><button type="button" className="icon-button" aria-label="Cerrar catálogo del nivel" onClick={() => setPicker(null)}><X size={17}/></button></div><div className="product-search"><label htmlFor="level-product-query"><span>{picker.replacingId ? 'Busca el producto de reemplazo' : 'Busca y selecciona varios productos seguidos'}</span></label><div className="product-search-input"><Search size={17}/><input ref={pickerInput} id="level-product-query" autoFocus type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre, código o código de barras…" onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setPicker(null); } }}/></div><div className="product-search-results" aria-label="Productos del catálogo">{matches.slice(0, 12).map(product => {
                                const assigned = rows.some(p => p.productId === product.id && p.id !== picker.replacingId);
                                return <button type="button" key={product.id} disabled={assigned} onClick={() => selectProduct(product)}><ProductImage src={product.image} name={product.name} category={product.category}/><span><strong>{product.name}</strong><small>{product.sku} · {assigned ? 'Ya está en este nivel' : product.category || 'Sin categoría'}</small></span>{assigned ? <Check size={17}/> : <Plus size={17}/>}</button>;
                            })}{matches.length === 0 && <p>No se encontraron productos activos. Prueba otro nombre o código.</p>}{matches.length > 12 && <p>Mostrando 12 de {matches.length}. Escribe más para afinar la búsqueda.</p>}</div></div><p className="level-picker-hint">Los productos elegidos se incorporan a la lista. Guarda la distribución al terminar.</p></div>}
                            {rows.length === 0 && !picker && <div className="level-empty"><Package size={23}/><span>Agrega los productos que correspondan a este nivel.</span></div>}
                            {shown.map(row => {
                                const product = productsById.get(row.productId), index = rows.findIndex(p => p.id === row.id), name = product?.name ?? 'Producto sin ficha';
                                return <article className="structure-product" key={row.id} aria-label={`${name}, nivel ${level}`}><div className="structure-product-main"><div className="assigned-product"><ProductImage src={product?.image ?? ''} name={name} category={product?.category ?? ''}/><span><strong>{name}</strong><small>{product?.sku}{product?.archived ? ' · Archivado' : ''}</small></span></div></div><div className="structure-product-actions"><button type="button" className="change-product" onClick={() => openPicker(level, row.id)}>Cambiar</button><label className="placement-level">Nivel<select className="field" aria-label={`Nivel de ${name}`} value={row.level} onChange={e => { const target = Number(e.target.value); updateRows(rows => moveToLevel(rows, row.id, target)); setCollapsed(collapsed.filter(n => n !== target)); setPicker(null); }}>{Array.from({ length: structure.levels }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label><span className="count-pending">Por contar</span><div className="placement-order"><button type="button" className="icon-button" aria-label={`Subir ${name} en nivel ${level}`} disabled={index === 0 || !!filter.trim()} title={filter.trim() ? 'Limpia la búsqueda para ordenar' : 'Subir en la lista'} onClick={() => updateRows(rows => reorderPlacement(rows, row.id, -1))}><ArrowUp size={16}/></button><button type="button" className="icon-button" aria-label={`Bajar ${name} en nivel ${level}`} disabled={index === rows.length - 1 || !!filter.trim()} title={filter.trim() ? 'Limpia la búsqueda para ordenar' : 'Bajar en la lista'} onClick={() => updateRows(rows => reorderPlacement(rows, row.id, 1))}><ArrowDown size={16}/></button></div><button type="button" className="remove-placement" aria-label={`Quitar ${name} del nivel ${level}`} onClick={() => { updateRows(rows => rows.filter(r => r.id !== row.id)); if (picker?.replacingId === row.id) setPicker(null); }}><Trash2 size={14}/><span>Quitar</span></button></div></article>;
                            })}
                            <button type="button" className="add-level-product" onClick={() => openPicker(level)}><Plus size={16}/>Agregar productos</button>
                        </div>}
                    </section>;
                })}</div>
                {filter.trim() && !structure.placements.some(matchesFilter) && <Empty title="Sin productos que coincidan" description="Prueba otro nombre o código, o limpia la búsqueda para ver todos los niveles."/>}
                <div className="structure-add-level"><button type="button" className="secondary-button" disabled={structure.levels >= 12} onClick={() => { setStructure({ ...structure, levels: structure.levels + 1 }); setFilter(''); setError(''); }}><Plus size={17}/>Agregar nivel</button><span>{structure.levels >= 12 ? 'Límite de 12 niveles alcanzado' : 'Se agrega arriba · Máximo 12 niveles'}</span></div>
            </div>
            <div className="editor-footer structure-footer"><span><Check size={15}/>{dirty ? 'Guarda para aplicar la distribución' : 'Sin cambios pendientes'}</span><button type="button" className="secondary-button" onClick={guard.close}>Cancelar</button><button type="button" className="primary-button" disabled={!dirty || busy} onClick={() => void save()}><Save size={16}/>{busy ? 'Guardando…' : 'Guardar distribución'}</button></div>
        </fieldset>{guard.confirmation}
    </Drawer>;
}
