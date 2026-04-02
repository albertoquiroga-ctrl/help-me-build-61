

## Calculadora "Quédate con el cambio" en CashPaymentSheet

### Problema
Cuando un cliente da un billete grande (ej. $500) para una cuenta de $160 y dice "quédate con el cambio", el mesero tiene que calcular mentalmente cuánto es pago ($160) y cuánto es propina ($340), y luego ingresarlo manualmente en dos campos separados.

### Solución
Agregar un mini-tool "💵 Billete recibido" debajo de los quick amounts. El mesero ingresa el billete que recibió, y el sistema auto-calcula:
- **Pago** = monto restante de la cuenta (o lo que haya en el campo)
- **Propina** = billete − pago
- Auto-rellena ambos campos con un solo tap

### Diseño UI

```text
┌─ Monto ─────────────────────────────┐
│  $ [160]                            │
│  [$50] [$100] [$200] [$500] [Todo]  │
│                                     │
│  💵 ¿Billete grande? ───────────── │
│  "El cliente paga $160 con..."      │
│  [$200] [$500] [$1000]              │
│  → Pago: $160 · Propina: $340  ✓   │
└─────────────────────────────────────┘
```

### Cambio técnico

**`src/components/waiter/CashPaymentSheet.tsx`**:

- Agregar estado `billReceived: number | null` para rastrear si el mesero activó la calculadora
- Debajo de los quick amounts, mostrar una sección colapsable "💵 ¿Billete grande? Quédate con el cambio"
- Al expandir, mostrar botones con denominaciones comunes de billetes mexicanos: $200, $500, $1000
- Al seleccionar un billete:
  - Si no hay monto ingresado, auto-llenar `amount` con `remaining` (lo que falta por pagar)
  - Calcular `cambio = billete - amount`
  - Si `cambio > 0`, auto-seleccionar `tipMode = 'custom'` y `customTip = cambio`
  - Mostrar un resumen: "Pago: $160 · Propina: $340 · Cambio: $0"
- El mesero puede ajustar si quiere dar cambio parcial (ej. "de los $340 dame $100 y quédate con $240")
- Solo se muestra esta sección cuando el método será efectivo (no tiene sentido en tarjeta)

### Archivo a modificar
- `src/components/waiter/CashPaymentSheet.tsx`

