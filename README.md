# Inventario Inteligente

Nueva plataforma de inventario, independiente del proyecto anterior. Primera entrega **en desarrollo**, con una demostración pública de consulta y una base de acceso real que requiere configurar PostgreSQL. No está lista para datos operativos.

## Incluido en este avance

- Next.js 16.4.3, React 19.3, TypeScript y Tailwind CSS 4, con lockfile.
- Interfaz adaptable con panel, inventarios ficticios, búsqueda y filtros, equipo, organización, explorador de permisos y hoja de ruta.
- Motor de permisos compartido con validación de organización, empresa, almacén, trabajo asignado y propietario del registro. Denegación explícita prevalece.
- Better Auth 1.7 con registro público desactivado, sesiones persistidas en PostgreSQL, caché de sesión deshabilitada y límites de intentos en base de datos.
- API protegida para listar las empresas autorizadas y crear empresas con auditoría transaccional.
- Migración reproducible de identidad, organizaciones, empresas, trabajadores, membresías, roles y auditoría.
- Script de alta inicial sin credenciales predeterminadas y nueve pruebas del motor de autorización (incluyen A–E).

La demo `/` usa exclusivamente datos ficticios incluidos en el código. Su selector de personas es un explorador de reglas, no una sesión ni una suplantación. La sesión real vive en `/login` y `/workspace`.

## Ejecutar

Node.js 22 o 24 y npm:

```bash
npm ci
npm run dev
npm test
npm run typecheck
npm run build
```

Abre `http://localhost:3000`. No necesitas secretos para la demo. La compilación tampoco se conecta a una base de datos.

## Habilitar el acceso real

1. Crea una base PostgreSQL **de desarrollo** (local o alojada) y copia `.env.example` a `.env.local`.
2. Configura `DATABASE_URL`, un secreto aleatorio de al menos 32 caracteres en `BETTER_AUTH_SECRET` y el origen exacto en `BETTER_AUTH_URL`.
3. Ejecuta `npm run db:migrate`.
4. En un terminal confiable define temporalmente las variables `BOOTSTRAP_EMAIL`, `BOOTSTRAP_NAME`, `BOOTSTRAP_PASSWORD` (mínimo 12 caracteres) y `BOOTSTRAP_ORGANIZATION`. Ejecuta `npm run db:bootstrap` y retira esas variables. El script no imprime la contraseña. No las subas al repositorio ni las guardes en Vercel.
5. Abre `/login`, inicia sesión y crea la primera empresa en `/workspace`.
6. Para recuperación de acceso configura Resend y un remitente verificado; ambos son opcionales para la demo. No se envían correos sin configuración.

## Vercel

Importa `sevenxfake-cmyk/InventarioInteligente`. Framework Next.js, directorio raíz vacío, instalación `npm ci` y compilación `npm run build`, Node 24. No se requiere una carpeta de salida personalizada. El avance funciona sin variables de entorno; el acceso real muestra que está pendiente.

Las migraciones se ejecutan explícitamente desde un terminal confiable, no durante cada build. Para conectar una preview, usa una base de desarrollo separada y un origen estable; el origen de Better Auth debe coincidir con el dominio de esa preview. No conectes las previews a la base de producción.

## Lo que sigue

La primera entrega aún necesita administración completa de usuarios y roles, invitaciones, revocación de sesiones desde UI y pruebas integradas sobre PostgreSQL. No hay endpoints públicos para delegar permisos. El rol propietario es una plantilla de permisos dentro de su organización; no concede acceso a otras organizaciones.

Catálogo, ubicaciones reales, inventarios operativos, conteos persistentes, aprobación, exportaciones, fotografías y modo offline se implementarán en las etapas 2–5. Los botones de la demo permiten navegar y consultar ejemplos; no simulan guardados ni entregas.

## Verificación

Pruebas automatizadas del motor: `npm test`. Validación TypeScript: `npm run typecheck`. Compilación: `npm run build`. Los escenarios A–E prueban reglas de autorización, **no** un recorrido de producción con cuentas, API y base de datos reales. La conexión real, restauración, correo y dispositivos físicos requieren sus pruebas correspondientes antes del uso operativo.

Ver [arquitectura y permisos](docs/architecture.md), [flujos y aceptación](docs/workflows.md) y [operación, costos y migración](docs/operations.md).
