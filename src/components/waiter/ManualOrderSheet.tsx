import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Minus, Plus, Pencil } from 'lucide-react';
import { useTablesStore, type OrderItem } from '@/stores/tablesStore';
import { toast } from 'sonner';

interface MenuItem {
  name: string;
  price: number;
  category: string;
}

const COMMON_MODIFIERS = ['Sin sal', 'Sin cebolla', 'Sin pepinillos', 'Sin picante', 'Sin gluten', 'Sin lácteos', 'Extra cocido', 'Término medio', 'Término 3/4', 'Bien cocido'];

const COMMON_EXTRAS: { name: string; price: number }[] = [
  { name: 'Doble de jamón', price: 35 },
  { name: 'Doble de queso', price: 25 },
  { name: 'Extra aguacate', price: 30 },
  { name: 'Extra salsa', price: 10 },
  { name: 'Porción extra de papas', price: 40 },
  { name: 'Huevo estrellado', price: 20 },
];

const MENU: MenuItem[] = [
  { name: 'Margarita Clásica', price: 120, category: 'Bebidas' },
  { name: 'Agua de Jamaica', price: 65, category: 'Bebidas' },
  { name: 'Limonada Natural', price: 55, category: 'Bebidas' },
  { name: 'Cerveza Artesanal', price: 95, category: 'Bebidas' },
  { name: 'Guacamole', price: 95, category: 'Entradas' },
  { name: 'Quesadillas de Flor', price: 110, category: 'Entradas' },
  { name: 'Sopa Azteca', price: 85, category: 'Entradas' },
  { name: 'Tacos de Asada', price: 160, category: 'Platos Fuertes' },
  { name: 'Entrecot a las Brasas', price: 295, category: 'Platos Fuertes' },
  { name: 'Pasta con Trufa', price: 245, category: 'Platos Fuertes' },
  { name: 'Ensalada Mixta', price: 130, category: 'Platos Fuertes' },
  { name: 'Pollo al Pastor', price: 185, category: 'Platos Fuertes' },
  { name: 'Tiramisú', price: 145, category: 'Postres' },
  { name: 'Flan Napolitano', price: 95, category: 'Postres' },
  { name: 'Churros con Chocolate', price: 85, category: 'Postres' },
];

interface CartItem {
  qty: number;
  modifiers: string[];
  extras: { name: string; price: number }[];
  customNote: string;
}

interface Props {
  tableId: string;
  onDismiss: () => void;
}

