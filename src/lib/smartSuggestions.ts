import type { WaiterTable } from '@/stores/tablesStore';

export interface SmartSuggestionData {
  id: string;
  icon: string;
  text: string;
  reason: string;
  tableId: string;
  tableNumber: number;
}

/** Menu items to suggest by context */
const DRINK_PAIRINGS: Record<string, string> = {
  'Tacos de Asada': 'Michelada',
  'Entrecot a las Brasas': 'Copa de vino tinto',
  'Pasta con Trufa': 'Negroni',
  'Ensalada Mixta': 'Limonada con menta',
  'Guacamole': 'Margarita de Tamarindo',
  'Quesadillas de Flor': 'Agua de Jamaica',
};

const DESSERT_SUGGESTIONS = ['Flan Napolitano', 'Churros con chocolate', 'Pastel de tres leches', 'Helado de vainilla'];
const REFILL_DRINKS = ['Agua mineral', 'Limonada', 'Café americano', 'Agua de Jamaica'];

/** Generate situational smart suggestions for a table */
export function generateSmartSuggestions(table: WaiterTable): SmartSuggestionData[] {
  if (table.status === 'empty') return [];

  const suggestions: SmartSuggestionData[] = [];
  const deliveredItems = table.rounds.filter(r => r.status === 'delivered').flatMap(r => r.items);
  const allItems = table.rounds.flatMap(r => r.items);
  const hasBeverage = deliveredItems.some(i => i.category === 'Bebidas');
  const hasEntrada = deliveredItems.some(i => i.category === 'Entradas');
  const hasPlatoFuerte = deliveredItems.some(i => i.category === 'Platos Fuertes');
  const hasPostre = allItems.some(i => i.category === 'Postres');
  const allDelivered = table.rounds.length > 0 && table.rounds.every(r => r.status === 'delivered');
  const cookingMain = table.rounds.some(r =>
    (r.status === 'cooking' || r.status === 'confirmed') &&
    r.items.some(i => i.category === 'Platos Fuertes')
  );

  // 1. Second round of drinks while main course cooks
  if (hasBeverage && cookingMain) {
    // Find a specific drink to suggest
    const orderedDrink = deliveredItems.find(i => i.category === 'Bebidas');
    const loyaltyFav = table.loyaltyGuest?.favoriteItems.find(f =>
      f.toLowerCase().includes('margarita') || f.toLowerCase().includes('agua') || f.toLowerCase().includes('cerveza')
    );
    const drinkName = loyaltyFav || orderedDrink?.name || 'Margarita';
    suggestions.push({
      id: `${table.id}-second-drink`,
      icon: '🍹',
      text: `Ofrece otra ${drinkName} — plato fuerte en camino`,
      reason: 'Bebidas entregadas · Plato fuerte en preparación',
      tableId: table.id,
      tableNumber: table.number,
    });
  }

  // 2. Suggest food pairing for recently ordered items
  if (!cookingMain && hasBeverage && !hasPlatoFuerte && deliveredItems.length > 0) {
    const lastDelivered = deliveredItems[deliveredItems.length - 1];
    const pairing = DRINK_PAIRINGS[lastDelivered.name];
    if (pairing) {
      suggestions.push({
        id: `${table.id}-pairing`,
        icon: '🤝',
        text: `${pairing} va perfecto con ${lastDelivered.name}`,
        reason: 'Pairing recomendado',
        tableId: table.id,
        tableNumber: table.number,
      });
    }
  }

  // 3. Suggest dessert after main course
  if (hasPlatoFuerte && !hasPostre && allDelivered) {
    const loyaltyDessert = table.loyaltyGuest?.favoriteItems.find(f =>
      f.toLowerCase().includes('flan') || f.toLowerCase().includes('pastel') ||
      f.toLowerCase().includes('churro') || f.toLowerCase().includes('helado')
    );
    const dessert = loyaltyDessert || DESSERT_SUGGESTIONS[Math.floor(table.number % DESSERT_SUGGESTIONS.length)];
    suggestions.push({
      id: `${table.id}-dessert`,
      icon: '🍮',
      text: `Ofrece ${dessert} — acaban de terminar sus platos`,
      reason: 'Platos fuertes entregados · Sin postre en cuenta',
      tableId: table.id,
      tableNumber: table.number,
    });
  }

  // 4. Refill suggestion — delivered drinks > 15 min ago, no new drink orders
  if (hasBeverage && !cookingMain && table.timeOpened > 15) {
    const lastDrinkRound = [...table.rounds].reverse().find(r =>
      r.status === 'delivered' && r.items.some(i => i.category === 'Bebidas')
    );
    if (lastDrinkRound) {
      const minAgo = Math.floor((Date.now() - new Date(lastDrinkRound.createdAt).getTime()) / 60000);
      if (minAgo >= 15) {
        const orderedDrink = lastDrinkRound.items.find(i => i.category === 'Bebidas');
        const refill = orderedDrink?.name || REFILL_DRINKS[table.number % REFILL_DRINKS.length];
        suggestions.push({
          id: `${table.id}-refill`,
          icon: '🔄',
          text: `¿Refill de ${refill}? Última bebida hace ${minAgo} min`,
          reason: 'Sin nuevas bebidas en un rato',
          tableId: table.id,
          tableNumber: table.number,
        });
      }
    }
  }

  // 5. No orders after 20 min — check if they need anything
  if (table.timeOpened > 20 && table.rounds.length === 0) {
    suggestions.push({
      id: `${table.id}-no-order`,
      icon: '💡',
      text: 'Pregunta si necesitan menú, cubiertos o agua',
      reason: `${table.timeOpened} min sin órdenes`,
      tableId: table.id,
      tableNumber: table.number,
    });
  }

  // 6. After entradas delivered, suggest plato fuerte if not ordered
  if (hasEntrada && !hasPlatoFuerte && !cookingMain) {
    const mainPairing = deliveredItems.find(i => i.category === 'Entradas');
    const suggestion = mainPairing?.name === 'Guacamole'
      ? 'Tacos de Asada'
      : mainPairing?.name === 'Quesadillas de Flor'
      ? 'Entrecot a las Brasas'
      : 'Pasta con Trufa';
    suggestions.push({
      id: `${table.id}-main-course`,
      icon: '🥩',
      text: `Sugiere ${suggestion} — ya terminaron entradas`,
      reason: 'Entradas entregadas · Sin plato fuerte',
      tableId: table.id,
      tableNumber: table.number,
    });
  }

  return suggestions;
}
