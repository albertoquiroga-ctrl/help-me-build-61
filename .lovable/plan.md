

# Plan: Tiempo de espera en cocina con alertas de retraso

## Resumen
Agregar a cada ronda con status `cooking` un tiempo estimado de preparación y un cronómetro ascendente visible. Cuando el tiempo real supere el estimado, la ronda se marca en rojo como retrasada, con opción de enviar un recordatorio a cocina.

## Cambios

### 1. Store — tiempo estimado por ronda (`tablesStore.ts`)
- Agregar `estimatedMinutes?: number` y `cookingStartedAt?: string` al tipo `Round`.
- Las rondas mock con status `cooking` tendrán valores iniciales (ej: estimatedMinutes: 15, cookingStartedAt hace X minutos).
- Al cambiar una ronda a `cooking` vía `updateRoundStatus`, auto-setear `cookingStartedAt = now` y `estimatedMinutes` default (15 min).

### 2. Indicador de tiempo en TableDetail (`TableDetail.tsx`)
- En la vista de rondas, para cada ronda `cooking`:
  - Mostrar cronómetro ascendente (minutos:segundos desde `cookingStartedAt`).
  - Mostrar tiempo prometido: "Estimado: 15 min".
  - Si elapsed > estimatedMinutes: borde rojo, texto rojo, badge "⏰ RETRASADO +Xmin".
- Botón "🔔 Recordar a cocina" que genera una notificación tipo `kitchen-msg` en el store y muestra toast de confirmación.

### 3. Alerta en WaiterDashboard (`WaiterDashboard.tsx`)
- En las TableCards del mesero, si alguna ronda `cooking` está retrasada, mostrar un indicador rojo pequeño (ej: "⏰ R2 +5min") para que el mesero vea desde el dashboard qué mesas tienen retrasos.

### 4. Componente CookingTimer (nuevo, `src/components/waiter/CookingTimer.tsx`)
- Componente reutilizable que recibe `startedAt` y `estimatedMinutes`.
- Muestra elapsed time con `useEffect` interval.
- Cambia color: verde (< 70% del tiempo), amarillo (70-100%), rojo (> 100%).
- Exporta también un hook o prop `isOverdue` para uso externo.

## Archivos
- **Nuevo**: `src/components/waiter/CookingTimer.tsx`
- **Modificados**: `tablesStore.ts` (tipo Round + mock data), `TableDetail.tsx` (timer + botón recordar), `WaiterDashboard.tsx` (indicador de retraso en cards)

