import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE_DIR||'sharp');
await sharp('public/icons/icon-512.png').jpeg({quality:80}).toFile('.cache/non-food-control.jpg');
const text=await readFile('.env.local','utf8'),token=text.match(/^PERSONAL_ACCESS_TOKEN=(.*)$/m)?.[1]?.trim();
const image='data:image/jpeg;base64,'+(await readFile('.cache/non-food-control.jpg')).toString('base64');
const r=await fetch('https://jd-food-api.jd-food-tracker.workers.dev/analyse',{method:'POST',headers:{Authorization:`Bearer ${token}`,Origin:'https://jonnyd99-max.github.io','Content-Type':'application/json'},body:JSON.stringify({image}),signal:AbortSignal.timeout(65000)});
const data=await r.json();await writeFile('.cache/photo-smoke-result.json',JSON.stringify({status:r.status,result:data},null,2));
console.log(`Authenticated non-food control: HTTP ${r.status}`);if(r.ok)console.log(`Foods suggested: ${data.foods.length}; questions: ${data.questions.length}. This checks connectivity/non-food handling, not meal accuracy.`);else console.log(data.error);
