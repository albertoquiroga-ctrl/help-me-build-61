# Plan: Abrir mesa

## Resumen
Las mesas vacías tendrán un botón "Abrir mesa" que pide número de personas y crea los comensales. Si alguien escanea el QR de una mesa vacía, se genera una notificación al mesero para confirmar la apertura.

## Cambios

### 1. Store — `openTable` action (`tablesStore.ts`)
- Nueva acción `openTable(tableId: string, guestCount: number)` que:
  - Crea N comensales con `Silla 1..N` y estado pending
  - Cambia status a `active`
  - Resetea `timeOpened` a 0

### 2. UI — Abrir mesa desde `TableCard` vacío
- En el card de mesa vacía (dashboard), agregar botón "Abrir mesa"
- Al tocarlo se abre un **Dialog** simple pidiendo número de personas (input numérico, 1-20)
- Al confirmar llama `openTable`

### 3. UI — Abrir mesa desde `TableDetail` vacío
- Si la mesa está vacía, mostrar estado vacío con botón "Abrir mesa" y el mismo dialog

### 4. Notificación — Escaneo QR en mesa vacía
- Agregar datos mock: una notificación tipo `qr-checkin` para simular que alguien escaneó el QR de mesa 9
- La notificación dice "Cliente escaneó QR · Mesa 9 — ¿Abrir mesa?"
- Al confirmar desde alertas, abre la mesa con 1 comensal inicial

## No incluye
- Rol de hostess separado (un solo rol flexible)
- Flujo real de QR (solo simulación con datos mock)
