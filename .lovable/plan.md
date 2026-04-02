

## Consolidación de turno — Sección en perfil del mesero

### Resumen
Agregar una sección expandible "Consolidación de turno" en el perfil del mesero que muestre todos los cobros del turno desglosados por método de pago (App/QR, Terminal/Tarjeta, Efectivo), con vista individual, por mesa y totales. Incluye botón para compartir el reporte.

### Diseño

La sección se ubica entre el "Resumen de turno" y los Settings, con tres tabs:

```text
┌─────────────────────────────────┐
│  💰 Consolidación de turno      │
│  ┌─────┬──────────┬──────────┐  │
│  │ App │ Terminal │ Efectivo │  │
│  └─────┴──────────┴──────────┘  │
│                                 │
│  MESA 2                         │
│  ├ C1 QR    $185    tip $20     │
│  └ Subtotal $185    tip $20     │
│                                 │
│  MESA 4                         │
│  ├ C1 QR    $426    tip $56     │
│  ├ C4 QR    $210    tip $30     │
│  └ Subtotal $636    tip $86     │
│                                 │
│  ═══════════════════════════     │
│  TOTAL APP: $821   Tips: $106   │
│                                 │
│  [📋 Copiar reporte]            │
│  [📤 Compartir consolidación]   │
└─────────────────────────────────┘
```

### Cambios técnicos

**1. Nuevo componente `src/components/waiter/ShiftConsolidation.tsx`**
- Lee todas las mesas del mesero desde `useTablesStore`
- Filtra pagos agrupados por método: `qr` → "App", `card-physical` → "Terminal", `cash` → "Efectivo"
- Tres tabs (uno por método) mostrando:
  - Pagos individuales por mesa (monto, propina, nombre del comensal, hora)
  - Subtotal por mesa
  - Gran total al final
- Tab "Todos" como vista default con las 3 columnas lado a lado en resumen
- Botón "Copiar reporte" genera texto plano al clipboard
- Botón "Compartir" usa `navigator.share()` si disponible, si no copia al clipboard
- Muestra discrepancias: compara total cobrado vs total de la cuenta de cada mesa, marca en rojo si no cuadran

**2. Editar `src/pages/WaiterProfile.tsx`**
- Importar y renderizar `<ShiftConsolidation />` entre el resumen de turno y los settings
- El componente es colapsable con un toggle para no saturar la vista del perfil

### Datos
Los `PaymentRecord` ya tienen `method`, `amount`, `tipAmount`, `guestName` y `timestamp` — toda la data necesaria ya existe en el store. Se agrupa por `table.assignedWaiter === 'Carlos'` y se itera sobre `table.payments`.

