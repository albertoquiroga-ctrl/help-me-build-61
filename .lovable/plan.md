

# Plan: Gaps entre el estado actual y los Jobs del Waiter

## Estado actual vs. Plan

Revisé todas las pantallas, stores, overlays y componentes existentes contra los 12 jobs definidos en tu documento. La app ya tiene una base sólida, pero hay gaps funcionales importantes en casi todas las pantallas.

---

## Gaps por pantalla

### W-01 Dashboard — Ajustes menores
- **Zero state** falta: cuando no hay mesas activas, debe mostrar ilustracion + "Tu turno acaba de empezar..."
- **Status dot logic** incompleta: actualmente usa strings hardcoded (`statusText`). Debe derivarse automáticamente de los rounds y pagos (pending round → ambar pulsing, payment failed → rojo, processing → azul)
- **Sim FAB**: los eventos simulados no actualizan los stores realmente (solo muestran overlays). Deben mutar `tablesStore` y `notificationsStore` para que el flujo sea coherente

### W-02 Detalle de mesa — Faltan acciones contextuales
- **Acciones contextuales dinámicas**: solo tiene "Marcar como entregado". Falta:
  - Round pendiente → "Confirmar orden" / "Rechazar"
  - Todo entregado + nadie pagando → "Sugerir cuenta"
- **Status por item**: el plan pide status individual por item dentro de un round (entregado/listo/en cocina/pendiente). Actualmente el status es por round completo
- **Propinas de esa mesa**: la sección existe pero es solo texto. Podría mostrar breakdown por comensal

### W-03 Orden entrante — Bien implementado
- La pantalla existe y funciona con timer de 45s y auto-confirm
- **Gap menor**: no registra la notificación en el store ni actualiza el estado de la mesa al confirmar/rechazar

### W-04 Rechazo — Bien implementado
- Flujo completo de rechazo parcial/total con razones. Funcional

### W-05 Orden lista — Gap medio
- El overlay `OrderReadyCard` existe pero:
  - **Falta timer counting-up** desde que está lista (el plan pide esto)
  - **Falta escalamiento**: si lleva >15 min sin entregar → alerta adicional
  - **Falta checklist de pickup** integrado (el componente `PickupChecklist` existe pero no se usa en el overlay)

### W-06 Llamado de servicio — Gap medio
- `ServiceCallCard` existe pero:
  - **Falta el flujo de dos estados**: (1) "Visto — voy en camino ✓" → (2) "Marcar como atendido"
  - Actualmente solo tiene dismiss, no feedback al guest
  - **Falta el motivo específico** del guest (agua, cubiertos, cuenta, otro)

### W-07 Propinas — Bien implementado
- Hero, timeline, modo propina, gráfico semanal. Todo cubierto

### W-08 Pago fallido — Gap medio
- `PaymentFailedAlert` existe pero:
  - **"Esperar" con doble confirmación** parcialmente implementado. Verificar que tenga selector de tiempo (2 min / 5 min) y countdown secundario
  - Debe ser **no dismissable sin acción** (verificar que no se pueda cerrar haciendo tap fuera)

### W-09 Cierre de mesa — Gap menor
- `TableCloseCard` existe. Verificar:
  - Muestra total facturado, propinas, rondas, tiempo
  - Auto-close countdown de 2 min
  - "Mantener abierta" con confirmación

### W-10 Salida anticipada — Gap menor  
- `EarlyExitNotification` existe. Verificar que actualice:
  - El tip counter en tiempo real
  - El estado de quién queda en la mesa

### W-11 Alertas — Gap medio
- La lista existe con filtros, pero:
  - **Tap en alerta no navega al detalle** correspondiente (solo muestra card estática)
  - Las alertas no se generan automáticamente al simular eventos

### W-12 Perfil — Bien implementado
- Nombre, turno, toggles, cerrar turno. Cubierto

---

## Plan de implementación (7 tareas)

### Tarea 1: Status dot derivado automáticamente
Refactorizar `TableCard` para que el status dot se calcule desde los datos reales del store (rounds con status pending → ambar, payment failed en guests → rojo, guests pagando → azul) en vez de depender de `statusText` hardcoded. Agregar zero state al dashboard.

### Tarea 2: Acciones contextuales en W-02
Agregar botones dinámicos en `TableDetail` según el estado actual: "Confirmar orden"/"Rechazar" cuando hay round pendiente, "Sugerir cuenta" cuando todo está entregado y nadie paga.

### Tarea 3: Simulaciones que mutan stores
Hacer que los eventos del FAB ⚡ realmente modifiquen los stores: agregar round pendiente a mesa 4, cambiar status de round a 'ready', agregar notificación al queue, marcar pago como fallido, etc. Esto conecta los overlays con el estado real.

### Tarea 4: Mejorar OrderReadyCard (W-05)
Agregar timer counting-up (tiempo esperando desde que está lista), integrar `PickupChecklist`, y agregar lógica de escalamiento visual si lleva >15 min.

### Tarea 5: Flujo de dos estados en ServiceCallCard (W-06)
Implementar: estado 1 "Visto — voy en camino ✓" que cambia a estado 2 "Marcar como atendido". Mostrar motivo específico del llamado (agua, cubiertos, cuenta).

### Tarea 6: Alertas navegables (W-11)
Hacer que tap en cada alerta navegue al detalle relevante (mesa, overlay) y que los eventos simulados generen notificaciones automáticamente en el store.

### Tarea 7: Pago fallido no-dismissable (W-08)
Asegurar que `PaymentFailedAlert` no se pueda cerrar sin acción, verificar el flujo de "Esperar" con selector de tiempo y countdown secundario.

---

## Resumen de esfuerzo

- **Ya funcional** (gaps menores): W-03, W-04, W-07, W-09, W-10, W-12
- **Necesita trabajo medio**: W-01, W-02, W-05, W-06, W-08, W-11
- **Archivos principales a modificar**: `TableCard.tsx`, `TableDetail.tsx`, `WaiterDashboard.tsx`, `OrderReadyCard.tsx`, `ServiceCallCard.tsx`, `PaymentFailedAlert.tsx`, `AlertsQueue.tsx`, `tablesStore.ts`, `notificationsStore.ts`

