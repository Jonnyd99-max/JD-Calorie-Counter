"""Build a compact, traceable offline database from the official USDA release.
Standard library only. No guessed nutrient values or household conversions.
"""
import csv, hashlib, io, json, pathlib, urllib.request, zipfile

URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip'
target = pathlib.Path('public/data/foods.json')
cache = pathlib.Path('.cache/usda-sr-legacy.zip')
cache.parent.mkdir(exist_ok=True)
if not cache.exists():
    print('Downloading official USDA SR Legacy April 2018 release…')
    with urllib.request.urlopen(URL, timeout=120) as response:
        cache.write_bytes(response.read())
archive = zipfile.ZipFile(cache)
def rows(name):
    paths = [p for p in archive.namelist() if p.rsplit('/', 1)[-1] == name]
    if len(paths) != 1:
        raise RuntimeError(f'Expected one {name} in official archive')
    return csv.DictReader(io.TextIOWrapper(archive.open(paths[0]), encoding='utf-8-sig', newline=''))

foods = {}
for row in rows('food.csv'):
    name = row['description']
    lower = name.lower()
    prep = 'Raw' if ', raw' in lower else 'Cooked' if any(t in lower for t in [', cooked', ', roasted', ', fried', ', boiled', ', baked', ', grilled', ', broiled', ', braised', ', stewed', ', poached']) else 'See matched food description'
    fid = int(row['fdc_id'])
    foods[str(fid)] = {'id': str(fid), 'name': name, 'source': 'USDA FoodData Central · SR Legacy (April 2018)', 'sourceUrl': f'https://fdc.nal.usda.gov/food-details/{fid}/nutrients', 'preparation': prep, 'per100g': {'calories': None, 'protein': None, 'carbs': None, 'fat': None}, 'portions': []}
nutrient_ids = {'1008': 'calories', '1003': 'protein', '1005': 'carbs', '1004': 'fat'}
for row in rows('food_nutrient.csv'):
    food, key = foods.get(row['fdc_id']), nutrient_ids.get(row['nutrient_id'])
    if food and key and row['amount'] != '':
        food['per100g'][key] = float(row['amount'])
for row in rows('food_portion.csv'):
    food = foods.get(row['fdc_id'])
    # Legacy measure wording describes the complete portion with this gram weight.
    modifier = row.get('modifier', '').strip()
    gram_weight = row.get('gram_weight', '')
    amount = row.get('amount', '')
    if food and modifier and gram_weight and float(gram_weight) > 0:
        label = f'{amount} {modifier}'.strip() if amount else modifier
        food['portions'].append({'id': row['id'], 'label': label, 'grams': float(gram_weight)})
if len(foods) < 7000:
    raise RuntimeError('Unexpectedly small USDA dataset; refusing to publish')
target.parent.mkdir(exist_ok=True, parents=True)
output = {'dataset': 'USDA FoodData Central SR Legacy', 'release': 'April 2018', 'downloadUrl': URL, 'archiveSha256': hashlib.sha256(cache.read_bytes()).hexdigest(), 'nutrientBasis': '100 g edible portion', 'foods': list(foods.values())}
target.write_text(json.dumps(output, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
print(f'Built {len(foods):,} foods with sourced gram measures → {target}')
