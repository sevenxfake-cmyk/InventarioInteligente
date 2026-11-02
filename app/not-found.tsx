import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccountFrame from '@/components/account-frame';
export default function NotFound() {
    return <AccountFrame title="Este espacio no está disponible" description="La dirección puede haber cambiado. Vuelve a la aplicación para seguir con tu inventario." eyebrow="PÁGINA NO ENCONTRADA"><Link href="/" className="primary-button account-continue"><ArrowLeft size={16}/>Abrir la aplicación</Link></AccountFrame>;
}
