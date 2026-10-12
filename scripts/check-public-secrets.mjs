import {readFile,readdir} from 'node:fs/promises';
const text=await readFile('.env.local','utf8');
const secrets=['OPENAI_API_KEY','PERSONAL_ACCESS_TOKEN'].map(k=>text.match(new RegExp(`^${k}=(.*)$`,'m'))?.[1]?.trim()).filter(Boolean);
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;if(entry.isDirectory())await scan(path);else{const bytes=await readFile(path);if(secrets.some(s=>bytes.includes(Buffer.from(s))))throw new Error('A secret was found in public output; refusing delivery.')}}}
await scan('public');await scan('dist');console.log('Public source and built output contain no configured provider key or personal access token.');
