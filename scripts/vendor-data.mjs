import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const content=await readFile('public/data/foods.json');
const data=JSON.parse(content);if(data.foods?.length!==7793||!data.archiveSha256)throw new Error('Official nutrition source is required.');
await mkdir('vendor',{recursive:true});await writeFile('vendor/usda-foods.json.gz',gzipSync(content,{level:9}));
console.log('Vendored the verified USDA index for reproducible network-independent builds.');
