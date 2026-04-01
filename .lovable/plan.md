

# Plan: Mejoras al módulo de Hostess

## Resumen
Expandir el área de Hostess con más mesas, mesero asignado visible, capacidad de cerrar/liberar mesas, formulario para agregar personas a la lista de espera, reservaciones integradas en la lista, y tiempos de espera estimados.

## Cambios

### 1. Más mesas en el store (`tablesStore.ts`)
- Agregar mesas vacías hasta llegar a 15 (actualmente hay ~6). IDs: 1, 3, 5, 8, 10, 12, 13, 14, 15 como mesas vacías adicionales.
- Agregar campo `assignedWaiter?: string` a `WaiterTable`. Las mesas mock tendrán nombres como "Carlos", "Luis", "María".

### 2. Dashboard de Hostess — mesero y cerrar mesa (`HostessDashboard.tsx`)
- Mostrar nombre del mesero asignado debajo del número de mesa en cada card.
- Mesas con status `paying` + todos pagaron: mostrar botón "Liberar mesa" que llama a `closeTable(id)` y muestra toast.
- Agregar un estado visual para "Por limpiar" (mesas donde todos pagaron pero no se han cerrado).

### 3. Lista de espera — popup fix (`WaitlistPage.tsx`)
- Cambiar el popup de selección de mesa de `fixed items-end` a `items-center` para que se vea centrado en la pantalla y no quede cortado.

### 4. Agregar personas a la lista de espera (`WaitlistPage.tsx`)
- Botón flotante "+" o botón en header para abrir un formulario inline o sheet.
- Campos: nombre, número de personas, notas opcionales (ej: "cumpleaños").
- Al agregar, se inserta al final de la lista con timestamp actual.

### 5. Reservaciones en la lista de espera (`WaitlistPage.tsx`)
- Extender `WaitlistEntry` con campos: `type: 'walkin' | 'reservation'`, `reservationTime?: string`.
- Mock de 2-3 reservaciones con horarios cercanos, intercaladas en la lista.
- Las reservaciones se ordenan por hora de reserva; los walk-ins por tiempo de espera.
- La lista se ordena estratégicamente: primero reservaciones cuya hora ya llegó, luego walk-ins por antigüedad, luego reservaciones futuras.
- Visual: badge "Reservación · 8:30 PM" distinto al de walk-in.

### 6. Tiempos de espera estimados (`WaitlistPage.tsx`)
- Calcular estimación basada en: número de mesas ocupadas, tiempo promedio de ocupación actual, tamaño del grupo vs capacidad de mesas libres.
- Fórmula simple: `estimatedWait = (posición en cola) × avgTurnoverTime / mesasLibres` (con mínimo de 5 min).
- Mostrar "~15 min" en cada entry de la lista.
- Al agregar nueva persona, mostrar el tiempo estimado antes de confirmar.

## Archivos modificados
- `src/stores/tablesStore.ts` — agregar `assignedWaiter` al tipo, más mesas mock
- `src/pages/hostess/HostessDashboard.tsx` — mesero visible, botón liberar mesa
- `src/pages/hostess/WaitlistPage.tsx` — fix popup, formulario agregar, reservaciones, tiempos estimados

## No incluye
- Persistencia de reservaciones
- Notificaciones SMS/WhatsApp al cliente
- Edición de reservaciones existentes

