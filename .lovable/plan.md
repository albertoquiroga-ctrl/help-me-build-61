

# Plan: Flujo realista de identificación — Guest → Silla (asignada por mesero)

## Contexto

Los comensales que escanean el QR sin iniciar sesión aparecen como "Guest 1", "Guest 2", etc. Los que sí tienen cuenta aparecen con su nombre real (e.g. "Pedro"). **Ninguno tiene silla asignada automáticamente** — el mesero asigna la posición en la mesa después de confirmar la orden.

## Flujo corregido

```text
Comensales escanean QR → aparecen como "Guest 1", "Pedro", "Guest 3"
  → Ordenan (QR o menú físico)
  → Mesero confirma orden, captura las faltantes
  → Mesero asigna silla a cada comensal: "Guest 1" → Silla 1, "Pedro" → Silla 2
  → A la hora de cobrar: todo se muestra por posición (Silla 1, Silla 2...)
  → Mesero cobra uno por uno a los que no pagaron desde el app
```

## Cambios

### 1. Modelo de datos — `tablesStore.ts`

- Separar `name` (identidad del comensal: "Guest 1", "Pedro") de `seatLabel` (posición asignada por mesero: "Silla 1", null si no asignada).
- Agregar campo `seatLabel?: string` a `GuestInfo`.
- Agregar acción `assignSeat(tableId, guestId, seatNumber)` que pone `seatLabel = "Silla N"`.
- Agregar acción `assignAllSeats(tableId)` que asigna sillas automáticamente a todos los guests sin silla, en orden.
- Modificar `initializeSeats` para que cree guests con nombre "Guest N" y sin silla asignada (la silla se asigna después).
- Actualizar mock data: guests con `name: "Guest 1"` / `"Pedro"` y `seatLabel: "Silla 1"` o `undefined`.

### 2. UI de asignación de sillas — `TableDetail.tsx`

- Mostrar banner "Asignar posiciones" cuando hay guests sin `seatLabel`.
- Botón "Asignar sillas automáticamente" que llama `assignAllSeats` (asigna Silla 1, 2, 3... en orden).
- Opción de asignar manualmente: tap en un guest → selector de número de silla.
- Una vez asignadas, los guests se muestran como "Silla 1 (Pedro)" o "Silla 2 (Guest 1)".

### 3. Display inteligente — `GuestPill.tsx`

- Si tiene `seatLabel`: mostrar `🪑 Silla 2 · Pedro` o `🪑 Silla 1` (si el nombre es genérico Guest N, solo mostrar la silla).
- Si no tiene `seatLabel`: mostrar `👤 Pedro` o `📱 Guest 1` como ahora.
- En contexto de cobro (`CashPaymentSheet`), siempre priorizar `seatLabel` sobre `name`.

### 4. Cobro por posición — `CashPaymentSheet.tsx`

- Mostrar el `seatLabel` como identificador principal en el header y lista de items.
- Si el guest tiene nombre real, mostrarlo como subtítulo: "Silla 2 · Pedro".

### 5. Mock data actualizado — `tablesStore.ts`

- Mesas con guests que tienen nombres genéricos ("Guest 1") y algunos con nombre real ("Pedro", "Ana").
- Mesas donde las sillas ya fueron asignadas (mesas avanzadas) y mesas donde aún no (mesas recién abiertas).

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `tablesStore.ts` | Campo `seatLabel`, acciones `assignSeat`/`assignAllSeats`, mock data |
| `TableDetail.tsx` | Banner de asignación de sillas, botón automático, display dual |
| `GuestPill.tsx` | Display condicional seatLabel + name |
| `CashPaymentSheet.tsx` | Priorizar seatLabel en header e items |

