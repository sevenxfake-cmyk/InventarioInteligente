'use client';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {useState} from 'react';
import {authClient} from '@/lib/auth-client';
export default function ResetForm(){
 const token=useSearchParams().get('token'),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();if(password!==confirm){setMessage('Las contraseñas no coinciden.');return}setBusy(true);try{const r=await authClient.resetPassword({newPassword:password,token:token??''});if(r.error)setMessage('El enlace venció o no es válido. Solicita uno nuevo.');else{setDone(true);setMessage('Contraseña actualizada. Inicia sesión nuevamente.')}}catch{setMessage('No se pudo conectar. Inténtalo nuevamente.')}finally{setBusy(false)}}
 return <main className="mx-auto mt-16 max-w-md p-6"><section className="card p-7"><h1 className="text-xl font-semibold">Restablecer contraseña</h1>{!token?<p className="my-5 text-sm">Necesitas un enlace válido enviado a tu correo.</p>:!done&&<form className="mt-6 space-y-4" onSubmit={submit}><label className="block text-xs">Nueva contraseña<input className="field mt-2" type="password" minLength={12} maxLength={128} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="block text-xs">Confirma tu contraseña<input className="field mt-2" type="password" minLength={12} maxLength={128} required autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button disabled={busy} className="btn w-full">{busy?'Guardando…':'Actualizar contraseña'}</button></form>}{message&&<p role="status" className="my-5 text-sm leading-6">{message}</p>}<Link href="/login" className="mt-6 block text-xs text-emerald-700">Volver al acceso</Link></section></main>
}
