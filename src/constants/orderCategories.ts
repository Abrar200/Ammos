export const ORDER_CATEGORIES = [
  'Fruit & Veg',
  'Meats',
  'Seafoods',
  'Cleaning Supplies',
  'Alcohol',
  'General Items'
] as const;

export type OrderCategory = typeof ORDER_CATEGORIES[number];

export const CATEGORY_ICONS = {
  'Fruit & Veg': '🥬',
  'Meats': '🥩',
  'Seafoods': '🐟',
  'Cleaning Supplies': '🧽',
  'Alcohol': '🍷',
  'General Items': '📦'
} as const;

export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category as OrderCategory] || '📦';
};