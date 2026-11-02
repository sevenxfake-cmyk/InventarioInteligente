import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: '/', name: 'Inventario Inteligente', short_name: 'Inventario', description: 'Empresas, sucursales, productos y almacenes en una sola aplicación.',
        start_url: '/', scope: '/', lang: 'es-PE', display: 'standalone', orientation: 'any', background_color: '#f2f4fa', theme_color: '#304cb3',
        icons: [{ src: '/app-icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/app-icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/app-icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
        shortcuts: [{ name: 'Productos', url: '/#products', icons: [{ src: '/app-icons/icon-192.png', sizes: '192x192' }] }, { name: 'Almacenes', url: '/#warehouses', icons: [{ src: '/app-icons/icon-192.png', sizes: '192x192' }] }]
    };
}
