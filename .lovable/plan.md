

# Plan: Mock data realista para canales internos

## Qué cambia

Actualizar el mock data en `notificationsStore.ts` para que refleje el uso real de cada canal:

- **Cocina, Barra, Juice Bar** → notifican que **pedidos específicos están listos** para recoger (vinculados a una mesa), no avisos genéricos de inventario.
- **Hostess** → avisa que una **mesa ya llegó** físicamente al restaurante (para cubrir el caso donde nadie escanea el QR).
- **Gerente** → se mantiene como mensajes operativos generales.

## Cambios en `notificationsStore.ts`

Reemplazar las notificaciones internas mock (n7-n10) con datos realistas:

| ID | Canal | Título | Subtítulo | tableId | Estado |
|---|---|---|---|---|---|
| n7 | gerente | Llegó grupo VIP de 8 · Mesa 12 | Prioridad alta, atender de inmediato | 12 | activa |
| n8 | barra | Bebidas listas · Mesa 2 · 3 drinks | 2 Margaritas, 1 Mezcal Oaxaqueño | 2 | resuelta |
| n9 | hostess | Mesa 7 acaba de llegar · 5 personas | Ningún comensal ha escaneado QR aún | 7 | activa |
| n10 | cocina | Platos listos · Mesa 4 · R1 · 3 items | Tacos al pastor, Enchiladas, Sopa | 4 | resuelta |
| n11 | cocina | Platos listos · Mesa 6 · R2 · 2 items | Listo para recoger en barra caliente | 6 | activa |
| n12 | barra | Drinks listos · Mesa 11 · 2 cocktails | Paloma y Negroni | 11 | activa |
| n13 | hostess | Mesa 3 llegó · 4 personas · Reservación | Esperando en entrada, asignar mesa | 3 | resuelta |

Puntos clave:
- Las notificaciones de cocina/barra ahora incluyen `tableId` para que el mesero sepa a qué mesa llevar los pedidos.
- Las de hostess son alertas de llegada con urgencia media/alta (no baja) porque requieren acción inmediata.
- Se actualiza `unreadCount` para reflejar las activas no resueltas.

### Archivo a modificar

| Archivo | Cambio |
|---|---|
| `notificationsStore.ts` | Reemplazar mock data n7-n13 con notificaciones realistas por canal |

