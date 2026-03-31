

# Plan: Captura manual de órdenes y pago presencial para comensales sin QR

## Problema

El comensal mexicano promedio no siempre usa el QR. El mesero necesita:
1. **Al ordenar**: Verificar quién ya pidió por QR y capturar manualmente los platillos de quien no lo hizo, asignándolos al comensal correcto.
2. **Al pagar**: Generar una cuenta física para quienes no pagan por QR, manteniendo la división clara.

## Cambios

### 1. Modelo de datos — `tablesStore.ts`

- Agregar campo `orderMethod: 'qr' | 'manual'` a `GuestInfo` para distinguir cómo ordenó cada comensal.
- Agregar campo `paymentMethod: 'qr' | 'cash' | 'card-physical' | null` a `GuestInfo` para saber cómo pagará.
- Agregar campo `assignedTo?: string` (guest ID) a `OrderItem` para vincular cada platillo a un comensal específico.
- Agregar acción `addManualOrder(tableId, guestId, items[])` que crea o agrega items a un round pendiente marcado como manual.
- Agregar acción `markGuestPaidCash(tableId, guestId)` para registrar pago presencial.

### 2. Verificación de orden en mesa — `TableDetail.tsx`

Agregar una sección **"Verificar pedidos"** visible cuando hay una ronda pendiente o recién confirmada:
- Lista de comensales con indicador: ✅ "Pidió por QR" / ⚠️ "Sin pedido".
- Botón **"+ Capturar orden"** junto a cada comensal sin pedido, que abre un bottom sheet para agregar platillos manualmente.
- Al confirmar la ronda, todos los items (QR + manuales) se envían juntos a cocina.

### 3. Bottom sheet de captura manual — Nuevo componente `ManualOrderSheet.tsx`

- Header: "Capturar orden · [Nombre del comensal]"
- Buscador de platillos con lista filtrable (menú hardcoded para el prototipo: ~15 items organizados por categoría).
- Cada item tiene botón +/- para cantidad.
- Resumen al fondo con total y botón "Agregar a la ronda".
- Al confirmar, los items se agregan al round pendiente con `assignedTo` = guest ID y `orderMethod` = 'manual'.

### 4. Flujo de pago presencial — `TableDetail.tsx`

Cuando la mesa está en estado "Todo entregado" o "Pagando":
- Mostrar por cada comensal sin pago QR: botón **"Cobrar en mesa"**.
- Al tocar, abrir un mini-overlay que muestra el desglose de lo que debe ese comensal (sus items asignados) con opciones: "Pagó efectivo ✓" / "Pagó con tarjeta física ✓".
- Esto marca al comensal como `paid` con el `paymentMethod` correspondiente.
- El `GuestPill` mostrará un icono diferente según método: 📱 (QR), 💵 (efectivo), 💳 (tarjeta física).

### 5. Indicadores visuales — `GuestPill.tsx`

- Agregar icono de método de orden/pago: 📱 para QR, ✏️ para manual.
- Los comensales sin pedido muestran "⚠️ Sin pedido" en vez del monto.

### 6. Simulación — `WaiterDashboard.tsx`

Agregar un evento de simulación: **"Comensal sin QR en Mesa 7"** que marca a un guest como sin pedido para probar el flujo de captura manual.

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `tablesStore.ts` | Nuevos campos en tipos, nuevas acciones |
| `TableDetail.tsx` | Sección de verificación + botón cobrar en mesa |
| `ManualOrderSheet.tsx` | **Nuevo** — Bottom sheet de captura manual |
| `CashPaymentSheet.tsx` | **Nuevo** — Mini-overlay de cobro presencial |
| `GuestPill.tsx` | Iconos de método de orden/pago |
| `WaiterDashboard.tsx` | Nuevo evento de simulación |

## Flujo completo

```text
Mesa abierta → Comensales escanean QR
                    ↓
        ┌── Todos pidieron ──→ Confirmar ronda normal
        │
        └── Faltan pedidos ──→ TableDetail muestra ⚠️
                                    ↓
                            Mesero toca "+ Capturar orden"
                                    ↓
                            ManualOrderSheet (buscar, agregar items)
                                    ↓
                            Items asignados al comensal
                                    ↓
                            Confirmar ronda (QR + manual juntos)
                                    ↓
                            ... cocina, entrega ...
                                    ↓
                            Hora de pagar
                                    ↓
        ┌── Pagó por QR ──→ Automático ✓
        │
        └── No paga por QR ──→ Mesero toca "Cobrar en mesa"
                                    ↓
                            Ve desglose personal
                                    ↓
                            Marca "Pagó efectivo" o "Pagó tarjeta"
                                    ↓
                            Guest marcado como paid ✓
```

