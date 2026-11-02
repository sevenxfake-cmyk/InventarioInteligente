# Editores y diseño de la aplicación

## Empresas, sucursales y catálogo

- Empresas: crear y editar nombre, razón social, RUC opcional, dirección, contactos, logo, portada y color.
- Sucursales: crear y editar sedes y filtrar sus almacenes por empresa.
- Productos: crear y editar fichas con fotografía, código único por empresa, categoría, marca, código de barras, unidad y presentación. Archivar y restaurar conserva las ubicaciones anteriores.
- Almacenes: crear, editar y eliminar con confirmación. El tamaño del plano se encuentra en **Avanzado · Distribución del plano** y solo distribuye los andamios.

## Productos por nivel

Haz clic en un andamio del plano para abrir sus niveles. El nivel es una lista de productos: no hay casillas físicas numeradas ni capacidad de productos que configurar.

- **Agregar productos** abre una búsqueda por nombre, código o código de barras. Puedes seleccionar varios productos seguidos; cada selección agrega una ficha real a la lista, sin crear primero una fila vacía.
- El catálogo marca los productos ya añadidos al nivel para evitar agregarlos otra vez desde el selector. Las ubicaciones antiguas se conservan, incluso si incluyen varias referencias al mismo producto.
- **Buscar productos del andamio** filtra las listas guardadas o preparadas. Al buscar, las flechas de orden se desactivan para evitar reordenar productos que no están visibles.
- Cada producto permite cambiar la ficha, moverlo a otro nivel, reordenarlo en la lista o quitar su ubicación sin eliminarlo del catálogo.
- Se configuran de 1 a 12 niveles. Un nivel puede contener muchos productos distintos, sin el límite anterior de ocho espacios. Solo se eliminan niveles vacíos; los superiores se renumeran conservando sus productos.
- **Guardar distribución** aplica todos los cambios en una transacción local. Cerrar con cambios pendientes permite seguir editando o descartarlos.

Las cantidades quedan **por contar**. Agregar o mover una ficha no registra un conteo físico ni modifica existencias. El orden de la lista es independiente de la cantidad y del tamaño del andamio.

El panel muestra niveles, ubicaciones y qué parte del catálogo activo tiene alguna ubicación en el contexto seleccionado. No calcula capacidad física ni “espacios libres” a partir de una cuadrícula.

## Guardado y migración

IndexedDB conserva este borrador en el mismo navegador y origen. Los datos e imágenes todavía no se sincronizan entre dispositivos. Las fotografías JPG/PNG/WebP de hasta 5 MB se reducen a 1200 px para este espacio de prueba.

El modelo v4 convierte los borradores v2 y v3 a listas por nivel. Conserva empresas, sucursales, productos, imágenes, almacenes, andamios, ubicaciones, historial e identificadores. `slot` se transforma en `position`, como orden interno; `Rack.slots` deja de existir. No se deduplican ni descartan ubicaciones. La revisión se conserva y el primer guardado usa la detección de conflictos existente. Se mantiene el mismo nombre de almacenamiento para encontrar los borradores anteriores.

Una revisión antigua en otra pestaña no puede sobrescribir un guardado más reciente. Los errores de formato o cuota se muestran y no sustituyen silenciosamente el borrador.

## Diseño y acceso

Permisos usa el mismo contenedor azul de los editores. `/permisos` abre `/#permissions`; la antigua demo independiente fue retirada. Ingreso, recuperación, carga, errores y página no encontrada comparten marca y controles.

El laboratorio de permisos contiene escenarios ficticios y no cambia cuentas reales. El acceso autenticado y las APIs protegidas siguen separados del borrador local; requieren PostgreSQL y configuración de autenticación.

## Comprobaciones

33 pruebas automatizadas cubren permisos, validaciones, migraciones v2/v3 a v4, reordenamiento y guardado atómico. Incluyen guardar 60 productos distintos en un mismo nivel, mover a un nivel con 30 productos y preservar imágenes e identificadores durante la migración. TypeScript y la compilación se ejecutan antes de publicar.

La nueva prueba visual está pendiente por el bloqueo del navegador de pruebas. Las capturas anteriores en el repositorio reflejan versiones previas. No se ha validado en un teléfono físico ni con una base de producción.
