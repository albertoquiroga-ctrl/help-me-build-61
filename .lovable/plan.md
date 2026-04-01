
# Plan: Roles de Hostess, Barman y selector de modo

## Resumen
Agregar dos vistas nuevas (Hostess y Barman/Juice Bar) con sus propios dashboards y bottom navs, más un **selector de rol flotante** que permita al restaurantero cambiar entre los 3 modos (Mesero, Hostess, Barman) sin logout.

## Cambios

### 1. Store — Rol activo (`src/stores/roleStore.ts`, nuevo)
- Zustand store con `activeRole: 'waiter' | 'hostess' | 'bar'` y `setRole(role)`.

### 2. Selector de rol flotante (`src/components/RoleSwitcher.tsx`, nuevo)
- Botón flotante en el header que muestra un dropdown con los 3 roles: 🍽️ Mesero, 💁 Hostess, 🍸 Barra.
- Al seleccionar, cambia el rol y navega a la ruta raíz del rol.
- Visible en todas las vistas.

### 3. Vista Hostess

**Páginas:**
- **`HostessDashboard.tsx`**: Grid de todas las mesas mostrando estado (libre/ocupada/por limpiar) y # de personas. Botón "Abrir mesa" en mesas vacías (reutiliza `OpenTableDialog`).
- **`WaitlistPage.tsx`**: Lista de espera mock (nombre, # personas, tiempo esperando, botón "Asignar mesa").

**Nav:** `HostessBottomNav.tsx` — tabs: Mesas, Lista de espera, Perfil.

### 4. Vista Barman

**Páginas:**
- **`BarDashboard.tsx`**: Cola de pedidos de bebidas filtrados de las rondas activas. Cada pedido muestra mesa #, item, cantidad, tiempo. Botones: "Aceptar" → "Listo para recoger". Al marcar listo, genera notificación al mesero.

**Nav:** `BarBottomNav.tsx` — tabs: Pedidos, Perfil.

**Store auxiliar:** `barStore.ts` — lista de items-bebida para filtrar, estado de preparación por item.

### 5. Rutas nuevas (`App.tsx`)
```text
/hostess/dashboard
/hostess/waitlist
/hostess/profile
/bar/dashboard
/bar/profile
```
Ruta raíz `/` redirige según rol activo.

### 6. Datos mock
- Lista de bebidas conocidas para filtrar de las rondas existentes.
- 3-4 entries mock en la lista de espera.

## Archivos nuevos (8)
`roleStore.ts`, `barStore.ts`, `RoleSwitcher.tsx`, `HostessBottomNav.tsx`, `BarBottomNav.tsx`, `HostessDashboard.tsx`, `WaitlistPage.tsx`, `BarDashboard.tsx`

## Archivos modificados (2)
`App.tsx` (rutas + redirect dinámico), `WaiterDashboard.tsx` (RoleSwitcher en header)

## No incluye
- Autenticación real ni permisos
- Push notifications
- Perfil separado por rol (reutiliza WaiterProfile)
