import {readFile,readdir} from 'node:fs/promises';
const paths=['.gitignore','.env.example','README.md','package.json'];
async function collect(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${entry.name}`;if(entry.isDirectory())await collect(p);else if(!p.endsWith('.png')&&!p.endsWith('data/foods.json'))paths.push(p)}}
for(const dir of ['public','backend','scripts','tests','.github'])await collect(dir);
const elements=[];
for(const path of paths){if(path.startsWith('.env')&&path!=='.env.example')throw new Error('Refusing environment file');elements.push({path,mode:'100644',type:'blob',content:await readFile(path,'utf8')})}
process.stdout.write(JSON.stringify(elements));
