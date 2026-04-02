

## Marcar entregado manualmente en Table Detail

### Problema
Actualmente el botón "Marcar entregado" solo aparece cuando el status de la ronda es `ready`. Si cocina no actualiza el status en el app, el mesero no tiene forma de marcar que ya entregó los platillos.

### Solución
Agregar un botón "Marcar entregado" también en las rondas con status `cooking` o `confirmed`, permitiendo al mesero forzar la entrega manualmente cuando cocina no está sincronizada.

### Cambio técnico

**`src/pages/TableDetail.tsx`** — En la sección de active orders por categoría (líneas ~367-405):

- Agregar un botón "✓ Marcar entregado" junto al botón de "Recordar a cocina/barra" para rondas en estado `cooking` o `confirmed`
- El botón tendrá estilo secundario (outline verde) para diferenciarlo del caso `ready` (que es sólido verde)
- Al presionar, llama `markDelivered` para cada `roundNumber` del grupo y muestra toast de confirmación
- Se mantiene el botón de recordatorio existente; ambos coexisten en la misma fila

```text
┌─ Platos Fuertes ─── En cocina 🔥 ─┐
│  Entrecot ×2, Pasta ×1             │
│  🔥 ~12 min restante               │
│  [🔔 Recordar cocina] [✓ Entregado]│
└─────────────────────────────────────┘
```

