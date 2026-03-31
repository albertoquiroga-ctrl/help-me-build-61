

# Plan: Canales de comunicación interna + lectura en voz alta

## Qué se construye

Expandir la pantalla de Alertas para incluir **mensajes internos del equipo** (gerente, barra, juice bar, hostess, cocina/POS) junto con las alertas operativas existentes. Agregar un botón de **lectura en voz alta** usando la Web Speech API del navegador para que el mesero pueda escuchar las alertas sin mirar el teléfono.

## Cambios

### 1. Modelo de datos — `notificationsStore.ts`

- Agregar nuevos `NotifType`: `'manager-msg'` | `'kitchen-msg'` | `'bar-msg'` | `'host-msg'`
- Agregar campo `channel?: string` a `WaiterNotification` para identificar el origen ("Gerente", "Barra", "Juice Bar", "Hostess", "Cocina")
- Agregar mock data con mensajes de ejemplo:
  - Gerente: "Llegó grupo VIP de 8, mesa 12, prioridad alta"
  - Barra: "Se acabó el mezcal Amores, ofrecer Alipús"
  - Hostess: "Mesa 3 llega en 5 min, reservación confirmada"
  - Cocina: "Horno fuera de servicio, sin pizzas hasta nuevo aviso"

### 2. Filtros por canal — `AlertsQueue.tsx`

- Agregar una segunda fila de filtros por canal: Todas | Mesas | Gerente | Cocina | Barra | Hostess
- Los filtros existentes (Todas/Activas/Resueltas) se mantienen como estado de resolución
- Ambos filtros se aplican en combinación (AND)
- Cada canal tiene su icono: 👨‍💼 Gerente, 🍳 Cocina, 🍸 Barra, 🧃 Juice Bar, 💁 Hostess, 🪑 Mesas

### 3. Botón de lectura en voz alta — `AlertsQueue.tsx`

- Botón `🔊` en el header que usa `window.speechSynthesis` (Web Speech API, sin dependencias externas)
- Al presionarlo, lee en voz alta todas las alertas activas no resueltas en orden de prioridad
- Usa `SpeechSynthesisUtterance` con `lang: 'es-MX'`
- Estado toggle: si está leyendo, un segundo tap detiene la lectura
- Opción de auto-lectura: toggle en perfil para que cada nueva alerta se lea automáticamente (útil en hora pico)

### 4. Simulador — `WaiterDashboard.tsx`

- Agregar 2-3 acciones de simulación para mensajes internos (mensaje de gerente, aviso de barra) al menú de simulación existente

### 5. Visual de mensajes internos — `NotificationCard.tsx`

- Los mensajes internos muestran el nombre del canal como badge: `[Gerente]`, `[Barra]`
- Icono del canal en lugar del icono de prioridad para mensajes tipo `*-msg`

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `notificationsStore.ts` | Nuevos tipos, campo `channel`, mock data |
| `AlertsQueue.tsx` | Filtros por canal, botón de voz alta, layout actualizado |
| `NotificationCard.tsx` | Badge de canal para mensajes internos |
| `WaiterDashboard.tsx` | Nuevas acciones de simulación |

## Detalle técnico: Web Speech API

```text
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'es-MX';
utterance.rate = 1.1;  // ligeramente rápido para hora pico
window.speechSynthesis.speak(utterance);
```

No requiere API key, funciona offline en la mayoría de dispositivos móviles. Fallback: si `speechSynthesis` no está disponible, el botón se oculta.

