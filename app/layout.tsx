import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'Inventario Inteligente | Control de almacenes', description: 'Empresas, personas y almacenes bajo un mismo control.', icons:{icon:'/icon.svg'}, robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="es"><body>{children}</body></html>}
