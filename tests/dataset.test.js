import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {scaleNutrition,searchFoods} from '../public/core.js';
test('production USDA dataset has traceable records and no invented nutrient defaults',{skip:!existsSync('public/data/foods.json')},()=>{const data=JSON.parse(readFileSync('public/data/foods.json','utf8'));assert(data.foods.length>7000);assert.match(data.archiveSha256,/^[a-f0-9]{64}$/);for(const f of data.foods){assert(f.source.includes('USDA'));assert(f.sourceUrl.includes(`/food-details/${f.id}/`));for(const k of ['calories','protein','carbs','fat'])assert(f.per100g[k]===null||(Number.isFinite(f.per100g[k])&&f.per100g[k]>=0));for(const p of f.portions)assert(p.grams>0&&p.label)}const rice=searchFoods(data.foods,'rice','cooked');assert(rice.length);assert(scaleNutrition(rice[0],200).calories>0);assert(searchFoods(data.foods,'rice','raw').length)});
