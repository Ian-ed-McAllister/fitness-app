import type { FoodItem } from '../types/nutrition';

const BASE = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = 'product_name,brands,serving_size,serving_quantity,serving_quantity_unit,nutriments';

export type OpenFoodResult = Omit<FoodItem, 'id' | 'createdAt' | 'source'>;

function parseServingSize(str: string): { size: number; unit: 'g' | 'ml' } | null {
  if (!str) return null;
  // Parenthesised value takes priority: "1 cup (240ml)", "2 biscuits (28g)"
  const paren = str.match(/\((\d+(?:\.\d+)?)\s*(g|ml)\)/i);
  if (paren) return { size: parseFloat(paren[1]), unit: paren[2].toLowerCase() as 'g' | 'ml' };
  // Plain "30g" / "250 ml"
  const plain = str.match(/^(\d+(?:\.\d+)?)\s*(g|ml)/i);
  if (plain) return { size: parseFloat(plain[1]), unit: plain[2].toLowerCase() as 'g' | 'ml' };
  return null;
}

export async function lookupBarcode(barcode: string): Promise<OpenFoodResult | null> {
  try {
    const res = await fetch(`${BASE}/${barcode}.json?fields=${FIELDS}`, {
      headers: { 'User-Agent': 'FitTrack/1.0 (fitness tracking app)' },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n: Record<string, number> = p.nutriments ?? {};

    // ── Resolve serving size ──────────────────────────────────────────────
    let servingSize = 100;
    let servingUnit: 'g' | 'ml' = 'g';

    if (p.serving_quantity && !isNaN(parseFloat(p.serving_quantity))) {
      servingSize = parseFloat(p.serving_quantity);
      const rawUnit = (p.serving_quantity_unit ?? '').toLowerCase();
      servingUnit = rawUnit === 'ml' ? 'ml' : 'g';
    } else if (p.serving_size) {
      const parsed = parseServingSize(p.serving_size as string);
      if (parsed) { servingSize = parsed.size; servingUnit = parsed.unit; }
    }

    // ── Convert per-100g values to per-serving ───────────────────────────
    const factor = servingSize / 100;

    const kcalPer100 =
      n['energy-kcal_100g'] ??
      (n['energy_100g'] != null ? n['energy_100g'] / 4.184 : 0);

    const sodiumPer100 = n.sodium_100g != null ? n.sodium_100g * 1000 : undefined;

    return {
      name: (p.product_name as string)?.trim() || 'Unknown Product',
      brand: (p.brands as string)?.split(',')[0]?.trim() || undefined,
      barcode,
      servingSize,
      servingUnit,
      calories: Math.round(kcalPer100 * factor),
      protein: Math.round((n.proteins_100g ?? 0) * factor * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g ?? 0) * factor * 10) / 10,
      fat: Math.round((n.fat_100g ?? 0) * factor * 10) / 10,
      fiber: n.fiber_100g != null ? Math.round(n.fiber_100g * factor * 10) / 10 : undefined,
      sugar: n.sugars_100g != null ? Math.round(n.sugars_100g * factor * 10) / 10 : undefined,
      sodium: sodiumPer100 != null ? Math.round(sodiumPer100 * factor) : undefined,
      saturatedFat:
        n['saturated-fat_100g'] != null
          ? Math.round(n['saturated-fat_100g'] * factor * 10) / 10
          : undefined,
    };
  } catch {
    return null;
  }
}
