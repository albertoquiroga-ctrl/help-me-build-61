

## Mejora de Consolidación de Turno — Lista cronológica + Foto de voucher

### Resumen
Rediseñar la consolidación para que sea una herramienta práctica de reconciliación: el mesero ve listas planas ordenadas por hora (mesa, hora, monto) separadas por método de pago, para comparar contra lo que tiene físicamente en la mano. Además, al registrar pagos con terminal, puede tomar foto del voucher como respaldo.

### Cambios

**1. Rediseñar `ShiftConsolidation.tsx` — Listas planas por método**

Cambiar de la vista agrupada por mesa a listas cronológicas planas por tab:

```text
┌─ Tab: Terminal ──────────────────┐
│  Mesa 4 · 14:32 · $426   📷     │
│  Mesa 2 · 15:10 · $185   📷     │
│  ─────────────────────────────── │
│  Total Terminal: $611            │
│  Propinas: $76                   │
└──────────────────────────────────┘
```

- Cada pago es una fila: mesa, hora, monto, propina
- Ordenado cronológicamente (más antiguo arriba)
- En tab Terminal: cada fila tiene botón de cámara (📷) para adjuntar foto de voucher
- Tab "Todos" muestra todas las filas con badge del método
- Mantener totales por tab y discrepancias (mesas sin pagar completo) como nota al final, no como foco principal

**2. Agregar `voucherPhoto` a `PaymentRecord`**

- Nuevo campo opcional `voucherPhoto?: string` (base64 data URL) en la interfaz `PaymentRecord`
- Al tomar foto, se guarda directamente en el payment record del store

**3. Agregar acción `attachVoucher` al store**

- Nueva acción en `tablesStore`: `attachVoucher(tableId: string, paymentId: string, photoDataUrl: string)`
- Busca el payment por ID y le asigna el `voucherPhoto`

**4. Componente de captura de foto en `ShiftConsolidation`**

- Botón de cámara junto a cada pago de terminal
- Al tocar: abre `<input type="file" accept="image/*" capture="environment">` (abre cámara en móvil)
- Convierte a base64 y llama `attachVoucher`
- Si ya tiene foto: muestra miniatura clickeable que abre la foto en un modal/lightbox simple
- Icono cambia de gris a verde cuando ya tiene foto adjunta

**5. Mantener funcionalidad existente**
- Botones de copiar/compartir reporte siguen funcionando
- El reporte de texto indica "(con voucher)" junto a pagos que tienen foto

### Archivos a modificar
- `src/stores/tablesStore.ts` — agregar `voucherPhoto` a `PaymentRecord` y acción `attachVoucher`
- `src/components/waiter/ShiftConsolidation.tsx` — rediseño completo de la UI + captura de foto

