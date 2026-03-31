

# Plan: Identificación de comensales por posición (Silla 1, Silla 2...)

## Problema

La mayoría de comensales no inician sesión — solo escanean el QR para ver el menú. El mesero necesita trabajar con identificadores posicionales ("Silla 1", "Silla 2") en lugar de nombres reales, y poder renombrar si el comensal da su nombre.

## Cambios

### 1. Auto-generación de guests por silla — `tablesStore.ts`

- Agregar acción `initializeSeats(tableId, count)` que crea N guests con nombres `Silla 1`, `Silla 2`, etc., todos con `orderMethod: 'manual'`.
- Agregar campo opcional `seatNumber?: number` a `GuestInfo` para mantener el orden visual.
- Agregar acción `renameGuest(tableId, guestId, newName)` para que el mesero pueda poner nombre real si el comensal lo da.
- Modificar `addGuest` para que el nombre default sea `Silla N+1` si no se proporciona nombre.

### 2. Inicialización rápida de mesa — `TableDetail.tsx`

- Cuando la mesa tiene 0 guests, mostrar un selector rápido: **"¿Cuántos comensales?"** con botones `[1] [2] [3] [4] [5] [6+]`.
- Al seleccionar, se llama `initializeSeats` y se crean los perfiles automáticamente.
- Esto reemplaza el flujo actual donde el mesero tiene que agregar uno por uno.

### 3. Renombrar guest inline — `TableDetail.tsx`

- Al tocar un `GuestPill`, permitir edición inline del nombre (tap → input con el nombre actual → Enter para confirmar).
- Esto permite al mesero poner "Don Pepe" en lugar de "Silla 3" cuando el comensal se identifica.

### 4. Datos de prueba actualizados — `tablesStore.ts`

- Cambiar los guests con nombres genéricos (`C1`, `C4`, `Grupo 1-5`) a usar el formato `Silla N` para consistencia.
- Mantener los que tienen nombre real (Lucía, Pedro, Ana) como ejemplo de guests que sí iniciaron sesión.

### 5. Adaptación visual — `GuestPill.tsx`

- Mostrar icono de silla 🪑 para guests sin sesión (posicionales), 👤 para los que dieron nombre, 📱 para QR con sesión.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `tablesStore.ts` | `initializeSeats`, `renameGuest`, campo `seatNumber`, datos actualizados |
| `TableDetail.tsx` | Selector de cantidad de comensales, edición inline de nombre |
| `GuestPill.tsx` | Icono contextual según tipo de identificación |

## Flujo

```text
Mesa vacía → Mesero abre TableDetail
  → "¿Cuántos comensales?" → [4]
  → Se crean: Silla 1, Silla 2, Silla 3, Silla 4
  → Mesero captura órdenes por silla
  → Si alguien dice su nombre: tap en "Silla 2" → "Don Pepe"
  → Al cobrar: CashPaymentSheet muestra "Silla 1" o "Don Pepe"
```

