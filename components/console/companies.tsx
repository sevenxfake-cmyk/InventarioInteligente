'use client';
import { useState } from 'react';
import { ArrowRight, Building2, MapPin, Pencil, Plus, Warehouse, Package } from 'lucide-react';
import { uid, type Company, type Draft } from '@/lib/console/model';
import { CompanyLogo, Drawer, Field, FormError, ImageField, useGuardedClose } from './ui';
export function Companies({ data, onEdit, onSelect, onNew }: {
    data: Draft;
    onEdit: (c: Company) => void;
    onSelect: (id: string) => void;
    onNew: () => void;
}) { return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{data.companies.map(c => { const warehouses = data.warehouses.filter(w => w.companyId === c.id), products = data.products.filter(p => p.companyId === c.id && !p.archived); return <article className="panel overflow-hidden" key={c.id}><div className="company-cover" style={{ background: `linear-gradient(120deg,${c.color},${c.color}bb)` }}>{c.cover ? <img src={c.cover} alt={`Portada de ${c.name}`} className="absolute inset-0 h-full w-full object-cover"/> : <><div className="cover-ring"/><Building2 size={75} strokeWidth={1} className="absolute right-8 top-8 text-white/30"/></>}<span className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-bold tracking-widest text-white">EMPRESA DE PRUEBA</span></div><div className="relative px-6 pb-6"><div className="-mt-10 flex items-end justify-between"><CompanyLogo src={c.logo} name={c.name} color={c.color} large/><button aria-label={`Editar ${c.name}`} onClick={() => onEdit(c)} className="icon-button bg-white"><Pencil size={17}/></button></div><p className="mt-5 text-xs font-semibold text-emerald-700">{c.industry || 'Sin categoría'}</p><h2 className="mt-2 text-xl font-bold tracking-tight">{c.name}</h2><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14}/>{c.address || 'Dirección por completar'}</p><div className="my-6 grid grid-cols-2 divide-x divide-slate-200 rounded-xl bg-slate-50 py-3"><div className="px-4"><p className="text-xl font-bold">{warehouses.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-slate-500">Almacenes</p></div><div className="px-4"><p className="text-xl font-bold">{products.length.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-slate-500">Productos activos</p></div></div><button className="flex w-full items-center justify-between text-sm font-bold text-emerald-700" onClick={() => onSelect(c.id)}>Abrir empresa<ArrowRight size={17}/></button></div></article>; })}<button onClick={onNew} className="flex min-h-96 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 p-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Plus size={28}/></div><h3 className="mt-5 text-lg font-bold">Una nueva empresa</h3><p className="mt-2 max-w-56 text-sm leading-6 text-slate-500">Organiza su catálogo, identidad y almacenes en un solo lugar.</p></button></div>; }
export function CompanyEditor({ value, onSave, onClose }: {
    value: Company | null;
    onSave: (c: Company) => Promise<void>;
    onClose: () => void;
}) {
    const [initial] = useState<Company>(() => value ?? { id: uid(), name: '', legalName: '', ruc: '', industry: '', address: '', email: '', phone: '', color: '#137c66', logo: '', cover: '', notes: '' });
    const [form, setForm] = useState<Company>(initial), [tab, setTab] = useState('general'), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const dirty = JSON.stringify(form) !== JSON.stringify(initial), guard = useGuardedClose(dirty, onClose);
    const patch = (key: keyof Company, v: string) => setForm(f => ({ ...f, [key]: v }));
    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (form.name.trim().length < 2) {
            setError('El nombre debe tener al menos 2 caracteres.');
            setTab('general');
            return;
        }
        if (form.ruc && !/^\d{11}$/.test(form.ruc)) {
            setError('El RUC debe tener 11 dígitos o quedar vacío.');
            setTab('general');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await onSave({ ...form, name: form.name.trim() });
            onClose();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        }
        finally {
            setBusy(false);
        }
    }
    return <Drawer title={value ? 'Editar empresa' : 'Nueva empresa'} subtitle="Dale identidad a tu empresa y organiza su operación." onClose={guard.close}><div className="editor-tabs">{[['general', 'Información general'], ['visual', 'Identidad visual']].map(([id, label]) => <button type="button" key={id} onClick={() => setTab(id)} className={tab === id ? 'active' : ''}>{label}</button>)}</div><form onSubmit={submit}><div className="space-y-6 p-7"><FormError message={error}/>{tab === 'general' ? <><Field label="Nombre comercial *"><input required minLength={2} maxLength={100} className="field" value={form.name} onChange={e => patch('name', e.target.value)} placeholder="Ej. Norte Distribuciones"/></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Razón social"><input className="field" maxLength={150} value={form.legalName} onChange={e => patch('legalName', e.target.value)}/></Field><Field label="RUC (opcional)"><input className="field" inputMode="numeric" maxLength={11} value={form.ruc} onChange={e => patch('ruc', e.target.value)}/></Field></div><Field label="Rubro"><input className="field" maxLength={80} placeholder="Ej. Limpieza y cuidado" value={form.industry} onChange={e => patch('industry', e.target.value)}/></Field><Field label="Dirección"><input className="field" maxLength={200} value={form.address} onChange={e => patch('address', e.target.value)}/></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Correo de contacto"><input type="email" className="field" maxLength={150} value={form.email} onChange={e => patch('email', e.target.value)}/></Field><Field label="Teléfono"><input className="field" maxLength={30} value={form.phone} onChange={e => patch('phone', e.target.value)}/></Field></div><Field label="Notas internas"><textarea className="field min-h-24" maxLength={1000} value={form.notes} onChange={e => patch('notes', e.target.value)}/></Field></> : <><div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5"><CompanyLogo src={form.logo} name={form.name || 'Tu empresa'} color={form.color} large/><div><p className="text-lg font-bold">{form.name || 'Tu empresa'}</p><p className="mt-1 text-sm text-slate-500">Vista previa de tu identidad</p></div></div><ImageField label="Logo de la empresa" value={form.logo} onChange={v => patch('logo', v)}/><ImageField label="Portada de la empresa" value={form.cover} onChange={v => patch('cover', v)} wide/><Field label="Color de identidad"><div className="flex items-center gap-3"><input aria-label="Color de la empresa" type="color" value={form.color} onChange={e => patch('color', e.target.value)} className="h-12 w-16 cursor-pointer rounded-lg border border-slate-200"/><span className="font-mono text-sm text-slate-500">{form.color}</span></div></Field></>}</div><div className="editor-footer"><button type="button" onClick={guard.close} className="secondary-button">Cancelar</button><button disabled={busy} className="primary-button">{busy ? 'Guardando…' : 'Guardar empresa'}</button></div></form>{guard.confirmation}</Drawer>;
}
