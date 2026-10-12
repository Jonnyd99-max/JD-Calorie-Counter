// Run after wrangler login. Secrets travel to wrangler through stdin, never argv.
import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const file='.env.local';
let text=await readFile(file,'utf8');
const value=name=>text.match(new RegExp(`^${name}=(.*)$`,'m'))?.[1]?.trim();
const apiKey=value('OPENAI_API_KEY');if(!apiKey)throw new Error('Provision an OpenAI key through the secure setup first.');
const token=value('PERSONAL_ACCESS_TOKEN')||randomBytes(32).toString('base64url');
const hash=createHash('sha256').update(token).digest('hex');
for(const[name,val]of[['PERSONAL_ACCESS_TOKEN',token],['PERSONAL_TOKEN_SHA256',hash]]){const re=new RegExp(`^${name}=.*$`,'m');text=re.test(text)?text.replace(re,`${name}=${val}`):text.trimEnd()+`\n${name}=${val}\n`}
await writeFile(file,text,{mode:0o600});
const executable=process.env.WRANGLER_CLI;if(!executable)throw new Error('Set WRANGLER_CLI to the installed wrangler bin/wrangler.js path.');
const secrets={OPENAI_API_KEY:apiKey,PERSONAL_TOKEN_SHA256:hash};
const child=spawn(process.execPath,[executable,'secret','bulk','--config','backend/wrangler.jsonc'],{stdio:['pipe','inherit','inherit'],windowsHide:true});
child.stdin.end(JSON.stringify(secrets));
child.on('exit',code=>{if(code)process.exitCode=code;else console.log('Backend secrets uploaded. Personal access token is stored only in ignored .env.local.');});
