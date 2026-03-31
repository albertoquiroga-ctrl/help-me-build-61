import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Minus, Plus } from 'lucide-react';
import { useTablesStore, type OrderItem } from '@/stores/tablesStore';
import { toast } from 'sonner';

interface MenuItem {
  name: string;
  price: number;
  category: string;
}

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

interface Props {
  tableId: string;
  guestId: string;
  guestName: string;
  onDismiss: () => void;
}

export default function ManualOrderSheet({ tableId, guestId, guestName, onDismiss }: Props) {
  const addManualOrder = useTablesStore((s) => s.addManualOrder);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});

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
    return Object.entries(cart).reduce((sum, [name, qty]) => {
      const item = MENU.find((m) => m.name === name);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }, [cart]);

  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const updateQty = (name: string, delta: number) => {
    setCart((prev) => {
      const next = (prev[name] || 0) + delta;
      if (next <= 0) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [name]: next };
    });
  };

  const handleSubmit = () => {
    if (itemCount === 0) return;
    const items: OrderItem[] = Object.entries(cart).map(([name, qty]) => {
      const m = MENU.find((i) => i.name === name)!;
      return { name, qty, price: m.price, assignedTo: guestId };
    });
    addManualOrder(tableId, guestId, items);
    toast.success(`✏️ ${itemCount} items agregados para ${guestName}`);
    onDismiss();
  };

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
          <div>
            <h3 className="text-[14px] font-semibold text-w-text">✏️ Capturar orden</h3>
            <p className="text-[12px] text-w-text-secondary">{guestName}</p>
          </div>
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
                  const qty = cart[item.name] || 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-[8px] bg-w-surface border border-w-border min-h-[44px]">
                      <div>
                        <p className="text-[13px] text-w-text">{item.name}</p>
                        <p className="text-[11px] font-mono text-w-text-secondary">${item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
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
              Agregar a la ronda ✓
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}