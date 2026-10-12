"""Build offline nutrition from the official USDA SR Legacy ASCII archive.
Column definitions: USDA SR-Legacy Documentation, April 2018 / revised July 2018.
Standard library only. No guessed nutrient values or gram conversions.
"""
import csv, hashlib, io, json, pathlib, urllib.request, zipfile

URL = 'https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR-Legacy/SR-Leg_ASC.zip'
SOURCE = 'https://agdatacommons.nal.usda.gov/articles/dataset/USDA_National_Nutrient_Database_for_Standard_Reference_Legacy_Release/24661818'
target = pathlib.Path('public/data/foods.json')
cache = pathlib.Path('.cache/usda-sr-legacy-ascii.zip')
cache.parent.mkdir(exist_ok=True)
if not cache.exists():
    print('Downloading official USDA SR Legacy archived release…')
    with urllib.request.urlopen(URL, timeout=120) as response:
        cache.write_bytes(response.read())
archive = zipfile.ZipFile(cache)
def rows(name):
    paths = [p for p in archive.namelist() if p.rsplit('/', 1)[-1].upper() == name]
    if len(paths) != 1:
        raise RuntimeError(f'Expected one {name} in official archive')
    return csv.reader(io.TextIOWrapper(archive.open(paths[0]), encoding='latin-1', newline=''), delimiter='^', quotechar='~')

foods = {}
for row in rows('FOOD_DES.TXT'):
    ndb, name = row[0], row[2]
    lower = name.lower()
    prep = 'Raw' if ', raw' in lower else 'Cooked' if any(t in lower for t in [', cooked', ', roasted', ', fried', ', boiled', ', baked', ', grilled', ', broiled', ', braised', ', stewed', ', poached']) else 'See matched food description'
    foods[ndb] = {'id': 'ndb-' + ndb, 'ndbNumber': ndb, 'name': name, 'source': 'USDA SR Legacy (April 2018) · NDB ' + ndb, 'sourceUrl': SOURCE, 'preparation': prep, 'per100g': {'calories': None, 'protein': None, 'carbs': None, 'fat': None}, 'portions': []}
nutrient_ids = {'208': 'calories', '203': 'protein', '205': 'carbs', '204': 'fat'}
for row in rows('NUT_DATA.TXT'):
    food, key = foods.get(row[0]), nutrient_ids.get(row[1])
    if food and key and row[2] != '':
        food['per100g'][key] = float(row[2])
for row in rows('WEIGHT.TXT'):
    food = foods.get(row[0])
    if food and row[3] and row[4] and float(row[4]) > 0:
        food['portions'].append({'id': row[1], 'label': row[2] + ' ' + row[3], 'grams': float(row[4])})
if len(foods) != 7793:
    raise RuntimeError('Unexpected USDA record count; refusing to publish')
target.parent.mkdir(exist_ok=True, parents=True)
output = {'dataset': 'USDA National Nutrient Database SR Legacy', 'release': 'April 2018 (archived July revision)', 'downloadUrl': URL, 'sourceUrl': SOURCE, 'archiveSha256': hashlib.sha256(cache.read_bytes()).hexdigest(), 'nutrientBasis': '100 g edible portion', 'foods': list(foods.values())}
target.write_text(json.dumps(output, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
print(f'Built {len(foods):,} foods with sourced gram measures -> {target}')
