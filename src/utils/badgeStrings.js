// Centralized badge strings and accessibility helpers for GI Locations

export const BADGE_STRINGS = {
  notForSale: 'Not for sale',
  available: (qty) => `${qty} available`,
};

export function getBadgeText(sellable_quantity) {
  if (sellable_quantity == null) return BADGE_STRINGS.notForSale;
  return BADGE_STRINGS.available(sellable_quantity);
}

export function getBadgeColor(sellable_quantity) {
  // WCAG AA compliant colors
  if (sellable_quantity == null) return '#718096'; // gray
  if (typeof sellable_quantity === 'number' && sellable_quantity >= 0) return '#38a169'; // green
  return '#718096';
}
