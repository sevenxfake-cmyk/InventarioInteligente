'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, KeyRound } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import AccountFrame from './account-frame';
import { Field } from './console/ui';
export default function ResetForm() {
    const token = useSearchParams().get('token'), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [done, setDone] = useState(false);
    async function submit(e: React.FormEvent) {
        e.preventDefault(); setMessage('');
        if (password !== confirm) { setMessage('Las contraseñas no coinciden.'); return; }
        setBusy(true);
        try {
            const r = await authClient.resetPassword({ newPassword: password, token: token ?? '' });
            if (r.error) setMessage('El enlace venció o no es válido. Solicita uno nuevo.');
            else { setDone(true); setMessage('Contraseña actualizada. Inicia sesión nuevamente.'); }
        } catch { setMessage('No se pudo conectar. Inténtalo nuevamente.'); }
        finally { setBusy(false); }
    }
    return <AccountFrame title="Restablecer contraseña" description="Crea una nueva contraseña para recuperar el acceso a tu organización." eyebrow="RECUPERACIÓN DE CUENTA">
        {!token ? <div className="account-notice"><KeyRound size={24}/><strong>Necesitas un enlace de recuperación</strong><p>Abre el enlace enviado a tu correo. Si ya venció, solicita uno nuevo desde el acceso.</p></div> : !done && <form className="account-form" onSubmit={submit}><fieldset disabled={busy}><Field label="Nueva contraseña" hint="Entre 12 y 128 caracteres."><input className="field" type="password" minLength={12} maxLength={128} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}/></Field><Field label="Confirma tu contraseña"><input className="field" type="password" minLength={12} maxLength={128} required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)}/></Field><button disabled={busy} className="primary-button account-continue">{busy ? 'Guardando…' : 'Actualizar contraseña'}</button></fieldset></form>}
        {message && <p role="status" className={`account-feedback ${done ? 'success' : ''}`}>{done && <Check size={17}/>} {message}</p>}<Link href="/login" className="account-back-link"><ArrowLeft size={15}/>Volver al acceso</Link>
    </AccountFrame>;
}
