import Demo from '@/components/demo';
import Link from 'next/link';
export default function Page(){return <><Link href="/" className="fixed right-6 bottom-5 z-50 rounded-full bg-emerald-800 px-5 py-3 text-xs font-bold text-white shadow-lg">← Volver a los editores</Link><Demo initialPage="Roles y permisos"/></>}
