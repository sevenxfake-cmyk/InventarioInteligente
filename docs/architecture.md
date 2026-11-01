# Arquitectura y permisos

## Módulos

- `app/`, `components/`: interfaz y rutas Next.js. La demo está separada del espacio real.
- `lib/permissions.ts`: reglas puras de autorización; no dependen del navegador ni de nombres de rol.
- `lib/server-access.ts`: identidad, cuenta activa y carga vigente de membresías y permisos desde PostgreSQL; sin caché compartida entre solicitudes.
- `lib/auth.ts`: Better Auth. Cookies seguras administradas por la biblioteca, sin registro público y limitador persistente en PostgreSQL.
- `lib/db.ts`, `migrations/`: persistencia PostgreSQL mediante consultas parametrizadas.
- Archivos e integraciones: interfaces y módulos por implementar cuando se incorporen fotografías y otros servicios. No existe almacenamiento de fotos en este avance.

Monolito modular portátil; no necesita una PC encendida ni Tailscale. No usa localStorage para datos operativos ni para autorización. Los secretos se leen exclusivamente en servidor. Las importaciones grandes se procesarán con trabajos persistentes e idempotentes, fuera de la petición web; no están implementadas.

## Modelo

Organización → empresas → sucursales → almacenes → espacios/andamios → niveles → ubicaciones de producto. Desde sucursales en adelante son entidades previstas para siguientes migraciones.

Cuenta de acceso (`user`, `app_users`) separada de trabajador (`workers`). Una persona puede ser miembro de una organización y tener membresías diferentes en cada empresa. Los roles pertenecen a la organización y se asignan **a una membresía de empresa**. Nunca se unen permisos por usuario ignorando la empresa.

`company_memberships.warehouse_ids`: `NULL` significa todos los almacenes de la empresa; `[]` no permite recursos de almacén. Toda futura ruta de almacén debe pasar el almacén real, cargado desde DB, a `can`; no confiar en el valor enviado por el cliente.

## Precedencia

1. Sin sesión válida o cuenta/membresía activa: rechazo.
2. Organización y empresa deben coincidir exactamente.
3. El almacén debe pertenecer al ámbito de la membresía.
4. Se reúnen reglas de roles de esa membresía y excepciones individuales.
5. Denegación explícita aplicable gana a concesiones, independientemente del orden.
6. Si no hay concesión aplicable: denegado.
7. El caso de uso comprueba estado y doble control. `canApprove` requiere entrega recibida y evita aprobación propia por defecto.

Las excepciones usan el mismo formato de reglas; no superan los límites de empresa/almacén. No existe aún una API de delegación; cuando se incorpore, validará que el delegado no reciba privilegios ni ámbitos superiores a los que el actor puede delegar. La pantalla actual consulta permisos ficticios; la edición, duplicación y comparación de roles están pendientes.

La capacidad organizacional `can_manage_companies` controla la creación de empresas; no otorga por sí misma otros permisos. Un propietario inicial recibe una plantilla explícita de reglas al crear su organización. Un trigger protege al último propietario activo de una organización contra baja o cambio de propietario.

## Seguridad pendiente de verificación integral

Los endpoints implementados omiten costos porque aún no consultan productos ni valores monetarios. Antes de crear exportaciones habrá que usar proyecciones de datos basadas en permisos; ocultar columnas en la pantalla no bastará.

La desactivación de `app_users`, de la membresía organizacional o de empresa se verifica en las siguientes operaciones del servidor. No se elimina trabajo ni historial. La UI de desactivación y revocación está pendiente. No se debe desactivar globalmente al último propietario mediante SQL directo: la baja administrativa debe actualizar primero su membresía con el guard de propietario y revocar sesiones dentro de una transacción.
