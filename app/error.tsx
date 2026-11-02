'use client';
import { RotateCcw } from 'lucide-react';
import AccountFrame from '@/components/account-frame';
export default function ErrorPage({ reset }: { reset: () => void }) {
    return <AccountFrame title="No pudimos cargar este espacio" description="Revisa tu conexión y vuelve a intentarlo. Si continúa, contacta al administrador." eyebrow="RECUPERAR EL ESPACIO"><button className="primary-button account-continue" onClick={reset}><RotateCcw size={16}/>Intentar nuevamente</button></AccountFrame>;
}
