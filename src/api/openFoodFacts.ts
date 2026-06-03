import type { FoodItem } from '../types/nutrition';

const BASE = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = 'product_name,brands,serving_size,nutriments';

export type OpenFoodResult = Omit<FoodItem, 'id' | 'createdAt' | 'source'>;

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

    const kcal =
      n['energy-kcal_100g'] ??
      (n['energy_100g'] != null ? n['energy_100g'] / 4.184 : 0);

    const sodium = n.sodium_100g != null ? n.sodium_100g * 1000 : undefined;

    return {
      name: (p.product_name as string)?.trim() || 'Unknown Product',
      brand: (p.brands as string)?.split(',')[0]?.trim() || undefined,
      barcode,
      servingSize: 100,
      servingUnit: 'g',
      calories: Math.round(kcal),
      protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
      fiber: n.fiber_100g != null ? Math.round(n.fiber_100g * 10) / 10 : undefined,
      sugar: n.sugars_100g != null ? Math.round(n.sugars_100g * 10) / 10 : undefined,
      sodium: sodium != null ? Math.round(sodium) : undefined,
      saturatedFat:
        n['saturated-fat_100g'] != null
          ? Math.round(n['saturated-fat_100g'] * 10) / 10
          : undefined,
    };
  } catch {
    return null;
  }
}
