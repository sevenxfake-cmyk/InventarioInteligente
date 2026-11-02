import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Inventario Inteligente | Control de almacenes', description: 'Empresas, personas y almacenes bajo un mismo control.', applicationName: 'Inventario Inteligente', appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Inventario' }, icons: { icon: '/app-icons/icon-192.png', apple: '/app-icons/apple-touch-icon.png' }, robots: { index: false, follow: false } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#304cb3' };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="es"><body>{children}</body></html>; }
