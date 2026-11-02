'use client';
import { useState } from 'react';
import { Building2, MapPin, Pencil, Plus, Warehouse } from 'lucide-react';
import { uid, validateBranch, type Branch, type Draft } from '@/lib/console/model';
import { Drawer, Field, FormError, Empty, useGuardedClose } from './ui';
export function Branches({ data, companyId, onEdit, onNew, onOpen }: {
    data: Draft;
    companyId: string;
    onEdit: (b: Branch) => void;
    onNew: () => void;
    onOpen: (id: string) => void;
}) {
    const branches = data.branches.filter(b => b.companyId === companyId);
    return <div className="branch-grid">{branches.map(branch => { const warehouses = data.warehouses.filter(w => w.branchId === branch.id); return <article className="panel branch-card" key={branch.id}><div className="branch-card-top"><span className="module-symbol orange"><Building2 size={24}/></span><button className="icon-button" aria-label={`Editar sucursal ${branch.name}`} onClick={() => onEdit(branch)}><Pencil size={18}/></button></div><span className="category-tag">{branch.code}</span><h2>{branch.name}</h2><p className="branch-address"><MapPin size={14}/>{branch.address || 'Sin dirección registrada'}</p><div className="branch-count"><Warehouse size={18}/><strong>{warehouses.length}</strong> almacenes vinculados</div><button className="secondary-button w-full" onClick={() => onOpen(branch.id)}>Ver almacenes de esta sucursal →</button></article>; })}<button className="new-module-card" onClick={onNew}><Plus size={28}/><strong>Nueva sucursal</strong><span>Organiza sedes y sus almacenes.</span></button>{!branches.length && <Empty title="Crea tu primera sucursal" description="Cada almacén quedará vinculado a una sucursal de esta empresa."/>}</div>;
}
export function BranchEditor({ value, companyId, data, onSave, onClose }: {
    value: Branch | null;
    companyId: string;
    data: Draft;
    onSave: (b: Branch) => Promise<void>;
    onClose: () => void;
}) {
    const [initial] = useState<Branch>(() => value ?? { id: uid(), companyId, name: '', code: '', address: '' });
    const [form, setForm] = useState(initial), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const guard = useGuardedClose(JSON.stringify(form) !== JSON.stringify(initial), onClose);
    async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); try {
        validateBranch(form, data);
        await onSave({ ...form, name: form.name.trim(), code: form.code.trim() });
        onClose();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
    finally {
        setBusy(false);
    } }
    return <Drawer title={value ? 'Editar sucursal' : 'Nueva sucursal'} subtitle="Organiza los almacenes de una misma sede." onClose={guard.close}><form onSubmit={submit}><div className="space-y-6 p-7"><FormError message={error}/><Field label="Nombre de la sucursal *"><input required maxLength={100} className="field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Principal o Centro de recepción"/></Field><Field label="Código *"><input required maxLength={30} className="field font-mono" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="PRIN"/></Field><Field label="Dirección"><input maxLength={200} className="field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}/></Field></div><div className="editor-footer"><button className="secondary-button" type="button" onClick={guard.close}>Cancelar</button><button className="primary-button" disabled={busy}>{busy ? 'Guardando…' : 'Guardar sucursal'}</button></div></form>{guard.confirmation}</Drawer>;
}
