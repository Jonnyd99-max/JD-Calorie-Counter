export const NUTRIENTS = ['calories', 'protein', 'carbs', 'fat'];
export const clone = value => structuredClone(value);
export const uid = () => crypto.randomUUID();
export function localDay(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function scaleNutrition(food, grams) {
  if (!food || !Number.isFinite(grams) || grams <= 0) throw new Error('Enter a weight greater than zero.');
  return Object.fromEntries(NUTRIENTS.map(key => [key,
    Number.isFinite(food.per100g[key]) ? food.per100g[key] * grams / 100 : null]));
}
export function servingToGrams(food, portionId, count) {
  const portion = food.portions?.find(p => p.id === portionId);
  if (!portion || !Number.isFinite(portion.grams) || portion.grams <= 0 || !Number.isFinite(count) || count <= 0) throw new Error('This measure has no documented gram conversion.');
  return portion.grams * count;
}
export function labelFood({name, brand = '', basis = '100g', servingGrams, values, reference}) {
  if (!name?.trim() || !reference?.trim()) throw new Error('Add a food name and label reference.');
  const base = basis === 'serving' ? Number(servingGrams) : 100;
  if (!Number.isFinite(base) || base <= 0) throw new Error('A per-serving label needs a serving weight in grams.');
  const per100g = Object.fromEntries(NUTRIENTS.map(key => {
    const raw = values[key];
    if (raw === '' || raw === null || raw === undefined) return [key, null];
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 10000) throw new Error('Label values must be non-negative numbers, or blank when unavailable.');
    return [key, n * 100 / base];
  }));
  return {id: uid(), name: name.trim(), brand: brand.trim(), source: 'User-confirmed nutrition label', reference: reference.trim(), sourceUrl: '', per100g,
    preparation: 'As labelled', portions: basis === 'serving' ? [{id:'label-serving', label:'1 labelled serving', grams:base}] : [], labelBasis:basis, originalLabel:clone(values), servingGrams:base};
}
export function itemNutrition(item) {
  if (!item.food || !Number.isFinite(item.grams) || item.grams <= 0) return Object.fromEntries(NUTRIENTS.map(k=>[k,null]));
  return scaleNutrition(item.food, item.grams);
}
export function sumItems(items) {
  const result = {};
  for (const key of NUTRIENTS) {
    let subtotal = 0, missing = 0;
    for (const item of items) { const v = itemNutrition(item)[key]; if (v === null) missing++; else subtotal += v; }
    result[key] = {value: missing ? null : subtotal, subtotal, missing};
  }
  return result;
}
export function quantityRange(items) {
  const estimated = items.filter(i => i.quantityStatus === 'estimated');
  if (!estimated.length) return null;
  if (estimated.some(i=>!Number.isFinite(i.minGrams) || !Number.isFinite(i.maxGrams) || i.minGrams <= 0 || i.minGrams > i.grams || i.maxGrams < i.grams || !i.rangeReason?.trim())) return {available:false};
  const low = sumItems(items.map(i=>({...i, grams:i.quantityStatus === 'estimated' ? i.minGrams : i.grams})));
  const high = sumItems(items.map(i=>({...i, grams:i.quantityStatus === 'estimated' ? i.maxGrams : i.grams})));
  return {available:true, low, high};
}
export function validateMeal(meal) {
  if (!meal.name?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(meal.date) || localDay(new Date(`${meal.date}T12:00:00`)) !== meal.date) throw new Error('Add a meal name and valid date.');
  if (!Array.isArray(meal.items) || !meal.items.length) throw new Error('Add at least one food.');
  for (const i of meal.items) {
    if (!i.food) throw new Error(`Choose a nutrition source for ${i.name || 'each food'}.`);
    if (!Number.isFinite(i.grams) || i.grams <= 0 || i.grams > 100000) throw new Error('Enter each food’s weight in grams.');
    if (!['confirmed','estimated'].includes(i.quantityStatus)) throw new Error('Choose a quantity status.');
    if (!['confirmed','uncertain'].includes(i.matchStatus)) throw new Error('Choose a food-match status.');
    if (i.quantityStatus === 'estimated' && !quantityRange([i]).available) throw new Error('Estimated quantities need a lower and upper weight and a reason for the range.');
  }
  return true;
}
export function reuseMeal(meal, date = localDay()) {
  const copy = clone(meal);
  return {...copy, id:uid(), date, favourite:false, createdAt:new Date().toISOString(), items:copy.items.map(i=>({...i,id:uid()}))};
}
export function searchFoods(foods, query, preparation = 'all') {
  const normalized = query.toLowerCase().replace(/\b(aubergine|courgette|coriander|rocket|prawn|prawns)\b/g, m=>({aubergine:'eggplant',courgette:'zucchini',coriander:'cilantro',rocket:'arugula',prawn:'shrimp',prawns:'shrimp'}[m]));
  const terms = normalized.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return foods.filter(f=>terms.every(t=>`${f.name} ${f.brand || ''}`.toLowerCase().includes(t)) && (preparation==='all' || f.preparation.toLowerCase().includes(preparation)))
    .sort((a,b)=>(a.name.toLowerCase().startsWith(normalized)?-1:0)-(b.name.toLowerCase().startsWith(normalized)?-1:0)||a.name.length-b.name.length).slice(0,60);
}
function isText(s, max = 2000) { return typeof s === 'string' && s.length <= max; }
export function validateBackup(data) {
  if (data?.app !== 'JD Food Tracker' || data.version !== 1 || !Array.isArray(data.meals) || data.meals.length > 20000) throw new Error('This is not a supported JD Food Tracker backup.');
  const ids = new Set();
  for (const meal of data.meals) {
    if (!isText(meal.id,100) || !/^[a-zA-Z0-9-]+$/.test(meal.id) || ids.has(meal.id) || !isText(meal.name,200) || !isText(meal.notes || '') || !Array.isArray(meal.items) || meal.items.length > 100 || typeof meal.favourite !== 'boolean' || !isText(meal.createdAt,100) || !Number.isFinite(Date.parse(meal.createdAt)) || !['Breakfast','Lunch','Dinner','Snack','Drink'].includes(meal.type)) throw new Error('Invalid or duplicated meal in backup.');
    ids.add(meal.id);
    if (meal.photo && (!isText(meal.photo,2200000) || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(meal.photo))) throw new Error('Invalid photo in backup.');
    for (const i of meal.items || []) {
      const f = i.food;
      if (!f || !isText(i.id,100) || !/^[a-zA-Z0-9-]+$/.test(i.id) || !isText(f.name,500) || !isText(f.source,500) || !isText(f.preparation,500) || !f.per100g || !isText(i.name || '',500) || !isText(i.assumptions || '') || !isText(i.rangeReason || '')) throw new Error('Invalid food source in backup.');
      if (f.portions && (!Array.isArray(f.portions) || f.portions.length>100 || f.portions.some(p=>!isText(p.label,500) || !Number.isFinite(p.grams) || p.grams<=0))) throw new Error('Invalid gram conversion in backup.');
      for (const k of NUTRIENTS) if (f.per100g[k] !== null && (!Number.isFinite(f.per100g[k]) || f.per100g[k] < 0 || f.per100g[k] > 10000)) throw new Error('Invalid nutrient in backup.');
      if (f.sourceUrl && (!isText(f.sourceUrl,1000) || !/^https:\/\/(fdc|agdatacommons)\.nal\.usda\.gov\//.test(f.sourceUrl))) throw new Error('Invalid source URL.');
    }
    validateMeal(meal);
  }
  return clone(data.meals);
}
export function makeBackup(meals) { return {app:'JD Food Tracker',version:1,exportedAt:new Date().toISOString(),meals:clone(meals)}; }
