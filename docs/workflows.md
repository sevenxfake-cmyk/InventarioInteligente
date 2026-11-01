# Flujos y criterios de aceptación

## Primera entrega

Administrador inicial: migrar base → alta privada de propietario → iniciar sesión → ver empresas autorizadas → crear empresa → comprobar que aparece tras recargar. Implementado en código; pendiente de probar con una base de desarrollo configurada.

Administración completa de usuarios: invitar/crear cuenta → vincular trabajador → asignar empresas y almacenes → roles y excepciones → revisar permisos efectivos → confirmar resumen de cambios → auditar. Pendiente.

## Recorrido operativo previsto

Administrador configura organización, empresas y ubicaciones; supervisor abre inventario y asigna espacios; trabajador abre Mis tareas, registra cantidades/evidencias, revisa y entrega; servidor confirma recepción con identificador; supervisor aprueba, devuelve o pide reconteo; cierre verifica pendientes dentro de la transacción.

Dos modalidades: lista previa / desde cero. Conteo ciego es una opción independiente. Cero es un valor; `null` significa pendiente. Unidad de medida determina precisión. El conteo físico no ajusta stock por sí solo.

Estados previstos (no implementados todavía):

| Recurso | Transiciones | Responsable y condición |
| --- | --- | --- |
| Inventario | borrador → activo → pausado / cerrado | supervisor autorizado; cierre sin pendientes dentro de transacción |
| Tarea | asignada → en proceso → recibida | trabajador asignado; recepción confirmada por servidor |
| Entrega | recibida → aprobada / devuelta / reconteo | supervisor con permiso; motivo al devolver; doble control |
| Borrador offline | guardado local → pendiente → recibido / conflicto | revalidar sesión, permiso, asignación y versión al sincronizar |

Reaperturas, correcciones y reasignaciones deben conservar autor, valores previos y motivo. Cada entrega llevará clave de idempotencia y versión; conflictos no se sobrescriben silenciosamente. Inventarios cerrados y reasignaciones invalidan autorizaciones antiguas.

Offline será complementario: IndexedDB por cuenta/organización, autorización con caducidad, descarga mínima, reintento visible al abrir. La revocación no borra mágicamente un dispositivo desconectado. Nada de este modo está habilitado todavía.

## Pruebas

`tests/permissions.test.ts` cubre A–E a nivel de reglas, prioridad de denegación, aislamiento, falta de membresía y doble control. Antes de dar por terminada la primera entrega se requiere probar sesión real + DB + endpoints, cambios de URL, desactivación con sesión abierta y último propietario con operaciones concurrentes.

Antes de inventario operativo: persistencia tras recarga, cero/pendiente, reintento de entrega, edición concurrente, cierre concurrente, exportación sin costos, restauración con fotos y recorrido en móvil físico. No se presentan como pruebas pasadas en este avance.
