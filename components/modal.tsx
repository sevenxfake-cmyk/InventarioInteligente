'use client';
import {useEffect,useRef} from 'react';
export default function Modal({children,onClose}:{children:React.ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{ref.current?.showModal()},[]);
 return <dialog aria-label="Detalle de inventario" ref={ref} onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose()}} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-40px)] max-w-lg overflow-y-auto rounded-2xl border-0 bg-transparent p-0 shadow-xl backdrop:bg-[#102820]/40">{children}</dialog>;
}
