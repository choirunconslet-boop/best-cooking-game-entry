// Recipes and ingredients for Sizzle & Serve — Warung Rush.
// One file, one job: what a dish is made of, what it pays, and how it looks.
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b04b', emoji: '🍞', raw: false },
  patty: { name: 'Patty', color: '#c96a4a', emoji: '🥩', raw: true, cooked: 'pattyCooked' },
  pattyCooked: { name: 'Grilled Patty', color: '#8a4a2e', emoji: '🍔', raw: false },
  lettuce: { name: 'Lettuce', color: '#7bc96a', emoji: '🥬', raw: true, cooked: 'lettuceChopped' },
  lettuceChopped: { name: 'Chopped Lettuce', color: '#5da84e', emoji: '🥗', raw: false },
  tomato: { name: 'Tomato', color: '#e05a4e', emoji: '🍅', raw: true, cooked: 'tomatoChopped' },
  tomatoChopped: { name: 'Sliced Tomato', color: '#d14a3e', emoji: '🍅', raw: false },
  cheese: { name: 'Cheese', color: '#f2d24b', emoji: '🧀', raw: false },
  friesRaw: { name: 'Raw Fries', color: '#f2c14e', emoji: '🍟', raw: true, cooked: 'fries' },
  fries: { name: 'Fries', color: '#e8a93c', emoji: '🍟', raw: false },
};

export const RECIPES = [
  { id: 'warung-burger', name: 'Warung Burger', needs: ['bun', 'pattyCooked', 'lettuceChopped'], coins: 18 },
  { id: 'cheese-burger', name: 'Cheese Burger', needs: ['bun', 'pattyCooked', 'cheese'], coins: 22 },
  { id: 'garden-stack', name: 'Garden Stack', needs: ['bun', 'lettuceChopped', 'tomatoChopped'], coins: 16 },
  { id: 'combo', name: 'Burger Combo', needs: ['bun', 'pattyCooked', 'fries'], coins: 26 },
  { id: 'double-trouble', name: 'Double Trouble', needs: ['bun', 'pattyCooked', 'pattyCooked', 'cheese'], coins: 30 },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

/** True when the plate's items match the recipe exactly (order-insensitive). */
export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = [...plate].sort();
  const want = [...recipe.needs].sort();
  return have.every((item, i) => item === want[i]);
}

/** The first order whose recipe the plate completes, or null. */
export function matchingOrder(plate, orders) {
  for (const order of orders) {
    const recipe = recipeById(order.recipeId);
    if (recipe && plateMatches(plate, recipe)) return order;
  }
  return null;
}
