'use client';
import { useEffect, useState } from 'react';
import { Check, Download, Smartphone, WifiOff } from 'lucide-react';
import { Drawer } from './ui';
type InstallPrompt = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
    }>;
};
export default function AppInstall() {
    const [prompt, setPrompt] = useState<InstallPrompt | null>(null), [help, setHelp] = useState(false), [installed, setInstalled] = useState(false), [error, setError] = useState('');
    useEffect(() => {
        setInstalled(window.matchMedia('(display-mode: standalone)').matches);
        const ready = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt); };
        const complete = () => { setInstalled(true); setPrompt(null); };
        window.addEventListener('beforeinstallprompt', ready);
        window.addEventListener('appinstalled', complete);
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production')
            void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => { });
        return () => { window.removeEventListener('beforeinstallprompt', ready); window.removeEventListener('appinstalled', complete); };
    }, []);
    async function install() { if (!prompt) {
        setHelp(true);
        return;
    } try {
        await prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
    }
    catch {
        setError('La instalación no se pudo abrir. Usa el menú del navegador.');
        setHelp(true);
    } }
    return <><button className="install-app-button" onClick={() => void install()}>{installed ? <Check size={17}/> : <Download size={17}/>}<span>{installed ? 'App instalada' : 'Instalar en mi dispositivo'}</span></button>{help && <Drawer eyebrow="APLICACIÓN EN TU DISPOSITIVO" title="Lleva tu inventario contigo" subtitle="Instala la versión web como una aplicación en tu pantalla de inicio." onClose={() => setHelp(false)}><div className="space-y-6 p-7"><div className="install-preview"><img src="/app-icons/icon-192.png" alt="Icono de Inventario Inteligente"/><strong>Inventario Inteligente</strong><span>Acceso directo a tu espacio de trabajo</span></div><div className="install-instructions"><h3><Smartphone size={19}/>Desde Android</h3><ol><li>Abre esta página en Chrome.</li><li>En el menú ⋮, elige <strong>Instalar aplicación</strong> o <strong>Añadir a la pantalla de inicio</strong>.</li><li>Confirma y abre Inventario desde el nuevo icono.</li></ol><p>En iPhone: Safari → Compartir → Añadir a pantalla de inicio. En computadora, busca la opción de instalar en la barra del navegador.</p></div><div className="connection-note"><WifiOff size={18}/><p>Necesitas conexión para abrir la app. Los borradores guardados en este navegador se conservan; el conteo y la sincronización sin conexión siguen en desarrollo.</p></div><p className="text-xs leading-6 text-slate-500">Esta instalación web no es un archivo APK. El empaquetado y firma de la aplicación Android se preparan por separado.</p>{error && <p role="alert" className="text-sm text-rose-600">{error}</p>}</div></Drawer>}</>;
}
