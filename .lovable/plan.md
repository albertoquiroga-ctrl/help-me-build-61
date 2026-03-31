

# Plan: CashPaymentSheet interactivo con asignación de items por mesero

## Problema actual

El `CashPaymentSheet` actual muestra un desglose estático basado en items pre-asignados y solo tiene dos botones de "Pagó". El mesero no puede:
1. Seleccionar qué items corresponden a cada comensal (el mesero pregunta en la mesa y asigna)
2. Dividir items compartidos entre comensales
3. Crear perfiles de guest sobre la marcha para que la cuenta ya esté dividida antes de cobrar

## Cambios

### 1. Agregar guests desde TableDetail — `tablesStore.ts` + `TableDetail.tsx`

- Nueva acción `addGuest(tableId, name)` en el store que crea un `GuestInfo` con `orderMethod: 'manual'`, `amountOwed: 0`.
- Botón **"+ Agregar comensal"** en la sección de Comensales de `TableDetail`, que abre un input inline para nombre y crea el perfil. Esto permite al mesero crear perfiles antes de cobrar para que la división sea clara.

### 2. Rediseñar CashPaymentSheet como flujo de asignación — `CashPaymentSheet.tsx`

Transformar el sheet de un desglose estático a una herramienta interactiva donde el mesero asigna items:

**Vista principal:**
- Lista todos los items de la mesa (de todos los rounds) con checkboxes
- Los items ya asignados a este guest vienen pre-seleccionados
- Los items asignados a otros guests aparecen grises con el nombre del dueño
- Los items sin asignar están disponibles para seleccionar
- Opción de "dividir item" (ej: Guacamole compartido → $95 / 2 = $47.50 cada uno)

**Flujo:**
1. Mesero abre "Cobrar en mesa" para un comensal
2. Ve todos los items, selecciona los que son de ese comensal
3. El total se calcula dinámicamente según selección
4. Toca "💵 Pagó efectivo" o "💳 Pagó tarjeta"
5. Los items quedan asignados y el guest marcado como paid

### 3. Store: asignar items y dividir — `tablesStore.ts`

- Nueva acción `assignItemsToGuest(tableId, guestId, assignments)` donde cada assignment es `{ roundNumber, itemIndex, splitWith?: string[] }`.
- Actualiza `assignedTo` de cada item y recalcula `amountOwed` de los guests involucrados.
- Nueva acción `markItemsPaidByGuest(tableId, guestId, method, selectedItems)` que marca los items seleccionados como pagados por ese guest y actualiza su `paymentStatus`.

### 4. Indicadores en items de rounds — `TableDetail.tsx`

En la vista expandida de cada round, mostrar junto a cada item quién lo tiene asignado (pill con nombre) o "Sin asignar" si nadie lo reclamó. Esto da visibilidad al mesero de qué falta por asignar antes de cobrar.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `tablesStore.ts` | `addGuest`, `assignItemsToGuest`, `markItemsPaidByGuest` |
| `CashPaymentSheet.tsx` | Rediseño completo: checklist de items, split, total dinámico |
| `TableDetail.tsx` | Botón "+ Agregar comensal", indicadores de asignación en items |

## Flujo completo

```text
Mesa con 4 personas → 2 pidieron por QR, 2 no

Mesero:
  1. Crea perfiles: "+ Agregar comensal" → "Don Pepe", "Doña María"
  2. Captura orden manual para cada uno (ManualOrderSheet existente)
  3. Items van a cocina → se cocinan → se entregan
  4. Hora de cobrar:
     - QR guests pagan solos ✓
     - Mesero abre "Cobrar en mesa" → Don Pepe
     - Ve todos los items, pregunta: "¿Lo suyo fueron los tacos y el agua?"
     - Selecciona esos items ✓, el guacamole lo marca como "dividido con Doña María"
     - Total se calcula: $160 + $65 + $47.50 = $272.50
     - "Pagó efectivo ✓"
     - Repite con Doña María (sus items ya pre-seleccionados)
```

