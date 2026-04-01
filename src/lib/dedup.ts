import { PantryItem } from '../types/database';
import { ScannedItem } from '../types/scan';

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')  // strip punctuation
    .replace(/\s+/g, ' ');         // collapse whitespace
}

export function findDuplicates(
  scannedItems: ScannedItem[],
  existingItems: PantryItem[]
): ScannedItem[] {
  const existingNormalized = existingItems.map(item => ({
    id: item.id,
    name: item.name,
    normalized: normalizeName(item.name),
    quantityStr: [item.quantity, item.unit].filter(Boolean).join(' ') || null,
  }));

  return scannedItems.map(scanned => {
    const scannedNorm = normalizeName(scanned.name);
    const match = existingNormalized.find(existing =>
      existing.normalized === scannedNorm ||
      existing.normalized.includes(scannedNorm) ||
      scannedNorm.includes(existing.normalized)
    );
    if (match) {
      return {
        ...scanned,
        duplicateOfId: match.id,
        duplicateOfName: match.name,
        duplicateQuantity: match.quantityStr,
      };
    }
    return scanned;
  });
}
