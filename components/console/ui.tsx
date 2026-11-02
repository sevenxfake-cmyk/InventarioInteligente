'use client';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Package, Upload, X } from 'lucide-react';
export function Drawer({ title, subtitle, children, onClose, eyebrow }: {
    title: string;
    eyebrow?: string;
    subtitle?: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { ref.current?.showModal(); }, []);
    return <dialog ref={ref} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => {
            if (e.target === e.currentTarget)
                onClose();
        }} aria-label={title} className="editor-drawer"><div className="flex items-start justify-between gap-4 border-b border-slate-200 px-7 py-6"><div><p className="eyebrow">{eyebrow ?? 'EDITOR DEL ESPACIO DE PRUEBA'}</p><h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>{subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}</div><button type="button" aria-label="Cerrar editor" onClick={onClose} className="icon-button shrink-0"><X size={20}/></button></div>{children}</dialog>;
}
export function Field({ label, children, hint }: {
    label: string;
    children: React.ReactNode;
    hint?: string;
}) { return <label className="block"><span className="mb-2 block text-[13px] font-semibold text-slate-700">{label}</span>{children}{hint && <span className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span>}</label>; }
export function Empty({ title, description, action }: {
    title: string;
    description: string;
    action?: React.ReactNode;
}) { return <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center"><div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Package size={27}/></div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>{action && <div className="mt-5">{action}</div>}</div>; }
export function ProductImage({ src, name, category, size = 'normal' }: {
    src: string;
    name: string;
    category: string;
    size?: 'normal' | 'large';
}) { const colors: Record<string, string> = { Microfibras: 'bg-sky-50 text-sky-600', Químicos: 'bg-amber-50 text-amber-600', Herramientas: 'bg-emerald-50 text-emerald-600', Protección: 'bg-violet-50 text-violet-600' }; return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl ${colors[category] ?? 'bg-orange-50 text-orange-500'} ${size === 'large' ? 'h-36 w-full sm:h-44' : 'h-12 w-12'}`}>{src ? <img src={src} alt={name} className="h-full w-full object-contain p-1"/> : <Package size={size === 'large' ? 62 : 23} strokeWidth={1.4}/>}</div>; }
export function CompanyLogo({ src, name, color, large = false }: {
    src: string;
    name: string;
    color: string;
    large?: boolean;
}) { return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[3px] border-white font-bold text-white shadow-sm ${large ? 'h-20 w-20 text-2xl' : 'h-11 w-11 text-sm'}`} style={{ background: color }}>{src ? <img src={src} alt={`Logo de ${name}`} className="h-full w-full bg-white object-contain p-1"/> : name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}</div>; }
export function ImageField({ value, onChange, label, wide = false }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    wide?: boolean;
}) {
    const [error, setError] = useState(''), [busy, setBusy] = useState(false);
    async function upload(file?: File) {
        if (!file)
            return;
        setError('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            setError('Selecciona JPG, PNG o WebP de hasta 5 MB.');
            return;
        }
        setBusy(true);
        try {
            const bitmap = await createImageBitmap(file);
            const canvas = document.createElement('canvas'), scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            const context = canvas.getContext('2d');
            if (!context)
                throw new Error();
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            bitmap.close();
            onChange(canvas.toDataURL('image/webp', .82));
        }
        catch {
            setError('No se pudo leer esta imagen. Prueba con otra.');
        }
        finally {
            setBusy(false);
        }
    }
    return <div><span className="mb-2 block text-[13px] font-semibold">{label}</span><label className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-emerald-500 hover:bg-emerald-50 ${wide ? 'h-40' : 'h-44'}`}>
 {value ? <img src={value} alt={`Vista previa: ${label}`} className={`h-full w-full ${wide ? 'object-cover' : 'object-contain p-3'}`}/> : <><ImagePlus size={30} className="mb-3 text-emerald-600"/><span className="text-sm font-semibold text-slate-700">{busy ? 'Preparando imagen…' : 'Elegir una imagen'}</span><span className="mt-1 text-xs text-slate-500">JPG, PNG o WebP · hasta 5 MB</span></>}
 <input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" aria-label={label} className="sr-only" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }}/>{value && <span className="absolute bottom-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold shadow">Cambiar imagen</span>}</label>{value && <button type="button" className="mt-2 text-xs font-semibold text-rose-600" onClick={() => onChange('')}>Quitar imagen</button>}{error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}</div>;
}
export function FormError({ message }: {
    message: string;
}) { return message ? <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{message}</p> : null; }
export function useGuardedClose(dirty: boolean, onClose: () => void) {
    const [confirm, setConfirm] = useState(false);
    return { close: () => {
            if (dirty)
                setConfirm(true);
            else
                onClose();
        }, confirmation: confirm ? <div className="sticky bottom-0 z-20 border-t border-amber-200 bg-amber-50 p-5"><p className="text-sm font-semibold">Tienes cambios sin guardar.</p><div className="mt-3 flex gap-3"><button type="button" className="secondary-button" onClick={() => setConfirm(false)}>Seguir editando</button><button type="button" className="danger-button" onClick={onClose}>Descartar cambios</button></div></div> : null };
}
