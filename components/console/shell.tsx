'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Activity, Building2, Check, ChevronDown, ChevronRight, HardDrive, House, LayoutGrid, LockKeyhole, MapPin, Menu, Package, Settings2, ShieldCheck, Warehouse, X } from 'lucide-react';
import type { Branch, Company } from '@/lib/console/model';
import { CompanyLogo } from './ui';
import AppInstall from './app-install';
import AppBrand from '../app-brand';
export const modules = [
    { id: 'overview', name: 'Inicio', label: 'Vista general', icon: House, color: 'indigo', description: 'Resumen de tu operación' },
    { id: 'products', name: 'Productos', label: 'Catálogo de productos', icon: Package, color: 'teal', description: 'Tu catálogo, en orden' },
    { id: 'warehouses', name: 'Almacenes', label: 'Almacenes y andamios', icon: Warehouse, color: 'sky', description: 'Andamios, niveles y ubicaciones' },
    { id: 'companies', name: 'Empresas', label: 'Empresas', icon: Building2, color: 'violet', description: 'Identidad y organización' },
    { id: 'branches', name: 'Sucursales', label: 'Sucursales', icon: MapPin, color: 'orange', description: 'Cada sede, su estructura' },
    { id: 'activity', name: 'Actividad', label: 'Actividad del borrador', icon: Activity, color: 'rose', description: 'Historial de tus cambios' }
];
export default function ConsoleShell({ children, company, companies, branches, branchId, section, busy, savedAt, productCount, onCompanyChange, onBranchChange, onNavigate, onEditCompany }: {
    children: React.ReactNode;
    company: Company;
    companies: Company[];
    branches: Branch[];
    branchId: string;
    section: string;
    busy: boolean;
    savedAt: string;
    productCount: number;
    onCompanyChange: (id: string) => void;
    onBranchChange: (id: string) => void;
    onNavigate: (id: string) => void;
    onEditCompany: () => void;
}) {
    const [mobile, setMobile] = useState(false);
    const aside = useRef<HTMLElement>(null), opener = useRef<HTMLButtonElement>(null);
    const currentBranch = branches.find(b => b.id === branchId);
    useEffect(() => { if (!mobile)
        return; const first = aside.current?.querySelector<HTMLButtonElement>('[aria-label="Cerrar módulos"]'); first?.focus(); const key = (e: KeyboardEvent) => { if (aside.current?.querySelector('dialog[open]'))
        return; if (e.key === 'Escape') {
        setMobile(false);
        opener.current?.focus();
    } if (e.key === 'Tab') {
        const nodes = Array.from(aside.current?.querySelectorAll<HTMLElement>('button,select,a[href]') ?? []).filter(el => el.getClientRects().length > 0);
        const start = nodes[0], end = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === start) {
            e.preventDefault();
            end?.focus();
        }
        else if (!e.shiftKey && document.activeElement === end) {
            e.preventDefault();
            start?.focus();
        }
    } }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, [mobile]);
    function go(id: string) { setMobile(false); onNavigate(id); }
    return <div className="app-shell erp-layout"><a className="skip-console" href="#console-content">Saltar al contenido</a><aside ref={aside} aria-label="Navegación y contexto" className={`console-sidebar erp-sidebar ${mobile ? 'is-open' : ''}`}><AppBrand><button className="mobile-close" aria-label="Cerrar módulos" onClick={() => setMobile(false)}><X size={22}/></button></AppBrand><div className="erp-company-identity"><CompanyLogo src={company.logo} name={company.name} color={company.color} large/><button onClick={onEditCompany} aria-label="Editar identidad de empresa" className="identity-edit"><Settings2 size={14}/></button></div><div className="context-stack"><label className="erp-context-field"><span>EMPRESA</span><select aria-label="Empresa actual" value={company.id} onChange={e => onCompanyChange(e.target.value)}>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><div className="erp-context-field"><span>CARGO</span><strong>Administrador de prueba</strong></div><label className="erp-context-field"><span>SUCURSAL</span><select aria-label="Sucursal actual" value={branchId} onChange={e => onBranchChange(e.target.value)}><option value="all">Todas las sucursales</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label></div><p className="module-menu-label">MÓDULOS DEL INVENTARIO</p><nav className="erp-module-grid" aria-label="Módulos principales">{modules.map(m => <button key={m.id} aria-label={m.label} aria-current={section === m.id ? 'page' : undefined} onClick={() => go(m.id)} className={`erp-module-tile ${m.color} ${section === m.id ? 'selected' : ''}`}><m.icon size={23}/><span>{m.name}</span>{m.id === 'products' && <small>{productCount}</small>}</button>)}</nav><div className="erp-sidebar-links"><button className={`sidebar-permissions ${section === 'permissions' ? 'active' : ''}`} aria-current={section === 'permissions' ? 'page' : undefined} onClick={() => go('permissions')}><ShieldCheck size={16}/>Accesos y permisos<ChevronRight size={13}/></button><Link href="/login"><LockKeyhole size={16}/>Ingreso de usuarios<ChevronRight size={13}/></Link><AppInstall /></div><div className="sidebar-draft-note"><span />ESPACIO DE PRUEBA EDITABLE<small>Guardado en este navegador</small></div></aside>{mobile && <button className="module-backdrop" aria-label="Cerrar navegación" onClick={() => setMobile(false)}/>}
 <div className="console-content"><header className="console-header erp-header"><div className="erp-greeting"><button ref={opener} className="icon-button open-modules" aria-label="Abrir módulos" onClick={() => setMobile(true)}><Menu size={22}/></button><div><span>Bienvenido a tu espacio</span><strong>{company.name}</strong></div></div><div className="erp-header-actions"><span className="save-state"><HardDrive size={14}/>{busy ? 'Guardando…' : savedAt ? 'Borrador guardado' : 'Datos de ejemplo'}</span><button aria-label="Editar empresa actual" className="icon-button" onClick={onEditCompany}><Settings2 size={18}/></button><div className="user-avatar">AD</div></div></header><div className="erp-subheader"><span><Building2 size={14}/>{company.name}</span><ChevronRight size={12}/><span><MapPin size={13}/>{currentBranch?.name ?? 'Todas las sucursales'}</span><span className="erp-demo-badge">DEMO</span><label className="mobile-branch-select"><select aria-label="Filtrar sucursal en móvil" value={branchId} onChange={e => onBranchChange(e.target.value)}><option value="all">Todas las sucursales</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><ChevronDown size={12}/></label></div><main id="console-content" className="console-main" tabIndex={-1}>{children}</main></div>
 <nav className="mobile-bottom-nav" aria-label="Navegación de la aplicación">{[{ id: 'overview', label: 'Inicio', icon: House }, { id: 'products', label: 'Productos', icon: Package }, { id: 'warehouses', label: 'Almacenes', icon: Warehouse }].map(item => <button key={item.id} onClick={() => go(item.id)} className={section === item.id ? 'active' : ''} aria-current={section === item.id ? 'page' : undefined}><item.icon size={22}/><span>{item.label}</span></button>)}<button onClick={() => setMobile(true)} className={['companies', 'branches', 'activity', 'permissions'].includes(section) ? 'active' : ''}><LayoutGrid size={22}/><span>Más módulos</span></button></nav></div>;
}
