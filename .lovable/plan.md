

# Plan: Vista "Por comensal" en detalle de mesa

## Resumen

Agregar una **vista alternativa con tabs** en la sección de rondas del detalle de mesa: "Por rondas" (actual) y "Por comensal". La vista por comensal agrupa todos los items que ordenó cada persona a través de todas las rondas, mostrando su total individual y estado de pago. Esto le da al mesero claridad inmediata sobre qué lleva cada quien.

## Cambios

### `src/pages/TableDetail.tsx`

1. Agregar un toggle/tabs encima de la sección de rondas: **"🍽 Rondas"** | **"👤 Por comensal"**
2. Estado local `viewMode: 'rounds' | 'by-guest'`
3. Vista "Por comensal":
   - Para cada guest, una tarjeta colapsable mostrando:
     - Header: nombre/silla del comensal, total acumulado, badge de pago
     - Expandido: lista de todos sus items agrupados por ronda (R1, R2...) con nombre, cantidad, precio y status de la ronda
   - Items sin `assignedTo` se muestran en sección separada "Sin asignar"
4. La vista actual de rondas queda intacta en el tab "Rondas"

### Detalle de UI por comensal

```text
┌─────────────────────────────────┐
│ 🪑 Silla 1 · Ana      → $385  │
│ ✓ Pagado 💵                     │
├─────────────────────────────────┤
│  R1: Tacos al Pastor ×2  $120  │
│  R1: Agua mineral ×1      $45  │
│  R2: Guacamole ×1        $110  │
│  R2: Quesadilla ×1      $110  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ⚠️ Sin asignar          → $85  │
├─────────────────────────────────┤
│  R1: Salsa extra ×1       $0   │
│  R2: Nachos ×1            $85  │
└─────────────────────────────────┘
```

No se requieren cambios al store ni a otros componentes.

