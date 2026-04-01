# Plan: Roles de Hostess, Barman y selector de modo

## Resumen
Agregar dos vistas nuevas (Hostess y Barman/Juice Bar) con sus propios dashboards y bottom navs, más un **selector de rol flotante** que permita al restaurantero cambiar entre los 3 modos (Mesero, Hostess, Barman) sin logout.

## Cambios

### 1. Store — Rol activo (`src/stores/roleStore.ts`, nuevo)
- Zustand store con `activeRole: 'waiter' | 'hostess' | 'bar'` y `setRole(role)`.
- Persistido en memoria (no localStorage para el demo).

### 2. Selector de rol flotante (`src/components/RoleSwitcher.tsx`, nuevo)
- Botón flotante (esquina superior derecha o similar) que muestra un popover/dropdown con los 3 roles: 🍽️ Mesero, 💁 Hostess, 🍸 Barra.
- Al seleccionar, cambia el rol y navega a la ruta raíz del rol correspondiente.
- Visible en todas las vistas. Estilo discreto pero accesible.

### 3. Vista Hostess

**Páginas:**
- **`src/pages/hostess/HostessDashboard.tsx`**: Grid de mesas mostrando estado (libre/ocupada/por limpiar). Cada mesa muestra número, estado visual, y # de personas si está ocupada.
- **`src/pages/hostess/WaitlistPage.tsx`**: Lista de espera mock con nombre, # personas, tiempo esperando, y botón "Asignar mesa".

**Nav:** `src/components/hostess/HostessBottomNav.tsx` con tabs: Mesas, Lista de espera, Perfil.

**Funcionalidad clave:**
- Ver todas las mesas y su estado (usa el mismo `tablesStore`).
- Botón "Abrir mesa" en mesas vacías (reutiliza `OpenTableDialog`).
- Lista de espera con datos mock (nombre, personas, timestamp).
- Marcar mesa como "ocupada" con # de personas.

### 4. Vista Barman

**Páginas:**
- **`src/pages/bar/BarDashboard.tsx`**: Cola de pedidos de bebidas filtrados de las rondas de todas las mesas. Muestra: mesa #, item, cantidad, tiempo desde pedido.
- Cada pedido tiene botones: "Aceptar" → "Listo para recoger".

**Nav:** `src/components/bar/BarBottomNav.tsx` con tabs: Pedidos, Perfil.

**Funcionalidad clave:**
- Filtra items de bebidas de todas las rondas activas (se identifican por categoría o por nombre mock).
- Estados del pedido desde la barra: pendiente → en preparación → listo.
- Al marcar "listo", genera notificación al mesero ("Bebidas listas · Mesa X").

**Store auxiliar:** `src/stores/barStore.ts` — lista de nombres de items que son bebidas (para filtrar), y estado local de preparación por item.

### 5. Rutas (`src/App.tsx`)
```
/hostess/dashboard
/hostess/waitlist
/hostess/profile
/bar/dashboard
/bar/profile
```
- Ruta raíz `/` redirige según `activeRole`.

### 6. Datos mock
- **Bebidas identificables**: Agregar flag o lista de nombres ("Agua mineral", "Margarita", "Cerveza", etc.) en el barStore para filtrar de las rondas.
- **Lista de espera**: 3-4 entries mock en el waitlist store/page.

## Archivos nuevos (8)
1. `src/stores/roleStore.ts`
2. `src/stores/barStore.ts`
3. `src/components/RoleSwitcher.tsx`
4. `src/components/hostess/HostessBottomNav.tsx`
5. `src/components/bar/BarBottomNav.tsx`
6. `src/pages/hostess/HostessDashboard.tsx`
7. `src/pages/hostess/WaitlistPage.tsx`
8. `src/pages/bar/BarDashboard.tsx`

## Archivos modificados (2)
1. `src/App.tsx` — nuevas rutas + redirect dinámico
2. `src/pages/WaiterDashboard.tsx` — agregar RoleSwitcher al header

## No incluye
- Autenticación real ni permisos
- Push notifications
- Perfil separado por rol (reutiliza WaiterProfile por ahora)
