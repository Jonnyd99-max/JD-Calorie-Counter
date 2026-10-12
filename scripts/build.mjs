import {mkdir,cp,readFile,writeFile,access} from 'node:fs/promises';
import {deflateSync,gunzipSync} from 'node:zlib';
function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0}
function chunk(type,data){const t=Buffer.from(type),size=Buffer.alloc(4),crc=Buffer.alloc(4);size.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([size,t,data,crc])}
function icon(size){const pixels=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++){for(let x=0;x<size;x++){const p=y*(size*4+1)+1+x*4,dx=x/size-.5,dy=y/size-.5,r=Math.hypot(dx,dy);let colour=[23,60,50];if((r>.26&&r<.284)||(r>.195&&r<.21))colour=[225,237,195];const leaf1=((dx+.065)/.085)**2+((dy+.035)/.125)**2<1;const leaf2=((dx-.075)/.09)**2+((dy+.005)/.055)**2<1;const stem=Math.abs(dx+.015)<.01&&dy>.025&&dy<.15;if((leaf1&&dx<.005)||(leaf2&&dx>0)||stem)colour=[225,237,195];pixels.set([...colour,255],p)}}const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))])}
await mkdir('public/icons',{recursive:true});
for(const [name,size]of[['icon-192.png',192],['icon-512.png',512],['icon-maskable.png',512]])await writeFile(`public/icons/${name}`,icon(size));
try{await access('public/data/foods.json')}catch{await mkdir('public/data',{recursive:true});await writeFile('public/data/foods.json',gunzipSync(await readFile('vendor/usda-foods.json.gz')))}
const data=JSON.parse(await readFile('public/data/foods.json','utf8'));if(!data.foods?.length)throw new Error('Cannot publish an empty food database.');
await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});await writeFile('dist/.nojekyll','');
console.log(`Built static PWA with ${data.foods.length} nutrition records. No environment files included.`);
