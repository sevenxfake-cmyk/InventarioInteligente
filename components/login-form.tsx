'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import AccountFrame from './account-frame';
import { Field } from './console/ui';
export default function LoginForm({ configured, recovery }: { configured: boolean; recovery: boolean }) {
    const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [reset, setReset] = useState(false);
    async function submit(e: React.FormEvent) {
        e.preventDefault(); setBusy(true); setMessage('');
        try {
            if (reset) {
                const r = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' });
                setMessage(r.error ? 'No se pudo solicitar la recuperación. Inténtalo después.' : 'Si la cuenta existe, recibirás instrucciones por correo.');
            } else {
                const r = await authClient.signIn.email({ email, password });
                if (r.error) setMessage('No se pudo iniciar sesión. Verifica tus datos o contacta al administrador.');
                else window.location.assign('/workspace');
            }
        } catch { setMessage('No hay conexión con el servicio. Inténtalo nuevamente.'); }
        finally { setBusy(false); }
    }
    return <AccountFrame title={reset ? 'Recupera tu acceso' : 'Bienvenido a tu espacio'} description={reset ? 'Te enviaremos las instrucciones al correo de tu cuenta.' : 'Accede con la cuenta habilitada por tu organización.'}>
        {!configured ? <><div className="account-notice"><LockKeyhole size={24}/><strong>El acceso real está en preparación</strong><p>Mientras conectamos la base de datos y la autenticación, puedes explorar los editores con datos de ejemplo.</p></div><Link href="/" className="primary-button account-continue">Explorar espacio de prueba<ArrowRight size={16}/></Link><p className="account-help">Los cambios de prueba se guardan en este navegador.</p></> : <form onSubmit={submit} className="account-form"><fieldset disabled={busy}><Field label="Correo electrónico"><input className="field" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)}/></Field>{!reset && <Field label="Contraseña"><input type="password" className="field" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></Field>}<button className="primary-button account-continue" disabled={busy}>{busy ? 'Procesando…' : reset ? 'Enviar instrucciones' : 'Iniciar sesión'}<ArrowRight size={16}/></button>{recovery && <button type="button" className="account-text-button" onClick={() => { setReset(!reset); setMessage(''); }}>{reset ? 'Volver al acceso' : 'Olvidé mi contraseña'}</button>}</fieldset></form>}
        {message && <p className="account-feedback" role="status">{message}</p>}
    </AccountFrame>;
}