export default function ManualOrderSheet({ tableId, onDismiss }: Props) {
  const addManualOrder = useTablesStore((s) => s.addManualOrder);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return MENU;
    const q = search.toLowerCase();
    return MENU.filter((m) => m.name.toLowerCase().includes(q));
  }, [search]);

  const categories = useMemo(() => {
    const cats: Record<string, MenuItem[]> = {};
    filtered.forEach((m) => {
      if (!cats[m.category]) cats[m.category] = [];
      cats[m.category].push(m);
    });
    return cats;
  }, [filtered]);

  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [name, ci]) => {
      const item = MENU.find((m) => m.name === name);
      const extrasTotal = ci.extras.reduce((s, e) => s + e.price, 0);
      return sum + (item ? (item.price + extrasTotal) * ci.qty : 0);
    }, 0);
  }, [cart]);

  const itemCount = Object.values(cart).reduce((s, ci) => s + ci.qty, 0);

  const updateQty = (name: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[name];
      if (!existing && delta > 0) {
        return { ...prev, [name]: { qty: 1, modifiers: [], extras: [], customNote: '' } };
      }
      if (!existing) return prev;
      const next = existing.qty + delta;
      if (next <= 0) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: { ...existing, qty: next } };
    });
  };

  const toggleModifier = (itemName: string, mod: string) => {
    setCart((prev) => {
      const ci = prev[itemName];
      if (!ci) return prev;
      const has = ci.modifiers.includes(mod);
      return {
        ...prev,
        [itemName]: {
          ...ci,
          modifiers: has ? ci.modifiers.filter((m) => m !== mod) : [...ci.modifiers, mod],
        },
      };
    });
  };

  const toggleExtra = (itemName: string, extra: { name: string; price: number }) => {
    setCart((prev) => {
      const ci = prev[itemName];
      if (!ci) return prev;
      const has = ci.extras.some((e) => e.name === extra.name);
      return {
        ...prev,
        [itemName]: {
          ...ci,
          extras: has ? ci.extras.filter((e) => e.name !== extra.name) : [...ci.extras, extra],
        },
      };
    });
  };

  const setCustomNote = (itemName: string, note: string) => {
    setCart((prev) => {
      const ci = prev[itemName];
      if (!ci) return prev;
      return { ...prev, [itemName]: { ...ci, customNote: note } };
    });
  };

  const handleSubmit = () => {
    if (itemCount === 0) return;
    const items: OrderItem[] = Object.entries(cart).map(([name, ci]) => {
      const m = MENU.find((i) => i.name === name)!;
      const allModifiers = [...ci.modifiers];
      if (ci.customNote.trim()) allModifiers.push(ci.customNote.trim());
      return {
        name,
        qty: ci.qty,
        price: m.price + ci.extras.reduce((s, e) => s + e.price, 0),
        category: m.category,
        modifiers: allModifiers.length > 0 ? allModifiers : undefined,
        extras: ci.extras.length > 0 ? ci.extras : undefined,
      };
    });
    addManualOrder(tableId, items);
    toast.success(`✏️ ${itemCount} items agregados`);
    onDismiss();
  };

  const editItem = editingItem ? MENU.find((m) => m.name === editingItem) : null;
  const editCartItem = editingItem ? cart[editingItem] : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onDismiss}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[51] bg-w-elevated rounded-t-[16px] border-t border-w-border flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 border-b border-w-border">
          <h3 className="text-[14px] font-semibold text-w-text">📝 Capturar orden</h3>
          <button onClick={onDismiss} className="w-11 h-11 flex items-center justify-center">
            <X size={18} className="text-w-text-secondary" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-text-secondary" />
            <input
              type="text"
              placeholder="Buscar platillo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-[8px] bg-w-surface border border-w-border text-[13px] text-w-text placeholder:text-w-text-secondary focus:outline-none focus:ring-1 focus:ring-w-brand"
            />
          </div>
        </div>

        {/* Menu list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {Object.entries(categories).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-w-text-secondary mb-1.5">{cat}</p>
              <div className="space-y-1">
                {items.map((item) => {
                  const ci = cart[item.name];
                  const qty = ci?.qty || 0;
                  const hasCustomizations = ci && (ci.modifiers.length > 0 || ci.extras.length > 0 || ci.customNote);
                  return (
                    <div key={item.name} className="rounded-[8px] bg-w-surface border border-w-border overflow-hidden">
                      <div className="flex items-center justify-between p-2 min-h-[44px]">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-w-text">{item.name}</p>
                          <p className="text-[11px] font-mono text-w-text-secondary">${item.price}</p>
                          {hasCustomizations && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ci.modifiers.map((m) => (
                                <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-w-warning/15 text-w-warning">{m}</span>
                              ))}
                              {ci.extras.map((e) => (
                                <span key={e.name} className="text-[10px] px-1.5 py-0.5 rounded bg-w-brand/15 text-w-brand">+{e.name}</span>
                              ))}
                              {ci.customNote && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-w-text-secondary/15 text-w-text-secondary">📝 {ci.customNote}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {qty > 0 && (
                            <>
                              <button onClick={() => updateQty(item.name, -1)} className="w-8 h-8 rounded-full bg-w-border flex items-center justify-center">
                                <Minus size={14} className="text-w-text" />
                              </button>
                              <span className="text-[13px] font-mono text-w-text w-5 text-center">{qty}</span>
                            </>
                          )}
                          <button onClick={() => updateQty(item.name, 1)} className="w-8 h-8 rounded-full bg-w-brand flex items-center justify-center">
                            <Plus size={14} className="text-white" />
                          </button>
                          {qty > 0 && (
                            <button onClick={() => setEditingItem(item.name)} className="w-8 h-8 rounded-full bg-w-surface border border-w-border flex items-center justify-center">
                              <Pencil size={12} className="text-w-text-secondary" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {itemCount > 0 && (
          <div className="p-4 border-t border-w-border bg-w-elevated">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-w-text-secondary">{itemCount} items</span>
              <span className="font-mono text-[14px] font-semibold text-w-text">${total}</span>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full h-12 rounded-[8px] bg-w-brand text-white font-semibold text-[14px] active:scale-[0.98] transition-transform"
            >
              Agregar a la orden ✓
            </button>
          </div>
        )}
      </motion.div>

      {/* Modifiers/Extras Panel */}
      <AnimatePresence>
        {editingItem && editItem && editCartItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[52] bg-black/40"
              onClick={() => setEditingItem(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[53] bg-w-elevated rounded-t-[16px] border-t border-w-border flex flex-col"
              style={{ maxHeight: '75vh' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-w-border">
                <div>
                  <h3 className="text-[14px] font-semibold text-w-text">{editItem.name}</h3>
                  <p className="text-[12px] text-w-text-secondary">Personalizar pedido</p>
                </div>
                <button onClick={() => setEditingItem(null)} className="w-11 h-11 flex items-center justify-center">
                  <X size={18} className="text-w-text-secondary" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-w-text-secondary mb-2">🚫 Modificadores</p>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_MODIFIERS.map((mod) => {
                      const active = editCartItem.modifiers.includes(mod);
                      return (
                        <button
                          key={mod}
                          onClick={() => toggleModifier(editingItem, mod)}
                          className={`px-3 py-1.5 rounded-[6px] text-[12px] border min-h-[36px] transition-colors ${
                            active
                              ? 'bg-w-warning/15 border-w-warning/50 text-w-warning font-medium'
                              : 'border-w-border text-w-text-secondary hover:border-w-text-secondary/50'
                          }`}
                        >
                          {mod}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-w-text-secondary mb-2">➕ Extras</p>
                  <div className="space-y-1.5">
                    {COMMON_EXTRAS.map((extra) => {
                      const active = editCartItem.extras.some((e) => e.name === extra.name);
                      return (
                        <button
                          key={extra.name}
                          onClick={() => toggleExtra(editingItem, extra)}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-[8px] border min-h-[40px] transition-colors ${
                            active
                              ? 'bg-w-brand/10 border-w-brand/40 text-w-brand'
                              : 'border-w-border text-w-text-secondary hover:border-w-text-secondary/50'
                          }`}
                        >
                          <span className="text-[12px]">{extra.name}</span>
                          <span className="text-[11px] font-mono">+${extra.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-w-text-secondary mb-2">📝 Nota especial</p>
                  <textarea
                    value={editCartItem.customNote}
                    onChange={(e) => setCustomNote(editingItem, e.target.value)}
                    placeholder="Ej: alergia a mariscos, sin cilantro..."
                    className="w-full bg-w-surface border border-w-border rounded-[8px] p-3 text-[13px] text-w-text placeholder:text-w-text-secondary/50 resize-none focus:outline-none focus:ring-1 focus:ring-w-brand"
                    rows={2}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-w-border">
                <button
                  onClick={() => setEditingItem(null)}
                  className="w-full h-11 rounded-[8px] bg-w-brand text-white font-semibold text-[13px] active:scale-[0.98] transition-transform"
                >
                  Listo ✓
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
