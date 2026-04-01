
# Plan: Tiempos de preparación de bebidas con alertas

## Resumen
Similar al cronómetro de cocina, agregar tiempo estimado de preparación a las bebidas y mostrar alertas de retraso tanto al barman como al mesero.

## Cambios

### 1. Store de barra (`barStore.ts`)
- Agregar `estimatedMinutes?: number` y `preparingStartedAt?: string` al tipo `DrinkOrder`.
- Al cambiar status a `preparing`, auto-setear `preparingStartedAt = now` y `estimatedMinutes = 5` (las bebidas son más rápidas que la cocina).

### 2. Dashboard del Barman (`BarDashboard.tsx`)
- En la sección "En preparación", mostrar el `CookingTimer` (reutilizado) con el tiempo de cada bebida.
- Bebidas retrasadas: borde rojo + badge "⏰ RETRASADO".
- Ordenar las bebidas en preparación: las retrasadas primero.

### 3. Vista del mesero — TableDetail (`TableDetail.tsx`)
- Agregar sección similar a la de cocina pero para bebidas en preparación.
- Mostrar cronómetro y botón "🔔 Recordar a barra" que envía notificación tipo `bar-msg`.

### 4. TableCard del mesero (`TableCard.tsx`)
- Si hay bebidas retrasadas en barra, mostrar indicador "🍸 +Xmin" en la card (similar al de cocina).

## Archivos modificados
- `src/stores/barStore.ts` — campos de tiempo
- `src/pages/bar/BarDashboard.tsx` — cronómetro en preparación
- `src/pages/TableDetail.tsx` — sección de bebidas + recordar a barra
- `src/components/waiter/TableCard.tsx` — indicador de retraso de bebidas
