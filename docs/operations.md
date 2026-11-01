# Operación, costos y portabilidad

## Dependencias externas y costos

Referencias oficiales consultadas el 1 de noviembre de 2026; verificar precios antes de contratar. No se ha contratado ni actualizado ningún plan.

| Servicio | Uso | Referencia de costo / límite |
| --- | --- | --- |
| Vercel | Hosting inicial | Hobby USD 0, limitado a uso personal/no comercial. Pro desde USD 20/mes más consumo e impuestos. Este avance es una demostración de desarrollo. Para operación comercial, evaluar un plan apropiado. https://vercel.com/pricing y https://vercel.com/docs/plans/hobby |
| PostgreSQL / Neon opcional | Datos e identidad | Neon Free USD 0 con cuotas publicadas; referencia consultada: 0.5 GB por proyecto, 100 CU-h y 5 GB de transferencia. No aprovisionado. También admite PostgreSQL propio. https://neon.com/pricing |
| Better Auth | Autenticación dentro de la app | Biblioteca, sin cuota alojada propia; consume DB y hosting. https://better-auth.com/docs |
| Resend opcional | Recuperación por correo | No configurado. Costo depende de plan y volumen; verificar https://resend.com/pricing antes de habilitar. |
| Almacenamiento de objetos | Fotos privadas, etapa 5 | Proveedor y presupuesto pendientes. No existe carga de fotos en este avance; estimar por GB, operaciones y salida. |

No hay estimación total fiable sin usuarios activos, número/tamaño de fotografías y retención. Para la demo sin servicios conectados el costo incremental previsto es cero dentro del plan disponible; no equivale a un compromiso de producción gratuita.

## Respaldos

Antes de uso operativo, automatizar `pg_dump --format=custom` con retención y almacenamiento cifrado independiente. Validar recuperación en base aislada con `pg_restore --no-owner`, aplicar migraciones pendientes y probar sesión, membresías y auditoría. Las URL de conexión se inyectan desde secretos, nunca se suben al repositorio.

En este avance solo existen tablas de identidad/organización: no hay archivos operativos. Cuando se añadan fotos, generar un manifiesto de objetos con versiones y checksums coherente con la copia de DB. Una copia de la base sin evidencias no será respaldo completo. La restauración real está pendiente de prueba; no se afirma que se haya ejecutado.

## Cambio de dominio o servidor

1. Aprovisionar PostgreSQL destino y comprobar copia restaurada.
2. Configurar Node 22/24, `npm ci`, `npm run build`, `npm start` bajo supervisor de procesos y proxy HTTPS.
3. Inyectar secretos, definir `BETTER_AUTH_URL` al nuevo origen y validar cookies, acceso y recuperación. Puede requerir iniciar sesión nuevamente por cambio de dominio.
4. Aplicar migraciones reproducibles con `npm run db:migrate` desde un terminal seguro.
5. Probar aislamiento entre organizaciones y empresas antes de cambiar DNS.
6. Reducir TTL, cambiar DNS, observar errores y conservar rollback del código y datos.

No se guarda PostgreSQL ni fotografías en el disco efímero de Vercel. `next start` es suficiente para alojar este monolito en un servidor con Node; no hay API propietaria de Vercel en las reglas del negocio.

## Versiones

Documentación oficial: https://nextjs.org/docs/app/getting-started/installation, https://tailwindcss.com/docs/installation/framework-guides/nextjs, https://better-auth.com/docs/integrations/next. Se revisaron también las guías incluidas en la versión local de Next y los campos del adaptador de Better Auth. `package-lock.json` fija la resolución instalada. Las migraciones de identidad deben revisarse al actualizar Better Auth.
