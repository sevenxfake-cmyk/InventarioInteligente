import { Layers3 } from 'lucide-react';
export default function AppBrand({ children }: { children?: React.ReactNode }) {
    return <div className="erp-brand"><div className="brand-symbol"><Layers3 size={26}/></div><div><strong>INVENTARIO<span> INTELIGENTE</span></strong><small>GESTIÓN DE ALMACENES</small></div>{children}</div>;
}
