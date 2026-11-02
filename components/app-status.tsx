import { Layers3 } from 'lucide-react';
export default function AppStatus({ message = 'Cargando tu espacio…' }: { message?: string }) {
    return <main className="app-status" role="status"><div className="app-status-symbol"><Layers3 size={27} className="animate-pulse"/></div><strong>INVENTARIO INTELIGENTE</strong><p>{message}</p></main>;
}
