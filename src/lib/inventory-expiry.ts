type ExpiryFields = {
  expiryDate: Date | null;
  warrantyExpiryDate: Date | null;
};

/** An item is "Expired" once either its expiry date or its warranty expiry
 * date has passed — only set for the "Office Supplies"/"Tec Item"/"Others"
 * categories, but the check itself is category-agnostic (just compares
 * whatever dates exist). */
export function isItemExpired(item: ExpiryFields) {
  return expiryLabel(item) !== null;
}

/** Distinguishes "the product itself expired" from "its warranty expired" —
 * an item can be either, both, or neither. Returns null when neither date
 * has passed (or neither is set). */
export function expiryLabel(item: ExpiryFields): string | null {
  const now = new Date();
  const productExpired = Boolean(item.expiryDate && item.expiryDate < now);
  const warrantyExpired = Boolean(item.warrantyExpiryDate && item.warrantyExpiryDate < now);

  if (productExpired && warrantyExpired) return "expired + warranty expired";
  if (productExpired) return "expired";
  if (warrantyExpired) return "warranty expired";
  return null;
}
