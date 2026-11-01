import {Suspense} from 'react';
import ResetForm from '@/components/reset-form';
export default function Page(){return <Suspense fallback={<p className="p-8">Cargando…</p>}><ResetForm/></Suspense>}
